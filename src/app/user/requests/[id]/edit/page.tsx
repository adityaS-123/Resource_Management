'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'
import { 
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

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
}

interface ResourceTemplate {
  id: string
  name: string
  description?: string
  approvalLevels: number
  fields: ResourceField[]
}

interface Phase {
  id: string
  name: string
  project: {
    id: string
    name: string
    client: string
  }
}

interface ResourceRequest {
  id: string
  status: string
  currentLevel: number
  requiredLevels: number
  requestedQty: number
  justification?: string
  requestedConfig: Record<string, any>
  canEdit: boolean
  resourceTemplate: ResourceTemplate
  phase: Phase
  approvals: any[]
}

export default function EditRequestPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const requestId = params.id as string

  const [request, setRequest] = useState<ResourceRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    requestedConfig: {} as Record<string, any>,
    requestedQty: 1,
    justification: ''
  })

  useEffect(() => {
    if (session) {
      fetchRequest()
    }
  }, [session, requestId])

  const fetchRequest = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/requests/${requestId}/edit`)
      if (!response.ok) {
        throw new Error('Failed to fetch request')
      }
      const data = await response.json()
      setRequest(data)
      setFormData({
        requestedConfig: data.requestedConfig || {},
        requestedQty: data.requestedQty,
        justification: data.justification || ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!request?.canEdit) {
      setError('This request can no longer be edited')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/requests/${requestId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update request')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/my-requests')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
            <p className="text-muted-foreground">Please sign in to edit requests</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-muted/30 rounded-2xl w-1/3"></div>
            <div className="h-6 bg-muted/20 rounded-xl w-2/3"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/30 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Request Not Found</h1>
              <p className="text-muted-foreground mb-6">The request you&apos;re looking for doesn&apos;t exist.</p>
              <Button asChild>
                <Link href="/my-requests">Back to My Requests</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!request.canEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">Request Cannot Be Edited</h1>
              <p className="text-muted-foreground mb-4">
                This request has been approved at level 1 or higher and can no longer be edited.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Current Status: <Badge>{request.status}</Badge>
              </p>
              <Button asChild>
                <Link href="/my-requests">Back to My Requests</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                  Edit Request
                </h1>
                <p className="text-muted-foreground mt-1">
                  Update your resource request details
                </p>
              </div>
            </div>
            <Badge variant="outline" className="px-4 py-2">
              {request.status}
            </Badge>
          </div>

          {/* Project Info */}
          <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Request Information</span>
              </CardTitle>
              <CardDescription>
                {request.phase.project.name} • {request.phase.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Template</Label>
                  <p className="font-semibold">{request.resourceTemplate.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-semibold">{request.status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Approval Level</Label>
                  <p className="font-semibold">{request.currentLevel} / {request.requiredLevels}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-semibold">{request.phase.project.client}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Request updated successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              You can edit this request until it receives approval at level 1. After that, you won&apos;t be able to make changes.
            </AlertDescription>
          </Alert>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Resource Configuration</CardTitle>
                <CardDescription>Update the requested configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dynamic Fields */}
                {request.resourceTemplate.fields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.name} className="font-semibold">
                      {field.label}
                      {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      {field.unit && <span className="text-muted-foreground text-sm ml-2">({field.unit})</span>}
                    </Label>

                    {field.fieldType === 'TEXT' && (
                      <Input
                        id={field.name}
                        type="text"
                        placeholder={field.defaultValue || ''}
                        value={formData.requestedConfig[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value)}
                        required={field.isRequired}
                        disabled={saving}
                      />
                    )}

                    {field.fieldType === 'EMAIL' && (
                      <Input
                        id={field.name}
                        type="email"
                        placeholder={field.defaultValue || ''}
                        value={formData.requestedConfig[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value)}
                        required={field.isRequired}
                        disabled={saving}
                      />
                    )}

                    {field.fieldType === 'URL' && (
                      <Input
                        id={field.name}
                        type="url"
                        placeholder={field.defaultValue || ''}
                        value={formData.requestedConfig[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value)}
                        required={field.isRequired}
                        disabled={saving}
                      />
                    )}

                    {field.fieldType === 'NUMBER' && (
                      <Input
                        id={field.name}
                        type="number"
                        placeholder={field.defaultValue || ''}
                        value={formData.requestedConfig[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value ? parseInt(e.target.value) : '')}
                        min={field.minValue}
                        max={field.maxValue}
                        required={field.isRequired}
                        disabled={saving}
                      />
                    )}

                    {field.fieldType === 'SELECT' && (
                      <Select
                        value={String(formData.requestedConfig[field.name] || '')}
                        onValueChange={(value) => handleConfigChange(field.name, value)}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options && JSON.parse(field.options).map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.fieldType === 'BOOLEAN' && (
                      <Select
                        value={String(formData.requestedConfig[field.name] ?? false)}
                        onValueChange={(value) => handleConfigChange(field.name, value === 'true')}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {field.fieldType === 'TEXTAREA' && (
                      <Textarea
                        id={field.name}
                        placeholder={field.defaultValue || ''}
                        value={formData.requestedConfig[field.name] || ''}
                        onChange={(e) => handleConfigChange(field.name, e.target.value)}
                        required={field.isRequired}
                        disabled={saving}
                        rows={4}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quantity & Justification */}
            <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="font-semibold">
                    Quantity Requested <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.requestedQty}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      requestedQty: parseInt(e.target.value) || 1
                    }))}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="justification" className="font-semibold">
                    Business Justification <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="justification"
                    placeholder="Explain why you need this resource..."
                    value={formData.justification}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      justification: e.target.value
                    }))}
                    required
                    disabled={saving}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || success}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
