import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../users/user.entity";
import { ServiceRequest } from "../requests/request.entity";

@Entity({
  name: "audit_logs",
})
@Index("IDX_audit_logs_request_id", ["requestId"])
@Index("IDX_audit_logs_actor_id", ["actorId"])
export class AuditLog {
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
    name: "actor_id",
    type: "uuid",
  })
  actorId!: string;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "actor_id",
  })
  actor!: User;

  @Column({
    name: "field_name",
    type: "varchar",
    length: 100,
  })
  fieldName!: string;

  @Column({
    name: "old_value",
    type: "jsonb",
    nullable: true,
  })
  oldValue!: unknown;

  @Column({
    name: "new_value",
    type: "jsonb",
    nullable: true,
  })
  newValue!: unknown;

  @Column({
    type: "varchar",
    length: 500,
  })
  reason!: string;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
