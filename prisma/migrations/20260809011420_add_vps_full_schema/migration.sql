/*
  Warnings:

  - You are about to drop the `activitylog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `instance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `activitylog` DROP FOREIGN KEY `ActivityLog_userId_fkey`;

-- DropForeignKey
ALTER TABLE `instance` DROP FOREIGN KEY `Instance_userId_fkey`;

-- DropTable
DROP TABLE `activitylog`;

-- DropTable
DROP TABLE `instance`;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `Users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `last_login_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_users_email`(`email`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Roles` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_roles_name`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User_Roles` (
    `user_id` INTEGER NOT NULL,
    `role_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VPS_Plans` (
    `plan_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(500) NULL,
    `cpu_cores` INTEGER NOT NULL,
    `ram_gb` INTEGER NOT NULL,
    `storage_gb` INTEGER NOT NULL,
    `storage_type` VARCHAR(20) NOT NULL,
    `bandwidth_mbps` INTEGER NOT NULL,
    `ipv4_addresses` INTEGER NOT NULL DEFAULT 1,
    `backup_enabled` BOOLEAN NOT NULL DEFAULT false,
    `snapshot_enabled` BOOLEAN NOT NULL DEFAULT true,
    `max_snapshots` INTEGER NULL,
    `monthly_price` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'USD',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_vps_plans_name`(`name`),
    PRIMARY KEY (`plan_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OS_Images` (
    `image_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `os_family` VARCHAR(30) NOT NULL,
    `version` VARCHAR(50) NOT NULL,
    `template_path` VARCHAR(500) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`image_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HyperV_Hosts` (
    `host_id` INTEGER NOT NULL AUTO_INCREMENT,
    `hostname` VARCHAR(100) NOT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `location` VARCHAR(100) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_hyperv_hosts_hostname`(`hostname`),
    PRIMARY KEY (`host_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscriptions` (
    `subscription_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `start_date` DATETIME(0) NOT NULL,
    `next_billing_date` DATETIME(0) NULL,
    `end_date` DATETIME(0) NULL,
    `monthly_price` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`subscription_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VirtualMachines` (
    `vm_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subscription_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,
    `image_id` INTEGER NOT NULL,
    `host_id` INTEGER NOT NULL,
    `vm_name` VARCHAR(100) NOT NULL,
    `hostname` VARCHAR(100) NULL,
    `hyperv_vm_id` VARCHAR(100) NULL,
    `cpu_cores` INTEGER NOT NULL,
    `ram_gb` INTEGER NOT NULL,
    `storage_gb` INTEGER NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `provisioning_status` VARCHAR(30) NOT NULL,
    `provisioning_error` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `started_at` DATETIME(0) NULL,
    `stopped_at` DATETIME(0) NULL,
    `terminated_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_virtual_machines_hyperv_id`(`hyperv_vm_id`),
    PRIMARY KEY (`vm_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IP_Pool` (
    `ip_id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip_address` VARCHAR(45) NOT NULL,
    `subnet_mask` VARCHAR(45) NOT NULL,
    `gateway` VARCHAR(45) NOT NULL,
    `ip_type` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `assigned_vm_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_ip_pool_address`(`ip_address`),
    PRIMARY KEY (`ip_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VM_Snapshots` (
    `snapshot_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vm_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `deleted_at` DATETIME(0) NULL,

    PRIMARY KEY (`snapshot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Backups` (
    `backup_id` BIGINT NOT NULL AUTO_INCREMENT,
    `vm_id` INTEGER NOT NULL,
    `backup_type` VARCHAR(20) NOT NULL,
    `backup_location` VARCHAR(500) NOT NULL,
    `backup_size_gb` DECIMAL(12, 2) NULL,
    `status` VARCHAR(20) NOT NULL,
    `started_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`backup_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Provisioning_Jobs` (
    `job_id` BIGINT NOT NULL AUTO_INCREMENT,
    `vm_id` INTEGER NOT NULL,
    `job_type` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `current_step` VARCHAR(100) NULL,
    `error_message` TEXT NULL,
    `started_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`job_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoices` (
    `invoice_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subscription_id` INTEGER NOT NULL,
    `invoice_number` VARCHAR(50) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `tax` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `issue_date` DATETIME(0) NOT NULL,
    `due_date` DATETIME(0) NULL,
    `paid_date` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_invoices_number`(`invoice_number`),
    PRIMARY KEY (`invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payments` (
    `payment_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `invoice_id` BIGINT NOT NULL,
    `payment_gateway` VARCHAR(50) NOT NULL,
    `transaction_id` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `payment_date` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_payments_transaction`(`transaction_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Security_Logs` (
    `log_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `result` VARCHAR(20) NOT NULL,
    `details` TEXT NULL,
    `timestamp` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity_Logs` (
    `activity_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `vm_id` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `details` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`activity_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User_Roles` ADD CONSTRAINT `User_Roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_Roles` ADD CONSTRAINT `User_Roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Roles`(`role_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscriptions` ADD CONSTRAINT `Subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscriptions` ADD CONSTRAINT `Subscriptions_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `VPS_Plans`(`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VirtualMachines` ADD CONSTRAINT `VirtualMachines_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VirtualMachines` ADD CONSTRAINT `VirtualMachines_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `Subscriptions`(`subscription_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VirtualMachines` ADD CONSTRAINT `VirtualMachines_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `VPS_Plans`(`plan_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VirtualMachines` ADD CONSTRAINT `VirtualMachines_image_id_fkey` FOREIGN KEY (`image_id`) REFERENCES `OS_Images`(`image_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VirtualMachines` ADD CONSTRAINT `VirtualMachines_host_id_fkey` FOREIGN KEY (`host_id`) REFERENCES `HyperV_Hosts`(`host_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IP_Pool` ADD CONSTRAINT `IP_Pool_assigned_vm_id_fkey` FOREIGN KEY (`assigned_vm_id`) REFERENCES `VirtualMachines`(`vm_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VM_Snapshots` ADD CONSTRAINT `VM_Snapshots_vm_id_fkey` FOREIGN KEY (`vm_id`) REFERENCES `VirtualMachines`(`vm_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Backups` ADD CONSTRAINT `Backups_vm_id_fkey` FOREIGN KEY (`vm_id`) REFERENCES `VirtualMachines`(`vm_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Provisioning_Jobs` ADD CONSTRAINT `Provisioning_Jobs_vm_id_fkey` FOREIGN KEY (`vm_id`) REFERENCES `VirtualMachines`(`vm_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoices` ADD CONSTRAINT `Invoices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoices` ADD CONSTRAINT `Invoices_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `Subscriptions`(`subscription_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payments` ADD CONSTRAINT `Payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payments` ADD CONSTRAINT `Payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `Invoices`(`invoice_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Security_Logs` ADD CONSTRAINT `Security_Logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity_Logs` ADD CONSTRAINT `Activity_Logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity_Logs` ADD CONSTRAINT `Activity_Logs_vm_id_fkey` FOREIGN KEY (`vm_id`) REFERENCES `VirtualMachines`(`vm_id`) ON DELETE SET NULL ON UPDATE CASCADE;
