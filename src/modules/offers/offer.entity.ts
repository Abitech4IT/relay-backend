import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { ServiceRequest } from "../requests/request.entity";

import { ProviderName } from "../providers/provider.types";

import { OfferStatus } from "../../common/constants/offer-status";

@Entity({
  name: "offers",
})
@Unique("UQ_offers_request_provider_external", [
  "requestId",
  "provider",
  "externalOfferId",
])
@Index("IDX_offers_request_id", ["requestId"])
@Index("IDX_offers_request_status", ["requestId", "status"])
export class Offer {
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
    name: "external_offer_id",
    type: "varchar",
    length: 255,
  })
  externalOfferId!: string;

  @Column({
    name: "base_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  baseAmount!: string;

  @Column({
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  fees!: string;

  @Column({
    name: "total_amount",
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  totalAmount!: string;

  @Column({
    type: "jsonb",
  })
  benefits!: string[];

  @Column({
    type: "jsonb",
  })
  terms!: string[];

  @Column({
    name: "customer_contribution",
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  customerContribution!: string;

  @Column({
    name: "valid_until",
    type: "timestamptz",
  })
  validUntil!: Date;

  @Column({
    name: "estimated_fulfillment_minutes",
    type: "integer",
  })
  estimatedFulfillmentMinutes!: number;

  @Column({
    type: "enum",
    enum: OfferStatus,
    default: OfferStatus.VALID,
  })
  status!: OfferStatus;

  @Column({
    name: "rank",
    type: "integer",
    nullable: true,
  })
  rank!: number | null;

  @Column({
    name: "score",
    type: "numeric",
    precision: 8,
    scale: 4,
    nullable: true,
  })
  score!: string | null;

  @Column({
    name: "ranking_explanation",
    type: "jsonb",
    nullable: true,
  })
  rankingExplanation!: Record<string, unknown> | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
  })
  updatedAt!: Date;
}
