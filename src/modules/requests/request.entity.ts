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

import { User } from "../users/user.entity";
import { RequestStatus } from "../../common/constants/request-status";

import { AssetData, CustomerProfile } from "./request.types";

@Entity({
  name: "service_requests",
})
@Unique("UQ_service_requests_user_idempotency", ["userId", "idempotencyKey"])
@Index("IDX_service_requests_public_id", ["publicId"], {
  unique: true,
})
@Index("IDX_service_requests_user_created_at", ["userId", "createdAt"])
@Index("IDX_service_requests_status", ["status"])
export class ServiceRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "public_id",
    type: "varchar",
    length: 50,
  })
  publicId!: string;

  @Column({
    name: "user_id",
    type: "uuid",
  })
  userId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "user_id",
  })
  user!: User;

  @Column({
    type: "varchar",
    length: 100,
  })
  category!: string;

  @Column({
    name: "customer_profile",
    type: "jsonb",
  })
  customerProfile!: CustomerProfile;

  @Column({
    type: "jsonb",
  })
  asset!: AssetData;

  @Column({
    type: "text",
    nullable: true,
  })
  notes!: string | null;

  @Column({
    type: "boolean",
  })
  consent!: boolean;

  @Column({
    type: "enum",
    enum: RequestStatus,
    default: RequestStatus.CREATED,
  })
  status!: RequestStatus;

  @Column({
    name: "idempotency_key",
    type: "varchar",
    length: 255,
  })
  idempotencyKey!: string;

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
