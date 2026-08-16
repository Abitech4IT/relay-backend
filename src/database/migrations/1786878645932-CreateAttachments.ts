import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAttachments1786878645932 implements MigrationInterface {
    name = 'CreateAttachments1786878645932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "attachments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "original_name" character varying(255) NOT NULL, "stored_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "extension" character varying(20) NOT NULL, "size_bytes" bigint NOT NULL, "storage_key" character varying(500) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fd4372d028a98db62266f932d2e" UNIQUE ("stored_name"), CONSTRAINT "UQ_ec3648b85f6af7eafe865a3257b" UNIQUE ("storage_key"), CONSTRAINT "PK_5e1f050bcff31e3084a1d662412" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_attachments_request_id" ON "attachments" ("request_id") `);
        await queryRunner.query(`ALTER TABLE "attachments" ADD CONSTRAINT "FK_dcbe694cf3a439b06e0c7b6a73c" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "attachments" DROP CONSTRAINT "FK_dcbe694cf3a439b06e0c7b6a73c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_attachments_request_id"`);
        await queryRunner.query(`DROP TABLE "attachments"`);
    }

}
