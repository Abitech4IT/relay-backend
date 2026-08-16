import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToreques1786910154819 implements MigrationInterface {
    name = 'AddFieldsToreques1786910154819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "processing_started_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "service_requests" ADD "request_fingerprint" character varying(64) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "request_fingerprint"`);
        await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN "processing_started_at"`);
    }

}
