import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Super Simple Budget</h1>
      <p className="mt-4 text-muted-foreground">Welcome to your budget tracker</p>
    </div>
  )
}
