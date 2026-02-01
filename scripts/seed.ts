import { v4 as uuidv4 } from 'uuid'
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import {
  accounts,
  budgetTemplates,
  envelopeGroups,
  envelopes,
  incomeCategories,
  userRoles,
  users,
} from '../src/db/schema'

async function seed() {
  console.log('🌱 Seeding database...')

  // Check if already seeded
  const existingSystemUser = await db.query.users.findFirst({
    where: eq(users.email, 'system@ssb.local'),
  })

  if (existingSystemUser) {
    console.log('⚠️  Database already seeded (system user exists). Skipping...')
    return
  }

  // =============================================================================
  // System User (for recurring transaction generation)
  // =============================================================================

  const systemUserId = uuidv4()
  console.log(`Creating system user with ID: ${systemUserId}`)

  await db.insert(users).values({
    id: systemUserId,
    name: 'System',
    email: 'system@ssb.local',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(userRoles).values({
    id: uuidv4(),
    userId: systemUserId,
    role: 'admin',
    createdAt: new Date(),
  })

  // =============================================================================
  // Admin User (bradley@haveman.ca)
  // =============================================================================

  const adminUserId = uuidv4()
  console.log(`Creating admin user: bradley@haveman.ca`)

  await db.insert(users).values({
    id: adminUserId,
    name: 'Bradley Haveman',
    email: 'bradley@haveman.ca',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  await db.insert(userRoles).values({
    id: uuidv4(),
    userId: adminUserId,
    role: 'admin',
    createdAt: new Date(),
  })

  // =============================================================================
  // Member User (jenna@haveman.ca)
  // =============================================================================

  const memberUserId = uuidv4()
  console.log(`Creating member user: jenna@haveman.ca`)

  await db.insert(users).values({
    id: memberUserId,
    name: 'Jenna Haveman',
    email: 'jenna@haveman.ca',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // =============================================================================
  // Accounts
  // =============================================================================

  const checkingAccountId = uuidv4()
  const creditCardAccountId = uuidv4()
  const savingsAccountId = uuidv4()

  console.log('Creating sample accounts...')

  await db.insert(accounts).values([
    {
      id: checkingAccountId,
      name: 'Checking',
      type: 'checking',
      initialBalanceCents: 500000, // $5,000
      currentBalanceCents: 500000,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: creditCardAccountId,
      name: 'Credit Card',
      type: 'credit',
      initialBalanceCents: 0,
      currentBalanceCents: 0,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: savingsAccountId,
      name: 'Savings',
      type: 'savings',
      initialBalanceCents: 1000000, // $10,000
      currentBalanceCents: 1000000,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  // Set member's default account to checking
  await db.insert(userRoles).values({
    id: uuidv4(),
    userId: memberUserId,
    role: 'member',
    defaultAccountId: checkingAccountId,
    createdAt: new Date(),
  })

  // =============================================================================
  // Budget Template with Envelope Groups
  // =============================================================================

  const budgetTemplateId = uuidv4()
  console.log('Creating budget template...')

  await db.insert(budgetTemplates).values({
    id: budgetTemplateId,
    name: 'Budget 2026',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  // Envelope Groups
  const billsGroupId = uuidv4()
  const discretionaryGroupId = uuidv4()
  const savingsGoalsGroupId = uuidv4()

  await db.insert(envelopeGroups).values([
    {
      id: billsGroupId,
      budgetTemplateId,
      name: 'Bills',
      sortOrder: 1,
      createdAt: new Date(),
    },
    {
      id: discretionaryGroupId,
      budgetTemplateId,
      name: 'Discretionary',
      sortOrder: 2,
      createdAt: new Date(),
    },
    {
      id: savingsGoalsGroupId,
      budgetTemplateId,
      name: 'Savings Goals',
      sortOrder: 3,
      createdAt: new Date(),
    },
  ])

  // Envelopes
  console.log('Creating envelopes...')

  await db.insert(envelopes).values([
    // Bills
    {
      id: uuidv4(),
      groupId: billsGroupId,
      name: 'Mortgage/Rent',
      budgetAmountCents: 200000, // $2,000
      sortOrder: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      groupId: billsGroupId,
      name: 'Utilities',
      budgetAmountCents: 20000, // $200
      sortOrder: 2,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      groupId: billsGroupId,
      name: 'Internet',
      budgetAmountCents: 8000, // $80
      sortOrder: 3,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Discretionary
    {
      id: uuidv4(),
      groupId: discretionaryGroupId,
      name: 'Groceries',
      budgetAmountCents: 80000, // $800
      sortOrder: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      groupId: discretionaryGroupId,
      name: 'Dining Out',
      budgetAmountCents: 20000, // $200
      sortOrder: 2,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      groupId: discretionaryGroupId,
      name: 'Entertainment',
      budgetAmountCents: 15000, // $150
      sortOrder: 3,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    // Savings Goals
    {
      id: uuidv4(),
      groupId: savingsGoalsGroupId,
      name: 'Emergency Fund',
      budgetAmountCents: 50000, // $500
      sortOrder: 1,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: uuidv4(),
      groupId: savingsGoalsGroupId,
      name: 'Vacation',
      budgetAmountCents: 30000, // $300
      sortOrder: 2,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ])

  // Income Categories
  console.log('Creating income categories...')

  await db.insert(incomeCategories).values([
    {
      id: uuidv4(),
      budgetTemplateId,
      name: 'Salary - Main',
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      budgetTemplateId,
      name: 'Freelance',
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      budgetTemplateId,
      name: 'Side Business',
      createdAt: new Date(),
    },
  ])

  console.log('✅ Seeding complete!')
  console.log('')
  console.log('Test users:')
  console.log('  Admin: bradley@haveman.ca (no password set - use email verification)')
  console.log('  Member: jenna@haveman.ca (no password set - use email verification)')
  console.log('  System user ID:', systemUserId)
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
