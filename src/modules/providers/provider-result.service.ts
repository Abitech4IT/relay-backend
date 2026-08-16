import { QueryFailedError, Repository } from "typeorm";

import { ProviderResult } from "./provider-result.entity";

import { ProviderExecutionResult } from "./provider.types";

export class ProviderResultService {
  constructor(private readonly repository: Repository<ProviderResult>) {}

  async saveResult(
    requestId: string,
    result: ProviderExecutionResult,
  ): Promise<ProviderResult> {
    const externalResultId = result.offer?.externalOfferId ?? null;

    if (externalResultId) {
      const existing = await this.repository.findOne({
        where: {
          requestId,
          provider: result.provider,
          externalResultId,
        },
      });

      if (existing) {
        return existing;
      }
    }

    const entity = this.repository.create({
      requestId,

      provider: result.provider,

      externalResultId,

      status: result.status,

      rawResponse: null,

      errorCode: result.errorCode ?? null,

      errorMessage: result.errorMessage ?? null,

      durationMs: result.durationMs,
    });

    try {
      return await this.repository.save(entity);
    } catch (error) {
      if (externalResultId && error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === "23505" &&
          driverError.constraint ===
            "UQ_provider_results_request_provider_external"
        ) {
          const existingAfterConflict = await this.repository.findOne({
            where: {
              requestId,
              provider: result.provider,
              externalResultId,
            },
          });

          if (existingAfterConflict) {
            return existingAfterConflict;
          }
        }
      }

      throw error;
    }
  }

  async findForRequest(requestId: string): Promise<ProviderResult[]> {
    return this.repository.find({
      where: {
        requestId,
      },

      order: {
        createdAt: "ASC",
      },
    });
  }
}
