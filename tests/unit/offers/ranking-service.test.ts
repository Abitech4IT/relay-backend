import { RankingService } from "../../../src/modules/offers/ranking/ranking.service";
import { WeightedRankingStrategy } from "../../../src/modules/offers/ranking/weighted-ranking.strategy";

import { ProviderName } from "../../../src/modules/providers/provider.types";

describe("RankingService", () => {
  it("should load valid offers, rank them, and persist rankings", async () => {
    const offerService = {
      findValidForRequest: jest.fn().mockResolvedValue([
        {
          id: "offer-1",

          provider: ProviderName.ALPHA,

          baseAmount: "1000.00",

          fees: "100.00",

          totalAmount: "1100.00",

          benefits: ["Standard support"],

          terms: [],

          customerContribution: "100.00",

          estimatedFulfillmentMinutes: 60,
        },

        {
          id: "offer-2",

          provider: ProviderName.BETA,

          baseAmount: "900.00",

          fees: "50.00",

          totalAmount: "950.00",

          benefits: ["Priority support", "Flexible fulfillment"],

          terms: [],

          customerContribution: "80.00",

          estimatedFulfillmentMinutes: 30,
        },
      ]),

      saveRankings: jest.fn().mockResolvedValue(undefined),
    };

    const strategy = new WeightedRankingStrategy();

    const rankingService = new RankingService(offerService as any, strategy);

    await rankingService.rankRequestOffers("request-id");

    expect(offerService.findValidForRequest).toHaveBeenCalledWith("request-id");

    expect(offerService.saveRankings).toHaveBeenCalledTimes(1);

    const rankings = offerService.saveRankings.mock.calls[0][0];

    expect(rankings).toHaveLength(2);

    expect(rankings[0].rank).toBe(1);

    expect(rankings[0].offerId).toBe("offer-2");
  });

  it("should do nothing when no valid offers exist", async () => {
    const offerService = {
      findValidForRequest: jest.fn().mockResolvedValue([]),

      saveRankings: jest.fn(),
    };

    const rankingService = new RankingService(
      offerService as any,
      new WeightedRankingStrategy(),
    );

    await rankingService.rankRequestOffers("request-id");

    expect(offerService.saveRankings).not.toHaveBeenCalled();
  });
});
