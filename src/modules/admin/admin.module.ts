import { AppDataSource } from "../../config/database";

import { ServiceRequest } from "../requests/request.entity";
import { ProviderResult } from "../providers/provider-result.entity";

import { AuditLog } from "./audit-log.entity";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";

const requestRepository = AppDataSource.getRepository(ServiceRequest);

const providerResultRepository = AppDataSource.getRepository(ProviderResult);

const auditRepository = AppDataSource.getRepository(AuditLog);

export const adminService = new AdminService(
  requestRepository,
  providerResultRepository,
  auditRepository,
);

export const adminController = new AdminController(adminService);
