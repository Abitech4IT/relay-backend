import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../users/user.entity";

@Entity({ name: "refresh_tokens" })
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "token_hash",
    type: "varchar",
    length: 255,
    unique: true,
  })
  tokenHash!: string;

  @Column({
    name: "expires_at",
    type: "timestamptz",
  })
  expiresAt!: Date;

  @Column({
    name: "revoked_at",
    type: "timestamptz",
    nullable: true,
    default: null,
  })
  revokedAt!: Date | null;

  @Column({
    name: "replaced_by_token_id",
    type: "uuid",
    nullable: true,
    default: null,
  })
  replacedByTokenId!: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: "CASCADE",
    nullable: false,
  })
  @JoinColumn({
    name: "user_id",
  })
  user!: User;
}
