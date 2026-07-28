-- DropForeignKey
ALTER TABLE `Brand` DROP FOREIGN KEY `Brand_seoId_fkey`;

-- DropForeignKey
ALTER TABLE `Cart` DROP FOREIGN KEY `Cart_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Category` DROP FOREIGN KEY `Category_seoId_fkey`;

-- DropForeignKey
ALTER TABLE `CmsPage` DROP FOREIGN KEY `CmsPage_seoId_fkey`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_seoId_fkey`;

-- DropForeignKey
ALTER TABLE `SellerSeo` DROP FOREIGN KEY `SellerSeo_sellerId_fkey`;

-- DropForeignKey
ALTER TABLE `SellerSeo` DROP FOREIGN KEY `SellerSeo_seoId_fkey`;

-- DropIndex
DROP INDEX `Brand_seoId_key` ON `Brand`;

-- DropIndex
DROP INDEX `Cart_userId_key` ON `Cart`;

-- DropIndex
DROP INDEX `Category_seoId_key` ON `Category`;

-- DropIndex
DROP INDEX `CmsPage_seoId_key` ON `CmsPage`;

-- DropIndex
DROP INDEX `Product_seoId_key` ON `Product`;

-- DropIndex
DROP INDEX `Role_name_key` ON `Role`;

-- DropIndex
DROP INDEX `Role_slug_key` ON `Role`;

-- AlterTable
ALTER TABLE `Address` MODIFY `type` ENUM('BILLING', 'SHIPPING', 'BUSINESS', 'OTHER') NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE `Brand` DROP COLUMN `seoId`;

-- AlterTable
ALTER TABLE `Cart` ADD COLUMN `guestToken` VARCHAR(191) NULL,
    MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `CartItem` ADD COLUMN `uniqueKey` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Category` DROP COLUMN `seoId`;

-- AlterTable
ALTER TABLE `CmsPage` DROP COLUMN `seoId`;

-- AlterTable
ALTER TABLE `InventoryMovement` ADD COLUMN `quantityAfter` INTEGER NOT NULL,
    ADD COLUMN `quantityBefore` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `seoId`;

-- AlterTable
ALTER TABLE `Role` ADD COLUMN `sellerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Seller` ADD COLUMN `completedOrderCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `positiveReviewCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `trustBadge` ENUM('NONE', 'VERIFIED_SELLER') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `trustBadgeAwardedAt` DATETIME(3) NULL,
    ADD COLUMN `trustBadgeRemovedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `SeoMetadata` ADD COLUMN `brandId` VARCHAR(191) NULL,
    ADD COLUMN `categoryId` VARCHAR(191) NULL,
    ADD COLUMN `pageId` VARCHAR(191) NULL,
    ADD COLUMN `productId` VARCHAR(191) NULL,
    ADD COLUMN `sellerId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `staffOfSellerId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `SellerSeo`;

-- CreateIndex
CREATE UNIQUE INDEX `Cart_guestToken_key` ON `Cart`(`guestToken`);

-- CreateIndex
CREATE INDEX `Cart_userId_idx` ON `Cart`(`userId`);

-- CreateIndex
CREATE INDEX `Cart_guestToken_idx` ON `Cart`(`guestToken`);

-- CreateIndex
CREATE INDEX `Cart_status_idx` ON `Cart`(`status`);

-- CreateIndex
CREATE UNIQUE INDEX `Cart_userId_status_key` ON `Cart`(`userId`, `status`);

-- CreateIndex
CREATE UNIQUE INDEX `CartItem_cartId_uniqueKey_key` ON `CartItem`(`cartId`, `uniqueKey`);

-- CreateIndex
CREATE INDEX `Role_sellerId_idx` ON `Role`(`sellerId`);

-- CreateIndex
CREATE UNIQUE INDEX `Role_sellerId_slug_key` ON `Role`(`sellerId`, `slug`);

-- CreateIndex
CREATE UNIQUE INDEX `Role_sellerId_name_key` ON `Role`(`sellerId`, `name`);

-- CreateIndex
CREATE UNIQUE INDEX `SeoMetadata_brandId_key` ON `SeoMetadata`(`brandId`);

-- CreateIndex
CREATE UNIQUE INDEX `SeoMetadata_categoryId_key` ON `SeoMetadata`(`categoryId`);

-- CreateIndex
CREATE UNIQUE INDEX `SeoMetadata_productId_key` ON `SeoMetadata`(`productId`);

-- CreateIndex
CREATE UNIQUE INDEX `SeoMetadata_pageId_key` ON `SeoMetadata`(`pageId`);

-- CreateIndex
CREATE UNIQUE INDEX `SeoMetadata_sellerId_key` ON `SeoMetadata`(`sellerId`);

-- CreateIndex
CREATE INDEX `User_staffOfSellerId_idx` ON `User`(`staffOfSellerId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_staffOfSellerId_fkey` FOREIGN KEY (`staffOfSellerId`) REFERENCES `Seller`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Seller`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;



-- AddForeignKey
ALTER TABLE `SeoMetadata` ADD CONSTRAINT `SeoMetadata_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeoMetadata` ADD CONSTRAINT `SeoMetadata_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeoMetadata` ADD CONSTRAINT `SeoMetadata_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeoMetadata` ADD CONSTRAINT `SeoMetadata_pageId_fkey` FOREIGN KEY (`pageId`) REFERENCES `CmsPage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SeoMetadata` ADD CONSTRAINT `SeoMetadata_sellerId_fkey` FOREIGN KEY (`sellerId`) REFERENCES `Seller`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
