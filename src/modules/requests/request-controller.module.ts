import { requestService } from "./request.module";

import { offerService } from "../offers/offer.module";

import { providerService } from "../providers/provider.module";

import { RequestController } from "./request.controller";

export const requestController = new RequestController(
  requestService,
  offerService,
  providerService,
);
