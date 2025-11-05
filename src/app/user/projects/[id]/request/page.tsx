'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import Navigation from '@/components/navigation'
import { 
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle,
  Server,
  Layers,
  Database,
  Info
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  phases: Phase[]
}

interface Phase {
  id: string
  name: string
  duration: number
  resources: Resource[]
}

interface Resource {
  id: string
  identifier?: string
  resourceType: string
  configuration: string
  quantity: number
  consumedQuantity: number
}

export default function ProjectResourceRequestPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [selectedPhase, setSelectedPhase] = useState('')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [requestedQty, setRequestedQty] = useState(1)
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (!selectedResource) {
        setError('Please select a resource')
        setSubmitting(false)
        return
      }

      const availableQuantity = selectedResource.quantity - selectedResource.consumedQuantity
      if (requestedQty > availableQuantity) {
        setError(`Only ${availableQuantity} units available`)
        setSubmitting(false)
        return
      }

      const requestBody = {
        phaseId: selectedPhase,
        resourceId: selectedResource.id,
        resourceType: selectedResource.resourceType,
        requestedConfig: selectedResource.configuration,
        requestedQty: requestedQty,
        justification: justification
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/user/projects/${params.id}`)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit request')
      }
    } catch (error) {
      setError('An error occurred while submitting the request')
    } finally {
      setSubmitting(false)
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
        <div key={key} className="flex justify-between text-sm">
          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
          <span className="font-medium">{String(value)}</span>
        </div>
      ))
    } catch {
      return <div className="text-xs text-gray-500">Invalid configuration</div>
    }
  }

  const selectedPhaseData = project?.phases.find(p => p.id === selectedPhase)
  const availableResources = selectedPhaseData?.resources.filter(r => 
    (r.quantity - r.consumedQuantity) > 0
  ) || []

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-1/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div>
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div>
        <Navigation />
        <div className="max-w-2xl mx-auto pt-8 px-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Request Submitted Successfully!</h2>
              <p className="text-green-700 mb-4">
                Your resource request has been submitted and is now pending approval.
              </p>
              <p className="text-sm text-green-600">
                Redirecting back to project...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/user/projects/${params.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Request Project Resources</h1>
          <p className="text-gray-600 mt-2">
            Request access to resources that have been configured for {project?.name}
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Project Name</Label>
                  <p className="text-lg font-semibold text-gray-900">{project?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <p className="text-lg text-gray-700">{project?.client}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Select Phase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Select Project Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a phase" />
                </SelectTrigger>
                <SelectContent>
                  {project?.phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      <div>
                        <div className="font-medium">{phase.name}</div>
                        <div className="text-sm text-gray-500">
                          {phase.resources.length} resources available
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Step 2: Select Resource */}
          {selectedPhase && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Select Resource
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableResources.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Database className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                    <p className="font-medium mb-1">No Available Resources</p>
                    <p className="text-sm">All resources in this phase are fully allocated.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableResources.map((resource) => {
                      const availableQty = resource.quantity - resource.consumedQuantity
                      const isSelected = selectedResource?.id === resource.id
                      
                      return (
                        <Card 
                          key={resource.id} 
                          className={`cursor-pointer transition-all border-2 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedResource(resource)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <h6 className="font-medium text-gray-900">{resource.resourceType}</h6>
                                {resource.identifier && (
                                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
                                    {resource.identifier}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  {availableQty} available
                                </Badge>
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  onChange={() => setSelectedResource(resource)}
                                  className="w-4 h-4 text-blue-600"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              {renderResourceConfig(resource.configuration)}
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Total: {resource.quantity}</span>
                              <span>Used: {resource.consumedQuantity}</span>
                              <span className="font-medium text-green-600">Available: {availableQty}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Specify Quantity and Justification */}
          {selectedResource && (
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requestedQty">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="requestedQty"
                    type="number"
                    min="1"
                    max={selectedResource.quantity - selectedResource.consumedQuantity}
                    value={requestedQty}
                    onChange={(e) => setRequestedQty(parseInt(e.target.value) || 1)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Maximum available: {selectedResource.quantity - selectedResource.consumedQuantity}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification">
                    Justification <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="justification"
                    placeholder="Please explain why you need these resources and how you plan to use them..."
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    required
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {selectedResource && (
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}