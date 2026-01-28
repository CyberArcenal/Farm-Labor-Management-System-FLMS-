/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1769421138640 {
    name = 'InitSchema1769421138640'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "temporary_bukids" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "location" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "kabisilyaId" integer, "status" varchar NOT NULL DEFAULT ('active'), CONSTRAINT "FK_0caba19d01baf91c011e37eb701" FOREIGN KEY ("kabisilyaId") REFERENCES "kabisilyas" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_bukids"("id", "name", "location", "createdAt", "updatedAt", "kabisilyaId") SELECT "id", "name", "location", "createdAt", "updatedAt", "kabisilyaId" FROM "bukids"`);
        await queryRunner.query(`DROP TABLE "bukids"`);
        await queryRunner.query(`ALTER TABLE "temporary_bukids" RENAME TO "bukids"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bukids" RENAME TO "temporary_bukids"`);
        await queryRunner.query(`CREATE TABLE "bukids" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "location" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "kabisilyaId" integer, CONSTRAINT "FK_0caba19d01baf91c011e37eb701" FOREIGN KEY ("kabisilyaId") REFERENCES "kabisilyas" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "bukids"("id", "name", "location", "createdAt", "updatedAt", "kabisilyaId") SELECT "id", "name", "location", "createdAt", "updatedAt", "kabisilyaId" FROM "temporary_bukids"`);
        await queryRunner.query(`DROP TABLE "temporary_bukids"`);
    }
}
