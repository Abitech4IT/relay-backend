import { randomUUID } from "crypto";

import { ProviderAdapter } from "../interfaces/provider.adapter";

import {
  NormalizedProviderOffer,
  ProviderName,
  ProviderRequest,
  ProviderSimulationOptions,
} from "../provider.types";

import { AlphaRequest, AlphaResponse } from "./alpha.types";
import { ProviderInvalidResponseError } from "../../../common/errors/provider.error";

export class AlphaAdapter implements ProviderAdapter {
  readonly name = ProviderName.ALPHA;

  constructor(private readonly simulation: ProviderSimulationOptions = {}) {}

  async getOffer(request: ProviderRequest): Promise<NormalizedProviderOffer> {
    const alphaRequest = this.toProviderRequest(request);

    const response = await this.callMockProvider(alphaRequest);

    return this.normalize(response);
  }

  private toProviderRequest(request: ProviderRequest): AlphaRequest {
    return {
      reference: request.requestId,

      customer: {
        first_name: request.customerProfile.firstName,

        last_name: request.customerProfile.lastName,
      },

      item: {
        category: request.category,

        type: request.asset.type,

        identifier: request.asset.identifier,
      },
    };
  }

  private async callMockProvider(
    _request: AlphaRequest,
  ): Promise<AlphaResponse> {
    const delay = this.simulation.delayMs ?? 100;

    await new Promise((resolve) => setTimeout(resolve, delay));

    const invalidFee = this.simulation.forceInvalidResponse ?? false;

    const base = 1000;

    const fee = invalidFee ? -50 : 75;

    return {
      result: {
        offer_id: randomUUID(),

        pricing: {
          base,
          fee,
          total: base + fee,
        },

        benefits: ["Fast processing", "Standard support"],

        terms: ["Subject to final review"],

        customer_contribution: 100,

        valid_until: new Date(Date.now() + 60 * 60 * 1000).toISOString(),

        fulfillment_minutes: 30,
      },
    };
  }

  private normalize(response: AlphaResponse): NormalizedProviderOffer {
    const offer = response.result;

    if (offer.pricing.fee < 0) {
      throw new ProviderInvalidResponseError(
        ProviderName.ALPHA,
        "Alpha returned a negative fee",
      );
    }

    if (offer.pricing.base < 0 || offer.pricing.total < 0) {
      throw new ProviderInvalidResponseError(
        ProviderName.ALPHA,
        "Alpha returned invalid pricing",
      );
    }

    return {
      provider: ProviderName.ALPHA,

      externalOfferId: offer.offer_id,

      baseAmount: offer.pricing.base,

      fees: offer.pricing.fee,

      totalAmount: offer.pricing.total,

      benefits: offer.benefits,

      terms: offer.terms,

      customerContribution: offer.customer_contribution,

      validUntil: new Date(offer.valid_until),

      estimatedFulfillmentMinutes: offer.fulfillment_minutes,
    };
  }
}
