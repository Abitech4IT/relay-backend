import { BetaAdapter } from "../../../src/modules/providers/beta/beta.adapter";
import {
  ProviderName,
  ProviderRequest,
} from "../../../src/modules/providers/provider.types";

const providerRequest: ProviderRequest = {
  requestId: "REQ_TEST",
  category: "vehicle-service",

  customerProfile: {
    firstName: "Jane",
    lastName: "Doe",
  },

  asset: {
    type: "vehicle",
    attributes: {},
  },

  notes: null,
};

describe("BetaAdapter", () => {
  it("should normalize the Beta response", async () => {
    const adapter = new BetaAdapter({
      delayMs: 1,
    });

    const result = await adapter.getOffer(providerRequest);

    expect(result.provider).toBe(ProviderName.BETA);

    expect(result.externalOfferId).toBeDefined();

    expect(result.baseAmount).toBeGreaterThan(0);

    expect(result.totalAmount).toBeGreaterThan(0);

    expect(result.benefits.length).toBeGreaterThan(0);
  });
});
