export interface StoredFile {
  key: string;
  size: number;
}

export interface StorageService {
  save(buffer: Buffer, key: string): Promise<StoredFile>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;

  getAbsolutePath?(key: string): string;
}
