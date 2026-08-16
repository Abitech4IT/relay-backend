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

    private readonly options: ProviderServiceOptions,
  ) {}

  async processRequest(
    requestId: string,
    providerRequest: ProviderRequest,
  ): Promise<ProviderExecutionResult[]> {
    await this.requestService.updateStatus(requestId, RequestStatus.PROCESSING);

    const executions = this.adapters.map((adapter) =>
      this.executeProvider(adapter, providerRequest),
    );

    const results = await Promise.all(executions);

    await Promise.all(
      results.map((result) =>
        this.providerResultService.saveResult(requestId, result),
      ),
    );

    await Promise.all(
      results
        .filter(
          (
            result,
          ): result is ProviderExecutionResult & {
            offer: NonNullable<ProviderExecutionResult["offer"]>;
          } =>
            result.status === ProviderResultStatus.SUCCESS &&
            Boolean(result.offer),
        )
        .map((result) =>
          this.offerService.saveNormalizedOffer(requestId, result.offer),
        ),
    );

    await this.updateRequestStatus(requestId, results);

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
  ): Promise<void> {
    const successful = results.filter(
      (result) => result.status === ProviderResultStatus.SUCCESS,
    );

    if (successful.length === 0) {
      await this.requestService.updateStatus(requestId, RequestStatus.FAILED);

      return;
    }

    if (successful.length < results.length) {
      await this.requestService.updateStatus(
        requestId,
        RequestStatus.PARTIAL_RESULTS,
      );

      return;
    }

    await this.requestService.updateStatus(
      requestId,
      RequestStatus.READY_FOR_REVIEW,
    );
  }
}
