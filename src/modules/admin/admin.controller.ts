import { Request, Response } from "express";

import { AdminService } from "./admin.service";

import { AdminCorrectionInput } from "./admin.types";

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  getRequest = async (req: Request, res: Response) => {
    const publicId = Array.isArray(req.params.publicId)
      ? req.params.publicId[0]
      : req.params.publicId;

    const serviceRequest = await this.adminService.getRequest(publicId);

    res.status(200).json({
      success: true,
      data: {
        request: {
          id: serviceRequest.publicId,

          userId: serviceRequest.userId,

          category: serviceRequest.category,

          customerProfile: serviceRequest.customerProfile,

          asset: serviceRequest.asset,

          notes: serviceRequest.notes,

          consent: serviceRequest.consent,

          status: serviceRequest.status,

          createdAt: serviceRequest.createdAt,

          updatedAt: serviceRequest.updatedAt,
        },
      },
    });
  };

  getProviderResults = async (req: Request, res: Response) => {
    const publicId = Array.isArray(req.params.publicId)
      ? req.params.publicId[0]
      : req.params.publicId;

    const results = await this.adminService.getProviderResults(publicId);

    res.status(200).json({
      success: true,
      data: {
        providerResults: results.map((result) => ({
          id: result.id,

          provider: result.provider,

          status: result.status,

          externalResultId: result.externalResultId,

          errorCode: result.errorCode,

          errorMessage: result.errorMessage,

          durationMs: result.durationMs,

          createdAt: result.createdAt,
        })),
      },
    });
  };

  correctRequest = async (req: Request, res: Response) => {
    const input = req.body as AdminCorrectionInput;

    const publicId = Array.isArray(req.params.publicId)
      ? req.params.publicId[0]
      : req.params.publicId;

    const serviceRequest = await this.adminService.correctRequest(
      publicId,
      req.user!.id,
      input,
    );

    res.status(200).json({
      success: true,

      data: {
        request: {
          id: serviceRequest.publicId,

          category: serviceRequest.category,

          customerProfile: serviceRequest.customerProfile,

          asset: serviceRequest.asset,

          notes: serviceRequest.notes,

          status: serviceRequest.status,

          updatedAt: serviceRequest.updatedAt,
        },
      },
    });
  };

  getAuditTrail = async (req: Request, res: Response) => {
    const publicId = Array.isArray(req.params.publicId)
      ? req.params.publicId[0]
      : req.params.publicId;

    const audits = await this.adminService.getAuditTrail(publicId);

    res.status(200).json({
      success: true,

      data: {
        auditLogs: audits.map((audit) => ({
          id: audit.id,

          actorId: audit.actorId,

          field: audit.fieldName,

          oldValue: audit.oldValue,

          newValue: audit.newValue,

          reason: audit.reason,

          createdAt: audit.createdAt,
        })),
      },
    });
  };
}
