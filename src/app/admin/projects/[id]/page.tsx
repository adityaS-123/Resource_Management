'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { 
  CalendarDays, 
  Users, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2,
  Database,
  Target,
  AlertTriangle,
  Edit
} from 'lucide-react'

interface Project {
  id: string
  name: string
  client: string
  startDate: string
  endDate: string
  phases: Phase[]
  users: User[]
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
}

interface Phase {
  id: string
  name: string
  duration: number
  resources: Resource[]
  resourceRequests: ResourceRequest[]
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

interface Resource {
  id: string
  resourceType: string // The type of resource (e.g., "Virtual Machine", "Database", etc.)
  resourceTemplateId?: string
  resourceTemplate?: ResourceTemplate
  configuration: string // JSON string containing field values
  quantity: number
  consumedQuantity?: number // Available in new schema
  // Runtime calculated fields
  allocatedQuantity?: number
  availableQuantity?: number
}

interface ResourceRequest {
  id: string
  resourceTemplateId?: string
  resourceType?: string
  resourceTemplate?: ResourceTemplate
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
  approvedBy?: {
    id: string
    name: string
    email: string
  }
}

export default function ProjectDetailsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resourceAvailability, setResourceAvailability] = useState<Map<string, any>>(new Map())
  const [newPhase, setNewPhase] = useState({ name: '', duration: 1 })
  const [customFields, setCustomFields] = useState<Array<{
    name: string
    label: string
    type: 'TEXT' | 'NUMBER' | 'SELECT' | 'BOOLEAN' | 'TEXTAREA'
    value: string
    unit?: string
    required?: boolean
    options?: string[]
  }>>([])
  const [resourceTemplates, setResourceTemplates] = useState<ResourceTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate | null>(null)
  const [resourceConfig, setResourceConfig] = useState<Record<string, any>>({})
  const [isCustomResource, setIsCustomResource] = useState(false)
  const [newResource, setNewResource] = useState({ 
    phaseId: '', 
    resourceType: '',
    resourceTemplateId: '',
    configuration: '{}',
    quantity: 1
  })

  // Helper function to parse and display resource configuration
  const renderResourceConfig = (configString: string) => {
    try {
      const config = JSON.parse(configString)
      return Object.entries(config).map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
          <span className="font-medium">{String(value)} {getConfigUnit(key)}</span>
        </div>
      ))
    } catch {
      return <span className="text-gray-500 text-xs">Invalid configuration</span>
    }
  }

  // Helper function to get appropriate unit for configuration fields
  const getConfigUnit = (fieldName: string) => {
    if (fieldName.toLowerCase().includes('cpu') || fieldName.toLowerCase().includes('cores')) return 'cores'
    if (fieldName.toLowerCase().includes('ram') || fieldName.toLowerCase().includes('memory')) return 'GB'
    if (fieldName.toLowerCase().includes('disk') || fieldName.toLowerCase().includes('storage')) return 'GB'
    return ''
  }
  
  const [editingProject, setEditingProject] = useState(false)
  const [editedProject, setEditedProject] = useState({
    name: '',
    client: '',
    startDate: '',
    endDate: '',
    userEmails: ''
  })
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchProject()
    fetchResourceTemplates()
  }, [params.id])

  const fetchResourceTemplates = async () => {
    try {
      const response = await fetch('/api/resource-templates')
      if (response.ok) {
        const templates = await response.json()
        setResourceTemplates(templates.filter((template: ResourceTemplate) => template.isActive))
      }
    } catch (err) {
      console.error('Failed to fetch resource templates:', err)
    }
  }

  const handleTemplateSelection = (templateId: string) => {
    const template = resourceTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(template)
      setNewResource(prev => ({ 
        ...prev, 
        resourceTemplateId: templateId,
        resourceType: template.name 
      }))
      
      // Initialize resource config with default values
      const initialConfig: Record<string, any> = {}
      template.fields.forEach(field => {
        if (field.defaultValue) {
          initialConfig[field.name] = field.fieldType === 'NUMBER' ? 
            parseFloat(field.defaultValue) : 
            field.fieldType === 'BOOLEAN' ? 
            field.defaultValue === 'true' : 
            field.defaultValue
        }
      })
      setResourceConfig(initialConfig)
      setNewResource(prev => ({ ...prev, configuration: JSON.stringify(initialConfig) }))
    }
  }

  const handleConfigChange = (fieldName: string, value: any, fieldType: string) => {
    const newConfig = { ...resourceConfig }
    if (fieldType === 'NUMBER') {
      newConfig[fieldName] = parseFloat(value) || 0
    } else if (fieldType === 'BOOLEAN') {
      newConfig[fieldName] = value === 'true' || value === true
    } else {
      newConfig[fieldName] = value
    }
    setResourceConfig(newConfig)
    setNewResource(prev => ({ ...prev, configuration: JSON.stringify(newConfig) }))
  }

  const switchToCustomResource = () => {
    setIsCustomResource(true)
    setSelectedTemplate(null)
    setNewResource(prev => ({ 
      ...prev, 
      resourceTemplateId: '',
      resourceType: '',
      configuration: '{}' 
    }))
    setResourceConfig({})
    setCustomFields([])
  }

  const switchToTemplateResource = () => {
    setIsCustomResource(false)
    setSelectedTemplate(null)
    setNewResource(prev => ({ 
      ...prev, 
      resourceTemplateId: '',
      resourceType: '',
      configuration: '{}' 
    }))
    setResourceConfig({})
    setCustomFields([])
  }

  const createTemplateFromCustomResource = async (resourceName: string, description: string) => {
    try {
      const templateData = {
        name: resourceName,
        description: description,
        fields: customFields.map((field, index) => ({
          name: field.name,
          label: field.label || field.name,
          fieldType: field.type,
          isRequired: field.required || false,
          defaultValue: field.value || '',
          options: field.options,
          unit: field.unit,
          sortOrder: index
        }))
      }

      const response = await fetch('/api/resource-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })

      if (response.ok) {
        // Refresh resource templates list
        await fetchResourceTemplates()
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to create template:', err)
      return false
    }
  }

  useEffect(() => {
    if (project) {
      fetchResourceAvailability()
    }
  }, [project])

  // Custom field management functions
  const addCustomField = () => {
    setCustomFields([...customFields, {
      name: '',
      label: '',
      type: 'TEXT',
      value: '',
      unit: '',
      required: false,
      options: []
    }])
  }

  const updateCustomField = (index: number, field: string, value: any) => {
    const updatedFields = [...customFields]
    updatedFields[index] = { ...updatedFields[index], [field]: value }
    setCustomFields(updatedFields)
    
    // Update resource configuration for custom resources
    if (isCustomResource) {
      const config: Record<string, any> = {}
      updatedFields.forEach(f => {
        if (f.name && f.value) {
          config[f.name] = f.type === 'NUMBER' ? parseFloat(f.value) || 0 : f.value
        }
      })
      setNewResource(prev => ({ ...prev, configuration: JSON.stringify(config) }))
    }
  }

  const removeCustomField = (index: number) => {
    const updatedFields = customFields.filter((_, i) => i !== index)
    setCustomFields(updatedFields)
    
    // Update resource configuration for custom resources
    if (isCustomResource) {
      const config: Record<string, any> = {}
      updatedFields.forEach(f => {
        if (f.name && f.value) {
          config[f.name] = f.type === 'NUMBER' ? parseFloat(f.value) || 0 : f.value
        }
      })
      setNewResource(prev => ({ ...prev, configuration: JSON.stringify(config) }))
    }
  }

  useEffect(() => {
    // Check if tab parameter is set in URL
    const tabParam = searchParams.get('tab')
    if (tabParam && ['overview', 'phases', 'requests', 'manage'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (project && !editingProject) {
      setEditedProject({
        name: project.name,
        client: project.client,
        startDate: project.startDate.includes('T') ? project.startDate.split('T')[0] : project.startDate,
        endDate: project.endDate.includes('T') ? project.endDate.split('T')[0] : project.endDate,
        userEmails: project.users.map(user => user.email).join(', ')
      })
    }
  }, [project, editingProject])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        setError('Failed to fetch project')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchResourceAvailability = async () => {
    if (!project) return
    
    const availabilityMap = new Map()
    
    // Fetch availability for each resource in each phase
    for (const phase of project.phases) {
      for (const resource of phase.resources) {
        try {
          const response = await fetch('/api/resources/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phaseId: phase.id,
              resourceTemplateId: resource.resourceTemplateId,
              resourceType: resource.resourceType
            })
          })
          
          if (response.ok) {
            const availabilityData = await response.json()
            availabilityMap.set(resource.id, availabilityData)
          }
        } catch (err) {
          console.error('Error fetching availability for resource:', resource.id, err)
        }
      }
    }
    
    setResourceAvailability(availabilityMap)
  }

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/projects/${params.id}/phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPhase)
      })
      if (response.ok) {
        fetchProject()
        setNewPhase({ name: '', duration: 1 })
      }
    } catch (err) {
      console.error('Failed to add phase:', err)
    }
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // For custom resources, first create a template if fields are configured
      let templateId = newResource.resourceTemplateId

      if (isCustomResource && customFields.length > 0) {
        const createTemplate = confirm(
          `Would you like to save "${newResource.resourceType}" as a reusable template? This will make it available for future projects.`
        )
        
        if (createTemplate) {
          const description = prompt('Enter a description for this resource template (optional):') || ''
          const templateCreated = await createTemplateFromCustomResource(newResource.resourceType, description)
          
          if (templateCreated) {
            // Find the newly created template
            const templates = await fetch('/api/resource-templates').then(r => r.json())
            const newTemplate = templates.find((t: ResourceTemplate) => t.name === newResource.resourceType)
            if (newTemplate) {
              templateId = newTemplate.id
            }
          }
        }
      }

      const response = await fetch(`/api/phases/${newResource.phaseId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceType: newResource.resourceType,
          resourceTemplateId: templateId || null,
          configuration: newResource.configuration,
          quantity: newResource.quantity
        })
      })
      
      if (response.ok) {
        fetchProject()
        setNewResource({ 
          phaseId: '', 
          resourceType: '', 
          resourceTemplateId: '',
          configuration: '{}',
          quantity: 1
        })
        setCustomFields([])
        setSelectedTemplate(null)
        setResourceConfig({})
        setIsCustomResource(false)
      }
    } catch (err) {
      console.error('Failed to add resource:', err)
    }
  }

  const handleEditProject = () => {
    console.log('Edit project clicked')
    setEditingProject(true)
  }

  const handleCancelEdit = () => {
    setEditingProject(false)
    if (project) {
      setEditedProject({
        name: project.name,
        client: project.client,
        startDate: project.startDate.includes('T') ? project.startDate.split('T')[0] : project.startDate,
        endDate: project.endDate.includes('T') ? project.endDate.split('T')[0] : project.endDate,
        userEmails: project.users.map(user => user.email).join(', ')
      })
    }
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare the update data
      const updateData = {
        ...editedProject,
        userEmails: editedProject.userEmails
          .split(',')
          .map(email => email.trim())
          .filter(email => email)
      }
      
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      if (response.ok) {
        fetchProject()
        setEditingProject(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update project')
      }
    } catch (err) {
      console.error('Failed to update project:', err)
      setError('An error occurred while updating the project')
    }
  }

  const handleApproveRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED', rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      })
      if (response.ok) {
        fetchProject()
        // Refresh resource availability after approval/rejection
        setTimeout(() => {
          fetchResourceAvailability()
        }, 500)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update request')
      }
    } catch (err) {
      console.error('Failed to approve request:', err)
      setError('An error occurred while updating the request')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="space-y-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-[400px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
          <Skeleton className="h-[500px]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-700 text-lg font-medium mb-2">Error Loading Project</p>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={fetchProject} 
              variant="outline" 
              className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Project Not Found</p>
            <p className="text-gray-500">The requested project could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate project metrics
  const totalResources = project.phases.reduce((sum, phase) => sum + phase.resources.length, 0)
  const totalRequests = project.phases.reduce((sum, phase) => sum + phase.resourceRequests.length, 0)
  const pendingRequests = project.phases.reduce((sum, phase) => 
    sum + phase.resourceRequests.filter(req => req.status === 'PENDING').length, 0
  )
  
  // Calculate project progress and status
  const phasesWithResources = project.phases.filter(phase => phase.resources.length > 0).length
  const totalPhases = project.phases.length
  const progressPercentage = totalPhases > 0 ? (phasesWithResources / totalPhases) * 100 : 0
  
  const now = new Date()
  const startDate = new Date(project.startDate)
  const endDate = new Date(project.endDate)
  const isActive = now >= startDate && now <= endDate
  const isUpcoming = now < startDate
  const isCompleted = now > endDate

  const statusVariant = isActive ? 'default' : isUpcoming ? 'secondary' : 'outline'
  const statusText = isActive ? 'ACTIVE' : isUpcoming ? 'UPCOMING' : 'COMPLETED'

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <Badge variant={statusVariant} className="text-sm">
                {statusText}
              </Badge>
            </div>
            <p className="text-lg text-gray-600 mb-2">Client: {project.client}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resources</p>
                  <p className="text-2xl font-bold text-blue-600">{totalResources}</p>
                  <p className="text-xs text-gray-500">
                    Across {project.phases.length} phases
                  </p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requests</p>
                  <p className="text-2xl font-bold text-purple-600">{totalRequests}</p>
                  <p className="text-xs text-gray-500">
                    {pendingRequests} pending approval
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{Math.round(progressPercentage)}%</p>
                  <p className="text-xs text-gray-500">
                    {phasesWithResources}/{totalPhases} phases configured
                  </p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Progress Bar */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Project Configuration Progress</h3>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {Math.round(progressPercentage)}% Complete
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{phasesWithResources} phases with resources</span>
                <span>{totalPhases - phasesWithResources} phases remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="phases" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Phases & Resources
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Requests ({pendingRequests})
          </TabsTrigger>
          <TabsTrigger value="manage" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Manage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                    <p className="text-lg font-semibold">{new Date(project.startDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">End Date</Label>
                    <p className="text-lg font-semibold">{new Date(project.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Duration</Label>
                  <p className="text-lg font-semibold">
                    {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <Separator />
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusVariant}>{statusText}</Badge>
                    {isActive && <span className="text-green-600 text-sm">• In Progress</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="phases" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Project Phases ({project.phases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.phases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="mx-auto h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Phases Yet</h3>
                  <p className="mb-4">Get started by adding the first phase to your project.</p>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setActiveTab('manage')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Phase
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {project.phases.map((phase, index) => (
                    <Card key={phase.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {phase.resources.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Database className="mx-auto h-10 w-10 mb-3 text-gray-300" />
                            <p className="font-medium mb-1">No Resources Configured</p>
                            <p className="text-sm">Add resources to enable user requests for this phase.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium flex items-center gap-2">
                                <Database className="h-4 w-4" />
                                Resources ({phase.resources.length})
                              </h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {phase.resources.map((resource) => {
                                const availability = resourceAvailability.get(resource.id)
                                const isFullyAllocated = availability && availability.availableQuantity === 0
                                const isPartiallyAllocated = availability && availability.allocatedQuantity > 0 && availability.availableQuantity > 0
                                
                                return (
                                  <Card key={resource.id} className={`border transition-colors ${
                                    isFullyAllocated ? 'border-red-300 bg-red-50' : 
                                    isPartiallyAllocated ? 'border-yellow-300 bg-yellow-50' : 
                                    'border-gray-200 hover:border-blue-300'
                                  }`}>
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <h6 className="font-medium text-gray-900">{resource.resourceType}</h6>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                            {resource.quantity} total
                                          </Badge>
                                          {availability && (
                                            <Badge 
                                              variant={isFullyAllocated ? 'destructive' : isPartiallyAllocated ? 'secondary' : 'default'}
                                              className="text-xs"
                                            >
                                              {availability.availableQuantity} available
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-2 text-sm">
                                        <div className="grid grid-cols-2 gap-2">
                                          {renderResourceConfig(resource.configuration)}
                                        </div>
                                        <Separator className="my-2" />
                                        
                                        {/* Availability Status */}
                                        {availability && (
                                          <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                              <span className="text-gray-600">Allocated:</span>
                                              <span className={availability.allocatedQuantity > 0 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                                                {availability.allocatedQuantity}/{availability.totalQuantity}
                                              </span>
                                            </div>
                                            {availability.allocatedQuantity > 0 && (
                                              <Progress 
                                                value={(availability.allocatedQuantity / availability.totalQuantity) * 100} 
                                                className="h-2"
                                              />
                                            )}
                                            {availability.allocatedQuantity > 0 && availability.allocatedTo && (
                                              <div className="mt-2 p-2 bg-white rounded border text-xs">
                                                <p className="font-medium text-gray-700 mb-1">Allocated to:</p>
                                                {availability.allocatedTo.slice(0, 2).map((allocation: any, idx: number) => (
                                                  <div key={idx} className="flex justify-between">
                                                    <span className="text-gray-600">{allocation.user.name}:</span>
                                                    <span className="font-medium">{allocation.quantity} units</span>
                                                  </div>
                                                ))}
                                                {availability.allocatedTo.length > 2 && (
                                                  <div className="text-gray-500 text-center mt-1">
                                                    +{availability.allocatedTo.length - 2} more...
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Quantity:</span>
                                          <span className="font-medium">{resource.quantity}</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resource Requests
                {pendingRequests > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {pendingRequests} Pending
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalRequests === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="mx-auto h-16 w-16 mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Resource Requests Yet</h3>
                  <p>Resource requests will appear here when users submit them.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.phases.map((phase) => 
                    phase.resourceRequests.map((request) => (
                      <Card key={request.id} className={`border-l-4 ${
                        request.status === 'PENDING' ? 'border-l-yellow-500 bg-yellow-50' :
                        request.status === 'APPROVED' ? 'border-l-green-500 bg-green-50' :
                        'border-l-red-500 bg-red-50'
                      }`}>
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {request.user.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-lg">
                                  {request.resourceTemplate?.name || request.resourceType || 'Custom Resource'} Request
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                  by {request.user.name} • {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={
                                request.status === 'APPROVED' ? 'default' : 
                                request.status === 'REJECTED' ? 'destructive' : 
                                'secondary'
                              }
                              className="w-fit"
                            >
                              {request.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                              {request.status === 'APPROVED' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {request.status === 'REJECTED' && <XCircle className="h-3 w-3 mr-1" />}
                              {request.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h6 className="font-medium mb-3 text-gray-900">Request Details</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phase:</span>
                                  <span className="font-medium">{phase.name}</span>
                                </div>
                                {renderResourceConfig(request.requestedConfig)}
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="font-medium">{request.requestedQty}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h6 className="font-medium mb-3 text-gray-900">Contact</h6>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">User:</span>
                                  <span className="font-medium">{request.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="font-medium">{request.user.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Date:</span>
                                  <span className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {request.justification && (
                            <div className="mt-4">
                              <h6 className="font-medium mb-2 text-gray-900">Justification</h6>
                              <div className="bg-white p-3 rounded border border-gray-200">
                                <p className="text-sm text-gray-700">{request.justification}</p>
                              </div>
                            </div>
                          )}
                          
                          {request.status === 'REJECTED' && request.rejectionReason && (
                            <div className="mt-4 bg-red-100 p-3 rounded border border-red-300">
                              <h6 className="font-medium text-red-800 mb-1">Rejection Reason</h6>
                              <p className="text-sm text-red-700">{request.rejectionReason}</p>
                            </div>
                          )}
                          
                          {request.status === 'PENDING' && (
                            <div className="mt-4 flex gap-2">
                              <Button 
                                onClick={() => handleApproveRequest(request.id, 'APPROVED')}
                                className="bg-green-600 hover:bg-green-700"
                                size="sm"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                onClick={() => {
                                  const reason = prompt('Please provide a rejection reason:')
                                  if (reason) handleApproveRequest(request.id, 'REJECTED', reason)
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <div className="space-y-6">
            {/* Edit Project Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Project Details
                  </CardTitle>
                  {!editingProject ? (
                    <Button onClick={handleEditProject} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Project
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingProject ? (
                  <form onSubmit={handleUpdateProject} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="projectName">Project Name</Label>
                        <Input
                          id="projectName"
                          value={editedProject.name}
                          onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
                          placeholder="Enter project name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectClient">Client</Label>
                        <Input
                          id="projectClient"
                          value={editedProject.client}
                          onChange={(e) => setEditedProject({ ...editedProject, client: e.target.value })}
                          placeholder="Enter client name"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="projectStartDate">Start Date</Label>
                        <Input
                          id="projectStartDate"
                          type="date"
                          value={editedProject.startDate}
                          onChange={(e) => setEditedProject({ ...editedProject, startDate: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="projectEndDate">End Date</Label>
                        <Input
                          id="projectEndDate"
                          type="date"
                          value={editedProject.endDate}
                          onChange={(e) => setEditedProject({ ...editedProject, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    {/* User Access Management */}
                    <div className="space-y-2">
                      <Label htmlFor="projectUserEmails">Assigned User Emails</Label>
                      <Textarea
                        id="projectUserEmails"
                        value={editedProject.userEmails}
                        onChange={(e) => setEditedProject({ ...editedProject, userEmails: e.target.value })}
                        placeholder="Enter email addresses separated by commas"
                        rows={3}
                      />
                      <p className="text-sm text-gray-500">
                        Enter email addresses of users who should have access to this project, separated by commas.
                        Leave empty to keep current user assignments.
                      </p>
                    </div>
                    
                    {error && (
                      <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Update Project
                      </Button>
                      <Button type="button" onClick={handleCancelEdit} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Project Name</Label>
                        <p className="text-lg font-semibold">{project?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Client</Label>
                        <p className="text-lg font-semibold">{project?.client}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Project Phases</Label>
                        <p className="text-lg font-semibold text-green-600">{project?.phases.length || 0} phases</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                        <p className="text-lg font-semibold">{project && new Date(project.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">End Date</Label>
                        <p className="text-lg font-semibold">{project && new Date(project.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Total Resources</Label>
                        <p className="text-lg font-semibold text-blue-600">{totalResources} resources</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User Access Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Access ({project?.users.length || 0} assigned)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project?.users && project.users.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {project.users.map((user) => (
                      <Badge key={user.id} variant="outline" className="flex items-center gap-2 px-3 py-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-gray-500 text-xs">{user.email}</div>
                        </div>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No users assigned to this project</p>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Add Phase Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPhase} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phaseName">Phase Name</Label>
                      <Input
                        id="phaseName"
                        value={newPhase.name}
                        onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                        placeholder="e.g., Development Phase"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phaseDuration">Duration (months)</Label>
                      <Input
                        id="phaseDuration"
                        type="number"
                        min="1"
                        value={newPhase.duration}
                        onChange={(e) => setNewPhase({ ...newPhase, duration: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phase
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Add Resource Section */}
            {project.phases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Add Resource to Phase
                  </CardTitle>
                  <CardDescription>
                    Choose from popular resource templates or create a custom resource that can become a reusable template.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddResource} className="space-y-6">
                    {/* Phase Selection */}
                    <div>
                      <Label htmlFor="resourcePhase">Select Phase</Label>
                      <select
                        id="resourcePhase"
                        className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600"
                        value={newResource.phaseId}
                        onChange={(e) => setNewResource({ ...newResource, phaseId: e.target.value })}
                        required
                      >
                        <option value="">Choose a phase...</option>
                        {project.phases.map((phase) => (
                          <option key={phase.id} value={phase.id}>
                            {phase.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Resource Type Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium">Resource Type</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={!isCustomResource ? "default" : "outline"}
                            size="sm"
                            onClick={switchToTemplateResource}
                          >
                            Use Template
                          </Button>
                          <Button
                            type="button"
                            variant={isCustomResource ? "default" : "outline"}
                            size="sm"
                            onClick={switchToCustomResource}
                          >
                            Create Custom
                          </Button>
                        </div>
                      </div>

                      {!isCustomResource ? (
                        // Template Selection Mode
                        <div>
                          <Label htmlFor="resourceTemplate">Choose Resource Template</Label>
                          <select
                            id="resourceTemplate"
                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600"
                            value={newResource.resourceTemplateId}
                            onChange={(e) => handleTemplateSelection(e.target.value)}
                            required
                          >
                            <option value="">Select a resource template...</option>
                            {resourceTemplates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name} - {template.description}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        // Custom Resource Mode
                        <div>
                          <Label htmlFor="customResourceType">Custom Resource Name</Label>
                          <Input
                            id="customResourceType"
                            value={newResource.resourceType || ''}
                            onChange={(e) => setNewResource({ ...newResource, resourceType: e.target.value })}
                            placeholder="e.g., Custom API Gateway, Specialized Database, etc."
                            required
                          />
                        </div>
                      )}
                    </div>

                    {/* Template Configuration Fields */}
                    {selectedTemplate && !isCustomResource && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium">Configure {selectedTemplate.name}</h4>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {selectedTemplate.fields.length} fields
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {selectedTemplate.fields.map((field) => (
                            <div key={field.id} className="space-y-2">
                              <Label htmlFor={field.name} className="flex items-center gap-2">
                                {field.label}
                                {field.isRequired && <span className="text-red-500">*</span>}
                                {field.unit && <span className="text-gray-500 text-xs">({field.unit})</span>}
                              </Label>
                              
                              {field.fieldType === 'SELECT' && field.options ? (
                                <select
                                  id={field.name}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600"
                                  value={resourceConfig[field.name] || field.defaultValue || ''}
                                  onChange={(e) => handleConfigChange(field.name, e.target.value, field.fieldType)}
                                  required={field.isRequired}
                                >
                                  <option value="">Choose {field.label.toLowerCase()}...</option>
                                  {JSON.parse(field.options).map((option: string) => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              ) : field.fieldType === 'BOOLEAN' ? (
                                <select
                                  id={field.name}
                                  className="w-full p-2 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600"
                                  value={resourceConfig[field.name]?.toString() || field.defaultValue || 'false'}
                                  onChange={(e) => handleConfigChange(field.name, e.target.value, field.fieldType)}
                                  required={field.isRequired}
                                >
                                  <option value="false">No</option>
                                  <option value="true">Yes</option>
                                </select>
                              ) : field.fieldType === 'NUMBER' ? (
                                <Input
                                  id={field.name}
                                  type="number"
                                  min={field.minValue || 0}
                                  max={field.maxValue || undefined}
                                  value={resourceConfig[field.name] || field.defaultValue || ''}
                                  onChange={(e) => handleConfigChange(field.name, e.target.value, field.fieldType)}
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  className="text-sm"
                                  required={field.isRequired}
                                />
                              ) : field.fieldType === 'TEXTAREA' ? (
                                <Textarea
                                  id={field.name}
                                  value={resourceConfig[field.name] || field.defaultValue || ''}
                                  onChange={(e) => handleConfigChange(field.name, e.target.value, field.fieldType)}
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  className="text-sm"
                                  rows={3}
                                  required={field.isRequired}
                                />
                              ) : (
                                <Input
                                  id={field.name}
                                  type="text"
                                  value={resourceConfig[field.name] || field.defaultValue || ''}
                                  onChange={(e) => handleConfigChange(field.name, e.target.value, field.fieldType)}
                                  placeholder={`Enter ${field.label.toLowerCase()}`}
                                  className="text-sm"
                                  required={field.isRequired}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Custom Resource Fields */}
                    {isCustomResource && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-md font-medium">Custom Properties</h4>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={addCustomField}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Property
                          </Button>
                        </div>
                        
                        {customFields.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
                            <Database className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                            <p className="text-sm">Add custom properties to define your resource configuration</p>
                            <p className="text-xs text-gray-400 mt-1">e.g., CPU cores, Memory, Storage, Network settings</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {customFields.map((field, index) => (
                              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                  <div>
                                    <Label className="text-xs">Property Name</Label>
                                    <Input
                                      value={field.name}
                                      onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                                      placeholder="e.g., cpu_cores"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Display Label</Label>
                                    <Input
                                      value={field.label}
                                      onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                                      placeholder="e.g., CPU Cores"
                                      className="text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Type</Label>
                                    <select
                                      className="w-full p-1.5 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                                      value={field.type}
                                      onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                                    >
                                      <option value="TEXT">Text</option>
                                      <option value="NUMBER">Number</option>
                                      <option value="SELECT">Dropdown</option>
                                      <option value="BOOLEAN">Yes/No</option>
                                      <option value="TEXTAREA">Long Text</option>
                                    </select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">
                                      {field.type === 'SELECT' ? 'Options (comma-separated)' : 'Default Value'}
                                    </Label>
                                    {field.type === 'SELECT' ? (
                                      <Input
                                        value={field.options?.join(',') || ''}
                                        onChange={(e) => updateCustomField(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                        placeholder="Option1,Option2,Option3"
                                        className="text-sm"
                                      />
                                    ) : (
                                      <Input
                                        type={field.type === 'NUMBER' ? 'number' : 'text'}
                                        value={field.value}
                                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                                        placeholder={field.type === 'NUMBER' ? '0' : 'Default value'}
                                        className="text-sm"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-xs">Unit</Label>
                                    <Input
                                      value={field.unit || ''}
                                      onChange={(e) => updateCustomField(index, 'unit', e.target.value)}
                                      placeholder="GB, cores, etc."
                                      className="text-sm"
                                    />
                                  </div>
                                  <div className="flex items-end justify-between">
                                    <Label className="text-xs flex items-center gap-1">
                                      <input
                                        type="checkbox"
                                        checked={field.required || false}
                                        onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                                        className="h-3 w-3"
                                      />
                                      Required
                                    </Label>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeCustomField(index)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="resourceQuantity">Quantity</Label>
                        <Input
                          id="resourceQuantity"
                          type="number"
                          min="1"
                          value={newResource.quantity || ''}
                          onChange={(e) => setNewResource({ ...newResource, quantity: parseInt(e.target.value) || 1 })}
                          required
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="submit" 
                          className="bg-green-600 hover:bg-green-700 w-full"
                          disabled={!isCustomResource && !selectedTemplate}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {isCustomResource ? 'Add Custom Resource' : 'Add Resource'}
                        </Button>
                      </div>
                    </div>

                    {isCustomResource && customFields.length > 0 && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          💡 <strong>Tip:</strong> After adding this custom resource, you&apos;ll be prompted to save it as a template for future use.
                        </p>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}