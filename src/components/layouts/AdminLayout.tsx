import { Link, Outlet } from '@tanstack/react-router'
import {
  ClipboardCheck,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md" />
            <span className="font-semibold text-lg">Super Simple Budget</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin</span>
            <Button variant="ghost" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary"
              activeProps={{
                className:
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary',
              }}
            >
              <ClipboardCheck className="w-4 h-4" />
              Pending
            </Link>
            <Link
              to="/envelopes"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary"
              activeProps={{
                className:
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary',
              }}
            >
              <FolderOpen className="w-4 h-4" />
              Envelopes
            </Link>
            <Link
              to="/accounts"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary"
              activeProps={{
                className:
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary',
              }}
            >
              <Wallet className="w-4 h-4" />
              Accounts
            </Link>
            <Link
              to="/budget"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary"
              activeProps={{
                className:
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary',
              }}
            >
              <LayoutDashboard className="w-4 h-4" />
              Budget
            </Link>
            <Link
              to="/settings"
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent hover:border-primary"
              activeProps={{
                className:
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary',
              }}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Super Simple Budget © 2026
        </div>
      </footer>
    </div>
  )
}
