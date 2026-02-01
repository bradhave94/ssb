import { eq } from 'drizzle-orm'
import { hash } from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../src/db'
import { authAccount, users } from '../src/db/schema'

async function setDevPasswords() {
  console.log('🔐 Setting development passwords...')

  const adminUser = await db.query.users.findFirst({
    where: eq(users.email, 'bradley@haveman.ca'),
  })

  const memberUser = await db.query.users.findFirst({
    where: eq(users.email, 'jenna@haveman.ca'),
  })

  if (!adminUser || !memberUser) {
    console.error('❌ Users not found. Run seed script first.')
    return
  }

  // Hash password using bcrypt (Better Auth's default, 10 rounds)
  const hashedPassword = await hash('password123', 10)

  // Clear existing accounts
  await db.delete(authAccount).where(eq(authAccount.userId, adminUser.id))
  await db.delete(authAccount).where(eq(authAccount.userId, memberUser.id))

  // Insert new accounts with proper password hash
  await db.insert(authAccount).values({
    id: uuidv4(),
    accountId: adminUser.id, // accountId should match userId for credential provider
    providerId: 'credential',
    userId: adminUser.id,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  console.log('✅ Set password for bradley@haveman.ca')

  await db.insert(authAccount).values({
    id: uuidv4(),
    accountId: memberUser.id, // accountId should match userId for credential provider
    providerId: 'credential',
    userId: memberUser.id,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  console.log('✅ Set password for jenna@haveman.ca')

  console.log('')
  console.log('🎉 Development passwords set!')
  console.log('')
  console.log('You can now login with:')
  console.log('  Admin: bradley@haveman.ca / password123')
  console.log('  Member: jenna@haveman.ca / password123')
}

setDevPasswords()
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
