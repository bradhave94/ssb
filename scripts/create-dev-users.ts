import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { auth } from '../src/lib/auth'
import { db } from '../src/db'
import { authAccount, userRoles, users } from '../src/db/schema'

async function createDevUsers() {
  console.log('👤 Creating development users...')

  const authContext = await auth.$context

  // Admin user
  const adminEmail = 'bradley@haveman.ca'
  const adminPassword = 'password123' // nanoid(16) for production
  const adminHashedPassword = await authContext.password.hash(adminPassword)

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  })

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping...')
  } else {
    const adminUserId = uuidv4()

    await db.insert(users).values({
      id: adminUserId,
      name: 'Bradley Haveman',
      email: adminEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(authAccount).values({
      id: uuidv4(),
      accountId: adminUserId,
      providerId: 'credential',
      userId: adminUserId,
      password: adminHashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(userRoles).values({
      id: uuidv4(),
      userId: adminUserId,
      role: 'admin',
      createdAt: new Date(),
    })

    console.log('✅ Created admin user')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
  }

  // Member user
  const memberEmail = 'jenna@haveman.ca'
  const memberPassword = 'password123' // nanoid(16) for production
  const memberHashedPassword = await authContext.password.hash(memberPassword)

  const existingMember = await db.query.users.findFirst({
    where: eq(users.email, memberEmail),
  })

  if (existingMember) {
    console.log('⚠️  Member user already exists, skipping...')
  } else {
    const memberUserId = uuidv4()

    // Get the first account (checking) for default
    const checkingAccount = await db.query.accounts.findFirst({
      where: (accts, { eq: eqOp }) => eqOp(accts.name, 'Checking'),
    })

    await db.insert(users).values({
      id: memberUserId,
      name: 'Jenna Haveman',
      email: memberEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(authAccount).values({
      id: uuidv4(),
      accountId: memberUserId,
      providerId: 'credential',
      userId: memberUserId,
      password: memberHashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await db.insert(userRoles).values({
      id: uuidv4(),
      userId: memberUserId,
      role: 'member',
      defaultAccountId: checkingAccount?.id,
      createdAt: new Date(),
    })

    console.log('✅ Created member user')
    console.log(`   Email: ${memberEmail}`)
    console.log(`   Password: ${memberPassword}`)
  }

  console.log('')
  console.log('🎉 Development users created!')
  console.log('')
  console.log('You can now login at http://localhost:3000/login')
}

createDevUsers()
  .catch((error) => {
    console.error('❌ Failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
