import { QueryFailedError, Repository } from "typeorm";

import { NormalizedProviderOffer } from "../providers/provider.types";

import { OfferStatus } from "../../common/constants/offer-status";

import { Offer } from "./offer.entity";

export class OfferService {
  constructor(private readonly repository: Repository<Offer>) {}

  async saveNormalizedOffer(
    requestId: string,
    normalized: NormalizedProviderOffer,
  ): Promise<Offer> {
    const existing = await this.repository.findOne({
      where: {
        requestId,

        provider: normalized.provider,

        externalOfferId: normalized.externalOfferId,
      },
    });

    if (existing) {
      return existing;
    }

    const offer = this.repository.create({
      requestId,

      provider: normalized.provider,

      externalOfferId: normalized.externalOfferId,

      baseAmount: normalized.baseAmount.toFixed(2),

      fees: normalized.fees.toFixed(2),

      totalAmount: normalized.totalAmount.toFixed(2),

      benefits: normalized.benefits,

      terms: normalized.terms,

      customerContribution: normalized.customerContribution.toFixed(2),

      validUntil: normalized.validUntil,

      estimatedFulfillmentMinutes: normalized.estimatedFulfillmentMinutes,

      status: OfferStatus.VALID,

      rank: null,

      score: null,

      rankingExplanation: null,
    });

    try {
      return await this.repository.save(offer);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === "23505" &&
          driverError.constraint === "UQ_offers_request_provider_external"
        ) {
          const existingAfterConflict = await this.repository.findOne({
            where: {
              requestId,

              provider: normalized.provider,

              externalOfferId: normalized.externalOfferId,
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

  async findValidForRequest(requestId: string): Promise<Offer[]> {
    return this.repository.find({
      where: {
        requestId,
        status: OfferStatus.VALID,
      },
    });
  }

  async findAllForRequest(requestId: string): Promise<Offer[]> {
    return this.repository.find({
      where: {
        requestId,
      },

      order: {
        rank: "ASC",
        createdAt: "ASC",
      },
    });
  }
}
