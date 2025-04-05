/*
  Warnings:

  - You are about to drop the column `layout_type_id` on the `artboard` table. All the data in the column will be lost.
  - You are about to drop the `layouttype` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `layout_id` to the `Artboard` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Artboard_created_by_fkey` ON `artboard`;

-- DropIndex
DROP INDEX `Artboard_layout_type_id_fkey` ON `artboard`;

-- DropIndex
DROP INDEX `Element_artboard_id_fkey` ON `element`;

-- DropIndex
DROP INDEX `ElementContent_element_id_fkey` ON `elementcontent`;

-- DropIndex
DROP INDEX `ElementStyle_element_id_fkey` ON `elementstyle`;

-- DropIndex
DROP INDEX `Resource_created_by_fkey` ON `resource`;

-- AlterTable
ALTER TABLE `artboard` DROP COLUMN `layout_type_id`,
    ADD COLUMN `layout_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `layouttype`;

-- CreateTable
CREATE TABLE `Layout` (
    `layout_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `content` LONGTEXT NULL,
    `category_id` INTEGER NULL,
    `tenant_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`layout_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Layout` ADD CONSTRAINT `Layout_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artboard` ADD CONSTRAINT `Artboard_layout_id_fkey` FOREIGN KEY (`layout_id`) REFERENCES `Layout`(`layout_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artboard` ADD CONSTRAINT `Artboard_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Element` ADD CONSTRAINT `Element_artboard_id_fkey` FOREIGN KEY (`artboard_id`) REFERENCES `Artboard`(`artboard_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ElementStyle` ADD CONSTRAINT `ElementStyle_element_id_fkey` FOREIGN KEY (`element_id`) REFERENCES `Element`(`element_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ElementContent` ADD CONSTRAINT `ElementContent_element_id_fkey` FOREIGN KEY (`element_id`) REFERENCES `Element`(`element_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
