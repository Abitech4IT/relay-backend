import { offerService } from "../offer.module";

import { RankingService } from "./ranking.service";

import { WeightedRankingStrategy } from "./weighted-ranking.strategy";

export const rankingStrategy = new WeightedRankingStrategy();

export const rankingService = new RankingService(offerService, rankingStrategy);
