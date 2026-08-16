import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOffers1786897895172 implements MigrationInterface {
    name = 'CreateOffers1786897895172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."offers_provider_enum" AS ENUM('ALPHA', 'BETA', 'GAMMA')`);
        await queryRunner.query(`CREATE TYPE "public"."offers_status_enum" AS ENUM('VALID', 'INVALID', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "offers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "provider" "public"."offers_provider_enum" NOT NULL, "external_offer_id" character varying(255) NOT NULL, "base_amount" numeric(12,2) NOT NULL, "fees" numeric(12,2) NOT NULL, "total_amount" numeric(12,2) NOT NULL, "benefits" jsonb NOT NULL, "terms" jsonb NOT NULL, "customer_contribution" numeric(12,2) NOT NULL, "valid_until" TIMESTAMP WITH TIME ZONE NOT NULL, "estimated_fulfillment_minutes" integer NOT NULL, "status" "public"."offers_status_enum" NOT NULL DEFAULT 'VALID', "rank" integer, "score" numeric(8,4), "ranking_explanation" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_offers_request_provider_external" UNIQUE ("request_id", "provider", "external_offer_id"), CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_offers_request_status" ON "offers" ("request_id", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_offers_request_id" ON "offers" ("request_id") `);
        await queryRunner.query(`ALTER TABLE "offers" ADD CONSTRAINT "FK_a95e1929b6cdc91ec744b5dce3c" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "offers" DROP CONSTRAINT "FK_a95e1929b6cdc91ec744b5dce3c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_offers_request_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_offers_request_status"`);
        await queryRunner.query(`DROP TABLE "offers"`);
        await queryRunner.query(`DROP TYPE "public"."offers_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."offers_provider_enum"`);
    }

}
