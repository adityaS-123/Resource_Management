'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import Navigation from '@/components/navigation'
import { 
  CalendarDays, 
  DollarSign, 
  Users, 
  Activity, 
  Clock, 
  Database,
  ArrowLeft,
  TrendingUp,
  Server,
  Plus,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  startDate: string
  endDate: string
  phases: Phase[]
  createdAt: string
}

interface Phase {
  id: string
  name: string
  duration: number
  allocatedCost: number
  resources: Resource[]
  resourceRequests: ResourceRequest[]
}

interface Resource {
  id: string
  identifier?: string // e.g., "VM-1a", "VM-1b", "Storage-2a" - unique identifier within phase
  resourceType: string
  configuration: string // JSON string containing field values
  quantity: number
  costPerUnit: number
}

interface ResourceRequest {
  id: string
  resourceTemplateId: string
  resourceTemplate?: {
    id: string
    name: string
    description?: string
  }
  requestedConfig: string // JSON string containing requested field values
  requestedQty: number
  justification?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function UserProjectDetails() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        setError('Failed to fetch project details')
      }
    } catch (err) {
      setError('An error occurred while fetching project details')
    } finally {
      setLoading(false)
    }
  }

  const renderResourceConfig = (configuration: string) => {
    try {
      if (!configuration || configuration.trim() === '') {
        return <div className="text-xs text-gray-500">No configuration</div>
      }
      const config = JSON.parse(configuration)
      const entries = Object.entries(config)
      if (entries.length === 0) {
        return <div className="text-xs text-gray-500">No configuration</div>
      }
      return entries.map(([key, value]) => (
        <div key={key} className="flex justify-between text-xs">
          <span className="text-gray-600">{key}:</span>
          <span className="font-medium">{String(value)}</span>
        </div>
      ))
    } catch {
      return <div className="text-xs text-gray-500">Invalid configuration</div>
    }
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-64" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error || 'Project not found'}
              </h3>
              <p className="text-gray-500 mb-6">
                The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
              </p>
              <Link href="/dashboard">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalBudget = project.phases?.reduce((sum, phase) => sum + (phase.allocatedCost || 0), 0) || 0
  const totalResources = project.phases?.reduce((total, phase) => 
    total + (phase.resources?.reduce((phaseTotal, resource) => phaseTotal + (resource.quantity || 0), 0) || 0), 0
  ) || 0
  const totalRequests = project.phases?.reduce((total, phase) => total + (phase.resourceRequests?.length || 0), 0) || 0
  const pendingRequests = project.phases?.reduce((total, phase) => 
    total + (phase.resourceRequests?.filter(req => req.status === 'PENDING').length || 0), 0
  ) || 0

  const daysRemaining = Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const progress = Math.max(0, Math.min(100, 
    ((new Date().getTime() - new Date(project.startDate).getTime()) / 
     (new Date(project.endDate).getTime() - new Date(project.startDate).getTime())) * 100
  ))

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">Client: {project.client}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/user/requests/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Request Resources
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Project Progress
                  </CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{Math.round(progress)}%</div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600">
                    {daysRemaining > 0 ? `${daysRemaining} days left` : 'Completed'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Available Resources
                  </CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Database className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{totalResources}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Server className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">Allocated resources</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-700">
                   
                  </CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">${totalBudget.toLocaleString()}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Activity className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-purple-600"></span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-amber-700">
                    My Requests
                  </CardTitle>
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-900">{totalRequests}</div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-amber-600" />
                  <span className="text-xs text-amber-600">
                    {pendingRequests} pending
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Start Date</p>
                    <p className="text-sm text-gray-600">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Progress</p>
                    <Progress value={progress} className="w-32 mt-2" />
                  </div>
                  <div className="text-right">
                    <p className="font-medium">End Date</p>
                    <p className="text-sm text-gray-600">{new Date(project.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Phases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Project Phases ({project.phases?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!project.phases || project.phases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="mx-auto h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Phases Yet</h3>
                  <p>This project doesn&apos;t have any phases configured yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {project.phases.map((phase, index) => (
                    <Card key={phase.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                Phase {index + 1}
                              </span>
                              {phase.name}
                            </CardTitle>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-gray-50">
                              <Clock className="h-3 w-3 mr-1" />
                              {phase.duration} months
                            </Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${phase.allocatedCost.toLocaleString()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Resources Section */}
                        <div className="mb-6">
                          <h5 className="font-medium flex items-center gap-2 mb-4">
                            <Database className="h-4 w-4" />
                            Available Resources ({phase.resources?.length || 0})
                          </h5>
                          {!phase.resources || phase.resources.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              <Database className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                              <p className="font-medium mb-1">No Resources Available</p>
                              <p className="text-sm">No resources have been allocated to this phase yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {phase.resources.map((resource) => (
                                <Card key={resource.id} className="border border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <h6 className="font-medium text-gray-900">{resource.resourceType}</h6>
                                        {resource.identifier && (
                                          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">
                                            {resource.identifier}
                                          </Badge>
                                        )}
                                      </div>
                                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                        {resource.quantity}x
                                      </Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="space-y-1">
                                        {renderResourceConfig(resource.configuration)}
                                      </div>
                                      <Separator className="my-2" />
                                      <div className="flex justify-between font-medium">
                                        <span className="text-gray-600"></span>
                                        <span className="text-green-600">${resource.costPerUnit}</span>
                                      </div>
                                      <div className="flex justify-between font-medium">
                                        <span className="text-gray-600">Total:</span>
                                        <span className="text-gray-900">${(resource.quantity * resource.costPerUnit).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Resource Requests Section */}
                        <div>
                          <h5 className="font-medium flex items-center gap-2 mb-4">
                            <Users className="h-4 w-4" />
                            My Resource Requests ({phase.resourceRequests?.length || 0})
                          </h5>
                          {!phase.resourceRequests || phase.resourceRequests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              <Users className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                              <p className="font-medium mb-1">No Resource Requests</p>
                              <p className="text-sm mb-4">You haven&apos;t made any resource requests for this phase yet.</p>
                              <Link href="/user/requests/new">
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Request Resources
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {phase.resourceRequests.map((request) => (
                                <Card key={request.id} className={`border-l-4 ${
                                  request.status === 'PENDING' ? 'border-l-yellow-500 bg-yellow-50' :
                                  request.status === 'APPROVED' ? 'border-l-green-500 bg-green-50' :
                                  'border-l-red-500 bg-red-50'
                                }`}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h6 className="font-medium text-gray-900">
                                          {request.resourceTemplate?.name || 'Resource'} Request
                                        </h6>
                                        <p className="text-sm text-gray-600">
                                          Requested on {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <Badge 
                                        variant={
                                          request.status === 'APPROVED' ? 'default' : 
                                          request.status === 'REJECTED' ? 'destructive' : 
                                          'secondary'
                                        }
                                      >
                                        {request.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                                        {request.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                                        {request.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                                        {request.status}
                                      </Badge>
                                    </div>
                                    
                                    <div className="text-sm space-y-2">
                                      <div>
                                        <span className="font-medium">Quantity:</span> {request.requestedQty || 0}
                                      </div>
                                      {request.justification && (
                                        <div>
                                          <span className="font-medium">Justification:</span>
                                          <p className="text-gray-600 mt-1">{request.justification}</p>
                                        </div>
                                      )}
                                      {request.status === 'REJECTED' && request.rejectionReason && (
                                        <div>
                                          <span className="font-medium text-red-600">Rejection Reason:</span>
                                          <p className="text-red-600 mt-1">{request.rejectionReason}</p>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}