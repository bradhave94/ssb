---
name: SSB Budget App Build
overview: Build Super Simple Budget (SSB), an envelope budgeting app with Admin/Member roles, using TanStack Start, Drizzle ORM, Better Auth, and shadcn/ui. The plan follows the 9-phase approach from the spec with schema refinements and additional documentation.
todos:
  - id: phase-1
    content: "Phase 1: Foundation - Project setup, auth, database schema, seeding, base layouts"
    status: in_progress
  - id: phase-2
    content: "Phase 2: Budget Templates & Envelopes - CRUD, groups, sorting, soft delete"
    status: pending
  - id: phase-3
    content: "Phase 3: Accounts & Income - Account management, transaction views (desktop/mobile), income"
    status: pending
  - id: phase-4
    content: "Phase 4: Member Transaction Entry - Simple expense form, pending status"
    status: pending
  - id: phase-5
    content: "Phase 5: Admin Approval - Pending dashboard, bulk actions, edit/delete"
    status: pending
  - id: phase-6
    content: "Phase 6: Recurring Transactions - On-demand generation, admin management UI"
    status: pending
  - id: phase-7
    content: "Phase 7: Envelope Tracking - Budget vs spent display, overspent indicators"
    status: pending
  - id: phase-8
    content: "Phase 8: Settings & User Management - Admin/member settings, export/import"
    status: pending
  - id: phase-9
    content: "Phase 9: Polish & Testing - Error handling, loading states, mobile optimization, docs"
    status: pending
isProject: false
---

# Super Simple Budget (SSB) - Implementation Plan

> **Reference:** For complete specification details, see [ssd_scope.md](../../.cursor\ssd_scope.md)

## Phase 1: Foundation

**Goal:** Project setup, authentication, database schema

### 1.1 Initialize Project

```bash
bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=lyra&baseColor=neutral&theme=blue&iconLibrary=lucide&font=nunito-sans&menuAccent=subtle&menuColor=default&radius=none&template=start&rtl=false" --template start
```

This creates a TanStack Start project with:

- shadcn/ui (Custom preset)
- Tailwind CSS v4
- TypeScript
- Bun as package manager

> **Reference:** See [Tech Stack](../../.cursor\ssd_scope.md#tech-stack) in ssd_scope.md for complete technology choices and versions.

### 1.2 Install Additional Dependencies

```bash
# Database
bun add drizzle-orm @libsql/client
bun add -D drizzle-kit

# Auth
bun add better-auth

# Email (for invitations and password reset)
bun add resend

# Validation
bun add zod@^4.0.0 @tanstack/zod-form-adapter

# TanStack ecosystem (Query already included with Start)
bun add @tanstack/react-form @tanstack/react-table

# Utilities
bun add date-fns uuid
bun add -D @types/uuid
```

### 1.3 Configure Drizzle

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './app/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'libsql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./data.db',
  },
})
```

**Database Setup:**

- **Development:** Uses `file:./data.db` (local SQLite file)
- **Production:** Uses Turso connection string from `DATABASE_URL` env var
- Turso setup: See [Deployment section](#deployment-vercel--turso) below

### 1.4 Database Schema

Create `app/db/schema.ts` with all tables from spec:

- users, sessions, accounts (Better Auth)
- userRoles
- budgetTemplates, envelopeGroups, envelopes
- incomeCategories
- accounts (with isArchived, **currentBalanceCents** cached)
- transactions (with transferPairId)
- recurringTransactions
- lastGenerated
- appSettings

**Key Schema Notes:**

- `accounts.currentBalanceCents` - Cached balance updated atomically with every transaction
- `transactions.transferPairId` - Links paired transfer transactions between accounts
- Balance update strategy uses SQL increment/decrement for race condition safety

> **Reference:** See [Database Schema section](../../.cursor\ssd_scope.md#database-schema) in ssd_scope.md for complete table definitions and field details.

### 1.4a Database Connection Setup

Create `app/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN, // Only needed for Turso
})

export const db = drizzle(client, { schema })
```

**Environment Variables:**

- **Development:** `DATABASE_URL="file:./data.db"` (no auth token needed)
- **Production:** `DATABASE_URL="libsql://..."` + `DATABASE_AUTH_TOKEN="..."` (Turso)

### 1.5 Better Auth Setup

Create `app/lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { resend } from 'better-auth/adapters/resend'
import { db } from '~/db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
  email: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
        to: user.email,
        subject: 'Verify your email',
        html: `<a href="${url}">Verify email</a>`,
      })
    },
    sendPasswordResetEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
        to: user.email,
        subject: 'Reset your password',
        html: `<a href="${url}">Reset password</a>`,
      })
    },
    sendInvitationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
        to: user.email,
        subject: "You've been invited to Super Simple Budget",
        html: `<p>You've been invited to join Super Simple Budget.</p><a href="${url}">Accept invitation</a>`,
      })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year
    updateAge: 60 * 60 * 24 * 30,   // refresh every 30 days
  },
})
```

**Environment Variables (.env):**

```bash
# Database (Development: file-based, Production: Turso)
DATABASE_URL="file:./data.db"  # or "libsql://..." for Turso
DATABASE_AUTH_TOKEN=""  # Only needed for Turso production

# Auth
BETTER_AUTH_SECRET="generate-random-string-here"
BETTER_AUTH_URL="http://localhost:3000"  # or production URL

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
```

> **Reference:** See [Better Auth Setup](../../.cursor\ssd_scope.md#3-better-auth-setup) in ssd_scope.md for detailed configuration notes.

### 1.6 Create Base Layouts

**Files to create:**

- `app/components/layouts/AdminLayout.tsx` - Full nav with tabs (Pending, Envelopes, Accounts, Budget, Settings)
- `app/components/layouts/MemberLayout.tsx` - Simple layout with "+ Add Expense" prominent
- `app/routes/__root.tsx` - Auth check, redirect to login if not authenticated

> **Reference:** See [UI/UX Design section](../../.cursor\ssd_scope.md#uiux-design) in ssd_scope.md for layout mockups and design details.

### 1.7 Protected Routes

Create middleware/helper for role-based access:

```typescript
// app/lib/auth-helpers.ts
export async function requireAuth() { /* ... */ }
export async function requireAdmin() { /* ... */ }
export async function getUserRole(userId: string) { /* ... */ }
```

> **Reference:** See [User Roles & Permissions](../../.cursor\ssd_scope.md#user-roles--permissions) in ssd_scope.md for detailed permission matrix.

### 1.8 Seeding Script

Create `scripts/seed.ts`:

- System user (UUID for recurring transaction createdBy)
- Default admin user ([bradley@haveman.ca](mailto:brad@example.com))
- Default member user ([jenna@haveman.ca](mailto:wife@example.com))
- Sample accounts (Checking, Credit Card, Savings)
- Sample budget template with envelope groups
- Optional: sample transactions for testing

### 1.9 Add shadcn Components

```bash
bunx --bun shadcn@latest add button card input label select form toast skeleton alert dialog sheet tabs badge separator table checkbox dropdown-menu
```

### 1.10 Create Utilities

- `app/lib/format-money.ts` - cents to display ($X.XX)
- `app/lib/utils.ts` - cn() helper, date utilities
- `app/lib/validations.ts` - Zod schemas for form validation

**Validation Setup:**

```typescript
// app/lib/validations.ts
import { z } from 'zod'

// Transaction validation
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amountCents: z.number().int().positive(),
  date: z.date(),
  description: z.string().optional(),
  envelopeId: z.string().uuid().optional(),
  incomeCategoryId: z.string().uuid().optional(),
  accountId: z.string().uuid(),
})

// Envelope validation
export const envelopeSchema = z.object({
  name: z.string().min(1).max(100),
  budgetAmountCents: z.number().int().nonnegative(),
  groupId: z.string().uuid(),
})

// User invitation validation
export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'member']),
  defaultAccountId: z.string().uuid().optional(),
})
```

### 1.11 Email Setup

**Resend Account Setup:**

1. Sign up at resend.com
2. Get API key from dashboard
3. Add to `.env`: `RESEND_API_KEY=re_xxxxx`
4. Set `EMAIL_FROM` (must be verified domain in Resend)

**Email Templates (Optional Enhancement):**

- Create branded email templates for:
  - Invitation emails
  - Password reset emails
  - Email verification

**Routes to Create:**

- `app/routes/auth/forgot-password.tsx` - Forgot password form
- `app/routes/auth/reset-password.tsx` - Reset password with token
- `app/routes/auth/accept-invitation.tsx` - Accept invitation and set password

**Key Files:**

- [app/db/schema.ts](app/db/schema.ts) - Full database schema
- [app/db/index.ts](app/db/index.ts) - Database connection (supports file-based SQLite and Turso)
- [app/lib/auth.ts](app/lib/auth.ts) - Better Auth configuration with email
- [app/lib/validations.ts](app/lib/validations.ts) - Zod schemas for validation
- [app/routes/__root.tsx](app/routes/__root.tsx) - Root layout with auth check
- [app/routes/auth/forgot-password.tsx](app/routes/auth/forgot-password.tsx) - Forgot password form
- [app/routes/auth/reset-password.tsx](app/routes/auth/reset-password.tsx) - Reset password with token
- [app/routes/auth/accept-invitation.tsx](app/routes/auth/accept-invitation.tsx) - Accept invitation
- [scripts/seed.ts](scripts/seed.ts) - Database seeding

---

## Phase 2: Budget Template and Envelopes (Admin Only)

**Goal:** Admin can create and manage budget templates with envelope groups

### 2.1 Server Functions

Create `app/server/budget.ts`:

- `getBudgetTemplates()` - List all templates
- `createBudgetTemplate(name)` - Create new template
- `setActiveTemplate(id)` - Set template as active
- `deleteBudgetTemplate(id)` - Delete (only if not active)

Create `app/server/envelopes.ts`:

- `getEnvelopeGroups(templateId)` - Get groups with envelopes
- `createEnvelopeGroup(templateId, name)` - Create group
- `updateEnvelopeGroupOrder(groups)` - Reorder groups
- `deleteEnvelopeGroup(id)` - Delete group (cascade envelopes)
- `createEnvelope(groupId, name, budgetAmountCents)` - Create envelope
- `updateEnvelope(id, data)` - Update name/budget
- `archiveEnvelope(id)` - Soft delete
- `deleteEnvelope(id)` - Hard delete (only if no transactions)

### 2.2 UI Components

- `app/components/features/budget/BudgetTemplateList.tsx`
- `app/components/features/budget/EnvelopeGroupTree.tsx` - Nested view with drag-drop
- `app/components/features/budget/EnvelopeForm.tsx` - Create/edit envelope modal with Zod validation
- `app/components/features/budget/GroupForm.tsx` - Create/edit group modal with Zod validation

**Form Validation Example:**

```typescript
// In EnvelopeForm.tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { envelopeSchema } from '~/lib/validations'

const form = useForm({
  defaultValues: { name: '', budgetAmountCents: 0, groupId: '' },
  validatorAdapter: zodValidator(),
  validators: { onChange: envelopeSchema },
  onSubmit: async ({ value }) => {
    await createEnvelope(value)
  },
})
```

### 2.3 Routes

- `app/routes/budget/index.tsx` - Budget management page (admin only)

### 2.4 Validation Rules

- Cannot delete active template
- Cannot hard delete envelope with transactions (show "Archive instead")
- Warn when archiving envelope with pending transactions

> **Reference:** See [Edge Cases & Behavior Rules](../../.cursor\ssd_scope.md#edge-cases--behavior-rules) in ssd_scope.md for comprehensive edge case handling.

---

## Phase 3: Accounts and Income

**Goal:** Account tracking, income categories, transaction views

### 3.1 Server Functions

Create `app/server/accounts.ts`:

- `getAccounts()` - List all accounts (active only by default)
- `getAccount(id)` - Single account using cached `currentBalanceCents`
- `createAccount(name, type, initialBalanceCents)` - Set `currentBalanceCents = initialBalanceCents`
- `updateAccount(id, data)`
- `archiveAccount(id)` - Soft delete
- `recomputeAccountBalance(id)` - Fallback: recompute from transactions if cache integrity fails

Create `app/server/transactions.ts`:

- `getTransactions(accountId, filters)` - With running balance
- `getTransactionsByEnvelope(envelopeId)`
- `createTransaction(data)` - **Atomically updates `account.currentBalanceCents` using SQL increment/decrement**
- `updateTransaction(id, data)` - **Atomically adjusts both old and new account balances**
- `deleteTransaction(id)` - **Atomically updates balance, also deletes transfer pair if present**
- `clearTransaction(id)` - Mark as cleared
- `bulkClearTransactions(ids)`
- `bulkChangeAccount(ids, newAccountId)` - **Atomically updates balances for both accounts**
- `createTransfer(fromAccountId, toAccountId, amountCents, description)` - **Creates two paired transactions with shared `transferPairId`, updates both account balances atomically**

**Transfer Implementation:**

```typescript
async function createTransfer(fromAccountId, toAccountId, amountCents, description, date) {
  return await db.transaction(async (tx) => {
    const transferPairId = generateUUID()

    // Create expense transaction (outflow from source account)
    await tx.insert(transactions).values({
      id: generateUUID(),
      type: 'expense',
      accountId: fromAccountId,
      amountCents,
      date,
      description: description || `Transfer to ${toAccount.name}`,
      transferPairId,
      status: 'cleared',
      envelopeId: null,
      incomeCategoryId: null,
      createdBy: currentUser.id,
    })

    // Create income transaction (inflow to destination account)
    await tx.insert(transactions).values({
      id: generateUUID(),
      type: 'income',
      accountId: toAccountId,
      amountCents,
      date,
      description: description || `Transfer from ${fromAccount.name}`,
      transferPairId,
      status: 'cleared',
      envelopeId: null,
      incomeCategoryId: null,
      createdBy: currentUser.id,
    })

    // Update both account balances atomically
    await tx.update(accounts)
      .set({ currentBalanceCents: sql`${accounts.currentBalanceCents} - ${amountCents}` })
      .where(eq(accounts.id, fromAccountId))

    await tx.update(accounts)
      .set({ currentBalanceCents: sql`${accounts.currentBalanceCents} + ${amountCents}` })
      .where(eq(accounts.id, toAccountId))
  })
}
```

> **Reference:** See [Account Transfers (Paired Transactions)](../../.cursor\ssd_scope.md#account-transfers-paired-transactions) in ssd_scope.md for transfer implementation details and rules.

### 3.2 Cached Balance Strategy

**Why Cache Balance?**

Computing account balance by summing all transactions is slow for accounts with many transactions. Instead, maintain a cached `currentBalanceCents` field on the accounts table that's updated atomically with every transaction change.

**Implementation Pattern:**

```typescript
// When creating a transaction
await db.transaction(async (tx) => {
  // Insert transaction
  await tx.insert(transactions).values(newTransaction)

  // Update account balance atomically
  const adjustment = newTransaction.type === 'income'
    ? newTransaction.amountCents
    : -newTransaction.amountCents

  await tx.update(accounts)
    .set({
      currentBalanceCents: sql`${accounts.currentBalanceCents} + ${adjustment}`
    })
    .where(eq(accounts.id, newTransaction.accountId))
})
```

**Key Points:**

- Use SQL `currentBalanceCents + amount` instead of reading current value (prevents race conditions)
- Always wrap transaction creation + balance update in a DB transaction
- For updates/deletes, reverse the old transaction's effect and apply the new one
- Provide a `recomputeAccountBalance()` function as a fallback for data integrity checks

### 3.3 Running Balance Calculation

```typescript
function calculateRunningBalances(transactions, startingBalanceCents) {
  // Sort oldest to newest
  // Accumulate balance (only cleared transactions)
  // Return in newest-first order for display
}
```

> **Reference:** See [Running Balance Calculation](../../.cursor\ssd_scope.md#5a-running-balance-calculation-account-view) in ssd_scope.md for detailed algorithm and implementation notes.

### 3.4 UI Components

**Desktop:**

- `app/components/features/accounts/AccountTransactionTable.tsx` - TanStack Table
- `app/components/features/accounts/AccountSummaryCard.tsx` - Balance metrics (using cached `currentBalanceCents`)
- `app/components/features/accounts/BulkActionBar.tsx` - Sticky when selected

**Mobile:**

- `app/components/features/accounts/TransactionCard.tsx` - Card for each transaction
- `app/components/features/accounts/TransactionList.tsx` - Date-grouped cards
- `app/components/features/accounts/MobileFAB.tsx` - Floating action button

**Shared:**

- `app/components/features/accounts/TransactionFilters.tsx` - Date, envelope, status, search
- `app/components/features/accounts/TransactionEditModal.tsx`
- `app/components/features/accounts/TransferModal.tsx` - Account-to-account transfer (creates paired transactions)

> **Reference:** See [Account Transaction View (Detailed)](../../.cursor\ssd_scope.md#6a-account-transaction-view-detailed) in ssd_scope.md for complete desktop and mobile UI mockups and specifications.

### 3.5 Routes

- `app/routes/accounts/index.tsx` - Account list
- `app/routes/accounts/$accountId.tsx` - Account detail with transactions

### 3.6 Income Categories

- `app/server/income.ts` - CRUD for income categories
- `app/components/features/income/IncomeCategoryForm.tsx`
- Income transaction entry in admin transaction form

### 3.7 Available to Budget

Display component showing:

```
Total Income (month): $X,XXX
- Budgeted: $X,XXX
= Available: $XXX
```

> **Reference:** See [Available to Budget (Computed Value)](../../.cursor\ssd_scope.md#available-to-budget-computed-value) in ssd_scope.md for formula and calculation details.

### 3.8 Reconciliation (Admin)

- `app/components/features/accounts/ReconcileModal.tsx`
- Enter actual bank balance
- Show difference against cached `currentBalanceCents`
- Create adjustment transaction (updates `currentBalanceCents` atomically)

---

## Phase 4: Transaction Entry - Member Flow

**Goal:** Super simple expense entry for members

### 4.1 Member Transaction Form

`app/components/features/transactions/QuickAddExpense.tsx`:

- Large numeric input with currency formatting
- Envelope dropdown (searchable, active only)
- Account chips (if >1 account) or hidden (if 1)
- Collapsible description field
- Big "Save" button

> **Reference:** See [Transaction Entry - Member Flow](../../.cursor\ssd_scope.md#4-transaction-entry) and [Member Mobile Experience](../../.cursor\ssd_scope.md#member-mobile-experience-primary-use-case) in ssd_scope.md for detailed UX mockups and flow.

### 4.2 Server Functions

- `createExpense(amountCents, envelopeId, accountId, description?)` - Creates as 'pending'

### 4.3 Member Home

`app/routes/index.tsx` (member view):

- Large "+ Add Expense" button
- Recent pending transactions (theirs)
- Envelope balances quick view

### 4.4 Routes

- `app/routes/index.tsx` - Home (different view for admin vs member)
- `app/routes/add-expense.tsx` - Full-page expense form (mobile)

---

## Phase 5: Admin Approval and Clearing

**Goal:** Admin dashboard to review and approve transactions

### 5.1 Server Functions

- `getPendingTransactions()` - All pending, grouped by user
- `approveTransaction(id)` - Mark as cleared
- `bulkApproveTransactions(ids)`
- `rejectTransaction(id)` - Delete with optional notification

### 5.2 UI Components

- `app/components/features/approval/PendingTransactionsList.tsx`
- `app/components/features/approval/PendingTransactionCard.tsx`
- `app/components/features/approval/ApprovalActions.tsx` - Approve/Edit/Delete

### 5.3 Routes

- `app/routes/dashboard/index.tsx` - Admin dashboard with pending transactions tab

---

## Phase 6: Recurring Transactions

**Goal:** On-demand generation of recurring transactions

### 6.1 Server Functions

Create `app/server/recurring.ts`:

- `getRecurringTransactions()`
- `createRecurringTransaction(data)`
- `updateRecurringTransaction(id, data)`
- `toggleRecurringActive(id)`
- `deleteRecurringTransaction(id)`
- `ensureRecurringGenerated()` - Main generation function
- `generateRecurringForDate(date)` - Generate for specific date
- `checkIfDueOnDate(recurring, date)` - Check if due

### 6.2 Generation Logic

```typescript
async function ensureRecurringGenerated() {
  return await db.transaction(async (tx) => {
    const lastGen = await getLastGeneratedDate(tx)
    const today = new Date()

    if (isSameDay(lastGen, today)) return

    let current = addDays(lastGen, 1)
    while (current <= today) {
      await generateRecurringForDate(tx, current)
      current = addDays(current, 1)
    }

    await updateLastGeneratedDate(tx, today)
  })
}
```

> **Reference:** See [Recurring Transaction Generation (On-Demand)](../../.cursor\ssd_scope.md#6-recurring-transaction-generation-on-demand) in ssd_scope.md for complete implementation with code examples and edge case handling.

### 6.3 UI Components

- `app/components/features/recurring/RecurringTransactionList.tsx`
- `app/components/features/recurring/RecurringTransactionForm.tsx`
- Frequency selector (daily, weekly, biweekly, monthly, quarterly, yearly)
- Day selector (day of month or day of week)

### 6.4 Routes

- `app/routes/recurring/index.tsx` - Admin recurring management

### 6.5 Integration

Call `ensureRecurringGenerated()` in route loaders:

- Dashboard loader
- Account detail loader
- Transactions list loader

---

## Phase 7: Envelope Tracking

**Goal:** Clear envelope status display

### 7.1 Server Functions

- `getEnvelopeBalances(month?)` - All envelopes with spent/remaining
- `getEnvelopeTransactions(envelopeId, month?)`

### 7.2 UI Components

- `app/components/features/envelopes/EnvelopeBalanceCard.tsx`
- `app/components/features/envelopes/EnvelopeBalanceList.tsx`
- `app/components/features/envelopes/OverspentBadge.tsx`

Display for each envelope:

```
[Groceries]
Budgeted: $800 | Spent: $650 | Remaining: $150
[=============================-----] 81%
```

Overspent:

```
[Dining Out] ⚠️ OVERSPENT
Budgeted: $200 | Spent: $250 | Over: -$50
[================================!!!] 125%
```

### 7.3 Archived Envelope Display

When showing transactions with archived envelopes:

```
Envelope: Archived: Old Category Name (italic, muted)
```

---

## Phase 8: Settings and User Management

**Goal:** Complete admin and member settings

### 8.1 Admin Settings Routes

`app/routes/settings/index.tsx` with tabs:

- Users & Roles
- Accounts
- Security
- Budget
- General

> **Reference:** See [Settings & Administration](../../.cursor\ssd_scope.md#11-settings--administration) in ssd_scope.md for detailed settings UI mockups and functionality.

### 8.2 User Management

- `app/server/users.ts`:
  - `getUsers()` - List all users with roles
  - `inviteUser(email, name, role, defaultAccountId?)` - Create user and send invitation email
  - `updateUserRole(userId, role, defaultAccountId?)`
  - `deactivateUser(userId)`
  - `forcePasswordReset(userId)` - Triggers password reset email

**Email Integration:**

- Use Better Auth's `sendInvitationEmail` when creating new users
- Use Better Auth's `sendPasswordResetEmail` for forgot password flow
- Create routes:
  - `app/routes/auth/forgot-password.tsx` - Forgot password form
  - `app/routes/auth/reset-password.tsx` - Reset password with token
  - `app/routes/auth/accept-invitation.tsx` - Accept invitation and set password

### 8.3 Export/Import

- `app/server/export.ts`:
  - `exportData(options)` - Generate JSON export
  - `importData(data)` - Import with ID regeneration and **auto-rename for duplicates**

Export format:

```typescript
interface ExportData {
  version: string
  exportDate: string
  data: {
    budgetTemplates?: BudgetTemplateExport[]
    accounts?: Account[]
    transactions?: Transaction[]
    recurringTransactions?: RecurringTransaction[]
    appSettings?: Record<string, string>
  }
}
```

**Auto-Rename on Import:**

When importing budget templates, check for duplicate names and automatically rename them to avoid conflicts:

```typescript
// Import logic for budget templates
async function importBudgetTemplate(template, tx) {
  // Check for duplicate name
  let templateName = template.name
  const existingTemplate = await tx.query.budgetTemplates.findFirst({
    where: eq(budgetTemplates.name, templateName)
  })

  if (existingTemplate) {
    // Auto-rename: "Budget 2026" → "Budget 2026 (2)"
    let suffix = 2
    let newName = `${templateName} (${suffix})`

    while (await tx.query.budgetTemplates.findFirst({
      where: eq(budgetTemplates.name, newName)
    })) {
      suffix++
      newName = `${templateName} (${suffix})`
    }

    templateName = newName
  }

  // Insert with potentially renamed name
  await tx.insert(budgetTemplates).values({
    ...template,
    id: generateNewId(),
    name: templateName,
  })
}
```

**Import Behavior:**

- Budget templates: Auto-rename duplicates
- Accounts: Auto-rename duplicates
- Transactions: Regenerate IDs, map to new account/envelope IDs
- Recurring transactions: Regenerate IDs, map to new references

### 8.4 Danger Zone

- `deleteAllTransactions()` - Keep budgets/accounts
- `deleteEverything()` - Full reset (requires confirmation)

### 8.5 Member Settings

`app/routes/settings/profile.tsx`:

- Name/email edit
- Password change
- View default account (read-only)

---

## Phase 9: Polish and Testing

**Goal:** Production-ready application

### 9.1 Error Handling

- Wrap all server functions with try/catch
- Return typed errors
- Display error toasts on mutation failures
- Error boundary for React errors

### 9.2 Loading States

- Skeleton components for lists/cards
- Disabled states during mutations
- Loading indicators on buttons

### 9.3 Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: clearTransaction,
  onMutate: async (id) => {
    await queryClient.cancelQueries(['transactions'])
    const previous = queryClient.getQueryData(['transactions'])
    queryClient.setQueryData(['transactions'], (old) =>
      old.map(t => t.id === id ? { ...t, status: 'cleared' } : t)
    )
    return { previous }
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(['transactions'], context.previous)
  },
})
```

### 9.4 Mobile Optimization

- Touch targets min 44px
- Swipe actions on cards (optional)
- Bottom navigation for member
- Responsive breakpoints

### 9.5 Testing Checklist

**Admin Workflows:**

- Create budget template with groups/envelopes
- Create accounts
- Add income transaction
- Approve pending transactions
- Create recurring transactions
- Reconcile account
- Transfer between accounts
- Archive envelope/account
- Export/import data

**Member Workflows:**

- Add expense (quick flow)
- View envelope balances
- View transaction history

**Edge Cases:**

- Overspent envelope display
- Archived envelope in history
- Transfer deletion (paired)
- Recurring generation after gap

### 9.6 Documentation

- Update README.md with setup instructions
- Create AGENTS.md for AI assistants
- Document deployment options

---

## Deployment: Vercel + Turso

**Deployment Strategy:** Vercel Pro (hosting) + Turso Free Tier (database)

### Setup Steps

1. **Turso Database Setup:**
  ```bash
   # Sign up at turso.tech (free)
   bunx @turso/cli signup

   # Create database
   bunx @turso/cli db create super-simple-budget

   # Get connection details
   bunx @turso/cli db show super-simple-budget
  ```
2. **Vercel Deployment:**
  - Push code to GitHub
  - Connect repo to Vercel
  - Set environment variables:
    - `DATABASE_URL` - Turso connection string (`libsql://...`)
    - `DATABASE_AUTH_TOKEN` - Turso auth token
    - `BETTER_AUTH_SECRET` - Generate secure random string
    - `BETTER_AUTH_URL` - Your Vercel domain (auto-set)
    - `RESEND_API_KEY` - Resend API key for emails
    - `EMAIL_FROM` - Email sender (e.g., `noreply@yourdomain.com`)
3. **Deploy:**
  - Vercel auto-deploys on push to main branch
  - On-demand recurring generation works perfectly (no cron needed)

### Cost Breakdown

- **Vercel Pro:** Already have (no additional cost)
- **Turso Free Tier:** $0/month
  - 5GB storage (more than enough for 2 users)
  - 500M reads / 10M writes per month
- **Total:** $0/month

### Environment Variables (.env.example)

```bash
# Database (Turso)
DATABASE_URL="libsql://your-db-name-org.turso.io"
DATABASE_AUTH_TOKEN="your-turso-auth-token"

# Auth (Better Auth)
BETTER_AUTH_SECRET="generate-random-string-here"
BETTER_AUTH_URL="https://your-app.vercel.app"

# Email (Resend)
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

> **Reference:** See [Deployment Strategy](../../.cursor\ssd_scope.md#deployment-strategy) in ssd_scope.md for complete deployment instructions.

---

## File Structure (Target)

```
super-simple-budget/
├── app/
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── dashboard/
│   │   │   └── index.tsx
│   │   ├── accounts/
│   │   │   ├── index.tsx
│   │   │   └── $accountId.tsx
│   │   ├── budget/
│   │   │   └── index.tsx
│   │   ├── recurring/
│   │   │   └── index.tsx
│   │   ├── settings/
│   │   │   ├── index.tsx
│   │   │   └── profile.tsx
│   │   └── add-expense.tsx
│   ├── server/
│   │   ├── accounts.ts
│   │   ├── budget.ts
│   │   ├── envelopes.ts
│   │   ├── income.ts
│   │   ├── recurring.ts
│   │   ├── transactions.ts
│   │   ├── users.ts
│   │   └── export.ts
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── layouts/
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── MemberLayout.tsx
│   │   │   └── RootLayout.tsx
│   │   └── features/
│   │       ├── accounts/
│   │       │   ├── AccountTransactionTable.tsx
│   │       │   ├── AccountSummaryCard.tsx
│   │       │   ├── TransactionCard.tsx
│   │       │   ├── TransactionFilters.tsx
│   │       │   ├── TransferModal.tsx
│   │       │   └── ReconcileModal.tsx
│   │       ├── budget/
│   │       │   ├── BudgetTemplateList.tsx
│   │       │   ├── EnvelopeGroupTree.tsx
│   │       │   └── EnvelopeForm.tsx
│   │       ├── envelopes/
│   │       │   ├── EnvelopeBalanceCard.tsx
│   │       │   └── EnvelopeBalanceList.tsx
│   │       ├── transactions/
│   │       │   └── QuickAddExpense.tsx
│   │       ├── approval/
│   │       │   ├── PendingTransactionsList.tsx
│   │       │   └── ApprovalActions.tsx
│   │       ├── recurring/
│   │       │   ├── RecurringTransactionList.tsx
│   │       │   └── RecurringTransactionForm.tsx
│   │       └── settings/
│   │           ├── UserManagement.tsx
│   │           ├── ExportImport.tsx
│   │           └── DangerZone.tsx
│   ├── db/
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-helpers.ts
│   │   ├── format-money.ts
│   │   └── utils.ts
│   └── styles/
│       └── app.css
├── drizzle/
│   └── migrations/
├── scripts/
│   └── seed.ts
├── public/
├── .env.example
├── drizzle.config.ts
├── package.json
├── README.md
└── AGENTS.md
```

---

## Commands Reference

```bash
# Development
bun run dev              # Start dev server
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Open Drizzle Studio
bun run db:seed          # Seed database

# Production
bun run build            # Build for production
bun run start            # Start production server

# Add components
bunx --bun shadcn@latest add [component]
```

