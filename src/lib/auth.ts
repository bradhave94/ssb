import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Resend } from 'resend'
import { db } from '@/db'
import * as schema from '@/db/schema'

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.authAccount,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@example.com',
        to: user.email,
        subject: 'Verify your email',
        html: `<a href="${url}">Verify email</a>`,
      })
    },
    sendOnSignUp: true,
  },
  resetPassword: {
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@example.com',
        to: user.email,
        subject: 'Reset your password',
        html: `<a href="${url}">Reset password</a>`,
      })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 365, // 1 year
    updateAge: 60 * 60 * 24 * 30, // refresh every 30 days
  },
  plugins: [tanstackStartCookies()],
})
