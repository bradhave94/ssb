import { Outlet } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MemberLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md" />
            <span className="font-semibold text-lg">SSB</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30">
        <Outlet />
      </main>

      {/* FAB - Add Expense Button (Mobile Primary Action) */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8">
        <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t py-4 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Super Simple Budget
        </div>
      </footer>
    </div>
  )
}
