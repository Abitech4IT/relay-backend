import { RankedOffer, RankableOffer } from "../offer.types";

export interface RankingStrategy {
  rank(offers: RankableOffer[]): RankedOffer[];
}
