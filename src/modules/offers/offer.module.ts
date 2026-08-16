import { AppDataSource } from "../../config/database";

import { Offer } from "./offer.entity";

import { OfferService } from "./offer.service";

const offerRepository = AppDataSource.getRepository(Offer);

export const offerService = new OfferService(offerRepository);
