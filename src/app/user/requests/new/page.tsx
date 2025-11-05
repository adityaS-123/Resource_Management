'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import { 
  FolderOpen, 
  Layers, 
  Server, 
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle,
  Plus,
  Database
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
  allocatedCost: number
  resources: Resource[]
}

interface Resource {
  id: string
  identifier?: string // e.g., "VM-1a", "VM-1b", "Storage-2a"
  resourceType: string // The flexible resource type (e.g., "Virtual Machine", "Database", etc.)
  configuration: string // JSON string containing field values
  quantity: number
  consumedQuantity?: number // How much has been consumed/allocated
  costPerUnit: number
  resourceTemplateId?: string // Optional - for backward compatibility
  resourceTemplate?: ResourceTemplate
}

interface ResourceTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  fields: ResourceField[]
}

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

export default function NewRequestPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [resourceTemplates, setResourceTemplates] = useState<ResourceTemplate[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedPhase, setSelectedPhase] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate | null>(null)
  const [selectedProjectResource, setSelectedProjectResource] = useState<Resource | null>(null)
  const [requestMode, setRequestMode] = useState<'template' | 'project'>('template')
  const [formData, setFormData] = useState({
    resourceTemplateId: '',
    resourceId: '',
    requestedConfig: {} as Record<string, any>,
    requestedQty: 1,
    justification: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [autoApproved, setAutoApproved] = useState(false)

  useEffect(() => {
    fetchProjects()
    fetchResourceTemplates()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchResourceTemplates = async () => {
    try {
      const response = await fetch('/api/resource-templates')
      if (response.ok) {
        const data = await response.json()
        setResourceTemplates(data.filter((template: ResourceTemplate) => template.isActive))
      }
    } catch (error) {
      console.error('Error fetching resource templates:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate required fields based on request mode
      if (requestMode === 'template' && !formData.resourceTemplateId) {
        setError('Please select a resource template')
        setLoading(false)
        return
      }

      if (requestMode === 'project' && !formData.resourceId) {
        setError('Please select a project resource')
        setLoading(false)
        return
      }

      const requestBody: any = {
        phaseId: selectedPhase,
        requestedConfig: formData.requestedConfig,
        requestedQty: formData.requestedQty,
        justification: formData.justification
      }

      // Add appropriate fields based on request mode
      if (requestMode === 'template') {
        requestBody.resourceTemplateId = formData.resourceTemplateId
      } else {
        requestBody.resourceId = formData.resourceId
        requestBody.resourceType = selectedProjectResource?.resourceType
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const responseData = await response.json()
        const isAutoApproved = responseData.status === 'APPROVED'
        
        setSuccess(true)
        setAutoApproved(isAutoApproved)
        
        setTimeout(() => {
          router.push('/user/requests')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit request')
      }
    } catch (error) {
      setError('An error occurred while submitting the request')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateChange = (templateId: string) => {
    const template = resourceTemplates.find(t => t.id === templateId)
    setSelectedTemplate(template || null)
    
    // Auto-populate with default values for better admin visibility
    const defaultConfig: Record<string, any> = {}
    if (template && template.fields) {
      template.fields.forEach(field => {
        if (field.defaultValue !== null && field.defaultValue !== undefined && field.defaultValue !== '') {
          // Parse the default value based on field type
          let value: any = field.defaultValue
          if (field.fieldType === 'NUMBER') {
            value = parseInt(field.defaultValue) || 0
          } else if (field.fieldType === 'BOOLEAN') {
            value = field.defaultValue.toLowerCase() === 'true'
          }
          defaultConfig[field.name] = value
        }
      })
    }
    
    setFormData(prev => ({
      ...prev,
      resourceTemplateId: templateId,
      resourceId: '',
      requestedConfig: defaultConfig
    }))
  }

  const handleProjectResourceChange = (resourceId: string) => {
    const selectedProjectData = projects.find(p => p.id === selectedProject)
    const selectedPhaseData = selectedProjectData?.phases.find(ph => ph.id === selectedPhase)
    const resource = selectedPhaseData?.resources.find(r => r.id === resourceId)
    
    if (resource) {
      setSelectedProjectResource(resource)
      // Parse the existing configuration from the resource
      try {
        const config = JSON.parse(resource.configuration)
        setFormData(prev => ({
          ...prev,
          resourceId: resourceId,
          resourceTemplateId: '',
          requestedConfig: config
        }))
      } catch {
        setFormData(prev => ({
          ...prev,
          resourceId: resourceId,
          resourceTemplateId: '',
          requestedConfig: {}
        }))
      }
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

  const handleConfigChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      requestedConfig: {
        ...prev.requestedConfig,
        [fieldName]: value
      }
    }))
  }

  const renderField = (field: ResourceField) => {
    const value = formData.requestedConfig[field.name] || field.defaultValue || ''

    switch (field.fieldType) {
      case 'NUMBER':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              {field.unit && <span className="text-gray-500 ml-1">({field.unit})</span>}
            </Label>
            <Input
              id={field.name}
              type="number"
              min={field.minValue}
              max={field.maxValue}
              value={value}
              onChange={(e) => handleConfigChange(field.name, parseInt(e.target.value) || 0)}
              required={field.isRequired}
            />
            {field.minValue !== undefined && field.maxValue !== undefined && (
              <p className="text-xs text-gray-500">
                Range: {field.minValue} - {field.maxValue} {field.unit}
              </p>
            )}
          </div>
        )

      case 'SELECT':
        const options = field.options ? JSON.parse(field.options) : []
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select 
              value={value} 
              onValueChange={(val) => handleConfigChange(field.name, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option: string, index: number) => (
                  <SelectItem key={`${field.name}-${index}`} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'BOOLEAN':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <input
              id={field.name}
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleConfigChange(field.name, e.target.checked)}
              className="rounded"
            />
            <Label htmlFor={field.name}>
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        )

      case 'TEXTAREA':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              required={field.isRequired}
            />
          </div>
        )

      default: // TEXT, EMAIL, URL
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.fieldType.toLowerCase()}
              value={value}
              onChange={(e) => handleConfigChange(field.name, e.target.value)}
              required={field.isRequired}
            />
          </div>
        )
    }
  }

  const selectedProjectData = projects.find(p => p.id === selectedProject)
  const selectedPhaseData = selectedProjectData?.phases.find(ph => ph.id === selectedPhase)

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-2xl mx-auto pt-8 px-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                {autoApproved ? 'Resource Allocated Successfully!' : 'Request Submitted Successfully!'}
              </h2>
              <p className="text-green-700 mb-4">
                {autoApproved 
                  ? 'Your project resource has been automatically allocated and is ready to use.'
                  : 'Your resource request has been submitted and is now pending admin approval.'
                }
              </p>
              <p className="text-sm text-green-600">
                Redirecting to your requests...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Resource Request</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Request resources using predefined templates or from project-specific configured resources
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
          {/* Step 1: Select Project */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Select Project
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-500">{project.client}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Step 2: Select Phase */}
          {selectedProject && (
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
                    {selectedProjectData?.phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        <div>
                          <div className="font-medium">{phase.name}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Resource Type and Source */}
          {selectedPhase && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Select Resource
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resource Mode Selection */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Choose Resource Source</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all border-2 ${
                        requestMode === 'project' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setRequestMode('project')}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Database className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Project Resource</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Request from configured project resources
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-all border-2 ${
                        requestMode === 'template' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setRequestMode('template')}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Server className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="font-medium text-gray-900">Request Additional Resource</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Request any available resource template (requires admin approval)
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Template Selection */}
                {requestMode === 'template' && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Choose from Available Resource Templates</Label>
                    <p className="text-sm text-gray-600 mb-3">
                      Select any available resource template to request additional resources outside your project allocation. These requests require admin approval.
                    </p>
                    <Select value={formData.resourceTemplateId} onValueChange={handleTemplateChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a resource template" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-sm text-gray-500">{template.description}</div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {resourceTemplates.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No resource templates available</p>
                    )}
                  </div>
                )}

                {/* Project Resource Selection */}
                {requestMode === 'project' && selectedPhaseData && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Choose from Project Resources</Label>
                    {selectedPhaseData.resources.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Database className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                        <p className="font-medium mb-1">No Configured Resources</p>
                        <p className="text-sm">No resources have been configured for this phase yet.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {selectedPhaseData.resources
                          .filter(resource => {
                            const availableQty = resource.quantity - (resource.consumedQuantity || 0)
                            return availableQty > 0 // Only show resources that have availability
                          })
                          .map((resource) => {
                            const availableQty = resource.quantity - (resource.consumedQuantity || 0)
                            const isSelected = formData.resourceId === resource.id
                            
                            return (
                              <Card 
                                key={resource.id} 
                                className={`cursor-pointer transition-all border-2 ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleProjectResourceChange(resource.id)}
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
                                        onChange={() => handleProjectResourceChange(resource.id)}
                                        className="w-4 h-4 text-blue-600"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {renderResourceConfig(resource.configuration)}
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })
                        }
                        {selectedPhaseData.resources.every(resource => {
                          const availableQty = resource.quantity - (resource.consumedQuantity || 0)
                          return availableQty <= 0
                        }) && (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Database className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                            <p className="font-medium mb-1">All Resources Fully Allocated</p>
                            <p className="text-sm">All configured resources for this phase have been fully allocated. Please contact your admin or wait for resources to become available.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Configure Resource */}
          {(selectedTemplate || selectedProjectResource) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {requestMode === 'template' 
                    ? `Configure ${selectedTemplate?.name}` 
                    : `Request ${selectedProjectResource?.resourceType}`
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requestMode === 'template' && selectedTemplate && (
                  <>
                    {selectedTemplate.fields
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map(field => renderField(field))}
                  </>
                )}
                
                {requestMode === 'project' && selectedProjectResource && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h6 className="font-medium text-gray-900 mb-2">Resource Configuration</h6>
                      <div className="space-y-2">
                        {renderResourceConfig(selectedProjectResource.configuration)}
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        This resource has been pre-configured by the admin. You can request a quantity from the available pool.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="requestedQty">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="requestedQty"
                    type="number"
                    min="1"
                    max={requestMode === 'project' && selectedProjectResource 
                      ? selectedProjectResource.quantity - (selectedProjectResource.consumedQuantity || 0)
                      : undefined
                    }
                    value={formData.requestedQty}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requestedQty: parseInt(e.target.value) || 1
                    }))}
                    required
                  />
                  {requestMode === 'project' && selectedProjectResource && (
                    <p className="text-xs text-gray-500">
                      Maximum available: {selectedProjectResource.quantity - (selectedProjectResource.consumedQuantity || 0)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification">
                    Justification (Recommended)
                  </Label>
                  <Textarea
                    id="justification"
                    placeholder="Please explain why you need these resources..."
                    value={formData.justification}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      justification: e.target.value
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {(selectedTemplate || selectedProjectResource) && (
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}