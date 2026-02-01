CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`initialBalanceCents` integer NOT NULL,
	`currentBalanceCents` integer NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `appSettings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appSettings_key_unique` ON `appSettings` (`key`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budgetTemplates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`isActive` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `envelopeGroups` (
	`id` text PRIMARY KEY NOT NULL,
	`budgetTemplateId` text NOT NULL,
	`name` text NOT NULL,
	`sortOrder` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`budgetTemplateId`) REFERENCES `budgetTemplates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `envelopes` (
	`id` text PRIMARY KEY NOT NULL,
	`groupId` text NOT NULL,
	`name` text NOT NULL,
	`budgetAmountCents` integer NOT NULL,
	`sortOrder` integer NOT NULL,
	`isArchived` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`groupId`) REFERENCES `envelopeGroups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `incomeCategories` (
	`id` text PRIMARY KEY NOT NULL,
	`budgetTemplateId` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`budgetTemplateId`) REFERENCES `budgetTemplates`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lastGenerated` (
	`id` text PRIMARY KEY NOT NULL,
	`date` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `recurringTransactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`incomeCategoryId` text,
	`envelopeId` text,
	`accountId` text NOT NULL,
	`amountCents` integer NOT NULL,
	`autoClear` integer NOT NULL,
	`description` text,
	`frequency` text NOT NULL,
	`dayOfMonth` integer,
	`dayOfWeek` integer,
	`startDate` integer NOT NULL,
	`endDate` integer,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`incomeCategoryId`) REFERENCES `incomeCategories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`envelopeId`) REFERENCES `envelopes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`amountCents` integer NOT NULL,
	`date` integer NOT NULL,
	`description` text,
	`incomeCategoryId` text,
	`envelopeId` text,
	`accountId` text NOT NULL,
	`transferPairId` text,
	`status` text NOT NULL,
	`createdBy` text NOT NULL,
	`clearedBy` text,
	`clearedAt` integer,
	`recurringTransactionId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`incomeCategoryId`) REFERENCES `incomeCategories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`envelopeId`) REFERENCES `envelopes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`createdBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`clearedBy`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`recurringTransactionId`) REFERENCES `recurringTransactions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `userRoles` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`role` text NOT NULL,
	`defaultAccountId` text,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
