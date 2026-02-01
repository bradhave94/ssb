import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { asc, eq } from 'drizzle-orm'
import { Edit, Plus, Trash2 } from 'lucide-react'
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
  const queryClient = useQueryClient()
  const [showGroupDialog, setShowGroupDialog] = useState(false)
  const [showEnvelopeDialog, setShowEnvelopeDialog] = useState(false)
  const [editingEnvelope, setEditingEnvelope] = useState<{
    id: string
    name: string
    budgetAmountCents: number
  } | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [envelopeName, setEnvelopeName] = useState('')
  const [envelopeAmount, setEnvelopeAmount] = useState('')

  // Fetch active template
  const { data, isLoading, error } = useQuery({
    queryKey: ['budget-template'],
    queryFn: async () => {
      const response = await fetch('/budget')
      if (!response.ok) throw new Error('Failed to load budget')
      const json = (await response.json()) as { template: unknown }
      return json.template
    },
  })

  // Mutations
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { budgetTemplateId: string; name: string }) => {
      const response = await fetch('/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createGroup', data: groupData }),
      })
      if (!response.ok) throw new Error('Failed to create group')
      return response.json() as Promise<{ group: unknown }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-template'] })
      toast.success('Envelope group created')
      setGroupName('')
      setShowGroupDialog(false)
    },
    onError: () => {
      toast.error('Failed to create group')
    },
  })

  const createEnvelopeMutation = useMutation({
    mutationFn: async (envelopeData: { groupId: string; name: string; budgetAmountCents: number }) => {
      const response = await fetch('/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createEnvelope', data: envelopeData }),
      })
      if (!response.ok) throw new Error('Failed to create envelope')
      return response.json() as Promise<{ envelope: unknown }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-template'] })
      toast.success('Envelope created')
      setEnvelopeName('')
      setEnvelopeAmount('')
      setEditingEnvelope(null)
      setShowEnvelopeDialog(false)
      setSelectedGroup(null)
    },
    onError: () => {
      toast.error('Failed to create envelope')
    },
  })

  const updateEnvelopeMutation = useMutation({
    mutationFn: async (updateData: { id: string; name?: string; budgetAmountCents?: number }) => {
      const response = await fetch('/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateEnvelope', data: updateData }),
      })
      if (!response.ok) throw new Error('Failed to update envelope')
      return response.json() as Promise<{ success: boolean }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-template'] })
      toast.success('Envelope updated')
      setEnvelopeName('')
      setEnvelopeAmount('')
      setEditingEnvelope(null)
      setShowEnvelopeDialog(false)
    },
    onError: () => {
      toast.error('Failed to update envelope')
    },
  })

  const archiveEnvelopeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archiveEnvelope', data: { id } }),
      })
      if (!response.ok) throw new Error('Failed to archive envelope')
      return response.json() as Promise<{ success: boolean }>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budget-template'] })
      toast.success('Envelope archived')
    },
    onError: () => {
      toast.error('Failed to archive envelope')
    },
  })

  const handleCreateGroup = () => {
    if (!data || !groupName.trim()) return
    createGroupMutation.mutate({
      budgetTemplateId: (data as { id: string }).id,
      name: groupName,
    })
  }

  const handleSaveEnvelope = () => {
    if (!envelopeName.trim()) return
    const amountCents = Math.round(parseFloat(envelopeAmount || '0') * 100)

    if (editingEnvelope) {
      updateEnvelopeMutation.mutate({
        id: editingEnvelope.id,
        name: envelopeName,
        budgetAmountCents: amountCents,
      })
    } else {
      if (!selectedGroup) return
      createEnvelopeMutation.mutate({
        groupId: selectedGroup,
        name: envelopeName,
        budgetAmountCents: amountCents,
      })
    }
  }

  const handleEditEnvelope = (envelope: { id: string; name: string; budgetAmountCents: number }) => {
    setEditingEnvelope(envelope)
    setEnvelopeName(envelope.name)
    setEnvelopeAmount((envelope.budgetAmountCents / 100).toFixed(2))
    setShowEnvelopeDialog(true)
  }

  const handleArchiveEnvelope = (id: string) => {
    if (confirm('Are you sure you want to archive this envelope?')) {
      archiveEnvelopeMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading budget...</div>
          <div className="text-sm text-muted-foreground">Please wait</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-4 text-red-800">
          <h2 className="font-semibold">Error loading budget</h2>
          <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
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

  // Calculate totals
  const totalBudget = template.envelopeGroups.reduce(
    (sum, group) => sum + group.envelopes.reduce((gSum, env) => gSum + env.budgetAmountCents, 0),
    0,
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Budget: {template.name}</h1>
            <p className="text-muted-foreground">Manage envelope groups and budget allocations</p>
          </div>
          <Button onClick={() => setShowGroupDialog(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Add Group
          </Button>
        </div>

        {/* Total Budget Summary */}
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total Monthly Budget</div>
              <div className="text-3xl font-bold text-primary">{formatMoney(totalBudget)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Envelope Groups</div>
              <div className="text-2xl font-semibold">{template.envelopeGroups.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Envelope Groups */}
      <div className="space-y-4">
        {template.envelopeGroups.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No envelope groups yet. Create one to get started!</p>
            <Button onClick={() => setShowGroupDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Group
            </Button>
          </Card>
        ) : (
          template.envelopeGroups.map((group) => {
            const groupTotal = group.envelopes.reduce((sum, env) => sum + env.budgetAmountCents, 0)

            return (
              <Card key={group.id} className="p-6">
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-xl font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.envelopes.length} envelope{group.envelopes.length !== 1 ? 's' : ''} • {formatMoney(groupTotal)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedGroup(group.id)
                      setEditingEnvelope(null)
                      setEnvelopeName('')
                      setEnvelopeAmount('')
                      setShowEnvelopeDialog(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Envelope
                  </Button>
                </div>

                {group.envelopes.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground py-4">No envelopes in this group yet</p>
                ) : (
                  <div className="space-y-2">
                    {group.envelopes.map((envelope) => (
                      <div
                        key={envelope.id}
                        className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{envelope.name}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-lg">{formatMoney(envelope.budgetAmountCents)}</div>
                            <div className="text-xs text-muted-foreground">per month</div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditEnvelope(envelope)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleArchiveEnvelope(envelope.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={setShowGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Envelope Group</DialogTitle>
            <DialogDescription>Add a new group to organize your budget envelopes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Monthly Bills, Savings Goals"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup()
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim() || createGroupMutation.isPending}>
              {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Envelope Dialog */}
      <Dialog
        open={showEnvelopeDialog}
        onOpenChange={(open) => {
          setShowEnvelopeDialog(open)
          if (!open) {
            setEditingEnvelope(null)
            setEnvelopeName('')
            setEnvelopeAmount('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEnvelope ? 'Edit Envelope' : 'Create Envelope'}</DialogTitle>
            <DialogDescription>
              {editingEnvelope
                ? 'Update the envelope name and monthly budget allocation.'
                : 'Add a new budget envelope with a monthly allocation.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="envelope-name">Envelope Name</Label>
              <Input
                id="envelope-name"
                value={envelopeName}
                onChange={(e) => setEnvelopeName(e.target.value)}
                placeholder="e.g., Groceries, Rent, Gas"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="envelope-amount">Monthly Budget ($)</Label>
              <Input
                id="envelope-amount"
                type="number"
                step="0.01"
                min="0"
                value={envelopeAmount}
                onChange={(e) => setEnvelopeAmount(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEnvelope()
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEnvelopeDialog(false)
                setEditingEnvelope(null)
                setEnvelopeName('')
                setEnvelopeAmount('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEnvelope}
              disabled={
                !envelopeName.trim() ||
                !envelopeAmount ||
                createEnvelopeMutation.isPending ||
                updateEnvelopeMutation.isPending
              }
            >
              {createEnvelopeMutation.isPending || updateEnvelopeMutation.isPending
                ? 'Saving...'
                : editingEnvelope
                  ? 'Update Envelope'
                  : 'Create Envelope'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
