import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ServiceRequest } from "../requests/request.entity";

@Entity({
  name: "attachments",
})
@Index("IDX_attachments_request_id", ["requestId"])
export class Attachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "request_id",
    type: "uuid",
  })
  requestId!: string;

  @ManyToOne(() => ServiceRequest, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "request_id",
  })
  request!: ServiceRequest;

  @Column({
    name: "original_name",
    type: "varchar",
    length: 255,
  })
  originalName!: string;

  @Column({
    name: "stored_name",
    type: "varchar",
    length: 255,
    unique: true,
  })
  storedName!: string;

  @Column({
    name: "mime_type",
    type: "varchar",
    length: 100,
  })
  mimeType!: string;

  @Column({
    name: "extension",
    type: "varchar",
    length: 20,
  })
  extension!: string;

  @Column({
    name: "size_bytes",
    type: "bigint",
  })
  sizeBytes!: string;

  @Column({
    name: "storage_key",
    type: "varchar",
    length: 500,
    unique: true,
  })
  storageKey!: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
