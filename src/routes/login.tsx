import { createFileRoute, redirect } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8 bg-background rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-md mb-4" />
          <h1 className="text-2xl font-bold">Super Simple Budget</h1>
          <p className="text-muted-foreground text-sm">Sign in to your account</p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <a href="/forgot-password" className="hover:underline">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  )
}
