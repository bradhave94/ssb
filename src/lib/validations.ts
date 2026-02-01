import { z } from 'zod'

// =============================================================================
// Transaction Validation
// =============================================================================

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amountCents: z.number().int().positive(),
  date: z.date(),
  description: z.string().optional(),
  envelopeId: z.string().uuid().optional(),
  incomeCategoryId: z.string().uuid().optional(),
  accountId: z.string().uuid(),
  status: z.enum(['pending', 'cleared']).optional(),
})

// =============================================================================
// Envelope Validation
// =============================================================================

export const envelopeSchema = z.object({
  name: z.string().min(1).max(100),
  budgetAmountCents: z.number().int().nonnegative(),
  groupId: z.string().uuid(),
})

export const envelopeGroupSchema = z.object({
  name: z.string().min(1).max(100),
  budgetTemplateId: z.string().uuid(),
  sortOrder: z.number().int().nonnegative(),
})

// =============================================================================
// Budget Template Validation
// =============================================================================

export const budgetTemplateSchema = z.object({
  name: z.string().min(1).max(100),
})

// =============================================================================
// Account Validation
// =============================================================================

export const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['checking', 'savings', 'credit']),
  initialBalanceCents: z.number().int(),
})

// =============================================================================
// User Invitation Validation
// =============================================================================

export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'member']),
  defaultAccountId: z.string().uuid().optional(),
})

// =============================================================================
// Recurring Transaction Validation
// =============================================================================

export const recurringTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amountCents: z.number().int().positive(),
  description: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly']),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  autoClear: z.boolean(),
  accountId: z.string().uuid(),
  envelopeId: z.string().uuid().optional(),
  incomeCategoryId: z.string().uuid().optional(),
})

// =============================================================================
// Transfer Validation
// =============================================================================

export const transferSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  date: z.date(),
  description: z.string().optional(),
})
