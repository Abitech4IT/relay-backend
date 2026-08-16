import { randomUUID } from "crypto";

import { ProviderAdapter } from "../interfaces/provider.adapter";

import {
  NormalizedProviderOffer,
  ProviderName,
  ProviderRequest,
  ProviderSimulationOptions,
} from "../provider.types";

import { BetaRequest, BetaResponse } from "./beta.types";

export class BetaAdapter implements ProviderAdapter {
  readonly name = ProviderName.BETA;

  constructor(private readonly simulation: ProviderSimulationOptions = {}) {}

  async getOffer(request: ProviderRequest): Promise<NormalizedProviderOffer> {
    const providerRequest = this.toProviderRequest(request);

    const response = await this.callMockProvider(providerRequest);

    return this.normalize(response);
  }

  private toProviderRequest(request: ProviderRequest): BetaRequest {
    return {
      request_ref: request.requestId,

      service_category: request.category,

      customer_name: `${request.customerProfile.firstName} ${request.customerProfile.lastName}`,

      asset_type: request.asset.type,
    };
  }

  private async callMockProvider(_request: BetaRequest): Promise<BetaResponse> {
    const delay = this.simulation.delayMs ?? 1500;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      quoteId: randomUUID(),

      basePrice: 950,

      serviceFee: 100,

      finalPrice: 1050,

      benefitsText: "Extended support|Flexible fulfillment",

      termsText: "Final approval required|Offer subject to availability",

      contribution: 120,

      expiresAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),

      etaMinutes: 45,
    };
  }

  private normalize(response: BetaResponse): NormalizedProviderOffer {
    return {
      provider: ProviderName.BETA,

      externalOfferId: response.quoteId,

      baseAmount: response.basePrice,

      fees: response.serviceFee,

      totalAmount: response.finalPrice,

      benefits: response.benefitsText.split("|"),

      terms: response.termsText.split("|"),

      customerContribution: response.contribution,

      validUntil: new Date(response.expiresAt),

      estimatedFulfillmentMinutes: response.etaMinutes,
    };
  }
}
