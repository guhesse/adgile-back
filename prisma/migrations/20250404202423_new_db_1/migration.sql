/*
  Warnings:

  - You are about to drop the `category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `layout` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `category`;

-- DropTable
DROP TABLE `layout`;

-- CreateTable
CREATE TABLE `User` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LayoutType` (
    `layout_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `tenant_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`layout_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Artboard` (
    `artboard_id` INTEGER NOT NULL AUTO_INCREMENT,
    `layout_type_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `width` INTEGER NOT NULL,
    `height` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`artboard_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Element` (
    `element_id` INTEGER NOT NULL AUTO_INCREMENT,
    `artboard_id` INTEGER NOT NULL,
    `element_type` VARCHAR(191) NOT NULL,
    `position_x` DOUBLE NOT NULL,
    `position_y` DOUBLE NOT NULL,
    `width` DOUBLE NOT NULL,
    `height` DOUBLE NOT NULL,
    `z_index` INTEGER NOT NULL DEFAULT 0,
    `tenant_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`element_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ElementStyle` (
    `style_id` INTEGER NOT NULL AUTO_INCREMENT,
    `element_id` INTEGER NOT NULL,
    `style_property` VARCHAR(191) NOT NULL,
    `style_value` VARCHAR(191) NOT NULL,
    `tenant_id` INTEGER NOT NULL,

    PRIMARY KEY (`style_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ElementContent` (
    `content_id` INTEGER NOT NULL AUTO_INCREMENT,
    `element_id` INTEGER NOT NULL,
    `content_type` VARCHAR(191) NOT NULL,
    `content_value` VARCHAR(191) NULL,
    `tenant_id` INTEGER NOT NULL,

    PRIMARY KEY (`content_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `resource_id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `resource_type` VARCHAR(191) NOT NULL,
    `external_path` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `original_filename` VARCHAR(191) NOT NULL,
    `file_size` BIGINT NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`resource_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
