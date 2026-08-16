import path from "path";

import { AppDataSource } from "../../config/database";

import { requestService } from "../requests/request.module";

import { Attachment } from "./attachment.entity";

import { AttachmentService } from "./attachment.service";

import { LocalStorageService } from "./storage/local-storage.service";

const attachmentRepository = AppDataSource.getRepository(Attachment);

const localStorageService = new LocalStorageService(
  path.resolve(process.cwd(), "storage"),
);

export const attachmentService = new AttachmentService(
  attachmentRepository,
  requestService,
  localStorageService,
);
