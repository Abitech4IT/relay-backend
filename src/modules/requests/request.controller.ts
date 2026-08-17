import { Request, Response } from "express";

import { getIdempotencyKey } from "../../common/utils/idempotency-key";

import { RequestStatus } from "../../common/constants/request-status";

import { RequestService } from "./request.service";

import type { CreateServiceRequestBody } from "./request.schemas";

import { OfferService } from "../offers/offer.service";

import { ProviderService } from "../providers/provider.service";

import { toProviderRequest } from "../providers/provider.mapper";

import { realtimeService } from "../realtime/realtime.service";
import { ServiceRequest } from "./request.entity";
import { backgroundTaskTracker } from "../../common/utils/background-task-tracker";

export class RequestController {
  constructor(
    private readonly requestService: RequestService,

    private readonly offerService: OfferService,

    private readonly providerService: ProviderService,
  ) {}

  create = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const idempotencyKey = getIdempotencyKey(req.get("Idempotency-Key"));

    const body = req.body as CreateServiceRequestBody;

    const { request: serviceRequest, replayed } =
      await this.requestService.create(userId, body, idempotencyKey);

    if (!replayed) {
      realtimeService.safeEmitRequestStatus(
        serviceRequest.publicId,
        RequestStatus.CREATED,
      );
    }

    if (serviceRequest.status === RequestStatus.CREATED) {
      this.startProviderProcessing(serviceRequest);
    }

    return res.status(replayed ? 200 : 201).json({
      success: true,

      data: {
        request: this.toResponse(serviceRequest),

        idempotentReplay: replayed,
      },
    });
  };

  getOne = async (req: Request, res: Response) => {
    const publicId = this.getPublicId(req);

    const serviceRequest = await this.requestService.findOwnedByPublicId(
      publicId,
      req.user!.id,
    );

    return res.status(200).json({
      success: true,

      data: {
        request: this.toResponse(serviceRequest),
      },
    });
  };

  getHistory = async (req: Request, res: Response) => {
    const requests = await this.requestService.findAllOwnedByUser(req.user!.id);

    return res.status(200).json({
      success: true,

      data: {
        requests: requests.map((serviceRequest) =>
          this.toResponse(serviceRequest),
        ),
      },
    });
  };

  getOffers = async (req: Request, res: Response) => {
    const publicId = this.getPublicId(req);

    const serviceRequest = await this.requestService.findOwnedByPublicId(
      publicId,
      req.user!.id,
    );

    const offers = await this.offerService.findAllForRequest(serviceRequest.id);

    return res.status(200).json({
      success: true,

      data: {
        requestId: serviceRequest.publicId,

        status: serviceRequest.status,

        offers: offers.map((offer) => ({
          id: offer.id,

          provider: offer.provider,

          baseAmount: Number(offer.baseAmount),

          fees: Number(offer.fees),

          totalAmount: Number(offer.totalAmount),

          benefits: offer.benefits,

          terms: offer.terms,

          customerContribution: Number(offer.customerContribution),

          validUntil: offer.validUntil,

          estimatedFulfillmentMinutes: offer.estimatedFulfillmentMinutes,

          status: offer.status,

          rank: offer.rank,

          score: offer.score !== null ? Number(offer.score) : null,

          rankingExplanation: offer.rankingExplanation,

          createdAt: offer.createdAt,
        })),
      },
    });
  };

  private startProviderProcessing(serviceRequest: ServiceRequest): void {
    const providerRequest = toProviderRequest(serviceRequest);

    const processingTask = this.providerService
      .processRequest(serviceRequest.id, providerRequest)
      .catch((error) => {
        console.error("Unexpected provider processing failure", {
          requestId: serviceRequest.publicId,

          error:
            error instanceof Error
              ? error.message
              : "Unknown provider processing error",
        });
      });

    backgroundTaskTracker.track(processingTask);
  }

  private getPublicId(req: Request): string {
    return Array.isArray(req.params.publicId)
      ? req.params.publicId[0]
      : req.params.publicId;
  }

  private toResponse(serviceRequest: {
    publicId: string;
    category: string;
    customerProfile: unknown;
    asset: unknown;
    notes: string | null;
    consent: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: serviceRequest.publicId,

      category: serviceRequest.category,

      customerProfile: serviceRequest.customerProfile,

      asset: serviceRequest.asset,

      notes: serviceRequest.notes,

      consent: serviceRequest.consent,

      status: serviceRequest.status,

      createdAt: serviceRequest.createdAt,

      updatedAt: serviceRequest.updatedAt,
    };
  }
}
