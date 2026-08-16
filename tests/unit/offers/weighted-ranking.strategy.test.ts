import { WeightedRankingStrategy } from "../../../src/modules/offers/ranking/weighted-ranking.strategy";

import { ProviderName } from "../../../src/modules/providers/provider.types";

import { RankableOffer } from "../../../src/modules/offers/offer.types";

describe("WeightedRankingStrategy", () => {
  const strategy = new WeightedRankingStrategy();

  it("should rank the strongest overall offer first", () => {
    const offers: RankableOffer[] = [
      {
        id: "offer-alpha",

        provider: ProviderName.ALPHA,

        baseAmount: 1000,

        fees: 100,

        totalAmount: 1100,

        benefits: ["Standard support"],

        terms: ["Subject to review"],

        customerContribution: 100,

        estimatedFulfillmentMinutes: 60,
      },

      {
        id: "offer-beta",

        provider: ProviderName.BETA,

        baseAmount: 900,

        fees: 50,

        totalAmount: 950,

        benefits: [
          "Extended support",
          "Priority processing",
          "Flexible fulfillment",
        ],

        terms: ["Subject to review"],

        customerContribution: 80,

        estimatedFulfillmentMinutes: 30,
      },

      {
        id: "offer-gamma",

        provider: ProviderName.GAMMA,

        baseAmount: 1200,

        fees: 150,

        totalAmount: 1350,

        benefits: [],

        terms: ["Final review required", "Limited availability"],

        customerContribution: 150,

        estimatedFulfillmentMinutes: 90,
      },
    ];

    const ranked = strategy.rank(offers);

    expect(ranked).toHaveLength(3);

    expect(ranked[0].offerId).toBe("offer-beta");

    expect(ranked[0].rank).toBe(1);

    expect(ranked[1].rank).toBe(2);

    expect(ranked[2].rank).toBe(3);

    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);

    expect(ranked[1].score).toBeGreaterThan(ranked[2].score);
  });

  it("should include an explainable score breakdown", () => {
    const offers: RankableOffer[] = [
      {
        id: "offer-a",

        provider: ProviderName.ALPHA,

        baseAmount: 1000,

        fees: 50,

        totalAmount: 1050,

        benefits: ["Fast processing", "Standard support"],

        terms: [],

        customerContribution: 100,

        estimatedFulfillmentMinutes: 30,
      },

      {
        id: "offer-b",

        provider: ProviderName.BETA,

        baseAmount: 1200,

        fees: 150,

        totalAmount: 1350,

        benefits: [],

        terms: ["Additional review required"],

        customerContribution: 150,

        estimatedFulfillmentMinutes: 90,
      },
    ];

    const ranked = strategy.rank(offers);

    const first = ranked[0];

    expect(first.breakdown).toBeDefined();

    expect(first.breakdown.priceScore).toBeDefined();

    expect(first.breakdown.feeScore).toBeDefined();

    expect(first.breakdown.fulfillmentScore).toBeDefined();

    expect(first.breakdown.qualityScore).toBeDefined();

    expect(first.breakdown.totalScore).toBeDefined();

    expect(first.breakdown.explanation).toEqual(expect.any(Array));

    expect(first.breakdown.explanation.length).toBeGreaterThan(0);
  });

  it("should handle a single offer", () => {
    const offers: RankableOffer[] = [
      {
        id: "only-offer",

        provider: ProviderName.ALPHA,

        baseAmount: 1000,

        fees: 50,

        totalAmount: 1050,

        benefits: ["Support"],

        terms: [],

        customerContribution: 100,

        estimatedFulfillmentMinutes: 45,
      },
    ];

    const ranked = strategy.rank(offers);

    expect(ranked).toHaveLength(1);

    expect(ranked[0].rank).toBe(1);

    expect(ranked[0].offerId).toBe("only-offer");

    expect(ranked[0].score).toBeGreaterThan(0);
  });

  it("should return an empty array when no offers are provided", () => {
    expect(strategy.rank([])).toEqual([]);
  });

  it("should give equal normalized scores when comparable values are identical", () => {
    const offers: RankableOffer[] = [
      {
        id: "a",

        provider: ProviderName.ALPHA,

        baseAmount: 1000,

        fees: 50,

        totalAmount: 1050,

        benefits: [],

        terms: [],

        customerContribution: 100,

        estimatedFulfillmentMinutes: 30,
      },

      {
        id: "b",

        provider: ProviderName.BETA,

        baseAmount: 1000,

        fees: 50,

        totalAmount: 1050,

        benefits: [],

        terms: [],

        customerContribution: 100,

        estimatedFulfillmentMinutes: 30,
      },
    ];

    const ranked = strategy.rank(offers);

    expect(ranked[0].breakdown.priceScore).toBe(1);

    expect(ranked[0].breakdown.feeScore).toBe(1);

    expect(ranked[0].breakdown.fulfillmentScore).toBe(1);

    expect(ranked[1].breakdown.priceScore).toBe(1);
  });
});
