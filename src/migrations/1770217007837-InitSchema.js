/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1770217007837 {
    name = 'InitSchema1770217007837'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_PAYMENT_HISTORY_DATE"`);
        await queryRunner.query(`DROP INDEX "IDX_PAYMENT_HISTORY_ACTION"`);
        await queryRunner.query(`CREATE TABLE "temporary_payment_histories" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "actionType" varchar NOT NULL DEFAULT ('update'), "changedField" varchar NOT NULL, "oldValue" varchar, "newValue" varchar, "oldAmount" decimal(10,2) DEFAULT (0), "newAmount" decimal(10,2) DEFAULT (0), "notes" varchar, "performedBy" varchar, "changeDate" datetime NOT NULL DEFAULT (datetime('now')), "paymentId" integer, "referenceNumber" varchar, CONSTRAINT "FK_93d739910b5eedf4e4c8ebd0ef4" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_payment_histories"("id", "actionType", "changedField", "oldValue", "newValue", "oldAmount", "newAmount", "notes", "performedBy", "changeDate", "paymentId") SELECT "id", "actionType", "changedField", "oldValue", "newValue", "oldAmount", "newAmount", "notes", "performedBy", "changeDate", "paymentId" FROM "payment_histories"`);
        await queryRunner.query(`DROP TABLE "payment_histories"`);
        await queryRunner.query(`ALTER TABLE "temporary_payment_histories" RENAME TO "payment_histories"`);
        await queryRunner.query(`CREATE INDEX "IDX_PAYMENT_HISTORY_DATE" ON "payment_histories" ("changeDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_PAYMENT_HISTORY_ACTION" ON "payment_histories" ("actionType") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_PAYMENT_HISTORY_ACTION"`);
        await queryRunner.query(`DROP INDEX "IDX_PAYMENT_HISTORY_DATE"`);
        await queryRunner.query(`ALTER TABLE "payment_histories" RENAME TO "temporary_payment_histories"`);
        await queryRunner.query(`CREATE TABLE "payment_histories" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "actionType" varchar NOT NULL DEFAULT ('update'), "changedField" varchar NOT NULL, "oldValue" varchar, "newValue" varchar, "oldAmount" decimal(10,2) DEFAULT (0), "newAmount" decimal(10,2) DEFAULT (0), "notes" varchar, "performedBy" varchar, "changeDate" datetime NOT NULL DEFAULT (datetime('now')), "paymentId" integer, CONSTRAINT "FK_93d739910b5eedf4e4c8ebd0ef4" FOREIGN KEY ("paymentId") REFERENCES "payments" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "payment_histories"("id", "actionType", "changedField", "oldValue", "newValue", "oldAmount", "newAmount", "notes", "performedBy", "changeDate", "paymentId") SELECT "id", "actionType", "changedField", "oldValue", "newValue", "oldAmount", "newAmount", "notes", "performedBy", "changeDate", "paymentId" FROM "temporary_payment_histories"`);
        await queryRunner.query(`DROP TABLE "temporary_payment_histories"`);
        await queryRunner.query(`CREATE INDEX "IDX_PAYMENT_HISTORY_ACTION" ON "payment_histories" ("actionType") `);
        await queryRunner.query(`CREATE INDEX "IDX_PAYMENT_HISTORY_DATE" ON "payment_histories" ("changeDate") `);
    }
}
