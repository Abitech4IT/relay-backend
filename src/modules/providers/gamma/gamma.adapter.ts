import { ProviderTemporaryError } from "../../../common/errors/provider.error";
import { ProviderAdapter } from "../interfaces/provider.adapter";

import {
  NormalizedProviderOffer,
  ProviderName,
  ProviderRequest,
  ProviderSimulationOptions,
} from "../provider.types";

import { GammaRequest, GammaResponse } from "./gamma.types";

export class GammaAdapter implements ProviderAdapter {
  readonly name = ProviderName.GAMMA;

  constructor(private readonly simulation: ProviderSimulationOptions = {}) {}

  async getOffer(request: ProviderRequest): Promise<NormalizedProviderOffer> {
    const providerRequest = this.toProviderRequest(request);

    const response = await this.callMockProvider(providerRequest);

    return this.normalize(response);
  }

  private toProviderRequest(request: ProviderRequest): GammaRequest {
    return {
      ref: request.requestId,

      kind: request.category,

      customer: `${request.customerProfile.firstName} ${request.customerProfile.lastName}`,

      object: {
        asset_kind: request.asset.type,

        ref: request.asset.identifier,
      },
    };
  }

  private async callMockProvider(
    _request: GammaRequest,
  ): Promise<GammaResponse> {
    if (this.simulation.forceTemporaryError) {
      throw new ProviderTemporaryError(ProviderName.GAMMA);
    }

    const delay = this.simulation.delayMs ?? 500;

    await new Promise((resolve) => setTimeout(resolve, delay));

    return {
      id: Date.now(),

      amount: "1025.00",

      charges: "50.00",

      grand_total: "1075.00",

      perks: ["Priority fulfillment", "Premium support"],

      conditions: "Subject to verification",

      customer_share: "90.00",

      expires: Date.now() + 60 * 60 * 1000,

      eta: "25",
    };
  }

  private normalize(response: GammaResponse): NormalizedProviderOffer {
    const benefits = Array.isArray(response.perks)
      ? response.perks
      : [response.perks];

    const terms = Array.isArray(response.conditions)
      ? response.conditions
      : [response.conditions];

    const baseAmount = Number(response.amount);

    const fees = Number(response.charges);

    const totalAmount = Number(response.grand_total);

    const contribution = Number(response.customer_share);

    const eta = Number(response.eta);

    if (
      [baseAmount, fees, totalAmount, contribution, eta].some(
        (value) => !Number.isFinite(value),
      )
    ) {
      throw new Error("GAMMA_INVALID_RESPONSE");
    }

    return {
      provider: ProviderName.GAMMA,

      externalOfferId: String(response.id),

      baseAmount,
      fees,
      totalAmount,

      benefits,
      terms,

      customerContribution: contribution,

      validUntil: new Date(response.expires),

      estimatedFulfillmentMinutes: eta,
    };
  }
}
