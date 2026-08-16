import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProviderResults1786889300186 implements MigrationInterface {
    name = 'CreateProviderResults1786889300186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."provider_results_provider_enum" AS ENUM('ALPHA', 'BETA', 'GAMMA')`);
        await queryRunner.query(`CREATE TYPE "public"."provider_results_status_enum" AS ENUM('SUCCESS', 'FAILED', 'TIMEOUT', 'INVALID_RESPONSE', 'TEMPORARY_ERROR')`);
        await queryRunner.query(`CREATE TABLE "provider_results" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "provider" "public"."provider_results_provider_enum" NOT NULL, "external_result_id" character varying(255), "status" "public"."provider_results_status_enum" NOT NULL, "raw_response" jsonb, "error_code" character varying(100), "error_message" character varying(500), "duration_ms" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_provider_results_request_provider_external" UNIQUE ("request_id", "provider", "external_result_id"), CONSTRAINT "PK_8eb50f41c6a2c87912e371df470" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_provider_results_status" ON "provider_results" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_provider_results_request_id" ON "provider_results" ("request_id") `);
        await queryRunner.query(`ALTER TABLE "provider_results" ADD CONSTRAINT "FK_544ee9ba3756f98fa727801cfb5" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "provider_results" DROP CONSTRAINT "FK_544ee9ba3756f98fa727801cfb5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_provider_results_request_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_provider_results_status"`);
        await queryRunner.query(`DROP TABLE "provider_results"`);
        await queryRunner.query(`DROP TYPE "public"."provider_results_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."provider_results_provider_enum"`);
    }

}
