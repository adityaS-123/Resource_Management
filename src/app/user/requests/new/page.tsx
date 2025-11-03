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
import Navigation from '@/components/navigation'
import { 
  FolderOpen, 
  Layers, 
  Server, 
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle,
  Plus
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
  resourceType: string // The flexible resource type (e.g., "Virtual Machine", "Database", etc.)
  configuration: string // JSON string containing field values
  quantity: number
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
  const [formData, setFormData] = useState({
    resourceTemplateId: '',
    requestedConfig: {} as Record<string, any>,
    requestedQty: 1,
    justification: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

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
      // Validate required fields
      if (!formData.resourceTemplateId) {
        setError('Please select a resource template')
        setLoading(false)
        return
      }

      const requestBody = {
        phaseId: selectedPhase,
        resourceTemplateId: formData.resourceTemplateId,
        requestedConfig: formData.requestedConfig,
        requestedQty: formData.requestedQty,
        justification: formData.justification
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
    setFormData(prev => ({
      ...prev,
      resourceTemplateId: templateId,
      requestedConfig: {}
    }))
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
              <h2 className="text-2xl font-bold text-green-900 mb-2">Request Submitted Successfully!</h2>
              <p className="text-green-700 mb-4">
                Your resource request has been submitted and is now pending approval.
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
            Request resources for your project phases using predefined resource templates
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

          {/* Step 3: Select Resource Template */}
          {selectedPhase && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Select Resource Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Choose from Available Templates</Label>
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
              </CardContent>
            </Card>
          )}

          {/* Step 4: Configure Resource */}
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Configure {selectedTemplate.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTemplate.fields
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map(field => renderField(field))}
                
                <div className="space-y-2">
                  <Label htmlFor="requestedQty">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="requestedQty"
                    type="number"
                    min="1"
                    value={formData.requestedQty}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requestedQty: parseInt(e.target.value) || 1
                    }))}
                    required
                  />
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
          {selectedTemplate && (
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