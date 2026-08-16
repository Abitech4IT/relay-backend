import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { ServiceRequest } from "../requests/request.entity";

import { ProviderName, ProviderResultStatus } from "./provider.types";

@Entity({
  name: "provider_results",
})
@Unique("UQ_provider_results_request_provider_external", [
  "requestId",
  "provider",
  "externalResultId",
])
@Index("IDX_provider_results_request_id", ["requestId"])
@Index("IDX_provider_results_status", ["status"])
export class ProviderResult {
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
    type: "enum",
    enum: ProviderName,
  })
  provider!: ProviderName;

  @Column({
    name: "external_result_id",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  externalResultId!: string | null;

  @Column({
    type: "enum",
    enum: ProviderResultStatus,
  })
  status!: ProviderResultStatus;

  @Column({
    name: "raw_response",
    type: "jsonb",
    nullable: true,
  })
  rawResponse!: Record<string, unknown> | null;

  @Column({
    name: "error_code",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  errorCode!: string | null;

  @Column({
    name: "error_message",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  errorMessage!: string | null;

  @Column({
    name: "duration_ms",
    type: "integer",
  })
  durationMs!: number;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
