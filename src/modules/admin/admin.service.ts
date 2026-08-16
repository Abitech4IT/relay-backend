import { EntityManager, Repository } from "typeorm";

import { BadRequestError, NotFoundError } from "../../common/errors";

import { AppDataSource } from "../../config/database";

import { ServiceRequest } from "../requests/request.entity";
import { ProviderResult } from "../providers/provider-result.entity";

import { AdminCorrectionInput } from "./admin.types";

import { AuditLog } from "./audit-log.entity";

export class AdminService {
  constructor(
    private readonly requestRepository: Repository<ServiceRequest>,

    private readonly providerResultRepository: Repository<ProviderResult>,

    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async getRequest(publicId: string): Promise<ServiceRequest> {
    const serviceRequest = await this.requestRepository.findOne({
      where: {
        publicId,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundError("Service request not found", "REQUEST_NOT_FOUND");
    }

    return serviceRequest;
  }

  async getProviderResults(publicId: string): Promise<ProviderResult[]> {
    const serviceRequest = await this.getRequest(publicId);

    return this.providerResultRepository.find({
      where: {
        requestId: serviceRequest.id,
      },

      order: {
        createdAt: "ASC",
      },
    });
  }

  async correctRequest(
    publicId: string,
    actorId: string,
    input: AdminCorrectionInput,
  ): Promise<ServiceRequest> {
    return AppDataSource.transaction(async (manager) => {
      const requestRepository = manager.getRepository(ServiceRequest);

      const auditRepository = manager.getRepository(AuditLog);

      const serviceRequest = await requestRepository
        .createQueryBuilder("service_request")
        .where("service_request.publicId = :publicId", {
          publicId,
        })
        .setLock("pessimistic_write")
        .getOne();

      if (!serviceRequest) {
        throw new NotFoundError(
          "Service request not found",
          "REQUEST_NOT_FOUND",
        );
      }

      const oldValue = this.getFieldValue(serviceRequest, input.field);

      const newValue = this.validateCorrectionValue(input.field, input.value);

      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        throw new BadRequestError(
          "New value must differ from the current value",
          "NO_CORRECTION_CHANGE",
        );
      }

      this.setFieldValue(serviceRequest, input.field, newValue);

      const savedRequest = await requestRepository.save(serviceRequest);

      const audit = auditRepository.create({
        requestId: serviceRequest.id,

        actorId,

        fieldName: input.field,

        oldValue: oldValue ?? null,

        newValue: newValue ?? null,

        reason: input.reason,
      });

      await auditRepository.save(audit);

      return savedRequest;
    });
  }

  async getAuditTrail(publicId: string): Promise<AuditLog[]> {
    const serviceRequest = await this.getRequest(publicId);

    return this.auditRepository.find({
      where: {
        requestId: serviceRequest.id,
      },

      order: {
        createdAt: "ASC",
      },
    });
  }

  private getFieldValue(
    request: ServiceRequest,
    field: AdminCorrectionInput["field"],
  ): unknown {
    switch (field) {
      case "category":
        return request.category;

      case "customerProfile":
        return request.customerProfile;

      case "asset":
        return request.asset;

      case "notes":
        return request.notes;
    }
  }

  private setFieldValue(
    request: ServiceRequest,
    field: AdminCorrectionInput["field"],
    value: unknown,
  ): void {
    switch (field) {
      case "category":
        request.category = value as string;
        break;

      case "customerProfile":
        request.customerProfile = value as ServiceRequest["customerProfile"];
        break;

      case "asset":
        request.asset = value as ServiceRequest["asset"];
        break;

      case "notes":
        request.notes = value as string | null;
        break;
    }
  }

  private validateCorrectionValue(
    field: AdminCorrectionInput["field"],
    value: unknown,
  ): unknown {
    switch (field) {
      case "category": {
        if (
          typeof value !== "string" ||
          value.trim().length < 2 ||
          value.trim().length > 100
        ) {
          throw new BadRequestError(
            "Invalid category value",
            "INVALID_CORRECTION_VALUE",
          );
        }

        return value.trim();
      }

      case "notes": {
        if (value === null) {
          return null;
        }

        if (typeof value !== "string" || value.length > 2000) {
          throw new BadRequestError(
            "Invalid notes value",
            "INVALID_CORRECTION_VALUE",
          );
        }

        return value.trim();
      }

      case "customerProfile": {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new BadRequestError(
            "Invalid customer profile",
            "INVALID_CORRECTION_VALUE",
          );
        }

        return value;
      }

      case "asset": {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new BadRequestError(
            "Invalid asset value",
            "INVALID_CORRECTION_VALUE",
          );
        }

        return value;
      }
    }
  }
}
