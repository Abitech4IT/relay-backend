import { ProviderName } from "../providers/provider.types";

export interface RankableOffer {
  id: string;
  provider: ProviderName;

  baseAmount: number;
  fees: number;
  totalAmount: number;

  benefits: string[];
  terms: string[];

  customerContribution: number;

  estimatedFulfillmentMinutes: number;
}

export interface RankingBreakdown {
  priceScore: number;
  feeScore: number;
  fulfillmentScore: number;
  qualityScore: number;

  weightedPriceScore: number;
  weightedFeeScore: number;
  weightedFulfillmentScore: number;
  weightedQualityScore: number;

  totalScore: number;

  explanation: string[];
}

export interface RankedOffer {
  offerId: string;
  rank: number;
  score: number;
  breakdown: RankingBreakdown;
}
