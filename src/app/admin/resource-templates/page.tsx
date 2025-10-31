'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PlusIcon, PencilIcon, TrashIcon, PowerIcon, Eye, Database, Hash, Type, ToggleLeft, Mail, Link2, FileText, X } from 'lucide-react'

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

interface ResourceTemplate {
  id: string
  name: string
  description?: string
  isActive: boolean
  fields: ResourceField[]
  createdAt: string
  updatedAt: string
}

export default function ResourceTemplatesPage() {
  const [templates, setTemplates] = useState<ResourceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ResourceTemplate | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    isActive: true
  })
  const [newTemplateFields, setNewTemplateFields] = useState<Omit<ResourceField, 'id' | 'sortOrder'>[]>([])
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/resource-templates')
      if (!response.ok) {
        throw new Error('Failed to fetch resource templates')
      }
      const data = await response.json()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/resource-templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to update template status')
      }

      await fetchTemplates() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this resource template? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/resource-templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      await fetchTemplates() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
    }
  }

  const handleViewDetails = (template: ResourceTemplate) => {
    setSelectedTemplate(template)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedTemplate(null)
  }

  const getFieldTypeIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'TEXT': return <Type className="h-4 w-4" />
      case 'NUMBER': return <Hash className="h-4 w-4" />
      case 'SELECT': return <Database className="h-4 w-4" />
      case 'BOOLEAN': return <ToggleLeft className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'URL': return <Link2 className="h-4 w-4" />
      case 'TEXTAREA': return <FileText className="h-4 w-4" />
      default: return <Type className="h-4 w-4" />
    }
  }

  const handleCreateTemplate = () => {
    setNewTemplate({ name: '', description: '', isActive: true })
    setNewTemplateFields([])
    setCreateError(null)
    setShowCreateModal(true)
  }

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setNewTemplate({ name: '', description: '', isActive: true })
    setNewTemplateFields([])
    setCreateError(null)
  }

  const addNewField = () => {
    setNewTemplateFields([...newTemplateFields, {
      name: '',
      label: '',
      fieldType: 'TEXT',
      isRequired: false,
      defaultValue: '',
      options: '',
      unit: '',
      minValue: undefined,
      maxValue: undefined
    }])
  }

  const updateNewField = (index: number, field: string, value: any) => {
    const updatedFields = [...newTemplateFields]
    updatedFields[index] = { ...updatedFields[index], [field]: value }
    setNewTemplateFields(updatedFields)
  }

  const removeNewField = (index: number) => {
    setNewTemplateFields(newTemplateFields.filter((_, i) => i !== index))
  }

  const handleSubmitNewTemplate = async () => {
    setIsCreating(true)
    setCreateError(null)

    try {
      // Validate required fields
      if (!newTemplate.name.trim()) {
        throw new Error('Template name is required')
      }

      // Validate fields
      for (let i = 0; i < newTemplateFields.length; i++) {
        const field = newTemplateFields[i]
        if (!field.name.trim() || !field.label.trim()) {
          throw new Error(`Field ${i + 1}: Name and label are required`)
        }
        if (field.fieldType === 'SELECT' && !field.options?.trim()) {
          throw new Error(`Field ${i + 1}: Select fields must have options`)
        }
      }

      const templateData = {
        name: newTemplate.name.trim(),
        description: newTemplate.description.trim() || undefined,
        isActive: newTemplate.isActive,
        fields: newTemplateFields.map((field, index) => ({
          name: field.name.trim(),
          label: field.label.trim(),
          fieldType: field.fieldType,
          isRequired: field.isRequired,
          defaultValue: field.defaultValue?.trim() || undefined,
          options: field.fieldType === 'SELECT' && field.options?.trim() ? 
            `["${field.options.split(',').map(opt => opt.trim()).filter(opt => opt).join('","')}"]` : 
            undefined,
          unit: field.unit?.trim() || undefined,
          minValue: field.fieldType === 'NUMBER' ? field.minValue : undefined,
          maxValue: field.fieldType === 'NUMBER' ? field.maxValue : undefined,
          sortOrder: index
        }))
      }

      const response = await fetch('/api/resource-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      await fetchTemplates() // Refresh the list
      closeCreateModal()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setIsCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <Button onClick={fetchTemplates} className="mt-2" variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Templates</h1>
          <p className="text-gray-600 mt-2">
            Manage custom resource types and their configuration fields
          </p>
        </div>
        <Button 
          onClick={handleCreateTemplate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resource templates</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first resource template.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className={`transition-opacity hover:shadow-lg ${!template.isActive ? 'opacity-50' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {template.name}
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    {template.description && (
                      <CardDescription>{template.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(template)}
                      title="View details"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(template.id, template.isActive)}
                      title={template.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <PowerIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(template.id)}
                      title="Delete template"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Fields ({template.fields.length})
                    </h4>
                    <div className="space-y-1">
                      {template.fields.slice(0, 3).map((field) => (
                        <div key={field.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 flex items-center gap-1">
                            {getFieldTypeIcon(field.fieldType)}
                            {field.label} ({field.fieldType.toLowerCase()})
                          </span>
                          {field.isRequired && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                        </div>
                      ))}
                      {template.fields.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{template.fields.length - 3} more fields
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleViewDetails(template)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Template Details Modal */}
      {showDetailsModal && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDetailsModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Database className="h-6 w-6 text-blue-600" />
                  {selectedTemplate.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Resource Template Details
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closeDetailsModal}
                className="rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Template Name</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-900 dark:text-white">{selectedTemplate.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <Badge variant={selectedTemplate.isActive ? 'default' : 'secondary'}>
                          {selectedTemplate.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    {selectedTemplate.description && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <p className="text-gray-900 dark:text-white">{selectedTemplate.description}</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-900 dark:text-white">
                          {new Date(selectedTemplate.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <p className="text-gray-900 dark:text-white">
                          {new Date(selectedTemplate.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fields Configuration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    Configuration Fields
                    <Badge variant="outline" className="text-xs">
                      {selectedTemplate.fields.length} fields
                    </Badge>
                  </h3>
                  
                  {selectedTemplate.fields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Database className="mx-auto h-12 w-12 mb-3 text-gray-300" />
                      <p>No configuration fields defined</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTemplate.fields
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((field, index) => (
                          <div 
                            key={field.id} 
                            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-750"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                                  {getFieldTypeIcon(field.fieldType)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900 dark:text-white">
                                    {field.label}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Field name: {field.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {field.fieldType}
                                </Badge>
                                {field.isRequired && (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              {field.defaultValue && (
                                <div>
                                  <label className="font-medium text-gray-700 dark:text-gray-300">Default Value</label>
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {field.defaultValue}
                                  </p>
                                </div>
                              )}
                              
                              {field.unit && (
                                <div>
                                  <label className="font-medium text-gray-700 dark:text-gray-300">Unit</label>
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {field.unit}
                                  </p>
                                </div>
                              )}
                              
                              {field.fieldType === 'NUMBER' && (field.minValue !== undefined || field.maxValue !== undefined) && (
                                <div>
                                  <label className="font-medium text-gray-700 dark:text-gray-300">Range</label>
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {field.minValue !== undefined ? field.minValue : '∞'} - {field.maxValue !== undefined ? field.maxValue : '∞'}
                                  </p>
                                </div>
                              )}
                              
                              {field.fieldType === 'SELECT' && field.options && (
                                <div className="md:col-span-3">
                                  <label className="font-medium text-gray-700 dark:text-gray-300">Options</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {JSON.parse(field.options).map((option: string, optIndex: number) => (
                                      <Badge key={optIndex} variant="secondary" className="text-xs">
                                        {option}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <Button variant="outline" onClick={closeDetailsModal}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => handleToggleStatus(selectedTemplate.id, selectedTemplate.isActive)}
              >
                <PowerIcon className="h-4 w-4 mr-1" />
                {selectedTemplate.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeCreateModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PlusIcon className="h-6 w-6 text-blue-600" />
                  Create New Resource Template
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Define a new resource type with custom configuration fields
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={closeCreateModal}
                className="rounded-full h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="space-y-6">
                {/* Error Display */}
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-red-800 font-medium">Error</h3>
                    <p className="text-red-600 mt-1">{createError}</p>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="e.g., Database Server, Load Balancer"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                      <select
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={newTemplate.isActive ? 'active' : 'inactive'}
                        onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.value === 'active' })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                      <textarea
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        rows={3}
                        value={newTemplate.description}
                        onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                        placeholder="Describe what this resource template is used for..."
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuration Fields */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuration Fields</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={addNewField}
                    >
                      <PlusIcon className="h-3 w-3 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  {newTemplateFields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
                      <Database className="mx-auto h-8 w-8 mb-2 text-gray-300" />
                      <p className="text-sm">Add configuration fields to define resource properties</p>
                      <p className="text-xs text-gray-400 mt-1">e.g., CPU cores, Memory, Storage, Network settings</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {newTemplateFields.map((field, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-750">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Field {index + 1}
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeNewField(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Field Name *</label>
                              <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                value={field.name}
                                onChange={(e) => updateNewField(index, 'name', e.target.value)}
                                placeholder="e.g., cpu_cores"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Display Label *</label>
                              <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                value={field.label}
                                onChange={(e) => updateNewField(index, 'label', e.target.value)}
                                placeholder="e.g., CPU Cores"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Field Type *</label>
                              <select
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                value={field.fieldType}
                                onChange={(e) => updateNewField(index, 'fieldType', e.target.value)}
                              >
                                <option value="TEXT">Text</option>
                                <option value="NUMBER">Number</option>
                                <option value="SELECT">Dropdown</option>
                                <option value="BOOLEAN">Yes/No</option>
                                <option value="EMAIL">Email</option>
                                <option value="URL">URL</option>
                                <option value="TEXTAREA">Long Text</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Default Value</label>
                              <input
                                type={field.fieldType === 'NUMBER' ? 'number' : 'text'}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                value={field.defaultValue}
                                onChange={(e) => updateNewField(index, 'defaultValue', e.target.value)}
                                placeholder="Default value"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Unit</label>
                              <input
                                type="text"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                value={field.unit}
                                onChange={(e) => updateNewField(index, 'unit', e.target.value)}
                                placeholder="GB, cores, etc."
                              />
                            </div>
                            <div className="flex items-end">
                              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={field.isRequired}
                                  onChange={(e) => updateNewField(index, 'isRequired', e.target.checked)}
                                  className="h-3 w-3"
                                />
                                Required
                              </label>
                            </div>
                            
                            {/* Conditional fields based on type */}
                            {field.fieldType === 'SELECT' && (
                              <div className="md:col-span-3">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Options (comma-separated) *
                                </label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                  value={field.options}
                                  onChange={(e) => updateNewField(index, 'options', e.target.value)}
                                  placeholder="Option1,Option2,Option3"
                                  required={field.fieldType === 'SELECT'}
                                />
                              </div>
                            )}
                            
                            {field.fieldType === 'NUMBER' && (
                              <>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Min Value</label>
                                  <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                    value={field.minValue || ''}
                                    onChange={(e) => updateNewField(index, 'minValue', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Minimum"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Max Value</label>
                                  <input
                                    type="number"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                                    value={field.maxValue || ''}
                                    onChange={(e) => updateNewField(index, 'maxValue', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Maximum"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <Button type="button" variant="outline" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmitNewTemplate}
                disabled={isCreating || !newTemplate.name.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}