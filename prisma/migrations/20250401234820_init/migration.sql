-- DropIndex
DROP INDEX `Layout_categoryId_fkey` ON `layout`;

-- AddForeignKey
ALTER TABLE `Layout` ADD CONSTRAINT `Layout_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
