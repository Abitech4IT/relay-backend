import { env } from "../../config/env";

import { retry } from "../../common/utils/retry";

import { withTimeout } from "../../common/utils/with-timeout";

import { ProviderAdapter } from "./interfaces/provider.adapter";

import {
  ProviderExecutionResult,
  ProviderName,
  ProviderRequest,
  ProviderResultStatus,
} from "./provider.types";

import { ProviderResultService } from "./provider-result.service";

import { RequestService } from "../requests/request.service";

import { RequestStatus } from "../../common/constants/request-status";
import {
  ProviderInvalidResponseError,
  ProviderTemporaryError,
  ProviderTimeoutError,
} from "../../common/errors/provider.error";
import { OfferService } from "../offers/offer.service";
import { RankingService } from "../offers/ranking/ranking.service";
import { RealtimeService } from "../realtime/realtime.service";

interface ProviderServiceOptions {
  timeoutMs: number;
  retries: number;
  retryDelayMs: number;
}

export class ProviderService {
  constructor(
    private readonly adapters: ProviderAdapter[],

    private readonly providerResultService: ProviderResultService,

    private readonly requestService: RequestService,

    private readonly offerService: OfferService,

    private readonly rankingService: RankingService,

    private readonly options: ProviderServiceOptions,

    private readonly realtimeService: RealtimeService,
  ) {}

  async processRequest(
    requestId: string,
    providerRequest: ProviderRequest,
  ): Promise<ProviderExecutionResult[]> {
    const publicRequestId = providerRequest.requestId;

    const claimed = await this.requestService.claimForProcessing(requestId);

    if (!claimed) {
      return [];
    }

    this.realtimeService.safeEmitRequestStatus(
      publicRequestId,
      RequestStatus.PROCESSING,
    );

    const executions = this.adapters.map(async (adapter) => {
      const result = await this.executeProvider(adapter, providerRequest);

      this.realtimeService.safeEmitRequestStatus(
        publicRequestId,
        RequestStatus.PROCESSING,
        {
          provider: adapter.name,

          providerStatus: result.status,
        },
      );

      return result;
    });

    const results = await Promise.all(executions);

    await Promise.all(
      results.map((result) =>
        this.providerResultService.saveResult(requestId, result),
      ),
    );

    const successfulResults = results.filter(
      (
        result,
      ): result is ProviderExecutionResult & {
        offer: NonNullable<ProviderExecutionResult["offer"]>;
      } =>
        result.status === ProviderResultStatus.SUCCESS && Boolean(result.offer),
    );

    await Promise.all(
      successfulResults.map((result) =>
        this.offerService.saveNormalizedOffer(requestId, result.offer),
      ),
    );

    if (successfulResults.length > 0) {
      await this.rankingService.rankRequestOffers(requestId);
    }

    const finalStatus = await this.updateRequestStatus(requestId, results);

    this.realtimeService.safeEmitRequestStatus(publicRequestId, finalStatus, {
      successfulProviders: successfulResults.length,

      totalProviders: results.length,
    });

    return results;
  }

  private async executeProvider(
    adapter: ProviderAdapter,
    request: ProviderRequest,
  ): Promise<ProviderExecutionResult> {
    const start = Date.now();

    try {
      const offer = await retry(
        () =>
          withTimeout(
            adapter.getOffer(request),
            this.options.timeoutMs,
            adapter.name,
          ),
        {
          retries: this.options.retries,
          delayMs: this.options.retryDelayMs,

          shouldRetry: (error) => error instanceof ProviderTemporaryError,
        },
      );

      return {
        provider: adapter.name,

        status: ProviderResultStatus.SUCCESS,

        offer,

        durationMs: Date.now() - start,
      };
    } catch (error) {
      return this.toFailedResult(adapter.name, error, Date.now() - start);
    }
  }

  private toFailedResult(
    provider: ProviderName,
    error: unknown,
    durationMs: number,
  ): ProviderExecutionResult {
    if (error instanceof ProviderTimeoutError) {
      return {
        provider,

        status: ProviderResultStatus.TIMEOUT,

        errorCode: "PROVIDER_TIMEOUT",

        errorMessage: error.message,

        durationMs,
      };
    }

    if (error instanceof ProviderTemporaryError) {
      return {
        provider,

        status: ProviderResultStatus.TEMPORARY_ERROR,

        errorCode: "PROVIDER_TEMPORARY_ERROR",

        errorMessage: error.message,

        durationMs,
      };
    }

    if (error instanceof ProviderInvalidResponseError) {
      return {
        provider,

        status: ProviderResultStatus.INVALID_RESPONSE,

        errorCode: "PROVIDER_INVALID_RESPONSE",

        errorMessage: error.message,

        durationMs,
      };
    }

    return {
      provider,

      status: ProviderResultStatus.FAILED,

      errorCode: "PROVIDER_FAILURE",

      errorMessage:
        error instanceof Error ? error.message : "Unknown provider failure",

      durationMs,
    };
  }

  private async updateRequestStatus(
    requestId: string,
    results: ProviderExecutionResult[],
  ): Promise<RequestStatus> {
    const successful = results.filter(
      (result) => result.status === ProviderResultStatus.SUCCESS,
    );

    let status: RequestStatus;

    if (successful.length === 0) {
      status = RequestStatus.FAILED;
    } else if (successful.length < results.length) {
      status = RequestStatus.PARTIAL_RESULTS;
    } else {
      status = RequestStatus.READY_FOR_REVIEW;
    }

    await this.requestService.updateStatus(requestId, status);

    return status;
  }
}
