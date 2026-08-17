import { AppDataSource } from "../../config/database";

import { ServiceRequest } from "./request.entity";
import { RequestService } from "./request.service";

const requestRepository = AppDataSource.getRepository(ServiceRequest);

export const requestService = new RequestService(requestRepository);
