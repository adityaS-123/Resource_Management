'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Navigation from '@/components/navigation'
import { CheckCircle, Clock, Server, FileText, Plus, X } from 'lucide-react'

interface ResourceRequest {
  id: string
  resourceTemplateId?: string
  resourceType?: string
  requestedConfig: string
  requestedQty: number
  justification: string | null
  status: 'ASSIGNED_TO_IT'
  createdAt: string
  assignedAt: string
  user: {
    id: string
    name: string
    email: string
  }
  phase: {
    id: string
    name: string
    project: {
      id: string
      name: string
      client: string
    }
  }
  resourceTemplate?: {
    id: string
    name: string
    description?: string
  }
  approvals: Array<{
    id: string
    approvalLevel: number
    status: 'APPROVED'
    approver: {
      id: string
      name: string
      email: string
    }
    approvedAt: string
    comments?: string
  }>
}

interface CompletionForm {
  completionNotes: string
  credentials: Array<{
    label: string
    value: string
    type: 'text' | 'password' | 'url' | 'email'
  }>
}

export default function MyAssignedTasksPage() {
  const [tasks, setTasks] = useState<ResourceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<ResourceRequest | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionForm, setCompletionForm] = useState<CompletionForm>({
    completionNotes: '',
    credentials: []
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAssignedTasks()
  }, [])

  const fetchAssignedTasks = async () => {
    try {
      const response = await fetch('/api/my-assigned-tasks')
      
      if (response.ok) {
        const data = await response.json()
        setTasks(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch assigned tasks')
        setTasks([])
      }
    } catch (error) {
      console.error('Error fetching assigned tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const parseRequestedConfig = (configString: string) => {
    try {
      return JSON.parse(configString)
    } catch (error) {
      console.error('Error parsing requested config:', error)
      return {}
    }
  }

  const formatSpecs = (configString: string) => {
    const config = parseRequestedConfig(configString)
    const specs: string[] = []
    
    Object.entries(config).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        let formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        
        const keyMappings: Record<string, string> = {
          'cpu': 'CPU',
          'ram': 'RAM',
          'disk': 'Disk',
          'storage': 'Storage',
          'cpuCores': 'CPU Cores',
          'ramSize': 'RAM',
          'diskSize': 'Disk Size',
          'storageSize': 'Storage',
          'vCpus': 'vCPUs',
          'memory': 'Memory'
        }
        
        if (keyMappings[key.toLowerCase()]) {
          formattedKey = keyMappings[key.toLowerCase()]
        }
        
        let formattedValue = value
        if ((key.toLowerCase().includes('ram') || key.toLowerCase().includes('memory') || key.toLowerCase().includes('disk') || key.toLowerCase().includes('storage') || key.toLowerCase().includes('size')) && typeof value === 'number') {
          if (!value.toString().includes('GB') && !value.toString().includes('MB') && !value.toString().includes('TB')) {
            formattedValue = `${value}GB`
          }
        }
        
        if (typeof value === 'boolean') {
          formattedValue = value ? 'Yes' : 'No'
        }
        
        specs.push(`${formattedKey}: ${formattedValue}`)
      }
    })
    
    return specs
  }

  const getResourceType = (task: ResourceRequest) => {
    if (task.resourceTemplate) {
      return task.resourceTemplate.name
    } else if (task.resourceType) {
      return task.resourceType
    }
    return 'Unknown Resource'
  }

  const handleCompleteTask = (task: ResourceRequest) => {
    setSelectedTask(task)
    setCompletionForm({
      completionNotes: '',
      credentials: [
        { label: 'Server IP/URL', value: '', type: 'text' },
        { label: 'Username', value: '', type: 'text' },
        { label: 'Password', value: '', type: 'password' }
      ]
    })
    setShowCompletionModal(true)
  }

  const addCredentialField = () => {
    setCompletionForm(prev => ({
      ...prev,
      credentials: [
        ...prev.credentials,
        { label: '', value: '', type: 'text' }
      ]
    }))
  }

  const updateCredentialField = (index: number, field: keyof CompletionForm['credentials'][0], value: string) => {
    setCompletionForm(prev => ({
      ...prev,
      credentials: prev.credentials.map((cred, i) => 
        i === index ? { ...cred, [field]: value } : cred
      )
    }))
  }

  const removeCredentialField = (index: number) => {
    setCompletionForm(prev => ({
      ...prev,
      credentials: prev.credentials.filter((_, i) => i !== index)
    }))
  }

  const submitCompletion = async () => {
    if (!selectedTask) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/my-assigned-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedTask.id,
          completionNotes: completionForm.completionNotes,
          credentials: completionForm.credentials.filter(cred => cred.label && cred.value)
        })
      })

      if (response.ok) {
        await fetchAssignedTasks()
        setShowCompletionModal(false)
        setSelectedTask(null)
        setCompletionForm({
          completionNotes: '',
          credentials: []
        })
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Failed to complete task')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Server className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  My Assigned Tasks
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Tasks assigned to you by IT support
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-4 py-2 text-sm bg-blue-50 border-blue-200 text-blue-700">
                <Clock className="h-4 w-4 mr-2" />
                {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
              </Badge>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6 border-b border-border/50">
              <CardTitle className="text-2xl font-semibold flex items-center justify-between">
                <span>Pending Tasks</span>
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {tasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-muted/30 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No assigned tasks</h3>
                  <p className="text-muted-foreground">
                    You don&apos;t have any tasks assigned yet. Check back later!
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableHead className="font-semibold text-foreground">Requester</TableHead>
                        <TableHead className="font-semibold text-foreground">Project</TableHead>
                        <TableHead className="font-semibold text-foreground">Resource</TableHead>
                        <TableHead className="font-semibold text-foreground">Specifications</TableHead>
                        <TableHead className="font-semibold text-foreground">Assigned On</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task, index) => (
                        <TableRow key={task.id} className={`hover:bg-muted/20 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="text-sm font-semibold text-primary">
                                  {task.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{task.user.name}</div>
                                <div className="text-sm text-muted-foreground">{task.user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div>
                              <div className="font-semibold text-foreground">{task.phase.project.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span>•</span>
                                {task.phase.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                              <Server className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-blue-900">{getResourceType(task)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm space-y-1">
                              {formatSpecs(task.requestedConfig).map((spec, index) => (
                                <div key={index} className="text-muted-foreground">{spec}</div>
                              ))}
                              <div className="font-semibold text-foreground pt-1">Qty: {task.requestedQty}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm">
                              {new Date(task.assignedAt).toLocaleDateString()} at{' '}
                              {new Date(task.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Button
                              size="sm"
                              onClick={() => handleCompleteTask(task)}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Complete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Modal */}
          <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  Complete Task
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Provide completion details for this resource deployment
                </DialogDescription>
              </DialogHeader>

              {selectedTask && (
                <div className="space-y-8">
                  {/* Task Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Task Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Requester:</span>
                          <span className="font-semibold text-foreground">{selectedTask.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Email:</span>
                          <span className="text-muted-foreground">{selectedTask.user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Project:</span>
                          <span className="font-semibold text-foreground">{selectedTask.phase.project.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Resource:</span>
                          <span className="text-muted-foreground">{getResourceType(selectedTask)} (Qty: {selectedTask.requestedQty})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Completion Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="completionNotes" className="text-base font-semibold">
                      Completion Notes *
                    </Label>
                    <Textarea
                      id="completionNotes"
                      value={completionForm.completionNotes}
                      onChange={(e) => setCompletionForm(prev => ({
                        ...prev,
                        completionNotes: e.target.value
                      }))}
                      placeholder="Describe what was deployed, any configuration details, and important information..."
                      rows={4}
                      className="text-base resize-none border-2 focus:border-primary/50"
                      required
                    />
                  </div>

                  {/* Credentials Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Access Credentials & Information</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCredentialField}
                        className="hover:bg-primary/10 border-primary/20"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {completionForm.credentials.map((credential, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-muted/30 rounded-xl border border-border/50">
                          <div className="col-span-3">
                            <Label className="text-xs">Label</Label>
                            <Input
                              value={credential.label}
                              onChange={(e) => updateCredentialField(index, 'label', e.target.value)}
                              placeholder="e.g., Server IP"
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Type</Label>
                            <select
                              value={credential.type}
                              onChange={(e) => updateCredentialField(index, 'type', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm"
                            >
                              <option value="text">Text</option>
                              <option value="password">Password</option>
                              <option value="url">URL</option>
                              <option value="email">Email</option>
                            </select>
                          </div>
                          <div className="col-span-6">
                            <Label className="text-xs">Value</Label>
                            <Input
                              type={credential.type === 'password' ? 'password' : 'text'}
                              value={credential.value}
                              onChange={(e) => updateCredentialField(index, 'value', e.target.value)}
                              placeholder="Enter the credential value"
                              className="h-8"
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCredentialField(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCompletionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitCompletion}
                  disabled={submitting || !completionForm.completionNotes.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
