/*
  Warnings:

  - Added the required column `category_id` to the `LayoutType` table without a default value. This is not possible if the table is not empty.

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
DROP INDEX `LayoutType_created_by_fkey` ON `layouttype`;

-- DropIndex
DROP INDEX `Resource_created_by_fkey` ON `resource`;

-- AlterTable
ALTER TABLE `layouttype` ADD COLUMN `category_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `LayoutType` ADD CONSTRAINT `LayoutType_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artboard` ADD CONSTRAINT `Artboard_layout_type_id_fkey` FOREIGN KEY (`layout_type_id`) REFERENCES `LayoutType`(`layout_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
