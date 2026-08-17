import { AppDataSource } from "../../config/database";

import { ServiceRequest } from "./request.entity";
import { RequestService } from "./request.service";
import { RequestController } from "./request.controller";
import { offerService } from "../offers/offer.module";

const requestRepository = AppDataSource.getRepository(ServiceRequest);

export const requestService = new RequestService(requestRepository);

export const requestController = new RequestController(
  requestService,
  offerService,
);
