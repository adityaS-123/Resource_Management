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
import { CheckCircle, Clock, Server, Database, Key, FileText, Plus, X } from 'lucide-react'

interface ResourceRequest {
  id: string
  resourceTemplateId?: string
  resourceType?: string
  requestedConfig: string
  requestedQty: number
  justification: string | null
  status: 'ASSIGNED_TO_IT' | 'COMPLETED'
  createdAt: string
  completedAt?: string
  completionNotes?: string
  credentials?: string
  assignedToUserId?: string
  assignedAt?: string
  user: {
    id: string
    name: string
    email: string
  }
  assignedToUser?: {
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

interface DepartmentMember {
  id: string
  name: string
  email: string
  userRole: string
}

export default function ITTasksPage() {
  const [requests, setRequests] = useState<ResourceRequest[]>([]) // Initialize as empty array
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'ASSIGNED_TO_IT' | 'COMPLETED'>('ALL')
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [completionForm, setCompletionForm] = useState<CompletionForm>({
    completionNotes: '',
    credentials: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [departmentMembers, setDepartmentMembers] = useState<DepartmentMember[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [loadingMembers, setLoadingMembers] = useState(false)

  useEffect(() => {
    fetchITTasks()
  }, [])

  const fetchITTasks = async () => {
    try {
      console.log('Fetching IT tasks...')
      const response = await fetch('/api/it-tasks')
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('IT tasks received:', data)
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setRequests(data)
      } else {
        console.error('Expected array but received:', typeof data, data)
        setRequests([])
      }
    } catch (error) {
      console.error('Error fetching IT tasks:', error)
      setRequests([]) // Set empty array on error
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

  const getResourceType = (request: ResourceRequest) => {
    if (request.resourceTemplate) {
      return request.resourceTemplate.name
    } else if (request.resourceType) {
      return request.resourceType
    }
    return 'Unknown Resource'
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      ASSIGNED_TO_IT: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800'
    }

    const labels = {
      ASSIGNED_TO_IT: 'Assigned to IT',
      COMPLETED: 'Completed'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const handleCompleteTask = (request: ResourceRequest) => {
    setSelectedRequest(request)
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

  const handleAssignToMember = (request: ResourceRequest) => {
    setSelectedRequest(request)
    setSelectedAssignee(null)
    setShowAssignModal(true)
    fetchOperationsMembers()
  }

  const fetchOperationsMembers = async () => {
    setLoadingMembers(true)
    try {
      const response = await fetch('/api/operations-members')
      console.log('Members API response status:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched members:', data)
        setDepartmentMembers(data.members || [])
      } else {
        try {
          const errorData = await response.json()
          console.error('Failed to fetch members - status:', response.status, 'error:', errorData)
        } catch {
          console.error('Failed to fetch members - status:', response.status, 'could not parse error body')
        }
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }

  const submitAssignment = async () => {
    if (!selectedRequest || !selectedAssignee) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/operations-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          assignedToUserId: selectedAssignee
        })
      })

      if (response.ok) {
        await fetchITTasks() // Refresh the list
        setShowAssignModal(false)
        setSelectedRequest(null)
        setSelectedAssignee(null)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to assign task')
      }
    } catch (error) {
      console.error('Error assigning task:', error)
      alert('Failed to assign task')
    } finally {
      setSubmitting(false)
    }
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
    if (!selectedRequest) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/it-tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          completionNotes: completionForm.completionNotes,
          credentials: JSON.stringify(completionForm.credentials.filter(cred => cred.label && cred.value))
        })
      })

      if (response.ok) {
        await fetchITTasks() // Refresh the list
        setShowCompletionModal(false)
        setSelectedRequest(null)
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

  const parseCredentials = (credentialsString?: string) => {
    if (!credentialsString) return []
    try {
      return JSON.parse(credentialsString)
    } catch {
      return []
    }
  }

  const filteredRequests = Array.isArray(requests) ? requests.filter(request => {
    if (filter === 'ALL') return true
    return request.status === filter
  }) : []

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
          {/* Enhanced Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Server className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  IT Tasks Dashboard
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Manage and complete approved resource requests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-4 py-2 text-sm bg-orange-50 border-orange-200 text-orange-700">
                <Clock className="h-4 w-4 mr-2" />
                {requests.filter(r => r.status === 'ASSIGNED_TO_IT').length} Pending
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm bg-green-50 border-green-200 text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                {requests.filter(r => r.status === 'COMPLETED').length} Completed
              </Badge>
            </div>
          </div>

          {/* Enhanced Filter Buttons */}
          <div className="flex space-x-3">
            {['ALL', 'ASSIGNED_TO_IT', 'COMPLETED'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status as any)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  filter === status 
                    ? 'shadow-lg bg-primary hover:bg-primary/90' 
                    : 'hover:bg-muted/50 hover:border-border hover:shadow-md'
                }`}
              >
                {status === 'ASSIGNED_TO_IT' && <Clock className="h-4 w-4 mr-2" />}
                {status === 'COMPLETED' && <CheckCircle className="h-4 w-4 mr-2" />}
                {status === 'ALL' ? 'All Tasks' : status.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6 border-b border-border/50">
              <CardTitle className="text-2xl font-semibold flex items-center justify-between">
                <span>
                  {filter === 'ALL' ? 'All IT Tasks' : filter.replace('_', ' ')}
                </span>
                <Badge variant="secondary" className="px-3 py-1 text-sm">
                  {filteredRequests.length} {filteredRequests.length === 1 ? 'task' : 'tasks'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">{filteredRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-full bg-muted/30 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Server className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No tasks found</h3>
                  <p className="text-muted-foreground">
                    {filter === 'ALL' ? 'No tasks are available at the moment.' :
                     filter === 'ASSIGNED_TO_IT' ? 'No pending tasks require your attention.' :
                     'No tasks have been completed yet.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/40">
                        <TableHead className="font-semibold text-foreground">User</TableHead>
                        <TableHead className="font-semibold text-foreground">Project</TableHead>
                        <TableHead className="font-semibold text-foreground">Resource</TableHead>
                        <TableHead className="font-semibold text-foreground">Specifications</TableHead>
                        <TableHead className="font-semibold text-foreground">Approval Chain</TableHead>
                        <TableHead className="font-semibold text-foreground">Assigned To</TableHead>
                        <TableHead className="font-semibold text-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-foreground">Date</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request, index) => (
                        <TableRow key={request.id} className={`hover:bg-muted/20 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                                <span className="text-sm font-semibold text-primary">
                                  {request.user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">{request.user.name}</div>
                                <div className="text-sm text-muted-foreground">{request.user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div>
                              <div className="font-semibold text-foreground">{request.phase.project.name}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <span>•</span>
                                {request.phase.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                              <Database className="h-5 w-5 text-blue-600" />
                              <span className="font-medium text-blue-900">{getResourceType(request)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm space-y-1">
                              {formatSpecs(request.requestedConfig).map((spec, index) => (
                                <div key={index} className="text-muted-foreground">{spec}</div>
                              ))}
                              <div className="font-semibold text-foreground pt-1">Qty: {request.requestedQty}</div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-2">
                              {request.approvals.map((approval) => (
                                <div key={approval.id} className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-50 border border-green-200">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-900">{approval.approver.name}</span>
                                  <Badge variant="secondary" className="text-xs">L{approval.approvalLevel}</Badge>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {request.assignedToUser ? (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 flex items-center justify-center border border-purple-200">
                                  <span className="text-xs font-semibold text-purple-700">
                                    {request.assignedToUser.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{request.assignedToUser.name}</div>
                                  <div className="text-xs text-muted-foreground">{request.assignedToUser.email}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm space-y-1">
                              <div className="font-medium text-foreground">Created: {new Date(request.createdAt).toLocaleDateString()}</div>
                              {request.completedAt && (
                                <div className="text-muted-foreground">Completed: {new Date(request.completedAt).toLocaleDateString()}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {request.status === 'ASSIGNED_TO_IT' ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAssignToMember(request)}
                                  variant="outline"
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Assign
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteTask(request)}
                                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <div>
                                  <div className="font-semibold text-green-900 text-sm">Completed</div>
                                  {request.completionNotes && (
                                    <div className="text-xs text-green-700 mt-1">{request.completionNotes.slice(0, 30)}...</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Completion Modal */}
          <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  Complete IT Task
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Provide completion details and access credentials for the user
                </DialogDescription>
              </DialogHeader>

              {selectedRequest && (
                <div className="space-y-8">
                  {/* Enhanced Task Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Task Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">User:</span>
                          <span className="font-semibold text-foreground">{selectedRequest.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Email:</span>
                          <span className="text-muted-foreground">{selectedRequest.user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Project:</span>
                          <span className="font-semibold text-foreground">{selectedRequest.phase.project.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Resource:</span>
                          <span className="text-muted-foreground">{getResourceType(selectedRequest)} (Qty: {selectedRequest.requestedQty})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Completion Notes */}
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
                      placeholder="Describe what was set up, configuration details, and any important information the user should know..."
                      rows={4}
                      className="text-base resize-none border-2 focus:border-primary/50"
                      required
                    />
                  </div>

                  {/* Enhanced Credentials Section */}
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
                    
                    <div className="space-y-4">{completionForm.credentials.map((credential, index) => (
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
                      Complete Task
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Assign to Operations Member Modal */}
          <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  Assign Task to Operations Member
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground">
                  Select an Operations department member to assign this resource request
                </DialogDescription>
              </DialogHeader>

              {selectedRequest && (
                <div className="space-y-6">
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
                          <span className="font-semibold text-foreground">{selectedRequest.user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Email:</span>
                          <span className="text-muted-foreground">{selectedRequest.user.email}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Resource:</span>
                          <span className="font-semibold text-foreground">{getResourceType(selectedRequest)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-700 w-20">Quantity:</span>
                          <span className="text-muted-foreground">{selectedRequest.requestedQty}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operations Members Selection */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Select Assignee</Label>
                    {loadingMembers ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                        Loading Operations members...
                      </div>
                    ) : departmentMembers.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground border border-dashed rounded-lg">
                        No Operations department members found
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {departmentMembers.map((member) => (
                          <div
                            key={member.id}
                            onClick={() => setSelectedAssignee(member.id)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              selectedAssignee === member.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-foreground">{member.name}</div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200" 
                                   style={{
                                     borderColor: selectedAssignee === member.id ? '#000' : '#ccc',
                                     backgroundColor: selectedAssignee === member.id ? '#000' : 'transparent'
                                   }}>
                                {selectedAssignee === member.id && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submitAssignment}
                  disabled={submitting || !selectedAssignee}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Assign Task
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