'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Navigation from '@/components/navigation'

interface ResourceField {
  id: string
  name: string
  label: string
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'EMAIL' | 'URL' | 'TEXTAREA'
  isRequired: boolean
  defaultValue?: string
  options?: string
  unit?: string
  minValue?: number
  maxValue?: number
  sortOrder: number
}

interface ResourceRequest {
  id: string
  resourceTemplateId?: string
  resourceType?: string
  requestedConfig: string // JSON string containing the actual requested specs
  requestedQty: number
  justification: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'ASSIGNED_TO_IT' | 'COMPLETED'
  currentLevel: number
  requiredLevels: number
  createdAt: string
  rejectionReason: string | null
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
    fields?: ResourceField[]
  }
  approvals: Array<{
    id: string
    approvalLevel: number
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    approver: {
      id: string
      name: string
      email: string
    }
    approvedAt?: string
    comments?: string
  }>
  approvedBy: {
    id: string
    name: string
  } | null
}

export default function AdminRequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<ResourceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'ASSIGNED_TO_IT' | 'COMPLETED'>('ALL')
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Helper function to get current user's role info
  const getCurrentUserInfo = () => {
    if (!session?.user) return { role: 'NONE', approvalLevel: 0 }
    
    const userRole = (session.user as any).userRole || (session.user as any).role
    let approvalLevel = 0
    
    if (userRole === 'DEPARTMENT_HEAD') {
      approvalLevel = 1
    } else if (userRole === 'IT_HEAD') {
      approvalLevel = 2
    } else if (userRole === 'ADMIN') {
      approvalLevel = 3
    }
    
    return { role: userRole, approvalLevel }
  }

  // Function to check if current user can approve a request
  const canUserApproveRequest = (request: ResourceRequest) => {
    if (!session?.user) return false

    // Get current user's approval level
    let userApprovalLevel = 0
    const userRole = (session.user as any).userRole || (session.user as any).role

    if (userRole === 'DEPARTMENT_HEAD') {
      userApprovalLevel = 1
    } else if (userRole === 'IT_HEAD') {
      userApprovalLevel = 2
    } else if (userRole === 'ADMIN') {
      userApprovalLevel = 3
    }

    // Check if request is in a state that can be approved
    if (request.status !== 'PENDING' && request.status !== 'IN_PROGRESS') {
      return false
    }

    // Calculate the next required approval level
    const nextRequiredLevel = request.currentLevel + 1

    // User can approve if their level matches the next required level
    const canApprove = userApprovalLevel === nextRequiredLevel && nextRequiredLevel <= request.requiredLevels

    console.log('Approval check:', {
      requestId: request.id,
      userRole,
      userApprovalLevel,
      currentLevel: request.currentLevel,
      nextRequiredLevel,
      requiredLevels: request.requiredLevels,
      canApprove
    })

    return canApprove
  }

  // Helper function to parse and display requested configuration
  const parseRequestedConfig = (configString: string) => {
    try {
      const config = JSON.parse(configString)
      return config
    } catch (error) {
      console.error('Error parsing requested config:', error)
      return {}
    }
  }

  // Helper function to format specs for display
  const formatSpecs = (configString: string, resourceTemplate?: { fields?: any[] }) => {
    const config = parseRequestedConfig(configString)
    const specs: string[] = []
    
    // If we have a resource template with fields, show all fields (even if not configured)
    if (resourceTemplate && resourceTemplate.fields && resourceTemplate.fields.length > 0) {
      // Fetch template fields to show what should be configured
      resourceTemplate.fields.forEach((field: any) => {
        const value = config[field.name] ?? field.defaultValue ?? ''
        const formattedKey = field.label || field.name
        
        // Add appropriate units
        let formattedValue = value
        if (field.unit && value && !value.toString().includes(field.unit)) {
          formattedValue = `${value} ${field.unit}`
        }
        
        // Handle boolean values
        if (field.fieldType === 'BOOLEAN') {
          formattedValue = value ? 'Yes' : 'No'
        }
        
        // Show if field is configured or using default
        const isConfigured = config.hasOwnProperty(field.name)
        const displayValue = formattedValue || 'Not set'
        const suffix = !isConfigured && field.defaultValue ? ' (default)' : ''
        
        specs.push(`${formattedKey}: ${displayValue}${suffix}`)
      })
    } else {
      // Fallback to dynamic parsing for resources without template info
      Object.entries(config).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Format the key to be more readable (e.g., "cpuCores" -> "CPU Cores")
          let formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          
          // Handle common field names with special formatting
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
            'memory': 'Memory',
            'size': 'Size',
            'volumeType': 'Volume Type',
            'iops': 'IOPS',
            'throughput': 'Throughput',
            'encrypted': 'Encryption',
            'region': 'Region'
          }
          
          if (keyMappings[key.toLowerCase()]) {
            formattedKey = keyMappings[key.toLowerCase()]
          }
          
          // Add appropriate units for common fields
          let formattedValue = value
          if ((key.toLowerCase().includes('ram') || key.toLowerCase().includes('memory') || key.toLowerCase().includes('disk') || key.toLowerCase().includes('storage') || key.toLowerCase().includes('size')) && typeof value === 'number') {
            if (!value.toString().includes('GB') && !value.toString().includes('MB') && !value.toString().includes('TB')) {
              formattedValue = `${value}GB`
            }
          }
          
          // Handle boolean values
          if (typeof value === 'boolean') {
            formattedValue = value ? 'Yes' : 'No'
          }
          
          specs.push(`${formattedKey}: ${formattedValue}`)
        }
      })
    }
    
    return specs
  }

  // Get the resource type/name for display
  const getResourceType = (request: ResourceRequest) => {
    if (request.resourceTemplate) {
      return request.resourceTemplate.name
    } else if (request.resourceType) {
      return request.resourceType
    }
    return 'Unknown Resource'
  }

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        console.log('Fetching requests for department head...')
        const response = await fetch('/api/requests')
        const data = await response.json()
        console.log('Requests received:', data)
        setRequests(data)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      console.log('Submitting approval:', { requestId, action, comments: action === 'reject' ? rejectionReason : undefined })
      
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          comments: action === 'reject' ? rejectionReason : undefined
        })
      })

      console.log('Approval response status:', response.status)
      
      if (response.ok) {
        const updatedRequest = await response.json()
        console.log('Approval successful:', updatedRequest)
        setRequests(requests.map(req => 
          req.id === requestId ? updatedRequest : req
        ))
        setSelectedRequest(null)
        setRejectionReason('')
        
        // Show success message
        const actionText = action === 'approve' ? 'approved' : 'rejected'
        alert(`Request ${actionText} successfully!`)
        
        // Refresh the page to get updated data
        window.location.reload()
      } else {
        const errorData = await response.json()
        console.error('Error updating request:', errorData.error)
        
        // Provide user-friendly error messages
        let errorMessage = errorData.error || 'Failed to process approval'
        
        if (errorData.error?.includes('level') && errorData.error?.includes('approval')) {
          errorMessage = `You don't have permission to approve this request. ${errorData.error}`
        }
        
        alert(errorMessage)
      }
    } catch (error) {
      console.error('Error updating request:', error)
      alert('Failed to process approval. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ASSIGNED_TO_IT: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800'
    }

    const labels = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      ASSIGNED_TO_IT: 'Assigned to IT',
      COMPLETED: 'Completed'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const filteredRequests = requests.filter(request => {
    if (filter === 'ALL') return true
    return request.status === filter
  })

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
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Resource Requests</h1>

          {/* User Role Info (for debugging) */}
          {session?.user && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm">
                <strong>Current User:</strong> {(session.user as any).name || session.user.email} | 
                <strong> Role:</strong> {getCurrentUserInfo().role} | 
                <strong> Approval Level:</strong> {getCurrentUserInfo().approvalLevel}
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex space-x-2 mb-6">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'ASSIGNED_TO_IT', 'COMPLETED', 'REJECTED'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status as any)}
              >
                {status.replace('_', ' ')}
              </Button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {filter === 'ALL' ? 'All Requests' : `${filter} Requests`}
                <span className="ml-2 text-sm text-gray-500">
                  ({filteredRequests.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <p className="text-gray-500">No requests found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Specs</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.user.name}</div>
                            <div className="text-sm text-gray-500">{request.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.phase.project.name}</div>
                            <div className="text-sm text-gray-500">{request.phase.project.client}</div>
                          </div>
                        </TableCell>
                        <TableCell>{request.phase.name}</TableCell>
                        <TableCell>{getResourceType(request)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatSpecs(request.requestedConfig, request.resourceTemplate).map((spec, index) => (
                              <div key={index}>{spec}</div>
                            ))}
                            <div className="font-medium">Qty: {request.requestedQty}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {canUserApproveRequest(request) ? (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApproval(request.id, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedRequest(request.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : (request.status === 'PENDING' || request.status === 'IN_PROGRESS') ? (
                            <div className="text-sm text-gray-500">
                              <div>Level {request.currentLevel + 1} approval required</div>
                              <div className="text-xs">
                                {request.currentLevel + 1 === 1 ? 'Department Head' :
                                 request.currentLevel + 1 === 2 ? 'IT Head' :
                                 request.currentLevel + 1 === 3 ? 'Admin' : 'Higher Level'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {request.status === 'APPROVED' ? 'Approved' : 
                               request.status === 'ASSIGNED_TO_IT' ? 'Assigned to IT' :
                               request.status === 'COMPLETED' ? 'Completed' : 'Rejected'}
                              {request.approvedBy && ` by ${request.approvedBy.name}`}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Rejection Modal */}
          {selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Reject Request</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                      <Textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleApproval(selectedRequest, 'reject')}
                        variant="destructive"
                        disabled={!rejectionReason.trim()}
                      >
                        Reject Request
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(null)
                          setRejectionReason('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}