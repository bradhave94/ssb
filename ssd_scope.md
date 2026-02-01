# Super Simple Budget (SSB) - Comprehensive Development Plan

## Project Overview
**Super Simple Budget (SSB)** is a simple, open-source envelope budget application built for personal use (you and your wife) with a focus on ease of use. The app follows an envelope budgeting methodology where every dollar is assigned to a specific category/envelope at the start of each month.

### Core Philosophy
- **STUPID SIMPLE** for members (your wife) to add transactions
- **Zero-based budgeting** - every dollar gets assigned
- **Admin/Member roles** with clear separation of duties
- **Running account balances** to match real bank accounts
- **No external integrations** - manual entry only

---

## Tech Stack

### Framework & Core
- **TanStack Start (v1 RC)** - Full-stack React framework with SSR
  - Built on TanStack Router and Vite
  - Server functions for type-safe RPC
  - Streaming SSR
  - File-based routing
  - Currently in Release Candidate (stable, production-ready)

### TanStack Ecosystem
- **TanStack Query (v5)** - Server state management
  - Automatic caching and revalidation
  - Optimistic updates
  - Built-in devtools
  - Latest: v5.90.19 (Jan 2026)

- **TanStack Form (v1)** - Form state management
  - Type-safe form handling
  - Async validation with debouncing
  - Server-side validation support
  - Framework-agnostic core
  - Released v1 stable (March 2025)

- **TanStack Table (v8)** - Headless table/datagrid
  - For transaction lists and budget views
  - Sorting, filtering, pagination
  - Fully type-safe
  - Latest: v8.21.3 (April 2025)

- **TanStack Router** - Built into Start
  - Type-safe routing
  - Search params management
  - Loaders and actions

### Database & ORM
- **Drizzle ORM** - Type-safe ORM
  - Better TypeScript support than Prisma
  - Lighter weight
  - SQL-like syntax
  - Drizzle Kit for migrations
  - Drizzle Studio for DB management

- **SQLite (via Turso/LibSQL)** - Database
  - Perfect for 2-user app
  - Can scale to 10+ users easily
  - File-based or cloud (Turso) deployment
  - Using @libsql/client for better cloud support
  - **Decision**: Start with file-based SQLite, migrate to Turso if cloud hosting needed

### Authentication & Authorization
- **Better Auth (v1.4+)** - Authentication framework
  - TypeScript-first
  - Framework-agnostic
  - Built-in rate limiting, MFA, password policies
  - Works seamlessly with Drizzle
  - Role-based permissions (Admin/Member)
  - Email support for invitations and password reset
  - Latest: v1.4.15 (Jan 2026)
  - Recently raised $5M (YC backed)
  - 150k+ weekly downloads

### Email Provider
- **Resend** (Recommended) - Email API service
  - Free tier: 3,000 emails/month
  - Simple API, great developer experience
  - Built-in email templates
  - Alternative: SendGrid, AWS SES, or SMTP

### UI & Styling
- **shadcn/ui** - Component library
  - Using the Vega style preset
  - Radix UI primitives
  - Lucide icons
  - Nunito Sans font
  - **Tailwind CSS v4** for styling (latest)
  - Nutral base color with blue theme

### Validation
- **Zod (v4)** - TypeScript-first schema validation
  - Runtime type checking
  - 14x faster string parsing vs v3
  - Integrates with TanStack Form via Standard Schema
  - Share schemas between client and server
  - Latest: v4.1.0+ (stable)

### Build Tools
- **Vite** - Build tool (built into Start)
- **Bun** - Package manager and runtime
- **TypeScript** - Type safety throughout

---

## Database Schema

## ID Strategy
- All primary keys are **UUID v4 strings** generated on the server.
- Import process must regenerate new UUIDs for imported rows and maintain an old→new ID map for relationships.
- Seed a dedicated **System** user (UUID) for auto-generated recurring transactions.


### Users Table
```typescript
users {
  id: string (uuid)
  email: string (unique)
  name: string
  emailVerified: boolean
  image: string?
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Sessions Table (Better Auth)
```typescript
sessions {
  id: string
  userId: string (fk → users)
  expiresAt: timestamp
  token: string
  ipAddress: string?
  userAgent: string?
}
```

### UserRoles Table
```typescript
userRoles {
  id: string (uuid)
  userId: string (fk → users)
  role: enum('admin', 'member')
  defaultAccount: string? (fk → accounts) // Member's default account
  createdAt: timestamp
}
```

### BudgetTemplates Table
```typescript
budgetTemplates {
  id: string (uuid)
  name: string
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### EnvelopeGroups Table
```typescript
envelopeGroups {
  id: string (uuid)
  budgetTemplateId: string (fk → budgetTemplates)
  name: string // e.g., "Bills", "Insurance", "Discretionary"
  sortOrder: integer
  createdAt: timestamp
}
```

### Envelopes Table
```typescript
envelopes {
  id: string (uuid)
  groupId: string (fk → envelopeGroups)
  name: string // e.g., "Groceries", "Mortgage", "Auto Insurance"
  budgetAmountCents: integer // stored in cents // Monthly budget for this envelope
  sortOrder: integer
  isArchived: boolean // default false, for soft delete
  createdAt: timestamp
  updatedAt: timestamp
}
```

### IncomeCategories Table
```typescript
incomeCategories {
  id: string (uuid)
  budgetTemplateId: string (fk → budgetTemplates)
  name: string // e.g., "Salary - Main", "Freelance", "Side Business"
  createdAt: timestamp
}
```

### RecurringTransactions Table
```typescript
recurringTransactions {
  id: string (uuid)
  type: enum('income', 'expense')
  incomeCategoryId: string? (fk → incomeCategories)
  envelopeId: string? (fk → envelopes)
  accountId: string (fk → accounts) // Required for all income + expenses
  amountCents: integer // stored in cents
  autoClear: boolean // if true, generated transactions are created as 'cleared'
  description: string?
  frequency: enum('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')
  dayOfMonth: integer? // 1-31, for monthly
  dayOfWeek: integer? // 1-7, for weekly
  startDate: date
  endDate: date?
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Accounts Table
```typescript
accounts {
  id: string (uuid)
  name: string // e.g., "Checking", "Savings", "Credit Card"
  type: enum('checking', 'savings', 'credit')
  initialBalanceCents: integer // stored in cents // Starting balance
  // currentBalance is computed from transactions; do not persist
  isArchived: boolean // default false, for hiding/soft delete
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Transactions Table

### Transaction Type Invariants
- If `type = income`:
  - `incomeCategoryId` is required (unless it's a transfer)
  - `envelopeId` must be null
- If `type = expense`:
  - `envelopeId` is required (unless it's a transfer)
  - `incomeCategoryId` must be null
- If `transferPairId` is set (transfer transaction):
  - Both `envelopeId` and `incomeCategoryId` must be null
  - Transaction is part of a paired transfer between accounts

```typescript
transactions {
  id: string (uuid)
  type: enum('income', 'expense')
  amountCents: integer // stored in cents
  date: date // Date only, no time
  description: string?

  // For income
  incomeCategoryId: string? (fk → incomeCategories)

  // For expenses
  envelopeId: string? (fk → envelopes)
  accountId: string (fk → accounts)

  // For transfers between accounts
  transferPairId: string? // Links paired transfer transactions (shared UUID)

  // Workflow
  status: enum('pending', 'cleared')
  createdBy: string (fk → users)
  clearedBy: string? (fk → users)
  clearedAt: timestamp?

  // From recurring?
  recurringTransactionId: string? (fk → recurringTransactions)

  createdAt: timestamp
  updatedAt: timestamp
}
```

### LastGenerated Table (For On-Demand Recurring)
```typescript
lastGenerated {
  id: string (uuid)
  date: date // Last date we generated recurring transactions for
  updatedAt: timestamp
}
```

### AppSettings Table
```typescript
appSettings {
  id: string (uuid)
  key: string (unique) // e.g., 'app_name', 'currency', 'date_format'
  value: string // JSON string for complex values
  updatedAt: timestamp
}
```

**Common Settings Keys:**
- `app_name` - Application display name
- `currency_symbol` - $ € £ ¥ etc.
- `currency_code` - USD, EUR, GBP, etc.
- `date_format` - MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
- `first_day_of_month` - 1-31
- `first_day_of_week` - 0-6 (Sunday-Saturday)
- `default_transaction_status` - pending/cleared
- `auto_clear_recurring` - true/false

---

## Account Transfers (Paired Transactions)

Transfers between accounts (e.g., paying off a credit card from checking) use **paired transactions** rather than a separate "transfer" type. This keeps the schema simple while maintaining accurate account balances.

### How Transfers Work

When transferring money between accounts, create two linked transactions:

**Example: Pay Credit Card $500 from Checking**

```
Transaction 1 (outflow from Checking):
  - type: 'expense'
  - accountId: checking_id
  - amountCents: 50000
  - envelopeId: null (transfers don't affect envelopes)
  - incomeCategoryId: null
  - description: "Transfer to Credit Card"
  - transferPairId: "shared-uuid-123"
  - status: 'cleared'

Transaction 2 (inflow to Credit Card):
  - type: 'income'
  - accountId: credit_card_id
  - amountCents: 50000
  - envelopeId: null
  - incomeCategoryId: null (transfers don't affect income categories)
  - description: "Transfer from Checking"
  - transferPairId: "shared-uuid-123"
  - status: 'cleared'
```

### Transfer Rules
- Both transactions share the same `transferPairId` (UUID generated at creation time)
- Neither transaction has an `envelopeId` or `incomeCategoryId` (transfers don't affect budget)
- Both transactions should have the same `status` (cleared/pending together)
- Deleting one transaction should delete its pair
- Editing amount on one should update its pair

### UI Behavior
- Display transfers as a single line item showing "Transfer: Checking → Credit Card"
- When editing a transfer, update both paired transactions atomically
- In account views, show the transfer with appropriate +/- based on that account's perspective

---

## Available to Budget (Computed Value)

"Available to Budget" represents unassigned income - money that has come in but hasn't been allocated to any envelope yet. This value is **computed on-the-fly**, not stored in the database.

### Formula

```typescript
function getAvailableToBudgetCents(month: Date): number {
  // Sum all cleared income for the month
  const totalIncomeCents = db.query.transactions
    .where(type = 'income')
    .where(status = 'cleared')
    .where(date within month)
    .where(transferPairId is null) // Exclude transfers
    .sum(amountCents)

  // Sum all envelope budget amounts from active template
  const totalBudgetedCents = db.query.envelopes
    .where(template is active)
    .where(isArchived = false)
    .sum(budgetAmountCents)

  return totalIncomeCents - totalBudgetedCents
}
```

### Display Rules
- **Positive value**: Money available to assign to envelopes
- **Zero**: All income is budgeted (ideal state)
- **Negative value**: Over-budgeted (assigned more to envelopes than income received)

### UI Behavior
- Show prominently on budget dashboard
- Color coding: Green (positive), Gray (zero), Red (negative)
- Clicking should show breakdown: Total Income - Total Budgeted = Available

---

## Edge Cases & Behavior Rules

### Archived Envelopes

| Scenario | Behavior |
|----------|----------|
| View transaction with archived envelope | Display as "Archived: [Envelope Name]" with visual indicator |
| Member selecting envelope for new transaction | Only show active (non-archived) envelopes in dropdown |
| Admin tries to delete envelope with transactions | Block deletion - show message "Archive this envelope instead" |
| Admin archives envelope with pending transactions | Allow with warning: "X pending transactions use this envelope" |

### Archived Accounts

| Scenario | Behavior |
|----------|----------|
| View transaction in archived account | Still visible in transaction history |
| Member/Admin creating new transaction | Only show active (non-archived) accounts |
| Admin tries to archive account with pending transactions | Show warning with count, allow if confirmed |
| Admin sets member's default account to archived one | Block - must choose active account |

### Budget Changes

| Scenario | Behavior |
|----------|----------|
| Admin changes envelope budget mid-month | Immediately affects "Remaining" calculation |
| Admin changes budget to less than already spent | Show as overspent (negative remaining) |
| Envelope budget set to $0 | Valid - envelope exists but has no allocation |

### Transfer Edge Cases

| Scenario | Behavior |
|----------|----------|
| Delete one side of transfer pair | Delete both transactions |
| Edit amount on transfer | Update both paired transactions atomically |
| One account in transfer is archived | Still show transfer in history, block new transfers to archived accounts |
| Clear one side of transfer | Clear both paired transactions together |

### Soft Delete vs Hard Delete

| Entity | Delete Behavior |
|--------|-----------------|
| Envelope with transactions | Cannot delete - must archive |
| Envelope with no transactions | Can hard delete |
| Account with transactions | Cannot delete - must archive |
| Account with no transactions | Can hard delete |
| Transaction | Hard delete (with confirmation) |
| Budget template (not active) | Hard delete with cascade to groups/envelopes |
| Budget template (active) | Cannot delete - must set another as active first |

---

## User Roles & Permissions

### Admin Role
**Can do everything:**
- Create/edit/delete budget templates
- Create/edit/delete envelope groups and envelopes
- Create/edit/delete income categories
- Add **income** transactions
- Add **expense** transactions (with all fields)
- Create/edit recurring transactions (both income and expense)
- Clear/approve pending transactions
- Assign transactions to accounts
- Set member default accounts
- Manage accounts (checking, credit, savings)
- View all financial reports

### Member Role
Members see cleared status as **read-only** (cannot toggle).

**Limited to:**
- Add **expense** transactions with:
  - Amount (required)
  - Envelope/category (required)
  - Account (defaults to their preset account, e.g., "Credit Card")
  - Description (optional)
- View their own pending transactions
- View cleared transactions
- View envelope balances
- **CANNOT:**
  - Add income
  - Edit budgets or envelopes
  - Clear their own transactions
  - Create recurring transactions

---

## Core Features

### Overspending Behavior (YNAB-style)
- Allow envelopes to go negative when spending exceeds remaining.
- Show overspent envelopes clearly in UI (badge + color).
- Admin can cover overspending by assigning more budget or moving money between envelopes.


### 1. Budget Template Management (Admin Only)
- Create multiple budget templates
- Set one template as "active"
- Active template auto-applies each month
- Template includes:
  - Envelope groups with envelopes and budget amounts
  - Income categories with expected amounts
  - Recurring transactions

### 2. Envelope Groups & Envelopes (Admin Only)
- Create hierarchical structure:
  ```
  Bills
    ├── Mortgage ($2,200)
    ├── Electricity ($150)
    └── Phone Bill ($80)

  Insurance
    ├── Auto ($200)
    ├── Home ($120)
    └── Health ($300)

  Discretionary
    ├── Groceries ($800)
    ├── Dining Out ($200)
    └── Entertainment ($100)
  ```
- Drag-and-drop sorting
- Edit/delete with safety checks

### 3. Income Management (Admin Only)
- Multiple income sources
- Recurring income transactions:
  - Main Salary: 8th of every month
  - Side Business: 3rd and 18th of month
  - Freelance: 25th of month
- Income adds to "Available to Budget" pool
- Assigning to envelopes reduces available pool

### 4. Transaction Entry

#### Member Flow (SUPER SIMPLE)
1. Click "Add Expense"
2. Enter amount (e.g., $50.23) — store internally as integer cents to avoid rounding issues
3. Select envelope from dropdown (e.g., "Groceries")
4. Account auto-populated (admin-set default: "Credit Card")
5. Optional: Add description
6. Click "Save" → Transaction marked as "pending"

**Quick Add Expense UX (member):**
- Default to the member’s **default account** (set by admin)
- Provide a **single-tap account toggle** (e.g., chips: `Debit` / `Credit`) when more than 1 account exists

#### Admin Flow
**For Expenses:**
- Same as member, but can also:
  - Change account
  - Mark as "cleared" immediately
  - Create recurring expense

**For Income:**
- Amount
- Income category
- Date
- Can be recurring

### 5. Transaction Approval Dashboard (Admin Only)
- View all pending transactions by user
- Bulk actions:
  - Approve (mark as cleared)
  - Edit (change account, envelope, amount)
  - Delete (if incorrect)
- Shows:
  - User who created
  - Amount
  - Envelope
  - Suggested account
  - Date

### 6. Account Balance Tracking
- Real-time running balance for each account
- Formula:
  ```
  Current Balance = Initial Balance
                    + Sum(cleared income assigned to account)
                    - Sum(cleared expenses from account)
  ```
- Visual display:
  - Checking: $2,456.78
  - Credit Card: -$843.21 (negative balance)
  - Savings: $5,000.00

### 6a. Account Transaction View (Detailed)

**Desktop Features:**
- **Full transaction table** with sortable columns
- **Column visibility toggles:**
  - Checkbox (always visible)
  - Date (always visible)
  - Description (optional - can hide)
  - Envelope/Category (optional)
  - Amount (always visible)
  - Cleared checkbox (always visible)
  - Running Balance (always visible)

- **Summary card at top:**
  - Current Balance (latest running balance)
  - Cleared Balance (only cleared transactions)
  - Pending Amount (sum of pending)
  - Available Balance (for credit cards: shows "Owed")

- **Filters:**
  - Date range picker (default: current month)
  - Envelope filter (multi-select)
  - Status filter (All / Cleared / Pending)
  - Search by description or amount

- **Bulk Actions:**
  - Select multiple transactions with checkboxes
  - Sticky action bar appears when items selected:
    - Change Account (move to different account)
    - Mark Cleared (toggle cleared status)
    - Delete (with confirmation)
    - Cancel selection

- **Individual Transaction Actions:**
  - Click transaction row to open edit modal
  - Quick clear/unclear with cleared checkbox
  - View full transaction details

**Mobile Features:**
- **Card-based layout** (inspired by budget.haveman.ca)
- **Each card shows:**
  - Checkbox for selection (left side)
  - Transaction name/envelope
  - Description (if added)
  - Amount (top right, large)
  - Running balance (bottom right, smaller/gray)
  - Cleared status toggle (admin-only)

- **Date section headers:**
  - Group by date
  - Format: "February 03, 2026"

- **Expandable summary card:**
  - Collapsed: Shows current balance only
  - Tap to expand: Shows all 4 balance metrics

- **Floating Action Button (FAB):**
  - Appears when transactions selected
  - Tap to show action menu:
    - Change Account
    - Mark Cleared
    - Delete
  - Shows count of selected items

- **Search bar** at top (collapsible)
- **+ Button** in header to add transaction

**Transaction Display Rules:**
- **Newest first** (most recent at top)
- **Running balance calculated bottom-up:**
    - Running balance starts from the account’s starting balance **as-of the oldest visible transaction** (continuous accounts; not $0)
  - Each subsequent **cleared** transaction updates cumulative balance (pending does not)
  - Top transaction = current balance

- **Pending transactions:**
  - Gray/dimmed appearance
  - Do NOT affect running balance
  - Show "(pending)" label on mobile
  - Can be cleared with checkbox

- **Monthly view:**
  - Default: Current month only
  - Can navigate: Previous/Next month
    - Previous month data read-only

**Credit Card Specifics:**
- Balance shown as negative: `-$843.21`
- Summary shows "Owed" instead of "Available"
- Payment transactions show as positive (reduce balance)
- Expenses show as negative (increase owed)

### 7. Credit Card Workflow
- Expenses on credit card → Increase balance (negative)
- "Pay off Credit Card" transaction:
  - Moves money from Checking → Credit Card
  - Records as transaction in both accounts

### 8. Envelope Budget Tracking
- Show each envelope:
  - Budgeted: $800
  - Spent: $650
  - Remaining: $150
- Overspent shows in red:
  - Budgeted: $800
  - Spent: $850
  - **Overspent: -$50** (red)

### 9. Recurring Transactions (On-Demand Generation)
- **On-Demand Generation:** Transactions are created automatically when you open the app
- **Smart Backfilling:** If you haven't opened the app in days, it generates all missing recurring transactions with correct dates
- **How it works:**
  1. You open SSB on Feb 10th
  2. App checks: "What's the last date we generated recurring for?"
  3. If it was Feb 7th, it generates all recurring from Feb 8th-10th
  4. All transactions backdated to their correct due dates
  5. Takes 1-2 seconds on first load, then cached

- **Examples:**
  - Mortgage: 1st of every month → Creates cleared transaction dated Feb 1st
  - Income: 8th of month → Creates cleared income dated Feb 8th
  - Netflix: 15th of month → Creates cleared expense dated Feb 15th

- **No cron jobs needed:** Works on any hosting (Vercel, self-hosted, etc.)
- **Always catches up:** Even if server is down, backfills when you return
- **Race condition safe:** Multiple users can load simultaneously without duplicates

### 10. Monthly Reset
- At start of new month:
  - Use the same active budget template as the previous month
  - Envelope balances carry over by default (setting: `carry_over_envelopes`, default: true, If disabled: reset envelope amounts)

### 11. Settings & Administration

#### Admin Settings Page
Admin has full access to app configuration via `/settings` with multiple tabs:

**User Management Tab:**
- List all users with roles
- Add new user (email invitation)
- Edit user roles (Admin/Member)
- Set member's default account for transactions
- Deactivate/remove users
- Reset user passwords

**Account Management Tab:**
- List all accounts (Checking, Savings, Credit Cards)
- Create new account
- Edit account details (name, type)
- Set initial balance
- Archive/hide accounts
- Reorder accounts

**Security Tab (Post-MVP):**
- Force change password on next login (per user)

**Budget Settings Tab:**
- Manage budget templates (link to budget management)
- Set active template
- Default envelope sort order
- Transaction defaults (auto-clear, default status)

**General Settings Tab:**
- App name/branding
- Currency settings (symbol, decimal places)
- Data export/import:
  - Export full backup (JSON): transactions, accounts, budget templates, envelopes, recurring
  - Import backup: restore budget templates and accounts (or full restore)
  - Export options: All data, Budget templates only, Transactions only
- Danger zone:
  - Delete all transactions (keep budgets and accounts)
  - Delete everything (complete reset)

#### Member Settings Page
Members have limited access to personal settings via `/settings`:

**Profile Section:**
- Update display name
- Update email address

**Security Section:**
- Change password

**Preferences Section:**
- Default account for transactions (read-only; admin-controlled)

---

## UI/UX Design

### Member Mobile Experience (Primary Use Case)
**Home Screen:**
- Large "+ Add Expense" button
- Quick view of envelope balances
- List of recent pending transactions

**Add Expense Screen:**
```
┌─────────────────────────────┐
│  Add Expense                │
├─────────────────────────────┤
│  Amount                     │
│  [$          ]              │
│                             │
│  Category                   │
│  [Select Envelope ▼]        │
│                             │
│  Account                    │
│  [Credit Card]  ✓           │
│                             │
│  Description (Optional)     │
│  [               ]          │
│                             │
│  [Cancel]    [Save]         │
└─────────────────────────────┘
```

### Admin Dashboard
**Tabs:**
1. **Pending** - Review transactions
2. **Envelopes** - View budget vs spent
3. **Accounts** - See balances
4. **Budget** - Edit template
5. **Settings** - User management, security, app settings

**Pending Transactions View:**
```
┌─────────────────────────────────────────┐
│ Pending Transactions (3)                │
├─────────────────────────────────────────┤
│ Wife - Groceries              $52.30    │
│ Target - Credit Card                    │
│ [Approve] [Edit] [Delete]               │
├─────────────────────────────────────────┤
│ You - Gas                     $45.00    │
│ Shell Station - Checking                │
│ [Approve] [Edit] [Delete]               │
├─────────────────────────────────────────┤
│ Wife - Dining Out             $67.89    │
│ Olive Garden - Credit Card              │
│ [Approve] [Edit] [Delete]               │
└─────────────────────────────────────────┘
```

**Envelope View:**
```
┌─────────────────────────────────────────┐
│ Bills                                   │
├─────────────────────────────────────────┤
│ Mortgage      $2,200 / $2,200  ✓        │
│ Electricity   $120 / $150      $30 left │
│ Phone         $80 / $80        ✓        │
├─────────────────────────────────────────┤
│ Groceries     $650 / $800      $150 left│
│ Dining Out    $180 / $200      $20 left │
│ Gas           $220 / $250      $30 left │
└─────────────────────────────────────────┘
```

### Account View (Desktop)

**Full Transaction Table:**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Checking Account                                      [+ Add Transaction]  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Current Balance: $2,456.78    Cleared: $2,500.00                 │    │
│  │ Pending: -$43.22              Available: $2,456.78               │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
│  [Search Checking...]                       [Filter ▼] [This Month ▼]    │
│  [☐ Show Description] [☑ Show Envelope] [☑ Show Cleared]                 │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ ☐  Date        Envelope      Amount    ☑  Running Balance                │
├────────────────────────────────────────────────────────────────────────────┤
│ ☐  Jan 30      Groceries     -$52.30   ☑  $2,456.78                      │
│ ☐  Jan 29      Salary        +$3,000   ☑  $2,509.08                      │
│ ☐  Jan 28      Gas           -$45.00   ☑  -$490.92                       │
│ ☐  Jan 27      Electricity   -$120.00  ☑  -$445.92                       │
│ ☐  Jan 15      Groceries     -$89.50   ☐  -$325.92    (pending - gray)   │
│ ☐  Jan 10      Dining Out    -$67.42   ☑  -$236.42                       │
│ ☐  Jan 8       Salary        +$2,500   ☑  -$169.00                       │
│ ☐  Jan 5       Mortgage      -$2,200   ☑  -$2,669.00                     │
│ ☐  Jan 3       Phone Bill    -$80.00   ☑  -$469.00                       │
│ ☐  Jan 2       Insurance     -$389.00  ☑  -$389.00                       │
│                                                         │
└────────────────────────────────────────────────────────────────────────────┘
```

**When Items Selected (Sticky Action Bar):**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ ✓ 3 items selected    [Change Account ▼] [Mark Cleared] [Delete] [Cancel]│
├────────────────────────────────────────────────────────────────────────────┤
│ ☑  Jan 30      Groceries     -$52.30   ☑  $2,456.78                      │
│ ☑  Jan 28      Gas           -$45.00   ☑  -$490.92                       │
│ ☐  Jan 27      Electricity   -$120.00  ☑  -$445.92                       │
│ ☑  Jan 15      Groceries     -$89.50   ☐  -$325.92                       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Credit Card Account (Negative Balance):**
```
┌────────────────────────────────────────────────────────────────────────────┐
│ Credit Card                                           [+ Add Transaction]  │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │ Current Balance: -$843.21     Cleared: -$800.00                  │    │
│  │ Pending: -$43.21              Owed: $843.21                      │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│ ☐  Date        Envelope      Amount    ☑  Running Balance                │
├────────────────────────────────────────────────────────────────────────────┤
│ ☐  Jan 30      Groceries     -$52.30   ☑  -$843.21                       │
│ ☐  Jan 28      Dining Out    -$67.89   ☑  -$790.91                       │
│ ☐  Jan 25      Gas           -$45.00   ☑  -$723.02                       │
│ ☐  Jan 20      Groceries     -$123.45  ☑  -$678.02                       │
│ ☐  Jan 15      Entertainment -$89.99   ☐  -$554.57    (pending)          │
│ ☐  Jan 10      Payment       +$500.00  ☑  -$464.58                       │
│ ☐  Jan 8       Dining Out    -$56.78   ☑  -$964.58                       │
│ ☐  Jan 5       Groceries     -$234.12  ☑  -$907.80                       │
│ ☐  Jan 3       Gas           -$48.90   ☑  -$673.68                       │
│ ☐  Jan 2       Dining Out    -$124.78  ☑  -$624.78                       │
│ ☐  Jan 1       Previous      -$500.00  ☑  -$500.00                       │
└────────────────────────────────────────────────────────────────────────────┘
```

### Account View (Mobile)

**Mobile Card Layout:**
```
┌─────────────────────────────┐
│ ← Back    Checking      [+] │
├─────────────────────────────┤
│                             │
│       Balance               │
│      $2,456.78              │
│                             │
│  [Search Checking...]       │
│                             │
├─────────────────────────────┤
│     February 03, 2026       │
├─────────────────────────────┤
│ ☐ Groceries          $52.30 │
│   Target             -$52.30│
│   [Cleared ☑] (admin-only toggle)      $2,456.78│
├─────────────────────────────┤
│     February 01, 2026       │
├─────────────────────────────┤
│ ☐ Salary           $3,000.00│
│   Monthly Income   +$3,000  │
│   [Cleared ☑] (admin-only toggle)      $2,509.08│
├─────────────────────────────┤
│ ☐ Gas                 $45.00│
│   Shell              -$45.00│
│   [Cleared ☑] (admin-only toggle)        -$490.92│
├─────────────────────────────┤
│     January 30, 2026        │
├─────────────────────────────┤
│ ☐ Groceries          $89.50 │
│   Walmart            -$89.50│
│   [Pending ☐]       -$325.92│
├─────────────────────────────┤
│ ☐ Electricity       $120.00 │
│   Duke Energy       -$120.00│
│   [Cleared ☑] (admin-only toggle)       -$445.92│
└─────────────────────────────┘

                    ( 💠 )  ← FAB appears when items checked
```

**Mobile with Items Selected (FAB Expanded):**
```
┌─────────────────────────────┐
│ ← Back    Checking      [+] │
├─────────────────────────────┤
│ ✓ 3 items selected     [✕]  │
├─────────────────────────────┤
│ ☑ Groceries          $52.30 │
│   Target             -$52.30│
│                    $2,456.78│
├─────────────────────────────┤
│ ☑ Gas                 $45.00│
│   Shell              -$45.00│
│                      -$490.92│
├─────────────────────────────┤
│ ☐ Electricity       $120.00 │
│   Duke Energy       -$120.00│
│                      -$445.92│
├─────────────────────────────┤
│ ☑ Groceries          $89.50 │
│   Walmart            -$89.50│
│                      -$325.92│
└─────────────────────────────┘

        ┌───────────────────┐
        │ Change Account    │
        │ Mark Cleared      │
        │ Delete            │
        └───────────────────┘
              ↑
            ( 💠 )  ← FAB tapped
```

**Mobile Summary Card (Expandable):**
```
┌─────────────────────────────┐
│       Balance               │
│      $2,456.78              │
│  [Tap for details ▼]        │
└─────────────────────────────┘

       ↓ When expanded ↓

┌─────────────────────────────┐
│       Balance               │
│      $2,456.78              │
│                             │
│  Current Balance  $2,456.78 │
│  Cleared Balance  $2,500.00 │
│  Pending          -$43.22   │
│  Available        $2,456.78 │
│                             │
│  [Collapse ▲]               │
└─────────────────────────────┘
```

### 8. Admin Settings Page

**Desktop Settings View with Tabs:**
```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                           [Save All]│
├──────────────────────────────────────────────────────────────┤
│  [Users & Roles] [Accounts] [Security] [Budget] [General]    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Users & Roles                                                 │
│  ──────────────────────────────────────────                   │
│                                                                │
│  ┌──────────────────────────────────────────┐                │
│  │  Email              Role      Default Acc │                │
│  ├──────────────────────────────────────────┤                │
│  │  brad@example.com   Admin     Checking    │ [Edit] [✕]    │
│  │  wife@example.com   Member    Credit Card │ [Edit] [✕]    │
│  └──────────────────────────────────────────┘                │
│                                                                │
│  [+ Add User]                                                  │
│                                                                │
│  ┌────────────────────────────────────┐                       │
│  │  Add New User                      │                       │
│  │                                    │                       │
│  │  Email: [________________]         │                       │
│  │  Name:  [________________]         │                       │
│  │  Role:  [Member ▼]                 │                       │
│  │  Default Account: [Credit Card ▼]  │                       │
│  │                                    │                       │
│  │  [Cancel]  [Send Invitation]       │                       │
│  └────────────────────────────────────┘                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Security Tab (Post-MVP):**
```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                           [Save All]│
├──────────────────────────────────────────────────────────────┤
│  [Users & Roles] [Accounts] [Security] [Budget] [General]    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Security Settings                                             │
│  ──────────────────────────────────                           │
│                                                                │
│  Authentication Methods                                        │
│  ☑ Email & Password (always enabled)                          │
│                                                                │
│  User Security Actions                                         │
│  ┌──────────────────────────────────────────┐                │
│  │  User              Action                 │                │
│  ├──────────────────────────────────────────┤                │
│  │  brad@example.com  [Force Password Reset]│                │
│  │  wife@example.com  [Force Password Reset]│                │
│  └──────────────────────────────────────────┘                │
│                                                                │
│  Note: Sessions last 1 year. Users stay logged in.            │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Accounts Tab:**
```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                           [Save All]│
├──────────────────────────────────────────────────────────────┤
│  [Users & Roles] [Accounts] [Security] [Budget] [General]    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Account Management                                            │
│  ───────────────────────────────────                          │
│                                                                │
│  ┌──────────────────────────────────────────┐                │
│  │  Account Name    Type         Balance    │                │
│  ├──────────────────────────────────────────┤                │
│  │  ≡ Checking      Checking    $2,456.78   │ [Edit] [Hide] │
│  │  ≡ Savings       Savings     $5,000.00   │ [Edit] [Hide] │
│  │  ≡ Credit Card   Credit      -$843.21    │ [Edit] [Hide] │
│  └──────────────────────────────────────────┘                │
│                                                                │
│  [+ Add Account]                                               │
│                                                                │
│  ┌────────────────────────────────────┐                       │
│  │  Add New Account                   │                       │
│  │                                    │                       │
│  │  Name:  [________________]         │                       │
│  │  Type:  [Checking ▼]               │                       │
│  │         - Checking                 │                       │
│  │         - Savings                  │                       │
│  │         - Credit Card              │                       │
│  │                                    │                       │
│  │  Initial Balance: [$_____]         │                       │
│  │                                    │                       │
│  │  [Cancel]  [Create Account]        │                       │
│  └────────────────────────────────────┘                       │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**General Tab:**
```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                           [Save All]│
├──────────────────────────────────────────────────────────────┤
│  [Users & Roles] [Accounts] [Security] [Budget] [General]    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  General Settings                                              │
│  ─────────────────────────────────                            │
│                                                                │
│  Application                                                   │
│  App Name:  [Super Simple Budget________]                     │
│                                                                │
│  Regional Settings                                             │
│  Currency:       [$ USD ▼]                                    │
│  Date Format:    [MM/DD/YYYY ▼]                               │
│  First Day of:   [Week: Sunday ▼] [Month: 1st ▼]             │
│                                                                │
│  Budget Settings                                               │
│  Active Template: [2026 Budget ▼]                             │
│  Auto-clear recurring: ☑ Yes                                  │
│  Default transaction status: [Pending ▼]                      │
│                                                                │
│  Data Management                                               │
│  ─────────────────────────────────                            │
│                                                                │
│  Export Data:                                                  │
│  ☐ Transactions                                                │
│  ☐ Accounts                                                    │
│  ☑ Budget Templates & Envelopes                                │
│  ☐ Recurring Transactions                                      │
│  ☑ App Settings                                                │
│                                                                │
│  [Export Selected (JSON)]   [Export All (JSON)]               │
│                                                                │
│  Import Data:                                                  │
│  [Choose File…]                                              │
│  [Import]                                                      │
│                                                                │
│  Use Case: Export your budget templates, delete all           │
│  transactions to start fresh, then import your budget          │
│  templates back to continue with a clean slate.               │
│                                                                │
│  Danger Zone ⚠️                                                │
│  ─────────────────────────────────                            │
│                                                                │
│  [Delete All Transactions]                                     │
│  Removes all transactions, keeps budgets and accounts          │
│                                                                │
│  [Delete Everything]                                           │
│  Complete reset - CANNOT BE UNDONE                             │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

### 9. Member Settings Page

**Simple Member Settings (Desktop):**
```
┌──────────────────────────────────────────────────────────────┐
│  My Settings                                                   │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Profile                                                       │
│  ───────                                                       │
│                                                                │
│  Name:  [Wife_____________]                                   │
│  Email: [wife@example.com_]                                   │
│                                                                │
│  [Save Profile]                                                │
│                                                                │
│  ────────────────────────────────────────────────────────     │
│                                                                │
│  Security                                                      │
│  ────────                                                      │
│                                                                │
│  Change Password                                               │
│  Current Password:  [________]                                 │
│  New Password:      [________]                                 │
│  Confirm Password:  [________]                                 │
│                                                                │
│  [Update Password]                                             │
│                                                                │
│                                                                │
│                                                                │
│  ────────────────────────────────────────────────────────     │
│                                                                │
│  Preferences                                                   │
│  ───────────                                                   │
│                                                                │
│  Default Account: Credit Card (set by admin)                  │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

**Mobile Member Settings:**
```
┌───────────────────────┐
│  ← My Settings        │
├───────────────────────┤
│                       │
│  Profile              │
│  ──────               │
│                       │
│  Name                 │
│  [Wife_________]      │
│                       │
│  Email                │
│  [wife@example.com]   │
│                       │
│  [Save]               │
│                       │
│ ───────────────────── │
│                       │
│  Security             │
│  ────────             │
│                       │
│  Change Password >    │
│                       │
│ ───────────────────── │
│                       │
│  Preferences          │
│  ───────────          │
│                       │
│  Default Account      │
│  Credit Card (admin)  │
│                       │
└───────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Setup, authentication, basic database

**Tasks:**
1. Initialize TanStack Start project with shadcn preset
   ```bash
   bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=lyra&baseColor=neutral&theme=blue&iconLibrary=lucide&font=nunito-sans&menuAccent=subtle&menuColor=default&radius=none&template=start&rtl=false" --template start
   ```

2. Install dependencies:
   ```bash
   bun add @tanstack/react-query @tanstack/react-form @tanstack/react-table
   bun add drizzle-orm @libsql/client
   bun add better-auth resend
   bun add zod@^4.0.0 @tanstack/zod-form-adapter
   bun add date-fns uuid
   bun add -D drizzle-kit @types/uuid
   ```

3. Setup Tailwind CSS v4:
   ```bash
   bun add -D tailwindcss@next @tailwindcss/vite@next
   ```
   - Configure Tailwind v4 in vite.config.ts
   - Import @tailwind CSS in your main CSS file

4. Setup Drizzle:
   - Create database schema
   - Configure drizzle.config.ts
   - Generate migrations
   - Setup Drizzle Studio

5. Setup Better Auth:
   - Configure auth with Drizzle adapter
   - Setup session management
   - Create user roles table
   - Add login/signup pages

6. Create base layouts:
   - Admin layout with navigation
   - Member layout (simplified)
   - Protected routes

**Deliverable:** Working auth, database schema, empty protected routes

---

### Phase 2: Budget Template & Envelopes (Week 3)
**Goal:** Admin can create budget templates with envelopes

**Tasks:**
1. Budget template CRUD:
   - List templates
   - Create new template
   - Set active template
   - Delete template

2. Envelope group management:
   - Create/edit/delete groups
   - Sortable groups

3. Envelope management:
   - Create envelopes within groups
   - Set budget amounts
   - Sort envelopes
   - Delete with warnings

4. UI Components:
   - Nested tree view for groups/envelopes
   - Forms with TanStack Form
   - Validation

**Deliverable:** Admin can build complete budget template

---

### Phase 3: Accounts & Income (Week 4)
**Goal:** Account tracking and income management

**Tasks:**
1. Account management:
   - Create accounts (Checking, Credit, Savings)
   - Set initial balances
   - Calculate current balance from transactions

2. Account transaction view:
   - **Desktop table view:**
     - Build transaction table with TanStack Table
     - Implement column visibility toggles
     - Add sortable columns
     - Show running balance calculation
     - Summary card with balance metrics

   - **Mobile card view:**
     - Responsive cards for transactions
     - Date section headers
     - Expandable summary card
     - Touch-friendly checkboxes

   - **Bulk actions:**
     - Selection checkboxes
     - Sticky action bar (desktop)
     - Floating action button (mobile)
     - Change account modal
     - Clear/unclear transactions (admin-only)

   - **Filters:**
     - Date range picker (default to current month)
     - Envelope filter
     - Status filter (pending/cleared)
     - Search functionality

2.5. Reconcile account balances (Admin):
   - Admin enters the real-world balance from the bank
   - Show difference between expected vs actual
   - Create an "Adjustment" transaction to correct the balance
   - Log reconciliations (date, entered balance, delta, who reconciled)

3. Income categories:
   - Create income categories
   - Link to budget template

4. Income transaction entry:
   - Admin can add income (income must always belong to an account)
   - Assign to "Available to Budget"
   - Link to income category

5. Available to Budget display:
   - Show total income for month
   - Show assigned to envelopes
   - Show remaining to assign

**Deliverable:** Accounts with full transaction view (desktop + mobile), income working

---

### Phase 4: Transaction Entry - Member Flow (Week 5)
**Goal:** Super simple transaction entry for members

**Tasks:**
1. Member transaction form:
   - Amount input (large, easy to tap)
   - Envelope selector (searchable dropdown)
   - Account (pre-filled)
   - Quick-switch account selector:
     - If user has >1 account: 1-tap segmented control (e.g., Credit/Debit)
     - If only 1 account exists: hide the selector
   - Description (optional, collapsible)

2. Transaction creation:
   - Create with "pending" status
   - Record who created
   - Server function for data save

3. Transaction list (member view):
   - See their pending transactions
   - See cleared transactions
   - Filter by date

4. PWA setup:
   - Service worker
   - App manifest
   - Install prompt
   - Persistent login

**Deliverable:** Member can easily add expenses on mobile

---

### Phase 5: Admin Approval & Clearing (Week 6)
**Goal:** Admin dashboard to review and approve transactions

**Tasks:**
1. Pending transactions dashboard:
   - List all pending transactions
   - Group by user
   - Filter/sort

2. Approval actions:
   - Single approve
   - Bulk approve
   - Edit transaction details
   - Delete transaction

3. Transaction detail modal:
   - Edit amount
   - Change envelope
   - Change account
   - Add/edit description

4. Update account balances:
   - Recalculate when transaction cleared
   - Show running balance

**Deliverable:** Admin can review and approve all transactions

---

### Phase 6: Recurring Transactions (Week 7)
**Goal:** Auto-generate recurring transactions on-demand

**Tasks:**
1. Recurring transaction setup:
   - Create recurring expense/income
   - Set frequency (daily, weekly, biweekly, monthly, quarterly, yearly)
   - Set day of month or day of week
   - Link to envelope (expense) or income category (income)
   - Set start/end dates

2. On-demand generation system:
   - Add `lastGeneratedDate` tracking table
   - Create `generateMissingRecurring(from, to)` function
   - Check on dashboard/account load
   - Generate all missing days since last check
   - Backdate transactions to correct dates
   - Handle race conditions (multiple users loading)

3. Generation logic:
   - Check each day between last generated and today
   - For each day, find recurring transactions due
   - Create transactions only if not already exists
   - Status depends on `autoClear` and created by System user
   - Update last generated date

4. Recurring transaction management:
   - List all recurring transactions
   - Edit upcoming occurrences
   - Pause/resume recurring
   - Delete recurring (with confirmation)
   - View generated history

5. Admin UI:
   - Recurring transactions list page
   - Create/edit recurring form
   - Manual "Regenerate" button (optional safety net)
   - Show next occurrence dates

**Deliverable:** Recurring transactions auto-generate when app is opened, correctly backdated

---

### Phase 7: Envelope Tracking (Week 8)
**Goal:** Clear envelope status at a glance (no reports)

**Tasks:**
1. Envelope budget view:
   - Show budgeted vs spent vs remaining
   - Overspent indicators

2. Simple monthly summary (optional, lightweight):
   - Total income
   - Total spent

**Deliverable:** Simple envelope dashboard focused on remaining funds

---

### Phase 7.5: Account Reconciliation (Week 8.5)
**Goal:** Keep account balances trustworthy by matching real bank balances

**Admin Flow:**
1. Open an account → click **Reconcile**
2. Enter the **actual bank balance** (as-of date)
3. App shows **difference** (actual - computed)
4. Admin can create an **Adjustment transaction** to reconcile

**Rules:**
- Reconciliation is **admin-only**
- Adjustment transaction:
  - Uses normal `type` (so existing math/UI works):
    - `type = income` if `(actual - computed) > 0`
    - `type = expense` if `(actual - computed) < 0`
  - Set a flag like `source = 'reconciliation'` (or `isReconciliationAdjustment = true`)
  - Belongs to the account
  - Envelope is **none** (forced)
  - Description auto-filled: `Reconciliation adjustment`

**Deliverable:** Admin can reconcile any account in < 30 seconds

---

### Phase 8: Settings & User Management (Week 9) — Post-MVP
**Goal:** Complete admin and member settings pages

**Tasks:**

1. Admin Settings - Users & Roles Tab:
   - List all users with roles
   - Add user form (email invitation)
   - Edit user role (Admin/Member)
   - Set member default account
   - Deactivate/remove users
   - Send email invitations (Better Auth email feature)

2. Admin Settings - Accounts Tab:
   - List all accounts
   - Create account form (name, type, initial balance)
   - Edit account details
   - Drag-to-reorder accounts
   - Archive/hide accounts

3. Admin Settings - Security Tab (Removed for MVP):
   - (Removed) passkeys / 2FA

4. Admin Settings - Budget Tab:
   - Select active template dropdown
   - Link to budget management page
   - Transaction defaults (auto-clear, default status)
   - Envelope sort preferences

5. Admin Settings - General Tab:
   - App name customization
   - Currency settings (symbol, format)
   - Date format preferences
   - First day of month/week settings
   - **Export system:**
     - Checkboxes for: Transactions, Accounts, Budget Templates, Recurring, Settings
     - Export selected or export all (JSON format)
     - Download JSON file
   - **Import system:**
     - Upload JSON file
     - Validate format
     - Selective import (choose what to import)
     - Confirmation dialog before import
   - **Danger zone:**
     - Delete all transactions (keep budgets/accounts)
     - Delete everything (complete reset)
     - Both require confirmation dialog

6. Member Settings Page:
   - Profile section (name, email)
   - Security section:
     - Change password form (current, new, confirm)
   - Preferences (default account: view only; admin-controlled)

7. Settings Access Control:
   - Admin sees full settings page
   - Member sees limited settings page
   - Server-side permission checks on all settings mutations
   - Proper error messages for unauthorized access

8. Export/Import Implementation:
   - Generate JSON with all selected data
   - Include metadata (version, export date, app name)
   - Validate import file structure
   - Handle ID conflicts (regenerate IDs on import)
   - Show import preview before applying

**Use Case:** Export budget templates → Delete all transactions to start fresh → Import budget templates back → Continue with clean slate but same budget structure

**Deliverable:** Complete settings management with export/import for clean restarts

---

### Phase 9: Polish & Testing (Week 10-11)
**Goal:** Production-ready app

**Tasks:**
1. Error handling:
   - Form validation messages
   - Network error handling
   - Optimistic updates with rollback

2. Loading states:
   - Skeleton loaders
   - Spinner states
   - Toast notifications

3. Mobile optimization:
   - Touch-friendly buttons
   - Responsive layouts
   - Offline support

4. Testing:
   - Test admin workflows
   - Test member workflows
   - Test edge cases

5. Documentation:
   - User guide for wife
   - Setup instructions
   - Deployment guide

**Deliverable:** Production-ready app

---

## Deployment Strategy

### Option 1: **Vercel** (Recommended for Easy Start) ⭐
- Push to GitHub
- Connect to Vercel
- Environment variables:
  - `DATABASE_URL` (Turso connection string for cloud SQLite)
  - `BETTER_AUTH_SECRET`
  - `BETTER_AUTH_URL` (your Vercel domain)
- Auto-deploy on push
- **On-demand recurring generation works perfectly** (no cron needed)

**For SQLite on Vercel, use Turso:**
```bash
# Sign up at turso.tech
bunx @turso/cli signup
bunx @turso/cli db create super-simple-budget

# Get credentials
bunx @turso/cli db show super-simple-budget

# Add to Vercel environment variables
DATABASE_URL="libsql://[db-name]-[org].turso.io"
DATABASE_AUTH_TOKEN="[your-token]"
```

### Option 2: **Railway.app** (Alternative)
- Similar to Vercel, supports full-stack apps
- $5 free credits/month
- Connect GitHub repo
- Set environment variables
- Deploy
- **On-demand generation works perfectly**

### Option 3: **Debian Server (Self-Hosted)**
1. Build for production:
   ```bash
   bun run build
   ```

2. Copy `.output` to server:
   ```bash
   scp -r .output user@server:/path/to/ssb
   ```

3. Setup systemd service:
   ```bash
   # /etc/systemd/system/ssb.service
   [Unit]
   Description=Super Simple Budget
   After=network.target

   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/ssb
   ExecStart=/usr/bin/bun run .output/server/index.mjs
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

4. Enable and start:
   ```bash
   sudo systemctl enable ssb
   sudo systemctl start ssb
   ```

5. Use nginx as reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name budget.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. SQLite database as file on server:
   ```bash
   # data directory
   mkdir -p /path/to/ssb/data
   chmod 755 /path/to/ssb/data

   # DATABASE_URL in .env
   DATABASE_URL="file:/path/to/ssb/data/ssb.db"
   ```

**No cron jobs needed!** On-demand generation works perfectly on self-hosted.

### Database Choice
- **Development:** File-based SQLite (`file:./data.db`)
- **Production (Vercel):** Turso (libSQL cloud) - Required for serverless
- **Production (Railway):** File-based SQLite or Turso
- **Production (Self-hosted):** File-based SQLite (simplest)

### Recurring Transactions on All Platforms
The on-demand generation system works on **all hosting platforms** without any additional setup:
- ✅ Vercel (serverless)
- ✅ Railway
- ✅ Self-hosted
- ✅ Any Node.js/Bun hosting

Transactions are generated when users load the app, so no background jobs or cron scheduling needed.

---

## Critical Implementation Notes

### System User (For Auto-Generated Transactions)
Seed a real user row named **System** and store its id as `SYSTEM_USER_ID`. Use that id for `createdBy` on auto-generated recurring transactions to satisfy the FK constraint.



### Money Formatting Helper (Cents → Display)
All monetary values are stored as **integer cents** (e.g., 5413).
UI must convert cents to dollars for display using a single helper:

```typescript
export function formatMoney(amountCents: number): string {
  const sign = amountCents < 0 ? '-' : ''
  const abs = Math.abs(amountCents)
  return `${sign}$${(abs / 100).toFixed(2)}`
}
```

Never call `.toFixed(2)` on raw cents without dividing by 100 first.



### 0. Tailwind CSS v4 Setup
Tailwind CSS v4 has a new architecture using Vite plugin:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    // ... other plugins
  ],
})
```

```css
/* app/styles/app.css */
@import "tailwindcss";

/* Your custom styles */
@theme {
  --color-primary: var(--color-blue-500);
}
```

Key differences from v3:
- No `tailwind.config.js` needed (use CSS `@theme` instead)
- Import via `@import "tailwindcss"` not `@tailwind`
- Use Vite plugin, not PostCSS
- More performant, smaller bundle

### 1. TanStack Form Best Practices
- Use Zod for schema validation
- Integrate with TanStack Form via `@tanstack/zod-form-adapter`
- Use server-side validation for security
- Debounce async validation (500ms)
- Use `form.Field` for type-safe fields
- Integrate with shadcn/ui components

**Example:**
```typescript
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

const transactionSchema = z.object({
  amountCents: z.number().int().positive(),
  envelopeId: z.string().uuid(),
  description: z.string().optional(),
})

const form = useForm({
  defaultValues: { amountCents: 0, envelopeId: '', description: '' },
  validatorAdapter: zodValidator(),
  validators: {
    onChange: transactionSchema,
  },
  onSubmit: async ({ value }) => {
    await createTransaction(value)
  },
})
```

### 2. TanStack Query Optimizations
- Use optimistic updates for instant UI feedback
- Configure stale times per query:
  - Transactions: `staleTime: 1000 * 60 * 5` (5 min)
  - Budget template: `staleTime: Infinity` (only changes on edit)
- Invalidate queries on mutations

### 3. Better Auth Setup
```typescript
// auth.config.ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { resend } from "better-auth/adapters/resend"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
  email: {
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
        to: user.email,
        subject: "Verify your email",
        html: `<a href="${url}">Verify email</a>`,
      })
    },
    sendPasswordResetEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
        to: user.email,
        subject: "Reset your password",
        html: `<a href="${url}">Reset password</a>`,
      })
    },
    sendInvitationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
        to: user.email,
        subject: "You've been invited to Super Simple Budget",
        html: `<p>You've been invited to join Super Simple Budget.</p><a href="${url}">Accept invitation</a>`,
      })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year (essentially "forever")
    updateAge: 60 * 60 * 24 * 30, // Update every 30 days
  },
})
```

**Environment Variables:**
```bash
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourdomain.com
BETTER_AUTH_URL=https://yourdomain.com
```

### 4. Member Default Account
```typescript
// When member creates transaction
const userRole = await getUserRole(userId)
const accountId = transaction.accountId ?? userRole.defaultAccount
```

### 5. Account Balance Calculation
```typescript
// Computed field or materialized view
function calculateAccountBalance(accountId: string) {
  const account = db.query.accounts.findFirst({
    where: eq(accounts.id, accountId)
  })

  const transactions = db.query.transactions.findMany({
    where: and(
      eq(transactions.accountId, accountId),
      eq(transactions.status, 'cleared')
    )
  })

  const balanceCents = account.initialBalanceCents +
    transactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amountCents : -t.amountCents)
    }, 0)

  return balanceCents
}
```

### 5a. Running Balance Calculation (Account View)
```typescript
// Calculate running balance for account transaction view
function calculateRunningBalances(transactions: Transaction[], startingBalanceCents: number) {
  // Sort newest first (for display)
  const sorted = transactions.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calculate from bottom up (oldest to newest)
  const reversed = [...sorted].reverse()

  let runningBalanceCents = startingBalanceCents

  const withBalances = reversed.map(t => {
    // Only cleared transactions affect balance
    if (t.status === 'cleared') {
      runningBalanceCents += t.type === 'income'
        ? t.amountCents
        : -t.amountCents
    }

    return {
      ...t,
      runningBalanceCents: t.status === 'cleared' ? runningBalanceCents : null
    }
  })

  // Return in display order (newest first)
  return withBalances.reverse()
}
```

### 5b. TanStack Table Implementation for Account View
```typescript
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table'

const columns = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => format(row.original.date, 'MMM dd, yyyy'),
  },
  {
    accessorKey: 'envelope.name',
    header: 'Envelope',
    // Column can be hidden with visibility state
  },
  {
    accessorKey: 'amountCents',
    header: 'Amount',
    cell: ({ row }) => {
      const amountCents = row.original.amountCents
      const sign = row.original.type === 'income' ? '+' : '-'
      return `${sign}${formatMoney(amountCents)}`
    },
  },
  {
    id: 'cleared',
    header: 'Cleared',
    cell: ({ row }) => (
      <Checkbox
        checked={row.original.status === 'cleared'}
        // admin-only
      onCheckedChange={() => toggleCleared(row.original.id)}
      />
    ),
  },
  {
    accessorKey: 'runningBalanceCents',
    header: 'Running Balance',
    cell: ({ row }) => {
      const balanceCents = row.original.runningBalanceCents
      if (balanceCents === null) return <span className="text-muted">Pending</span>
      return <span>{formatMoney(balanceCents)}</span>
    },
  },
]

const table = useReactTable({
  data: transactionsWithBalances,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    rowSelection,
    columnVisibility: {
      'envelope.name': showEnvelope,
      'description': showDescription,
    },
  },
  onRowSelectionChange: setRowSelection,
})
```

### 5c. Mobile Card Component for Account View
```typescript
function TransactionCard({ transaction, isSelected, onToggleSelect }: Props) {
  const isCleared = transaction.status === 'cleared'
  const amount = transaction.type === 'income'
    ? `+${formatMoney(transaction.amountCents)}`
    : `-${formatMoney(transaction.amountCents)}`

  return (
    <Card className={!isCleared ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
            />
            <div>
              <p className="font-medium">{transaction.envelope.name}</p>
              {transaction.description && (
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Checkbox
                  checked={isCleared}
                  // admin-only
                  onCheckedChange={() => toggleCleared(transaction.id)}
                  className="h-3 w-3"
                />
                <span className="text-xs">
                  {isCleared ? 'Cleared' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-lg font-semibold ${
              transaction.type === 'income' ? 'text-green-600' : ''
            }`}>
              {amount}
            </p>
            {transaction.runningBalanceCents !== null && (
              <p className="text-sm text-muted-foreground">
                {formatMoney(transaction.runningBalanceCents)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 6. Recurring Transaction Generation (On-Demand)
```typescript
// Database: Track last generated date
lastGenerated {
  id: string
  date: date
  updatedAt: timestamp
}

// Server function - called on dashboard/account page load
export const loadDashboard = createServerFn('GET', async () => {
  // Check and generate any missing recurring transactions
  await ensureRecurringGenerated()

  // Return dashboard data
  return getDashboardData()
})

// Core generation logic
async function ensureRecurringGenerated() {
  return await db.transaction(async (tx) => {
    // Get last generated date
    const lastGen = await tx.query.lastGenerated.findFirst()
    const lastDate = lastGen?.date || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const today = new Date()

    // If we're caught up, return
    if (isSameDay(lastDate, today)) return

    // Generate for each missing day
    let currentDate = new Date(lastDate)
    currentDate.setDate(currentDate.getDate() + 1) // Start from day after last

    while (currentDate <= today) {
      await generateRecurringForDate(tx, currentDate)
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Update last generated date
    if (lastGen) {
      await tx.update(lastGenerated)
        .set({ date: today, updatedAt: new Date() })
        .where(eq(lastGenerated.id, lastGen.id))
    } else {
      await tx.insert(lastGenerated).values({ date: today })
    }
  })
}

// Generate recurring transactions for a specific date
async function generateRecurringForDate(tx, date: Date) {
  const recurring = await tx.query.recurringTransactions.findMany({
    where: and(
      eq(recurringTransactions.isActive, true),
      lte(recurringTransactions.startDate, date),
      or(
        isNull(recurringTransactions.endDate),
        gte(recurringTransactions.endDate, date)
      )
    )
  })

  for (const r of recurring) {
    const isDue = checkIfDueOnDate(r, date)

    if (isDue) {
      // Check if already exists (prevent duplicates)
      const existing = await tx.query.transactions.findFirst({
        where: and(
          eq(transactions.recurringTransactionId, r.id),
          eq(transactions.date, date)
        )
      })

      if (!existing) {
        // Create transaction with CORRECT date (backdated)
        await tx.insert(transactions).values({
          type: r.type,
          amountCents: r.amountCents,
          date: date, // Use the date it was due, not today
          description: r.description,
          envelopeId: r.type === 'expense' ? r.envelopeId : null,
          incomeCategoryId: r.type === 'income' ? r.incomeCategoryId : null,
          accountId: r.accountId,
          status: r.autoClear ? 'cleared' : 'pending',
          recurringTransactionId: r.id,
          createdBy: SYSTEM_USER_ID, // id of a real seeded 'System' user
          createdAt: new Date(), // Actual creation time (now)
        })
      }
    }
  }
}

// Check if recurring transaction is due on a specific date
function checkIfDueOnDate(recurring: RecurringTransaction, date: Date): boolean {
  const day = date.getDate()
  const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday

  switch (recurring.frequency) {
    case 'daily':
      return true

    case 'weekly':
      return recurring.dayOfWeek === dayOfWeek

    case 'biweekly':
      // Check if it's the right day of week and the right week
      if (recurring.dayOfWeek !== dayOfWeek) return false
      const weeksSinceStart = Math.floor(
        (date.getTime() - recurring.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      )
      return weeksSinceStart % 2 === 0

    case 'monthly':
      return recurring.dayOfMonth === day

    case 'quarterly':
      // Every 3 months on the same day
      const monthsSinceStart =
        (date.getMonth() - recurring.startDate.getMonth()) +
        12 * (date.getFullYear() - recurring.startDate.getFullYear())
      return monthsSinceStart % 3 === 0 && recurring.dayOfMonth === day

    case 'yearly':
      return date.getMonth() === recurring.startDate.getMonth() &&
             date.getDate() === recurring.startDate.getDate()

    default:
      return false
  }
}

// Helper
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}
```

**Usage in Routes:**
```typescript
// app/routes/dashboard/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    // This will generate any missing recurring transactions
    return await loadDashboard()
  },
})

// app/routes/accounts/$accountId.tsx
export const Route = createFileRoute('/accounts/$accountId')({
  loader: async ({ params }) => {
    // This will also trigger generation before loading account
    await ensureRecurringGenerated()
    return await loadAccount(params.accountId)
  },
})
```

**Benefits:**
- ✅ No cron jobs or external services needed
- ✅ Works on Vercel, Railway, self-hosted, anywhere
- ✅ Automatically catches up after any downtime
- ✅ Transactions always have correct dates
- ✅ Race condition safe (database transaction)
- ✅ Can manually trigger by refreshing page

**Optional: Manual Regenerate Button**
```typescript
// For admin safety net
export const regenerateRecurring = createServerFn('POST', async ({ startDate, endDate }) => {
  const session = await requireAdmin()

  // Delete existing auto-generated transactions in range
  await db.delete(transactions).where(
    and(
      eq(transactions.createdBy, SYSTEM_USER_ID),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    )
  )

  // Regenerate
  let current = new Date(startDate)
  while (current <= endDate) {
    await generateRecurringForDate(db, current)
    current.setDate(current.getDate() + 1)
  }

  return { success: true }
})
```

### 7. Settings Management with AppSettings Table

Use a key-value store for flexible settings:

```typescript
// Get setting
async function getSetting(key: string, defaultValue?: string) {
  const setting = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, key)
  })
  return setting?.value ?? defaultValue
}

// Set setting
async function setSetting(key: string, value: string) {
  const existing = await db.query.appSettings.findFirst({
    where: eq(appSettings.key, key)
  })

  if (existing) {
    await db.update(appSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(appSettings.key, key))
  } else {
    await db.insert(appSettings).values({ key, value })
  }
}

// Complex values (JSON)
async function getJsonSetting<T>(key: string, defaultValue: T): Promise<T> {
  const value = await getSetting(key)
  return value ? JSON.parse(value) : defaultValue
}

// Example usage
const passwordMinLength = await getSetting('password_min_length', '8')
const currencySettings = await getJsonSetting('currency', {
  symbol: '$',
  code: 'USD'
})
```

**Settings Permission Check:**
```typescript
// Admin-only settings mutations
export const updateSettings = createServerFn('POST', async (data: SettingsInput) => {
  const user = await requireAuth()
  const userRole = await getUserRole(user.id)

  if (userRole.role !== 'admin') {
    throw new Error('Unauthorized: Admin only')
  }

  // Update settings
  for (const [key, value] of Object.entries(data)) {
    await setSetting(key, value)
  }

  return { success: true }
})
```

### 8. Export/Import System (Post-MVP)

**Export Format (JSON):**
```typescript
interface ExportData {
  version: string // App version
  exportDate: string
  appName: string
  data: {
    transactions?: Transaction[]
    accounts?: Account[]
    budgetTemplates?: {
      template: BudgetTemplate
      groups: EnvelopeGroup[]
      envelopes: Envelope[]
    }[]
    recurringTransactions?: RecurringTransaction[]
    incomeCategories?: IncomeCategory[]
    appSettings?: Record<string, string>
  }
}
```

**Export Implementation:**
```typescript
export const exportData = createServerFn('POST', async (options: ExportOptions) => {
  const user = await requireAuth()
  const userRole = await getUserRole(user.id)

  if (userRole.role !== 'admin') {
    throw new Error('Unauthorized: Admin only')
  }

  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    appName: await getSetting('app_name', 'Super Simple Budget'),
    data: {}
  }

  if (options.includeTransactions) {
    exportData.data.transactions = await db.query.transactions.findMany()
  }

  if (options.includeAccounts) {
    exportData.data.accounts = await db.query.accounts.findMany()
  }

  if (options.includeBudgetTemplates) {
    const templates = await db.query.budgetTemplates.findMany()
    exportData.data.budgetTemplates = await Promise.all(
      templates.map(async (template) => ({
        template,
        groups: await db.query.envelopeGroups.findMany({
          where: eq(envelopeGroups.budgetTemplateId, template.id)
        }),
        envelopes: await db.query.envelopes.findMany({
          where: exists(
            db.select()
              .from(envelopeGroups)
              .where(
                and(
                  eq(envelopeGroups.budgetTemplateId, template.id),
                  eq(envelopes.groupId, envelopeGroups.id)
                )
              )
          )
        })
      }))
    )
  }

  // ... similar for recurring, income categories, settings

  return exportData
})
```

**Import Implementation:**
```typescript
export const importData = createServerFn('POST', async (data: ExportData) => {
  const user = await requireAuth()
  const userRole = await getUserRole(user.id)

  if (userRole.role !== 'admin') {
    throw new Error('Unauthorized: Admin only')
  }

  // Validate format
  if (!data.version || !data.data) {
    throw new Error('Invalid import file format')
  }

  // Use database transaction for atomicity
  await db.transaction(async (tx) => {
    // Generate new IDs to avoid conflicts
    const idMap = new Map<string, string>()

    // Import budget templates
    if (data.data.budgetTemplates) {
      for (const { template, groups, envelopes } of data.data.budgetTemplates) {
        const newTemplateId = generateId()
        idMap.set(template.id, newTemplateId)

        await tx.insert(budgetTemplates).values({
          ...template,
          id: newTemplateId,
          isActive: false // Don't override active template
        })

        // Import groups and envelopes with new IDs
        for (const group of groups) {
          const newGroupId = generateId()
          idMap.set(group.id, newGroupId)

          await tx.insert(envelopeGroups).values({
            ...group,
            id: newGroupId,
            budgetTemplateId: newTemplateId
          })

          const groupEnvelopes = envelopes.filter(e => e.groupId === group.id)
          for (const envelope of groupEnvelopes) {
            await tx.insert(envelopes).values({
              ...envelope,
              id: generateId(),
              groupId: newGroupId
            })
          }
        }
      }
    }

    // Similar for accounts, transactions, etc.
  })

  return { success: true, imported: Object.keys(data.data).length }
})
```

**Use Cases:**
1. **Start Fresh:** Export budget templates → Delete all transactions → Import templates back
2. **Backup:** Export everything before major changes
3. **Migration:** Export from dev → Import to production
4. **Year-End:** Export full year → Archive → Start new year with clean slate

---

## Adding shadcn/ui Components

### How to Add New Components
shadcn/ui components are added on-demand as you need them. Use Bun to add components:

```bash
# Add a single component
bunx --bun shadcn@latest add button

# Add multiple components at once
bunx --bun shadcn@latest add button card dialog

# Common components you'll need
bunx --bun shadcn@latest add breadcrumb
bunx --bun shadcn@latest add dropdown-menu
bunx --bun shadcn@latest add form
bunx --bun shadcn@latest add input
bunx --bun shadcn@latest add label
bunx --bun shadcn@latest add select
bunx --bun shadcn@latest add table
bunx --bun shadcn@latest add toast
bunx --bun shadcn@latest add sheet
bunx --bun shadcn@latest add tabs
bunx --bun shadcn@latest add dialog
bunx --bun shadcn@latest add alert
bunx --bun shadcn@latest add badge
bunx --bun shadcn@latest add separator
bunx --bun shadcn@latest add skeleton
bunx --bun shadcn@latest add progress
```

### Component Categories by Feature

**Forms & Inputs:**
- `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `label`, `form`

**Data Display:**
- `table`, `card`, `badge`, `separator`, `avatar`, `progress`

**Feedback:**
- `alert`, `toast`, `skeleton`, `spinner`, `progress`

**Navigation:**
- `breadcrumb`, `tabs`, `dropdown-menu`, `navigation-menu`, `pagination`

**Overlays:**
- `dialog`, `sheet`, `popover`, `tooltip`, `alert-dialog`, `drawer`

**Layout:**
- `scroll-area`, `separator`, `aspect-ratio`, `collapsible`

### Customizing Components
Components are copied to `components/ui/` and can be customized:
- Edit the component file directly
- Modify variants in the component
- Add new variants as needed
- Components use Tailwind CSS classes

### Best Practices
1. **Only add components when needed** - Don't install everything upfront
2. **Customize after installation** - Edit components in `components/ui/` to fit your needs
3. **Use TypeScript** - All components are fully typed
4. **Follow shadcn patterns** - Consistent with Radix UI primitives

---

## TanStack Ecosystem Notes

### Why NOT TanStack DB?
**TanStack DB is in BETA** (v0.5.22 as of Jan 2026)
- Still experimental
- Focused on reactive client-side stores
- Designed for syncing with backend APIs
- **Not needed** for this use case since:
  - We have full control over the database
  - No real-time multi-user collaboration
  - Drizzle + TanStack Query is simpler and more stable

### TanStack Libraries We're Using

1. **TanStack Start (RC)** ✅
   - Production-ready
   - Stable API
   - Full-stack framework

2. **TanStack Query (v5)** ✅
   - Battle-tested
   - 1.2B+ downloads
   - Perfect for this

3. **TanStack Form (v1)** ✅
   - Stable release (March 2025)
   - Great TypeScript support

4. **TanStack Table (v8)** ✅
   - Stable
   - Perfect for transaction lists

5. **TanStack Router** ✅
   - Built into Start
   - Type-safe

### TanStack Libraries We're NOT Using

- **TanStack DB** ❌ - Too beta, not needed
- **TanStack Virtual** ❌ - Not needed (transaction lists won't be huge)
- **TanStack Store** ❌ - React state + Query handles our needs
- **TanStack AI** ❌ - No AI features needed

---

## Security Considerations

1. **Role-based access control:**
   - Server-side checks on every mutation
   - Members can't call admin-only server functions

2. **Better Auth security:**
   - CSRF protection (built-in)
   - Rate limiting (built-in)
   - Secure session cookies

3. **Input validation:**
   - Client-side (TanStack Form)
   - Server-side (Drizzle schema validation)

4. **SQL injection prevention:**
   - Drizzle ORM parameterized queries
   - No raw SQL except for trusted operations

5. **XSS prevention:**
   - React escapes by default
   - Validate user input

---

## Future Enhancements (Post-MVP)

1. **Reports:**
   - Export to CSV
   - Monthly/yearly spending reports
   - Trend analysis

2. **Mobile Apps:**
   - Convert to Capacitor for iOS/Android
   - Push notifications for recurring transactions

3. **Multi-budget:**
   - Separate budgets per user
   - Shared budget option

4. **Receipt upload:**
   - Attach images to transactions
   - OCR for amount extraction

5. **Goals:**
   - Savings goals
   - Debt payoff tracking

---

## Open Source Considerations

- **License:** MIT
- **Repository:** Public GitHub
- **Documentation:** Clear README with setup instructions
- **Contributing:** Welcome contributions
- **Issues:** Use GitHub issues for bugs/features

---

## Success Metrics

1. **Wife can add transaction in <30 seconds** ✅
2. **Admin can approve 10 transactions in <2 minutes** ✅
3. **Account balances match bank statements** ✅
4. **Zero downtime after deployment** ✅
5. **PWA works offline for transaction entry** ✅

---

## Key Takeaways

### Why This Stack?
- **TanStack Start:** Full-stack React with great DX, perfect for OSS
- **Drizzle:** Type-safe SQL, lighter than Prisma
- **Better Auth:** Modern auth, easy setup, granular permissions
- **SQLite:** Simple, no infrastructure needed
- **shadcn/ui:** Beautiful components, customizable

### Architecture Decisions
- **No external APIs:** Keep it simple, manual entry only
- **File-based DB for now:** Easy deployment, can migrate to Turso later
- **PWA not native app:** Easier maintenance, works on all devices
- **Server functions over tRPC:** Built into Start, less complexity
- **On-demand recurring generation:** No cron jobs, works everywhere, catches up automatically

### Development Approach
- Build for wife's workflow first (member experience)
- Admin features support the workflow
- Keep it simple - no over-engineering
- Iterate based on real usage

---

## Developer Documentation

### Creating README.md

Create a comprehensive `README.md` in the project root with the following structure:

```markdown
# Super Simple Budget (SSB)

A stupidly simple envelope budgeting app designed for couples. Built with TanStack Start, Drizzle ORM, and Better Auth.

## Features

- 🎯 **Envelope Budgeting** - Zero-based budgeting with envelope categories
- 👥 **Multi-user** - Admin/Member roles with different permissions
- 💳 **Account Tracking** - Track checking, savings, and credit card balances
- 📱 **Mobile-first** - PWA support for offline transaction entry
- 🔄 **Recurring Transactions** - Auto-generate bills and income
- 📊 **Budget Tracking** - Visual progress for each envelope

## Tech Stack

- **Framework:** TanStack Start (React meta-framework)
- **Database:** SQLite with Drizzle ORM
- **Auth:** Better Auth
- **UI:** shadcn/ui + Tailwind CSS v4
- **State:** TanStack Query + TanStack Form
- **Package Manager:** Bun

## Prerequisites

- Bun v1.0+
- Node.js 20+ (for some tooling)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/super-simple-budget.git
cd super-simple-budget
```

### 2. Install dependencies

```bash
bun install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` and configure:
```
DATABASE_URL="file:./data.db"
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Generate the database

```bash
bun run db:generate
bun run db:migrate
```

### 5. Seed initial data (optional)

```bash
bun run db:seed
```

### 6. Start the development server

```bash
bun run dev
```

Visit http://localhost:3000

## Development Scripts

```bash
bun run dev           # Start development server
bun run build         # Build for production
bun run start         # Start production server
bun run db:generate   # Generate Drizzle migrations
bun run db:migrate    # Run migrations
bun run db:studio     # Open Drizzle Studio
bun run db:seed       # Seed database with sample data
```

## Adding shadcn/ui Components

```bash
bunx --bun shadcn@latest add [component-name]
```

Example:
```bash
bunx --bun shadcn@latest add button card dialog
```

## Project Structure

```
super-simple-budget/
├── app/
│   ├── routes/           # TanStack Router routes
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── lib/             # Utilities and helpers
│   └── styles/          # Global styles
├── drizzle/
│   ├── schema.ts        # Database schema
│   └── migrations/      # SQL migrations
├── public/              # Static assets
└── .env                 # Environment variables
```

## User Roles

### Admin
- Full access to all features
- Can create/edit budgets and envelopes
- Can add income and expenses
- Can approve pending transactions
- Can manage accounts and recurring transactions

### Member
- Can add expense transactions (amount + envelope + optional description)
- Can view their pending transactions
- Can view envelope balances
- **Cannot** add income, edit budgets, or approve transactions

## Database Schema

## ID Strategy
- All primary keys are **UUID v4 strings** generated on the server.
- Import process must regenerate new UUIDs for imported rows and maintain an old→new ID map for relationships.
- Seed a dedicated **System** user (UUID) for auto-generated recurring transactions.


See [DATABASE.md](./docs/DATABASE.md) for complete schema documentation.

## Deployment

### Vercel

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

For Vercel deployment with SQLite, use Turso:
```bash
DATABASE_URL="libsql://your-database.turso.io"
DATABASE_AUTH_TOKEN="your-auth-token"
```

### Self-Hosted

```bash
# Build the app
bun run build

# Copy .output to your server
scp -r .output user@server:/path/to/app

# On the server
cd /path/to/app
bun run .output/server/index.mjs
```

## Contributing

This is primarily a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- Built with the TanStack ecosystem
- UI components from shadcn/ui
- Authentication by Better Auth
- Database management with Drizzle ORM
```

### Creating AGENTS.md

Create an `AGENTS.md` file for AI coding assistants (Cursor, Windsurf, etc.):

```markdown
# AGENTS.md - AI Coding Assistant Guide

This file provides context and guidelines for AI coding assistants working on Super Simple Budget (SSB).

## Project Context

Super Simple Budget (SSB) is an envelope budgeting application designed for couples. The primary use case is:
- **Member (Wife):** Quickly add expenses on mobile (4 fields: amount, envelope, auto-filled account, optional description)
- **Admin (Husband):** Review and approve transactions, manage budget templates, track accounts

The app prioritizes **simplicity** over features. Every feature should make the member experience simpler, not more complex.

## Tech Stack

- **Framework:** TanStack Start v1 (RC) - Full-stack React meta-framework
- **Database:** SQLite + Drizzle ORM (@libsql/client)
- **Auth:** Better Auth v1.4+
- **UI:** shadcn/ui (Vega preset) + Tailwind CSS v4
- **State Management:** TanStack Query v5 + TanStack Form v1
- **Tables:** TanStack Table v8
- **Package Manager:** Bun
- **TypeScript:** Strict mode enabled

## Architecture Patterns

### Server Functions (TanStack Start)

All database operations and business logic should use TanStack Start server functions:

```typescript
// app/routes/api/transactions.ts
import { createServerFn } from '@tanstack/start'
import { db } from '~/db'
import { transactions } from '~/db/schema'

export const createTransaction = createServerFn('POST', async (data: TransactionInput) => {
  // Server-side validation
  // Authorization checks
  // Database operations
  const result = await db.insert(transactions).values(data).returning()
  return result[0]
})
```

### Type-Safe Forms

Use TanStack Form for all forms with server-side validation:

```typescript
import { useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues: {
    amount: 0,
    envelopeId: '',
  },
  onSubmit: async ({ value }) => {
    await createTransaction(value)
  },
})
```

### Query Management

Use TanStack Query for all data fetching with proper cache invalidation:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const queryClient = useQueryClient()

const { data } = useQuery({
  queryKey: ['transactions'],
  queryFn: () => fetchTransactions(),
})

const mutation = useMutation({
  mutationFn: createTransaction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] })
  },
})
```

### Role-Based Authorization

Always check user role before operations:

```typescript
export const adminOnlyAction = createServerFn('POST', async (data) => {
  const session = await getSession()
  const userRole = await getUserRole(session.userId)

  if (userRole.role !== 'admin') {
    throw new Error('Unauthorized')
  }

  // Admin-only logic
})
```

## Database Patterns

### Schema Definition (Drizzle)

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  amount: real('amount').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  status: text('status', { enum: ['pending', 'cleared'] }).notNull(),
  // ... more fields
})
```

### Queries

```typescript
import { eq, and, desc } from 'drizzle-orm'

// Get pending transactions
const pending = await db.query.transactions.findMany({
  where: eq(transactions.status, 'pending'),
  orderBy: [desc(transactions.date)],
  with: {
    envelope: true,
    account: true,
  },
})
```

## Component Patterns

### shadcn/ui Integration

```typescript
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Form, FormField, FormItem, FormLabel } from '~/components/ui/form'

// Use shadcn components with TanStack Form
<form.Field name="amount">
  {(field) => (
    <FormItem>
      <FormLabel>Amount</FormLabel>
      <Input
        type="number"
        value={field.state.value}
        onChange={(e) => field.handleChange(Number(e.target.value))}
      />
    </FormItem>
  )}
</form.Field>
```

## Code Style Guidelines

### File Organization

```
app/
├── routes/
│   ├── index.tsx              # Home route
│   ├── dashboard/
│   │   ├── index.tsx          # Dashboard home
│   │   └── transactions.tsx   # Transactions page
│   └── api/
│       └── transactions.ts    # Server functions
├── components/
│   ├── ui/                    # shadcn components
│   └── features/
│       ├── transactions/      # Transaction-specific components
│       └── budget/            # Budget-specific components
└── lib/
    ├── utils.ts               # Utility functions
    └── validations.ts         # Zod schemas
```

### Naming Conventions

- **Components:** PascalCase (e.g., `TransactionList.tsx`)
- **Server Functions:** camelCase (e.g., `createTransaction`)
- **Database Tables:** snake_case (e.g., `user_roles`)
- **TypeScript Types:** PascalCase (e.g., `TransactionInput`)

### TypeScript Usage

- Always use explicit types for function parameters and return values
- Use Drizzle's type inference for database types
- Avoid `any` - use `unknown` if type is truly unknown
- Use Zod for runtime validation

## Common Tasks

### Adding a New Route

1. Create file in `app/routes/`
2. Export default component
3. Use TanStack Router loaders for data fetching

### Adding a New Database Table

1. Define schema in `drizzle/schema.ts`
2. Run `bun run db:generate` to create migration
3. Run `bun run db:migrate` to apply migration
4. Update TypeScript types

### Adding a New shadcn Component

```bash
bunx --bun shadcn@latest add [component-name]
```

### Creating a Server Function

1. Create in `app/routes/api/` directory
2. Use `createServerFn` from TanStack Start
3. Add proper validation and authorization
4. Return typed data

### Handling Recurring Transactions

**On-Demand Generation Pattern:**
Recurring transactions use an on-demand generation approach - they're created automatically when users load the app, not on a scheduled cron job.

```typescript
// Server function in dashboard loader
export const loadDashboard = createServerFn('GET', async () => {
  // Generate any missing recurring transactions
  await ensureRecurringGenerated()
  return getDashboardData()
})

async function ensureRecurringGenerated() {
  // Get last generated date
  const lastGen = await getLastGeneratedDate()
  const today = new Date()

  // If caught up, return early
  if (isSameDay(lastGen, today)) return

  // Generate for each missing day
  let current = new Date(lastGen)
  current.setDate(current.getDate() + 1)

  while (current <= today) {
    await generateRecurringForDate(current)
    current.setDate(current.getDate() + 1)
  }

  // Update last generated date
  await updateLastGeneratedDate(today)
}
```

**Key Points:**
- Transactions are backdated to their correct due dates
- Uses database transactions to prevent race conditions
- Checks if transaction already exists before creating
- Works on any hosting (Vercel, Railway, self-hosted)
- No external services or cron jobs needed
- Always catches up if user hasn't opened app in days

## Performance Guidelines

- Use optimistic updates for instant UI feedback
- Configure proper `staleTime` for queries:
  - Frequently changing data: 30 seconds - 5 minutes
  - Rarely changing data: `Infinity`
- Use `useSuspenseQuery` for critical data
- Lazy load heavy components

## Security Checklist

- [ ] Server-side validation for all inputs
- [ ] Role-based authorization checks
- [ ] Parameterized queries (Drizzle handles this)
- [ ] CSRF protection (Better Auth handles this)
- [ ] Rate limiting (Better Auth handles this)
- [ ] No sensitive data in client-side code

## Testing Guidelines

- Test critical paths (transaction creation, approval flow)
- Test authorization (admin vs member permissions)
- Test edge cases (negative amounts, date boundaries)
- Test mobile experience (transaction entry on small screens)

## Mobile-First Design

- **Transaction Entry:** Large touch targets (min 44px)
- **Forms:** Auto-focus on amount input
- **Keyboard:** Numeric keyboard for amount fields
- **Offline:** PWA support for transaction entry
- **Navigation:** Bottom navigation for easy thumb reach

### Account Transaction View Patterns

**Desktop:**
- Use TanStack Table for full-featured table
- Implement column visibility toggles
- Sticky action bar when rows selected
- Running balance calculated client-side for display

**Mobile:**
- Card-based layout for better mobile UX
- Date section headers for grouping
- FAB (Floating Action Button) for bulk actions
- Expandable summary card
- Touch-friendly checkboxes and tap targets

**Running Balance Logic:**
- Calculate bottom-up (oldest to newest)
- Display top-down (newest first)
- Only cleared transactions affect balance
- Pending shown as grayed out with null balance

### Recurring Transaction Generation (On-Demand)

**Pattern:** Generate missing recurring transactions when user loads the app, not on a schedule.

**Implementation:**
```typescript
// Call this in route loaders before loading data
export const Route = createFileRoute('/dashboard/')({
  loader: async () => {
    await ensureRecurringGenerated() // Check and generate missing
    return await getDashboardData()
  },
})
```

**Key Principles:**
- Check on every dashboard/account page load
- Use database transaction to prevent duplicates
- Backdate transactions to their correct due dates
- Track last generated date to know what's missing
- Generate all missing days in one pass

**Benefits:**
- No cron jobs or external services
- Works on any hosting (Vercel, self-hosted, etc.)
- Automatically catches up after downtime
- Race condition safe

**Edge Cases to Handle:**
- Multiple users loading simultaneously → Use DB transaction
- Server down for days → Generate all missing on next load
- Changing recurring transaction → Don't affect past generated ones
- Deleting recurring transaction → Keep past generated ones

## Anti-Patterns to Avoid

❌ Don't add features that complicate member experience
❌ Don't use client-side only state for persistent data
❌ Don't skip server-side validation
❌ Don't query database directly in components (use server functions)
❌ Don't use `any` type in TypeScript
❌ Don't add dependencies without checking bundle size
❌ Don't create generic "utils" - be specific

## Questions to Ask Before Adding Features

1. Does this make the member experience simpler?
2. Is this feature needed for MVP?
3. Can this be done with existing components?
4. Does this require a new database table?
5. How does this affect mobile UX?

## Useful Commands

```bash
# Development
bun run dev                    # Start dev server
bun run db:studio              # Open Drizzle Studio

# Database
bun run db:generate            # Generate migration
bun run db:migrate             # Run migrations
bun run db:seed                # Seed database

# Recurring Transactions (in app)
# Automatic: Opens dashboard/account → triggers generation
# Manual: Use "Regenerate Recurring" button in admin dashboard

# Components
bunx --bun shadcn@latest add button  # Add shadcn component

# Build & Deploy
bun run build                  # Build for production
bun run start                  # Start production server
```

## Resources

- [TanStack Start Docs](https://tanstack.com/start)
- [Drizzle ORM Docs](https://orm.drizzle.team)
- [Better Auth Docs](https://better-auth.com)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [TanStack Query Docs](https://tanstack.com/query)

## Current Phase

Currently in: **Phase 1 - Foundation**

Next tasks:
1. Setup project with TanStack Start + shadcn preset
2. Configure Drizzle + SQLite
3. Setup Better Auth with roles
4. Create base layouts (admin/member)

---

**Remember:** Simplicity is the ultimate goal. When in doubt, choose the simpler solution.
```

---

**Ready to build! 🚀**
