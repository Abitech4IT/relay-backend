import { WeightedRankingStrategy } from "../../../src/modules/offers/ranking/weighted-ranking.strategy";

import { ProviderName } from "../../../src/modules/providers/provider.types";

import { RankableOffer } from "../../../src/modules/offers/offer.types";

describe("WeightedRankingStrategy", () => {
  const strategy = new WeightedRankingStrategy();

  it("should rank the strongest overall offer first", () => {
    const offers: RankableOffer[] = [
      {
        id: "offer-a",

        provider: ProviderName.ALPHA,

        baseAmount: 1000,
        fees: 100,
        totalAmount: 1100,

        benefits: ["Fast processing"],

        terms: ["Standard review"],

        customerContribution: 100,

        estimatedFulfillmentMinutes: 60,
      },

      {
        id: "offer-b",

        provider: ProviderName.BETA,

        baseAmount: 900,
        fees: 50,
        totalAmount: 950,

        benefits: [
          "Fast processing",
          "Extended support",
          "Flexible fulfillment",
        ],

        terms: ["Standard review"],

        customerContribution: 80,

        estimatedFulfillmentMinutes: 30,
      },

      {
        id: "offer-c",

        provider: ProviderName.GAMMA,

        baseAmount: 1200,
        fees: 150,
        totalAmount: 1350,

        benefits: [],
        terms: ["Review required", "Limited availability"],

        customerContribution: 150,

        estimatedFulfillmentMinutes: 90,
      },
    ];

    const ranked = strategy.rank(offers);

    expect(ranked).toHaveLength(3);

    expect(ranked[0].offerId).toBe("offer-b");

    expect(ranked[0].rank).toBe(1);

    expect(ranked[1].rank).toBe(2);

    expect(ranked[2].rank).toBe(3);

    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);

    expect(ranked[1].score).toBeGreaterThan(ranked[2].score);
  });

  it("should provide a ranking explanation", () => {
    const offers: RankableOffer[] = [
      {
        id: "a",
        provider: ProviderName.ALPHA,
        baseAmount: 100,
        fees: 10,
        totalAmount: 110,
        benefits: ["Fast", "Support"],
        terms: [],
        customerContribution: 0,
        estimatedFulfillmentMinutes: 30,
      },

      {
        id: "b",
        provider: ProviderName.BETA,
        baseAmount: 200,
        fees: 20,
        totalAmount: 220,
        benefits: [],
        terms: ["Restriction"],
        customerContribution: 0,
        estimatedFulfillmentMinutes: 60,
      },
    ];

    const [first] = strategy.rank(offers);

    expect(first.breakdown).toBeDefined();

    expect(first.breakdown.priceScore).toBeDefined();

    expect(first.breakdown.feeScore).toBeDefined();

    expect(first.breakdown.fulfillmentScore).toBeDefined();

    expect(first.breakdown.qualityScore).toBeDefined();

    expect(first.breakdown.explanation.length).toBeGreaterThan(0);
  });

  it("should handle a single offer", () => {
    const ranked = strategy.rank([
      {
        id: "only",
        provider: ProviderName.ALPHA,
        baseAmount: 1000,
        fees: 50,
        totalAmount: 1050,
        benefits: ["Support"],
        terms: [],
        customerContribution: 100,
        estimatedFulfillmentMinutes: 45,
      },
    ]);

    expect(ranked).toHaveLength(1);

    expect(ranked[0].rank).toBe(1);

    expect(ranked[0].score).toBeGreaterThan(0);
  });

  it("should return an empty array when no offers are supplied", () => {
    expect(strategy.rank([])).toEqual([]);
  });
});
