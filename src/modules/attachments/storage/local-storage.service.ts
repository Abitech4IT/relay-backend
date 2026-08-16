import fs from "fs/promises";
import path from "path";

import { StoredFile, StorageService } from "./storage.interface";
import { StorageConflictError } from "../../../common/errors";

export class LocalStorageService implements StorageService {
  constructor(private readonly rootDirectory: string) {}

  async save(buffer: Buffer, key: string): Promise<StoredFile> {
    const absolutePath = this.resolveKey(key);

    const directory = path.dirname(absolutePath);

    await fs.mkdir(directory, {
      recursive: true,
    });

    try {
      await fs.writeFile(absolutePath, buffer, {
        flag: "wx",
      });
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === "EEXIST") {
        throw new StorageConflictError();
      }

      throw error;
    }

    return {
      key,
      size: buffer.length,
    };
  }

  async delete(key: string): Promise<void> {
    const absolutePath = this.resolveKey(key);

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));

      return true;
    } catch {
      return false;
    }
  }

  getAbsolutePath(key: string): string {
    return this.resolveKey(key);
  }

  private resolveKey(key: string): string {
    const root = path.resolve(this.rootDirectory);

    const resolved = path.resolve(root, key);

    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      throw new Error("Invalid storage key");
    }

    return resolved;
  }
}
