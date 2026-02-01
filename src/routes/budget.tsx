import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { asc, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { db } from '@/db'
import { budgetTemplates, envelopeGroups, envelopes } from '@/db/schema'
import { requireAdmin } from '@/lib/auth-helpers'
import { formatMoney } from '@/lib/format-money'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export const Route = createFileRoute('/budget')({
  component: BudgetPage,
  server: {
    handlers: {
      // Get active budget template
      GET: async ({ request }) => {
        await requireAdmin(request)

        const template = await db.query.budgetTemplates.findFirst({
          where: eq(budgetTemplates.isActive, true),
          with: {
            envelopeGroups: {
              with: {
                envelopes: {
                  where: eq(envelopes.isArchived, false),
                  orderBy: [asc(envelopes.sortOrder)],
                },
              },
              orderBy: [asc(envelopeGroups.sortOrder)],
            },
          },
        })

        return Response.json({ template })
      },

      // Create/update/delete operations
      POST: async ({ request }) => {
        await requireAdmin(request)

        const body = (await request.json()) as { action: string; data: unknown }

        switch (body.action) {
          case 'createTemplate': {
            const schema = z.object({
              name: z.string().min(1).max(100),
              isActive: z.boolean().default(false),
            })
            const validated = schema.parse(body.data)

            // Deactivate other templates if setting as active
            if (validated.isActive) {
              await db
                .update(budgetTemplates)
                .set({ isActive: false })
                .where(eq(budgetTemplates.isActive, true))
            }

            const now = new Date()
            const [template] = await db
              .insert(budgetTemplates)
              .values({
                id: uuidv4(),
                name: validated.name,
                isActive: validated.isActive,
                createdAt: now,
                updatedAt: now,
              })
              .returning()

            return Response.json({ template })
          }

          case 'createGroup': {
            const schema = z.object({
              budgetTemplateId: z.string().uuid(),
              name: z.string().min(1).max(100),
            })
            const validated = schema.parse(body.data)

            // Get max sort order
            const groups = await db.query.envelopeGroups.findMany({
              where: eq(envelopeGroups.budgetTemplateId, validated.budgetTemplateId),
            })
            const maxSort = Math.max(0, ...groups.map((g) => g.sortOrder))

            const now = new Date()
            const [group] = await db
              .insert(envelopeGroups)
              .values({
                id: uuidv4(),
                budgetTemplateId: validated.budgetTemplateId,
                name: validated.name,
                sortOrder: maxSort + 1,
                createdAt: now,
              })
              .returning()

            return Response.json({ group })
          }

          case 'createEnvelope': {
            const schema = z.object({
              groupId: z.string().uuid(),
              name: z.string().min(1).max(100),
              budgetAmountCents: z.number().int().nonnegative(),
            })
            const validated = schema.parse(body.data)

            // Get max sort order
            const envs = await db.query.envelopes.findMany({
              where: eq(envelopes.groupId, validated.groupId),
            })
            const maxSort = Math.max(0, ...envs.map((e) => e.sortOrder))

            const now = new Date()
            const [envelope] = await db
              .insert(envelopes)
              .values({
                id: uuidv4(),
                groupId: validated.groupId,
                name: validated.name,
                budgetAmountCents: validated.budgetAmountCents,
                sortOrder: maxSort + 1,
                createdAt: now,
                updatedAt: now,
              })
              .returning()

            return Response.json({ envelope })
          }

          case 'updateEnvelope': {
            const schema = z.object({
              id: z.string().uuid(),
              name: z.string().min(1).max(100).optional(),
              budgetAmountCents: z.number().int().nonnegative().optional(),
            })
            const validated = schema.parse(body.data)
            const { id, ...updates } = validated

            const now = new Date()
            await db.update(envelopes).set({ ...updates, updatedAt: now }).where(eq(envelopes.id, id)).returning()

            return Response.json({ success: true })
          }

          case 'archiveEnvelope': {
            const schema = z.object({ id: z.string().uuid() })
            const { id } = schema.parse(body.data)

            const now = new Date()
            await db.update(envelopes).set({ isArchived: true, updatedAt: now }).where(eq(envelopes.id, id)).returning()

            return Response.json({ success: true })
          }

          default:
            return Response.json({ error: 'Unknown action' }, { status: 400 })
        }
      },
    },
  },
})

function BudgetPage() {
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showEnvelopeDialog, setShowEnvelopeDialog] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [envelopeName, setEnvelopeName] = useState('')
  const [envelopeAmount, setEnvelopeAmount] = useState('')

  // Fetch active template
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['budget-template'],
    queryFn: async () => {
      const response = await fetch('/budget')
      const json = (await response.json()) as { template: unknown }
      return json.template
    },
  })

  const handleCreateGroup = async () => {
    if (!data || !groupName.trim()) return

    await fetch('/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createGroup',
        data: {
          budgetTemplateId: (data as { id: string }).id,
          name: groupName,
        },
      }),
    })

    setGroupName('')
    setShowGroupDialog(false)
    void refetch()
  }

  const handleCreateEnvelope = async () => {
    if (!selectedGroup || !envelopeName.trim()) return

    const amountCents = Math.round(parseFloat(envelopeAmount || '0') * 100)

    await fetch('/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createEnvelope',
        data: {
          groupId: selectedGroup,
          name: envelopeName,
          budgetAmountCents: amountCents,
        },
      }),
    })

    setEnvelopeName('')
    setEnvelopeAmount('')
    setShowEnvelopeDialog(false)
    setSelectedGroup(null)
    void refetch()
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (!data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold">Budget Management</h1>
        <p className="mt-4 text-muted-foreground">No active budget template. Create one to get started.</p>
      </div>
    )
  }

  const template = data as {
    id: string
    name: string
    envelopeGroups: Array<{
      id: string
      name: string
      envelopes: Array<{
        id: string
        name: string
        budgetAmountCents: number
      }>
    }>
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budget: {template.name}</h1>
          <p className="text-muted-foreground">Manage envelope groups and budget allocations</p>
        </div>
        <Button onClick={() => setShowGroupDialog(true)}>Add Envelope Group</Button>
      </div>

      <div className="space-y-4">
        {template.envelopeGroups.map((group) => (
          <Card key={group.id} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{group.name}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedGroup(group.id)
                  setShowEnvelopeDialog(true)
                }}
              >
                Add Envelope
              </Button>
            </div>

            {group.envelopes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No envelopes yet</p>
            ) : (
              <div className="space-y-2">
                {group.envelopes.map((envelope) => (
                  <div key={envelope.id} className="flex items-center justify-between rounded border p-2">
                    <span className="font-medium">{envelope.name}</span>
                    <span className="text-sm text-muted-foreground">{formatMoney(envelope.budgetAmountCents)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Envelope Group</DialogTitle>
            <DialogDescription>Add a new group to organize your budget envelopes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Monthly Bills, Savings Goals"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Envelope Dialog */}
      <Dialog open={showEnvelopeDialog} onOpenChange={setShowEnvelopeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Envelope</DialogTitle>
            <DialogDescription>Add a new budget envelope with a monthly allocation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="envelope-name">Envelope Name</Label>
              <Input
                id="envelope-name"
                value={envelopeName}
                onChange={(e) => setEnvelopeName(e.target.value)}
                placeholder="e.g., Groceries, Rent, Gas"
              />
            </div>
            <div>
              <Label htmlFor="envelope-amount">Monthly Budget</Label>
              <Input
                id="envelope-amount"
                type="number"
                step="0.01"
                value={envelopeAmount}
                onChange={(e) => setEnvelopeAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnvelopeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEnvelope}>Create Envelope</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
