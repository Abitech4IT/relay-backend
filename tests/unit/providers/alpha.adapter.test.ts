import { ProviderInvalidResponseError } from "../../../src/common/errors/provider.error";
import { AlphaAdapter } from "../../../src/modules/providers/alpha/alpha.adapter";
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

describe("AlphaAdapter", () => {
  it("should normalize a valid Alpha response", async () => {
    const adapter = new AlphaAdapter({
      forceInvalidResponse: false,
      delayMs: 1,
    });

    const result = await adapter.getOffer(providerRequest);

    expect(result.provider).toBe(ProviderName.ALPHA);

    expect(result.fees).toBeGreaterThanOrEqual(0);

    expect(result.totalAmount).toBeGreaterThan(0);
  });

  it("should reject a negative provider fee", async () => {
    const adapter = new AlphaAdapter({
      forceInvalidResponse: true,
      delayMs: 1,
    });

    await expect(adapter.getOffer(providerRequest)).rejects.toBeInstanceOf(
      ProviderInvalidResponseError,
    );
  });
});
