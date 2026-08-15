import { Request, Response } from "express";

import { getIdempotencyKey } from "../../common/utils/idempotency-key";

import { RequestService } from "./request.service";
import { CreateServiceRequestBody } from "./request.schemas";

export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  create = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const idempotencyKey = getIdempotencyKey(req.get("Idempotency-Key"));

    const body = req.body as CreateServiceRequestBody;

    const { request: serviceRequest, replayed } =
      await this.requestService.create(userId, body, idempotencyKey);

    res.status(replayed ? 200 : 201).json({
      success: true,

      data: {
        request: this.toResponse(serviceRequest),

        idempotentReplay: replayed,
      },
    });
  };

  getOne = async (req: Request, res: Response) => {
    const publicId = Array.isArray(req.params.publicId)
      ? req.params.publicId[0]
      : req.params.publicId;

    const serviceRequest = await this.requestService.findOwnedByPublicId(
      publicId,
      req.user!.id,
    );

    res.status(200).json({
      success: true,

      data: {
        request: this.toResponse(serviceRequest),
      },
    });
  };

  getHistory = async (req: Request, res: Response) => {
    const requests = await this.requestService.findAllOwnedByUser(req.user!.id);

    res.status(200).json({
      success: true,

      data: {
        requests: requests.map((serviceRequest) =>
          this.toResponse(serviceRequest),
        ),
      },
    });
  };

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
