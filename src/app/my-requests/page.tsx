'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import Link from 'next/link'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Users, 
  Shield, 
  Settings,
  Eye,
  RefreshCw,
  Calendar,
  FileText,
  AlertCircle,
  Server,
  Plus,
  Edit2
} from 'lucide-react'
import Navigation from '@/components/navigation'

interface ApprovalRecord {
  id: string
  approvalLevel: number
  status: string
  comments?: string
  approvedAt?: string
  createdAt: string
  approver: {
    name: string | null
    email: string
  }
}

interface ResourceRequest {
  id: string
  status: string
  currentLevel: number
  requiredLevels: number
  requestedQty: number
  justification?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  completionNotes?: string
  credentials?: string
  resourceTemplate?: {
    id: string
    name: string
    description?: string
    approvalLevels: number
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
  user: {
    name: string | null
    email: string
  }
  requestedConfig: any
  approvals: ApprovalRecord[]
  completedBy?: {
    name: string | null
    email: string
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
    case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
    case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'ASSIGNED_TO_IT': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'COMPLETED': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APPROVED': return <CheckCircle className="h-4 w-4" />
    case 'REJECTED': return <XCircle className="h-4 w-4" />
    case 'IN_PROGRESS': return <Clock className="h-4 w-4" />
    case 'ASSIGNED_TO_IT': return <Settings className="h-4 w-4" />
    case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
    default: return <AlertCircle className="h-4 w-4" />
  }
}

const getLevelIcon = (level: number) => {
  switch (level) {
    case 1: return <User className="h-4 w-4" />
    case 2: return <Users className="h-4 w-4" />
    case 3: return <Shield className="h-4 w-4" />
    default: return <Settings className="h-4 w-4" />
  }
}

const getLevelTitle = (level: number) => {
  switch (level) {
    case 1: return 'Department Head Approval'
    case 2: return 'IT Head Approval'
    case 3: return 'Admin Approval'
    default: return 'Unknown Level'
  }
}

const canEditRequest = (request: ResourceRequest) => {
  // Cannot edit if already approved, rejected, assigned to IT, or completed
  if (request.status === 'REJECTED' || request.status === 'APPROVED' || 
      request.status === 'ASSIGNED_TO_IT' || request.status === 'COMPLETED') {
    return false
  }
  
  // Can edit if status is PENDING or IN_PROGRESS but no level 1 approvals yet
  if (request.status === 'PENDING') {
    return true
  }
  
  if (request.status === 'IN_PROGRESS') {
    // Check if any level 1 approval exists
    const level1Approval = request.approvals.find(a => a.approvalLevel === 1)
    if (level1Approval && level1Approval.status === 'APPROVED') {
      return false
    }
    return true
  }
  
  return false
}

export default function MyRequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<ResourceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (session) {
      fetchRequests()
    }
  }, [session])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/my-requests')
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }
      const data = await response.json()
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (request: ResourceRequest) => {
    setSelectedRequest(request)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedRequest(null)
  }

  const getApprovalProgress = (request: ResourceRequest) => {
    if (request.requiredLevels === 0) return 100
    return (request.currentLevel / request.requiredLevels) * 100
  }

  const getNextApprovalLevel = (request: ResourceRequest) => {
    if (request.status === 'APPROVED' || request.status === 'REJECTED' || request.status === 'ASSIGNED_TO_IT') {
      return null
    }
    
    if (request.currentLevel < request.requiredLevels) {
      return request.currentLevel + 1
    }
    
    return null
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="p-4 rounded-full bg-primary/10 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
            <p className="text-muted-foreground">Please sign in to view your resource requests</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-8 animate-pulse">
            <div className="space-y-4">
              <div className="h-12 bg-muted/30 rounded-2xl w-1/3"></div>
              <div className="h-6 bg-muted/20 rounded-xl w-2/3"></div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-muted/30 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="p-4 rounded-full bg-red-100 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <AlertCircle className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Requests</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <Button onClick={fetchRequests} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Enhanced Header */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  My Resource Requests
                </h1>
                <p className="text-lg text-muted-foreground">
                  Track the status and approval progress of your resource requests
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="px-4 py-2 text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  {requests.length} {requests.length === 1 ? 'Request' : 'Requests'}
                </Badge>
                <Button 
                  onClick={fetchRequests} 
                  variant="outline"
                  className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

      {requests.length === 0 ? (
        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="p-4 rounded-full bg-muted/30 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">No requests found</h3>
            <p className="text-base text-muted-foreground mb-6 max-w-md mx-auto">
              You haven&apos;t submitted any resource requests yet. Start by creating your first request.
            </p>
            <Button 
              asChild
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/user/requests/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => {
            const progress = getApprovalProgress(request)
            const nextLevel = getNextApprovalLevel(request)
            
            return (
              <Card key={request.id} className="card-enhanced hover-lift group">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="flex items-center gap-3 text-lg">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-200">
                          <Server className="h-4 w-4 text-blue-600" />
                        </div>
                        {request.resourceTemplate?.name || 'Resource Request'}
                        <Badge className={`${getStatusColor(request.status)} badge-enhanced`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1.5 font-medium text-sm">{request.status.replace('_', ' ')}</span>
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm flex items-center gap-2">
                        <span className="font-medium">{request.phase.project.name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{request.phase.name}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="font-medium">Qty: {request.requestedQty}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {canEditRequest(request) && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="group-hover:shadow-md transition-all duration-300 hover:bg-blue-50"
                        >
                          <Link href={`/user/requests/${request.id}/edit`}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                        className="group-hover:shadow-md transition-all duration-300 hover:bg-primary/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">{/* Enhanced Approval Progress */}
                  {request.requiredLevels > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Approval Progress</span>
                        <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                          Level {request.currentLevel} / {request.requiredLevels}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress value={progress} className="h-3 bg-muted/30" />
                        {nextLevel && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Next: {getLevelTitle(nextLevel)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Status Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created</span>
                      </div>
                      <p className="text-foreground font-medium">
                        {new Date(request.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4" />
                        <span className="font-medium">Last Updated</span>
                      </div>
                      <p className="text-foreground font-medium">
                        {new Date(request.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    {request.justification && (
                      <div className="space-y-2 lg:col-span-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Justification</span>
                        </div>
                        <p className="text-foreground text-sm bg-muted/30 p-3 rounded-xl border">
                          {request.justification}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Alerts */}
                  {request.status === 'REJECTED' && request.rejectionReason && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-4">
                      <h4 className="text-red-800 font-semibold text-sm flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejection Reason
                      </h4>
                      <p className="text-red-600 text-sm mt-2">{request.rejectionReason}</p>
                    </div>
                  )}

                  {request.status === 'APPROVED' && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                      <h4 className="text-green-800 font-semibold text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Request Approved
                      </h4>
                      <p className="text-green-600 text-sm mt-2">Your request has been assigned to the IT team for provisioning.</p>
                    </div>
                  )}

                  {request.status === 'ASSIGNED_TO_IT' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <h4 className="text-blue-800 font-semibold text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Assigned to IT Team
                      </h4>
                      <p className="text-blue-600 text-sm mt-2">The IT team is working on provisioning your resource.</p>
                    </div>
                  )}

                  {request.status === 'COMPLETED' && (
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-4">
                      <h4 className="text-purple-800 font-semibold text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Resource Delivered
                      </h4>
                      <p className="text-purple-600 text-sm mt-2">Your resource has been provisioned. Click <strong className="font-medium">Details</strong> to view access credentials.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Request Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDetailsModal}
          ></div>
          
          <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Request Details
                </h2>
                <p className="text-gray-600 mt-1">{selectedRequest.resourceTemplate?.name}</p>
              </div>
              <Button variant="outline" size="sm" onClick={closeDetailsModal}>
                ✕
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Request Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(selectedRequest.status)} border`}>
                          {getStatusIcon(selectedRequest.status)}
                          <span className="ml-1">{selectedRequest.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Quantity Requested</label>
                      <p className="text-gray-900">{selectedRequest.requestedQty}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Project</label>
                      <p className="text-gray-900">
                        {selectedRequest.phase.project.name} - {selectedRequest.phase.name}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Client</label>
                      <p className="text-gray-900">{selectedRequest.phase.project.client}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Approval Workflow */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Approval Workflow</h3>
                  
                  {selectedRequest.requiredLevels === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Auto-Approved</span>
                      </div>
                      <p className="text-green-600 text-sm mt-1">
                        This resource type is configured for automatic approval.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-500">
                          Level {selectedRequest.currentLevel} / {selectedRequest.requiredLevels}
                        </span>
                      </div>
                      <Progress value={getApprovalProgress(selectedRequest)} className="h-3" />
                      
                      <div className="space-y-3">
                        {[1, 2, 3].slice(0, selectedRequest.requiredLevels).map((level) => {
                          const approvalRecord = selectedRequest.approvals.find(
                            record => record.approvalLevel === level
                          )
                          const isCompleted = selectedRequest.currentLevel >= level
                          const isCurrent = selectedRequest.currentLevel + 1 === level && selectedRequest.status === 'IN_PROGRESS'
                          
                          return (
                            <div key={level} className={`border rounded-lg p-4 ${
                              isCompleted ? 'bg-green-50 border-green-200' : 
                              isCurrent ? 'bg-orange-50 border-orange-200' : 
                              'bg-gray-50 border-gray-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${
                                    isCompleted ? 'bg-green-100' : 
                                    isCurrent ? 'bg-orange-100' : 
                                    'bg-gray-100'
                                  }`}>
                                    {getLevelIcon(level)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{getLevelTitle(level)}</h4>
                                    {approvalRecord && (
                                      <p className="text-sm text-gray-600">
                                        {approvalRecord.approver.name || approvalRecord.approver.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isCompleted && approvalRecord ? (
                                    <>
                                      <Badge variant="default" className="mb-1">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Approved
                                      </Badge>
                                      <p className="text-xs text-gray-500">
                                        {new Date(approvalRecord.approvedAt!).toLocaleDateString()}
                                      </p>
                                    </>
                                  ) : isCurrent ? (
                                    <Badge variant="secondary">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pending
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Waiting</Badge>
                                  )}
                                </div>
                              </div>
                              {approvalRecord?.comments && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-sm text-gray-600">
                                    <strong>Comments:</strong> {approvalRecord.comments}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Configuration */}
                {selectedRequest.requestedConfig && Object.keys(selectedRequest.requestedConfig).length > 0 && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Resource Configuration</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(selectedRequest.requestedConfig).map(([key, value]) => (
                            <div key={key} className="bg-white rounded border p-3">
                              <label className="text-sm font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                              </label>
                              <p className="text-gray-900 mt-1">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Justification */}
                {selectedRequest.justification && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Justification</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900">{selectedRequest.justification}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Completion Details & Credentials */}
                {selectedRequest.status === 'COMPLETED' && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Resource Delivery Details
                      </h3>
                      
                      {/* Completion Notes */}
                      {selectedRequest.completionNotes && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-green-800 mb-2">Completion Notes</h4>
                          <p className="text-green-700">{selectedRequest.completionNotes}</p>
                        </div>
                      )}

                      {/* Access Credentials */}
                      {selectedRequest.credentials && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Access Credentials & Information
                          </h4>
                          <div className="space-y-3">
                            {JSON.parse(selectedRequest.credentials).map((cred: any, index: number) => (
                              <div key={index} className="bg-white border border-blue-200 rounded p-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-blue-900">{cred.label}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {cred.type}
                                    </Badge>
                                    {cred.type === 'password' && (
                                      <button
                                        onClick={() => {
                                          const elem = document.getElementById(`credential-${index}`)
                                          if (elem) {
                                            elem.style.display = elem.style.display === 'none' ? 'block' : 'none'
                                          }
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                      >
                                        Show/Hide
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div 
                                  id={`credential-${index}`}
                                  style={cred.type === 'password' ? { display: 'none' } : {}}
                                  className="mt-2 font-mono text-sm bg-gray-100 p-2 rounded border"
                                >
                                  {cred.type === 'url' ? (
                                    <a 
                                      href={cred.value} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {cred.value}
                                    </a>
                                  ) : cred.type === 'email' ? (
                                    <a 
                                      href={`mailto:${cred.value}`}
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      {cred.value}
                                    </a>
                                  ) : (
                                    cred.value
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs text-yellow-800">
                              ⚠️ <strong>Security Notice:</strong> Please keep these credentials secure and do not share them with unauthorized users.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Completion Details */}
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        {selectedRequest.completedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Completed: {new Date(selectedRequest.completedAt).toLocaleString()}</span>
                          </div>
                        )}
                        {selectedRequest.completedBy && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>By: {selectedRequest.completedBy.name || selectedRequest.completedBy.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Rejection Reason */}
                {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        Rejection Reason
                      </h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-700">{selectedRequest.rejectionReason}</p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Timeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Created</p>
                        <p className="text-gray-600">
                          {new Date(selectedRequest.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Last Updated</p>
                        <p className="text-gray-600">
                          {new Date(selectedRequest.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={closeDetailsModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  )
}