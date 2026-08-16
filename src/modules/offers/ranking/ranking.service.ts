import { OfferService } from "../offer.service";

import { RankingStrategy } from "./ranking.strategy";

import { RankableOffer } from "../offer.types";

export class RankingService {
  constructor(
    private readonly offerService: OfferService,

    private readonly strategy: RankingStrategy,
  ) {}

  async rankRequestOffers(requestId: string): Promise<void> {
    const offers = await this.offerService.findValidForRequest(requestId);

    if (offers.length === 0) {
      return;
    }

    const rankableOffers: RankableOffer[] = offers.map((offer) => ({
      id: offer.id,

      provider: offer.provider,

      baseAmount: Number(offer.baseAmount),

      fees: Number(offer.fees),

      totalAmount: Number(offer.totalAmount),

      benefits: offer.benefits,

      terms: offer.terms,

      customerContribution: Number(offer.customerContribution),

      estimatedFulfillmentMinutes: offer.estimatedFulfillmentMinutes,
    }));

    const ranked = this.strategy.rank(rankableOffers);

    await this.offerService.saveRankings(ranked);
  }
}
