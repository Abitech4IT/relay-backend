import { Repository } from "typeorm";

import { BadRequestError } from "../../common/errors";

import { env } from "../../config/env";
import { AppDataSource } from "../../config/database";

import { sanitizeFilename } from "../../common/utils/filename";

import { validateAttachment } from "../../common/utils/attachment-validation";

import { RequestService } from "../requests/request.service";

import { Attachment } from "./attachment.entity";

import { StorageService } from "./storage/storage.interface";

import { generateAttachmentStorageKey } from "../../common/utils/storage-key";

export class AttachmentService {
  constructor(
    private readonly attachmentRepository: Repository<Attachment>,

    private readonly requestService: RequestService,

    private readonly storage: StorageService,
  ) {}

  private async storeFile(
    file: Express.Multer.File,
    extension: string,
  ): Promise<string> {
    const MAX_ATTEMPTS = 3;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const storageKey = generateAttachmentStorageKey(extension);

      const exists = await this.storage.exists(storageKey);

      if (exists) {
        continue;
      }

      try {
        await this.storage.save(file.buffer, storageKey);

        return storageKey;
      } catch (error) {
        const nodeError = error as NodeJS.ErrnoException;

        if (nodeError.code !== "EEXIST") {
          throw error;
        }
      }
    }

    throw new Error("Unable to allocate a unique storage key");
  }

  async uploadForRequest(
    userId: string,
    requestPublicId: string,
    files: Express.Multer.File[],
  ): Promise<Attachment[]> {
    const serviceRequest = await this.requestService.findOwnedByPublicId(
      requestPublicId,
      userId,
    );

    if (!files || files.length === 0) {
      throw new BadRequestError(
        "At least one attachment is required",
        "ATTACHMENTS_REQUIRED",
      );
    }

    const maxSizeBytes = env.UPLOAD_MAX_SIZE_MB * 1024 * 1024;

    // Validate entire batch before storing anything.
    const validatedFiles = files.map((file) => {
      const { extension, mimeType } = validateAttachment(file, maxSizeBytes);

      return {
        file,
        extension,
        mimeType,
      };
    });

    const storedFiles: Array<{
      file: Express.Multer.File;
      extension: string;
      mimeType: string;
      storageKey: string;
    }> = [];

    try {
      // Store physical files first.
      for (const validated of validatedFiles) {
        const storageKey = await this.storeFile(
          validated.file,
          validated.extension,
        );

        storedFiles.push({
          ...validated,
          storageKey,
        });
      }

      // Save all metadata atomically.
      const attachments = await AppDataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Attachment);

        const records = storedFiles.map(
          ({ file, extension, mimeType, storageKey }) =>
            repository.create({
              requestId: serviceRequest.id,

              originalName: sanitizeFilename(file.originalname),

              storedName: storageKey.split("/").at(-1)!,

              mimeType,

              extension,

              sizeBytes: String(file.size),

              storageKey,
            }),
        );

        return repository.save(records);
      });

      return attachments;
    } catch (error) {
      // Compensating cleanup.
      await Promise.allSettled(
        storedFiles.map(({ storageKey }) => this.storage.delete(storageKey)),
      );

      throw error;
    }
  }

  async findForRequest(
    userId: string,
    requestPublicId: string,
  ): Promise<Attachment[]> {
    const serviceRequest = await this.requestService.findOwnedByPublicId(
      requestPublicId,
      userId,
    );

    return this.attachmentRepository.find({
      where: {
        requestId: serviceRequest.id,
      },

      order: {
        createdAt: "ASC",
      },
    });
  }
}
