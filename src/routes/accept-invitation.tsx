import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/accept-invitation')({
  component: AcceptInvitationPage,
})

function AcceptInvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md p-8 bg-background rounded-lg shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-md mb-4" />
          <h1 className="text-2xl font-bold">Welcome!</h1>
          <p className="text-muted-foreground text-sm text-center">
            You've been invited to join Super Simple Budget
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="John Doe"
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

          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-md"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90"
          >
            Accept Invitation
          </button>
        </form>
      </div>
    </div>
  )
}
