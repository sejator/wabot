-- CreateTable
CREATE TABLE `apikeys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `token` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `apikeys_userId_key`(`userId`),
    INDEX `apikeys_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `ready` BOOLEAN NOT NULL DEFAULT false,
    `webhook` BOOLEAN NOT NULL DEFAULT false,
    `url` VARCHAR(191) NULL,
    `expired` INTEGER NULL DEFAULT 0,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `devices_uuid_key`(`uuid`),
    UNIQUE INDEX `devices_key_key`(`key`),
    INDEX `devices_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `sid` VARCHAR(191) NOT NULL,
    `data` TEXT NOT NULL,
    `expiresAt` DATETIME(0) NULL,

    UNIQUE INDEX `session_sid_key`(`sid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `roleId` INTEGER NOT NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `photo` VARCHAR(191) NULL DEFAULT 'photo.png',
    `key` VARCHAR(191) NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_whatsapp_key`(`whatsapp`),
    INDEX `users_roleId_fkey`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pakets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `durasi` INTEGER NOT NULL,
    `harga` INTEGER NOT NULL,
    `diskon` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `pemilik` VARCHAR(191) NOT NULL,
    `norek` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paketId` INTEGER NOT NULL,
    `devicesKey` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `deviceKey` VARCHAR(191) NOT NULL,
    `paketId` INTEGER NOT NULL,
    `bankId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `status` ENUM('PAID', 'UNPAID', 'EXPIRED', 'FAILED') NOT NULL DEFAULT 'UNPAID',
    `expired` INTEGER NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `invoices_uuid_key`(`uuid`),
    INDEX `invoices_uuid_kode_idx`(`uuid`, `kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `deviceKey` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `read` INTEGER NOT NULL DEFAULT 1,
    `noTujuan` VARCHAR(191) NULL,
    `text` TEXT NULL,
    `isGroup` BOOLEAN NOT NULL DEFAULT false,
    `secure` BOOLEAN NOT NULL DEFAULT false,
    `timestamp` INTEGER NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `messages_uuid_key`(`uuid`),
    UNIQUE INDEX `messages_messageId_key`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `deviceKey` VARCHAR(191) NOT NULL,
    `groupId` VARCHAR(200) NOT NULL,
    `groupName` VARCHAR(100) NULL,
    `groupAuthor` VARCHAR(191) NULL,
    `groupDeskripsi` VARCHAR(191) NULL,
    `groupAnggota` LONGTEXT NULL,
    `total` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `groups_uuid_key`(`uuid`),
    UNIQUE INDEX `groups_groupId_key`(`groupId`),
    INDEX `groups_groupId_idx`(`groupId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `waauts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deviceKey` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `credentials` LONGTEXT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    INDEX `waauts_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `main` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,
    `link` VARCHAR(191) NOT NULL,
    `urut` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submenus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `menusId` INTEGER NOT NULL,
    `sub` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL,
    `urut` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usermenus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `submenusId` INTEGER NOT NULL,
    `rolesId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `autoreply` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `deviceKey` VARCHAR(191) NOT NULL,
    `type` ENUM('TEXT', 'BUTTON', 'LIST') NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `title` VARCHAR(191) NULL,
    `footer` VARCHAR(191) NULL,
    `isGroup` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,

    UNIQUE INDEX `autoreply_uuid_key`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buttonreply` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `autoreplyId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(0) NULL,
    `updatedAt` DATETIME(0) NULL,
    `deviceKey` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `buttonreply_uuid_key`(`uuid`),
    FULLTEXT INDEX `buttonreply_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `apikeys` ADD CONSTRAINT `apikeys_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_paketId_fkey` FOREIGN KEY (`paketId`) REFERENCES `pakets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_devicesKey_fkey` FOREIGN KEY (`devicesKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_deviceKey_fkey` FOREIGN KEY (`deviceKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_paketId_fkey` FOREIGN KEY (`paketId`) REFERENCES `pakets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_bankId_fkey` FOREIGN KEY (`bankId`) REFERENCES `banks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_deviceKey_fkey` FOREIGN KEY (`deviceKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_deviceKey_fkey` FOREIGN KEY (`deviceKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `waauts` ADD CONSTRAINT `waauts_deviceKey_fkey` FOREIGN KEY (`deviceKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submenus` ADD CONSTRAINT `submenus_menusId_fkey` FOREIGN KEY (`menusId`) REFERENCES `menus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenus` ADD CONSTRAINT `usermenus_submenusId_fkey` FOREIGN KEY (`submenusId`) REFERENCES `submenus`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenus` ADD CONSTRAINT `usermenus_rolesId_fkey` FOREIGN KEY (`rolesId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autoreply` ADD CONSTRAINT `autoreply_deviceKey_fkey` FOREIGN KEY (`deviceKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `autoreply` ADD CONSTRAINT `autoreply_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buttonreply` ADD CONSTRAINT `buttonreply_autoreplyId_fkey` FOREIGN KEY (`autoreplyId`) REFERENCES `autoreply`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buttonreply` ADD CONSTRAINT `buttonreply_deviceKey_fkey` FOREIGN KEY (`deviceKey`) REFERENCES `devices`(`key`) ON DELETE RESTRICT ON UPDATE CASCADE;
