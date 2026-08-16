import { ProviderTemporaryError } from "../../../src/common/errors/provider.error";
import { GammaAdapter } from "../../../src/modules/providers/gamma/gamma.adapter";
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

describe("GammaAdapter", () => {
  it("should normalize Gamma string values into numbers", async () => {
    const adapter = new GammaAdapter({
      delayMs: 1,
    });

    const result = await adapter.getOffer(providerRequest);

    expect(result.provider).toBe(ProviderName.GAMMA);

    expect(typeof result.baseAmount).toBe("number");

    expect(typeof result.fees).toBe("number");

    expect(typeof result.estimatedFulfillmentMinutes).toBe("number");
  });

  it("should throw a temporary provider error when configured", async () => {
    const adapter = new GammaAdapter({
      forceTemporaryError: true,
    });

    await expect(adapter.getOffer(providerRequest)).rejects.toBeInstanceOf(
      ProviderTemporaryError,
    );
  });
});
