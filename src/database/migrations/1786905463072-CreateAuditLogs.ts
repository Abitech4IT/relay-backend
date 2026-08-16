import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuditLogs1786905463072 implements MigrationInterface {
    name = 'CreateAuditLogs1786905463072'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "actor_id" uuid NOT NULL, "field_name" character varying(100) NOT NULL, "old_value" jsonb, "new_value" jsonb, "reason" character varying(500) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_actor_id" ON "audit_logs" ("actor_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_audit_logs_request_id" ON "audit_logs" ("request_id") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_959054ba1c3ad6190ce3f7c7548" FOREIGN KEY ("request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_177183f29f438c488b5e8510cdb"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_959054ba1c3ad6190ce3f7c7548"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_request_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_actor_id"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
    }

}
