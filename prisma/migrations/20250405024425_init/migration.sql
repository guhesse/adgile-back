-- DropIndex
DROP INDEX `Artboard_created_by_fkey` ON `artboard`;

-- DropIndex
DROP INDEX `Artboard_layout_id_fkey` ON `artboard`;

-- DropIndex
DROP INDEX `Element_artboard_id_fkey` ON `element`;

-- DropIndex
DROP INDEX `ElementContent_element_id_fkey` ON `elementcontent`;

-- DropIndex
DROP INDEX `ElementStyle_element_id_fkey` ON `elementstyle`;

-- DropIndex
DROP INDEX `Layout_created_by_fkey` ON `layout`;

-- DropIndex
DROP INDEX `Resource_created_by_fkey` ON `resource`;

-- AlterTable
ALTER TABLE `layout` MODIFY `category_id` VARCHAR(191) NULL;

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
