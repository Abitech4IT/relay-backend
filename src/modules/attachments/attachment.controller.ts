import { Request, Response } from "express";

import { AttachmentService } from "./attachment.service";

export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  upload = async (req: Request, res: Response) => {
    const files = (req.files ?? []) as Express.Multer.File[];

    const attachments = await this.attachmentService.uploadForRequest(
      req.user!.id,
      Array.isArray(req.params.publicId)
        ? req.params.publicId[0]
        : req.params.publicId,
      files,
    );

    res.status(201).json({
      success: true,

      data: {
        attachments: attachments.map((attachment) => ({
          id: attachment.id,

          originalName: attachment.originalName,

          mimeType: attachment.mimeType,

          sizeBytes: Number(attachment.sizeBytes),

          createdAt: attachment.createdAt,
        })),
      },
    });
  };

  getForRequest = async (req: Request, res: Response) => {
    const attachments = await this.attachmentService.findForRequest(
      req.user!.id,
      Array.isArray(req.params.publicId)
        ? req.params.publicId[0]
        : req.params.publicId,
    );

    res.status(200).json({
      success: true,

      data: {
        attachments: attachments.map((attachment) => ({
          id: attachment.id,

          originalName: attachment.originalName,

          mimeType: attachment.mimeType,

          sizeBytes: Number(attachment.sizeBytes),

          createdAt: attachment.createdAt,
        })),
      },
    });
  };
}
