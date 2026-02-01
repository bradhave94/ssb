# Super Simple Budget - Implementation TODO

**Project Status:** Phase 1 Complete, Ready for Phase 2

**Last Updated:** February 1, 2026

**IMPORTANT: Linting Protocol**
After completing each major step or phase:
1. Check IDE for TypeScript errors (red squiggles)
2. Run `bun run lint` to check for ESLint errors
3. Run `bun run lint --fix` to auto-fix what can be fixed
4. Manually fix remaining errors
5. Verify with final `bun run lint` and IDE check
6. All code must pass both ESLint and TypeScript checks before moving to next phase

---

## Phase Status

- [X] **Phase 1:** Foundation (COMPLETE ✅)
- [ ] **Phase 2:** Budget Templates & Envelopes
- [ ] **Phase 3:** Accounts & Income
- [ ] **Phase 4:** Member Transaction Entry
- [ ] **Phase 5:** Admin Approval
- [ ] **Phase 6:** Recurring Transactions
- [ ] **Phase 7:** Envelope Tracking
- [ ] **Phase 8:** Settings & User Management
- [ ] **Phase 9:** Polish & Testing

---

## Current Phase: Phase 2 - Budget Templates & Envelopes

### Setup Tasks

- [X] 1.1 Initialize TanStack Start project with shadcn preset
- [X] 1.2 Install all dependencies (Drizzle, Better Auth, Zod, etc.)
- [X] 1.3 Configure Drizzle for SQLite/Turso
- [X] 1.4 Create database schema (`src/db/schema.ts`)
- [X] 1.4a Setup database connection (`src/db/index.ts`)
- [X] 1.5 Configure Better Auth with email support
- [X] 1.6 Create base layouts (Admin/Member)
- [X] 1.7 Setup protected routes and role checks
- [X] 1.8 Create seeding script with System user
- [X] 1.9 Add shadcn/ui components (button, card, form, etc.)
- [X] 1.10 Create utilities (format-money, validations with Zod)
- [X] 1.11 Setup email with Resend (invitations, password reset)

### Phase 1 Verification Checklist

- [X] Can run `bun run dev` successfully
- [X] Database migrations run without errors
- [X] Seed script creates System user + sample data
- [X] No linter errors (`bun run lint` passes)
- [X] Can signup with new account
- [X] Can login with credentials
- [ ] Admin sees admin layout with full navigation
- [ ] Member sees simplified layout
- [ ] Protected routes redirect to login when not authenticated

**Phase 1 Status:** ✅ COMPLETE - Foundation ready, auth working

---

## Current Phase: Phase 2 - Budget Templates & Envelopes

**Goal:** Admin can create and manage budget templates with envelope groups

## Phase 2 - Budget Templates & Envelopes

### Tasks

- [ ] 2.1 Create server functions for budget template CRUD
- [ ] 2.1 Create server functions for envelope groups and envelopes
- [ ] 2.2 Build UI components (template list, envelope tree, forms)
- [ ] 2.3 Create budget management route
- [ ] 2.4 Implement validation rules (archive, delete constraints)

### Verification

- [ ] Admin can create budget template
- [ ] Admin can add envelope groups
- [ ] Admin can add envelopes with budget amounts
- [ ] Drag-and-drop sorting works
- [ ] Archive prevents hard delete when transactions exist
- [ ] Forms validate with Zod schemas

---

## Phase 3 - Accounts & Income

### Tasks

- [ ] 3.1 Create account server functions (CRUD, balance calculation)
- [ ] 3.1 Create transaction server functions (CRUD, transfers)
- [ ] 3.2 Implement running balance calculation
- [ ] 3.3 Build desktop transaction table with TanStack Table
- [ ] 3.3 Build mobile card view with FAB
- [ ] 3.4 Create account routes (list, detail)
- [ ] 3.5 Build income categories and transaction entry
- [ ] 3.6 Display "Available to Budget" computation
- [ ] 3.7 Create reconciliation modal

### Verification

- [ ] Account balance computes correctly
- [ ] Running balance displays correctly (newest first)
- [ ] Desktop table: column visibility, sorting, bulk actions work
- [ ] Mobile view: cards, date headers, FAB work
- [ ] Transfers create paired transactions correctly
- [ ] Admin can add income transactions
- [ ] Reconciliation adjusts account balance

---

## Phase 4 - Member Transaction Entry

### Tasks

- [ ] 4.1 Build QuickAddExpense component with Zod validation
- [ ] 4.2 Create createExpense server function
- [ ] 4.3 Build member home page
- [ ] 4.4 Create routes for expense entry

### Verification

- [ ] Member can add expense in <30 seconds (success metric)
- [ ] Amount input shows numeric keyboard on mobile
- [ ] Account auto-populates to member's default
- [ ] Transaction creates as 'pending' status
- [ ] Member sees their pending transactions

---

## Phase 5 - Admin Approval

### Tasks

- [ ] 5.1 Create server functions for pending transactions
- [ ] 5.2 Build approval UI components
- [ ] 5.3 Create admin dashboard with pending tab

### Verification

- [ ] Admin sees all pending transactions
- [ ] Single approval works
- [ ] Bulk approval works
- [ ] Edit transaction modal works
- [ ] Delete transaction works
- [ ] Account balance updates when transaction cleared

---

## Phase 6 - Recurring Transactions

### Tasks

- [ ] 6.1 Create recurring transaction server functions
- [ ] 6.2 Implement on-demand generation logic
- [ ] 6.3 Build recurring UI components
- [ ] 6.4 Create recurring management route
- [ ] 6.5 Integrate generation into route loaders

### Verification

- [ ] Recurring transactions generate on dashboard load
- [ ] Backdating to correct dates works
- [ ] Multiple days backfill correctly
- [ ] Race conditions prevented (DB transaction)
- [ ] System user is createdBy for generated transactions
- [ ] Admin can create/edit/pause recurring

---

## Phase 7 - Envelope Tracking

### Tasks

- [ ] 7.1 Create envelope balance server functions
- [ ] 7.2 Build envelope display components
- [ ] 7.3 Handle archived envelope display

### Verification

- [ ] Envelope balances show budgeted/spent/remaining
- [ ] Overspent envelopes display with badge
- [ ] Progress bars show correct percentages
- [ ] Archived envelopes show in transaction history

---

## Phase 8 - Settings & User Management

### Tasks

- [ ] 8.1 Create admin settings routes with tabs
- [ ] 8.2 Build user management with email invitations
- [ ] 8.3 Implement export/import system
- [ ] 8.4 Create danger zone actions
- [ ] 8.5 Build member settings page

### Verification

- [ ] Admin can invite users (email sent)
- [ ] Force password reset sends email
- [ ] Export creates valid JSON
- [ ] Import regenerates IDs correctly
- [ ] Danger zone actions require confirmation
- [ ] Member can change password

---

## Phase 9 - Polish & Testing

### Tasks

- [ ] 9.1 Audit error handling across all forms
- [ ] 9.2 Audit loading states (skeletons, spinners)
- [ ] 9.3 Implement optimistic updates
- [ ] 9.4 Mobile optimization (touch targets, responsive)
- [ ] 9.5 Run full testing checklist
- [ ] 9.6 Complete documentation (README, AGENTS.md)

### Verification

- [ ] All admin workflows tested
- [ ] All member workflows tested
- [ ] All edge cases tested
- [ ] Mobile experience is smooth
- [ ] Documentation is complete
- [ ] Ready to deploy

---

## Deployment Checklist

- [ ] Turso database created
- [ ] Environment variables set in Vercel
- [ ] Resend account setup and domain verified
- [ ] GitHub repo connected to Vercel
- [ ] Initial deployment successful
- [ ] Database migrations run on production
- [ ] Seed data created (or admin signup completed)
- [ ] Email invitations working
- [ ] Password reset flow working
- [ ] Member can add transactions
- [ ] Admin can approve transactions

---

## Notes

- **Success Metric 1:** Wife can add transaction in <30 seconds
- **Success Metric 2:** Admin can approve 10 transactions in <2 minutes
- **Success Metric 3:** Account balances match bank statements
- **Core Philosophy:** STUPID SIMPLE for member experience

---

## Quick Reference

**Spec:** `../ssd_scope.md`
**Plan:** `PLAN.md`
**Deployment:** Vercel Pro + Turso Free Tier
**Cost:** $0/month
