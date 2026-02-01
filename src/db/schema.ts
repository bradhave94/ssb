import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// =============================================================================
// Better Auth Tables (user, session, account, verification)
// Use modelName in auth config to map: user->users, session->sessions,
// account->auth_account (to avoid conflict with our bank accounts table)
// =============================================================================

export const users = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull(),
  image: text('image'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const authAccount = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('idToken'),
  password: text('password'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

// =============================================================================
// App Tables
// =============================================================================

export const userRoles = sqliteTable('userRoles', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['admin', 'member'] }).notNull(),
  defaultAccountId: text('defaultAccountId'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export const budgetTemplates = sqliteTable('budgetTemplates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const envelopeGroups = sqliteTable('envelopeGroups', {
  id: text('id').primaryKey(),
  budgetTemplateId: text('budgetTemplateId')
    .notNull()
    .references(() => budgetTemplates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sortOrder').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

export const envelopes = sqliteTable('envelopes', {
  id: text('id').primaryKey(),
  groupId: text('groupId')
    .notNull()
    .references(() => envelopeGroups.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  budgetAmountCents: integer('budgetAmountCents').notNull(),
  sortOrder: integer('sortOrder').notNull(),
  isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const incomeCategories = sqliteTable('incomeCategories', {
  id: text('id').primaryKey(),
  budgetTemplateId: text('budgetTemplateId')
    .notNull()
    .references(() => budgetTemplates.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
})

// Bank accounts (different from auth account)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['checking', 'savings', 'credit'] }).notNull(),
  initialBalanceCents: integer('initialBalanceCents').notNull(),
  currentBalanceCents: integer('currentBalanceCents').notNull(),
  isArchived: integer('isArchived', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const recurringTransactions = sqliteTable('recurringTransactions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  incomeCategoryId: text('incomeCategoryId').references(
    () => incomeCategories.id,
    { onDelete: 'set null' }
  ),
  envelopeId: text('envelopeId').references(() => envelopes.id, {
    onDelete: 'set null',
  }),
  accountId: text('accountId')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  amountCents: integer('amountCents').notNull(),
  autoClear: integer('autoClear', { mode: 'boolean' }).notNull(),
  description: text('description'),
  frequency: text('frequency', {
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
  }).notNull(),
  dayOfMonth: integer('dayOfMonth'),
  dayOfWeek: integer('dayOfWeek'),
  startDate: integer('startDate', { mode: 'timestamp' }).notNull(),
  endDate: integer('endDate', { mode: 'timestamp' }),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  amountCents: integer('amountCents').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description'),
  incomeCategoryId: text('incomeCategoryId').references(
    () => incomeCategories.id,
    { onDelete: 'set null' }
  ),
  envelopeId: text('envelopeId').references(() => envelopes.id, {
    onDelete: 'set null',
  }),
  accountId: text('accountId')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  transferPairId: text('transferPairId'),
  status: text('status', { enum: ['pending', 'cleared'] }).notNull(),
  createdBy: text('createdBy')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  clearedBy: text('clearedBy').references(() => users.id, { onDelete: 'set null' }),
  clearedAt: integer('clearedAt', { mode: 'timestamp' }),
  recurringTransactionId: text('recurringTransactionId').references(
    () => recurringTransactions.id,
    { onDelete: 'set null' }
  ),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const lastGenerated = sqliteTable('lastGenerated', {
  id: text('id').primaryKey(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})

export const appSettings = sqliteTable('appSettings', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
})
