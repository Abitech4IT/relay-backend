import { RankedOffer, RankableOffer, RankingBreakdown } from "../offer.types";

import { RankingStrategy } from "./ranking.strategy";

import { RANKING_WEIGHTS } from "./ranking.constatnt";

export class WeightedRankingStrategy implements RankingStrategy {
  rank(offers: RankableOffer[]): RankedOffer[] {
    if (offers.length === 0) {
      return [];
    }

    const totals = offers.map((offer) => offer.totalAmount);

    const fees = offers.map((offer) => offer.fees);

    const fulfillmentTimes = offers.map(
      (offer) => offer.estimatedFulfillmentMinutes,
    );

    const minTotal = Math.min(...totals);

    const maxTotal = Math.max(...totals);

    const minFees = Math.min(...fees);

    const maxFees = Math.max(...fees);

    const minFulfillment = Math.min(...fulfillmentTimes);

    const maxFulfillment = Math.max(...fulfillmentTimes);

    const scored = offers.map((offer) => {
      const priceScore = this.inverseNormalize(
        offer.totalAmount,
        minTotal,
        maxTotal,
      );

      const feeScore = this.inverseNormalize(offer.fees, minFees, maxFees);

      const fulfillmentScore = this.inverseNormalize(
        offer.estimatedFulfillmentMinutes,
        minFulfillment,
        maxFulfillment,
      );

      const qualityScore = this.calculateQualityScore(offer);

      const weightedPriceScore = priceScore * RANKING_WEIGHTS.price;

      const weightedFeeScore = feeScore * RANKING_WEIGHTS.fees;

      const weightedFulfillmentScore =
        fulfillmentScore * RANKING_WEIGHTS.fulfillment;

      const weightedQualityScore = qualityScore * RANKING_WEIGHTS.quality;

      const totalScore =
        weightedPriceScore +
        weightedFeeScore +
        weightedFulfillmentScore +
        weightedQualityScore;

      const breakdown: RankingBreakdown = {
        priceScore: this.round(priceScore),

        feeScore: this.round(feeScore),

        fulfillmentScore: this.round(fulfillmentScore),

        qualityScore: this.round(qualityScore),

        weightedPriceScore: this.round(weightedPriceScore),

        weightedFeeScore: this.round(weightedFeeScore),

        weightedFulfillmentScore: this.round(weightedFulfillmentScore),

        weightedQualityScore: this.round(weightedQualityScore),

        totalScore: this.round(totalScore),

        explanation: this.buildExplanation(
          offer,
          priceScore,
          feeScore,
          fulfillmentScore,
          qualityScore,
        ),
      };

      return {
        offerId: offer.id,

        score: this.round(totalScore),

        breakdown,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }

  private inverseNormalize(value: number, min: number, max: number): number {
    if (max === min) {
      return 1;
    }

    return 1 - (value - min) / (max - min);
  }

  private calculateQualityScore(offer: RankableOffer): number {
    const benefitScore = Math.min(offer.benefits.length / 5, 1);

    const termPenalty = Math.min(offer.terms.length * 0.05, 0.25);

    return Math.max(0, benefitScore - termPenalty);
  }

  private buildExplanation(
    offer: RankableOffer,
    priceScore: number,
    feeScore: number,
    fulfillmentScore: number,
    qualityScore: number,
  ): string[] {
    const explanations: string[] = [];

    if (priceScore >= 0.8) {
      explanations.push("Highly competitive total price");
    }

    if (feeScore >= 0.8) {
      explanations.push("Low provider fees");
    }

    if (fulfillmentScore >= 0.8) {
      explanations.push("Fast estimated fulfillment");
    }

    if (qualityScore >= 0.7) {
      explanations.push("Strong benefits and terms profile");
    }

    if (explanations.length === 0) {
      explanations.push(`Balanced offer from ${offer.provider}`);
    }

    return explanations;
  }

  private round(value: number): number {
    return Number(value.toFixed(4));
  }
}
