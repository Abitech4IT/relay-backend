import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateServiceRequests1786824642874 implements MigrationInterface {
    name = 'CreateServiceRequests1786824642874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."service_requests_status_enum" AS ENUM('CREATED', 'PROCESSING', 'PARTIAL_RESULTS', 'READY_FOR_REVIEW', 'COMPLETED', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "service_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "public_id" character varying(50) NOT NULL, "user_id" uuid NOT NULL, "category" character varying(100) NOT NULL, "customer_profile" jsonb NOT NULL, "asset" jsonb NOT NULL, "notes" text, "consent" boolean NOT NULL, "status" "public"."service_requests_status_enum" NOT NULL DEFAULT 'CREATED', "idempotency_key" character varying(255) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_service_requests_user_idempotency" UNIQUE ("user_id", "idempotency_key"), CONSTRAINT "PK_ee60bcd826b7e130bfbd97daf66" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_service_requests_status" ON "service_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_service_requests_user_created_at" ON "service_requests" ("user_id", "created_at") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_service_requests_public_id" ON "service_requests" ("public_id") `);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD CONSTRAINT "FK_c38549a33af09d8cf92e9878a17" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP CONSTRAINT "FK_c38549a33af09d8cf92e9878a17"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_requests_public_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_requests_user_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_service_requests_status"`);
        await queryRunner.query(`DROP TABLE "service_requests"`);
        await queryRunner.query(`DROP TYPE "public"."service_requests_status_enum"`);
    }

}
