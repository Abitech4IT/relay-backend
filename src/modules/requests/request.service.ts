import { QueryFailedError, Repository } from "typeorm";

import { ConflictError, NotFoundError } from "../../common/errors";

import { RequestStatus } from "../../common/constants/request-status";

import { generateRequestPublicId } from "../../common/utils/request-id";

import { generateRequestFingerprint } from "../../common/utils/request-fingerprint";

import { ServiceRequest } from "./request.entity";

import { CreateServiceRequestBody } from "./request.schemas";

export class RequestService {
  constructor(private readonly requestRepository: Repository<ServiceRequest>) {}

  async create(
    userId: string,
    input: CreateServiceRequestBody,
    idempotencyKey: string,
  ): Promise<{
    request: ServiceRequest;
    replayed: boolean;
  }> {
    const requestFingerprint = generateRequestFingerprint(input);

    const existing = await this.requestRepository.findOne({
      where: {
        userId,
        idempotencyKey,
      },
    });

    if (existing) {
      this.assertMatchingFingerprint(existing, requestFingerprint);

      return {
        request: existing,
        replayed: true,
      };
    }

    const serviceRequest = this.requestRepository.create({
      publicId: generateRequestPublicId(),

      userId,

      category: input.category,

      customerProfile: input.customerProfile,

      asset: input.asset,

      notes: input.notes ?? null,

      consent: input.consent,

      status: RequestStatus.CREATED,

      idempotencyKey,

      requestFingerprint,

      processingStartedAt: null,
    });

    try {
      const saved = await this.requestRepository.save(serviceRequest);

      return {
        request: saved,
        replayed: false,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };

        if (
          driverError.code === "23505" &&
          driverError.constraint === "UQ_service_requests_user_idempotency"
        ) {
          const existingAfterConflict = await this.requestRepository.findOne({
            where: {
              userId,
              idempotencyKey,
            },
          });

          if (existingAfterConflict) {
            this.assertMatchingFingerprint(
              existingAfterConflict,
              requestFingerprint,
            );

            return {
              request: existingAfterConflict,

              replayed: true,
            };
          }
        }
      }

      throw error;
    }
  }

  async findOwnedByPublicId(
    publicId: string,
    userId: string,
  ): Promise<ServiceRequest> {
    const serviceRequest = await this.requestRepository.findOne({
      where: {
        publicId,
        userId,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundError("Service request not found", "REQUEST_NOT_FOUND");
    }

    return serviceRequest;
  }

  async findAllOwnedByUser(userId: string): Promise<ServiceRequest[]> {
    return this.requestRepository.find({
      where: {
        userId,
      },

      order: {
        createdAt: "DESC",
      },
    });
  }

  async updateStatus(requestId: string, status: RequestStatus): Promise<void> {
    await this.requestRepository.update(
      {
        id: requestId,
      },
      {
        status,
      },
    );
  }

  async claimForProcessing(requestId: string): Promise<boolean> {
    const result = await this.requestRepository
      .createQueryBuilder()
      .update(ServiceRequest)
      .set({
        status: RequestStatus.PROCESSING,

        processingStartedAt: new Date(),
      })
      .where("id = :requestId", {
        requestId,
      })
      .andWhere("status = :status", {
        status: RequestStatus.CREATED,
      })
      .execute();

    return result.affected === 1;
  }

  private assertMatchingFingerprint(
    existingRequest: ServiceRequest,
    incomingFingerprint: string,
  ): void {
    if (existingRequest.requestFingerprint !== incomingFingerprint) {
      throw new ConflictError(
        "Idempotency key was already used with a different request payload",
        "IDEMPOTENCY_KEY_REUSED",
      );
    }
  }
}
