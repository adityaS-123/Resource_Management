'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Navigation from '@/components/navigation'

interface ResourceRequest {
  id: string
  resourceTemplateId?: string
  resourceType?: string
  resourceTemplate?: {
    id: string
    name: string
    description?: string
  }
  requestedConfig: string
  requestedQty: number
  justification: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  rejectionReason: string | null
  phase: {
    id: string
    name: string
    project: {
      id: string
      name: string
      client: string
    }
  }
  approvedBy: {
    id: string
    name: string
  } | null
}

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<ResourceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  // Helper function to parse and display configuration
  const renderConfiguration = (configString: string) => {
    try {
      const config = JSON.parse(configString)
      return Object.entries(config).map(([key, value], index) => {
        if (value !== null && value !== undefined && value !== '') {
          // Format the key to be more readable
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
            'memory': 'Memory'
          }
          
          if (keyMappings[key.toLowerCase()]) {
            formattedKey = keyMappings[key.toLowerCase()]
          }
          
          // Add appropriate units for common fields
          let formattedValue = value
          if (key.toLowerCase().includes('ram') || key.toLowerCase().includes('memory') || key.toLowerCase().includes('disk') || key.toLowerCase().includes('storage')) {
            if (typeof value === 'number' && !value.toString().includes('GB') && !value.toString().includes('MB')) {
              formattedValue = `${value}GB`
            }
          }
          
          return (
            <div key={index} className="text-sm">
              {formattedKey}: {String(formattedValue)}
            </div>
          )
        }
        return null
      }).filter(Boolean)
    } catch {
      return <span className="text-gray-500 text-xs">Invalid config</span>
    }
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
        const response = await fetch('/api/requests')
        const data = await response.json()
        setRequests(data)
      } catch (error) {
        console.error('Error fetching requests:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status}
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Resource Requests</h1>
            <Link href="/user/requests/new">
              <Button>New Request</Button>
            </Link>
          </div>

          {/* Filter Buttons */}
          <div className="flex space-x-2 mb-6">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                onClick={() => setFilter(status as any)}
              >
                {status}
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
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No requests found</p>
                  <Link href="/user/requests/new">
                    <Button>Create Your First Request</Button>
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Specifications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.phase.project.name}</div>
                            <div className="text-sm text-gray-500">{request.phase.project.client}</div>
                          </div>
                        </TableCell>
                        <TableCell>{request.phase.name}</TableCell>
                        <TableCell>
                          {getResourceType(request)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {renderConfiguration(request.requestedConfig)}
                            <div className="font-medium">Qty: {request.requestedQty}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {request.status === 'APPROVED' && request.approvedBy && (
                              <div className="text-green-600">
                                Approved by {request.approvedBy.name}
                              </div>
                            )}
                            {request.status === 'REJECTED' && (
                              <div className="text-red-600">
                                {request.rejectionReason}
                              </div>
                            )}
                            {request.status === 'PENDING' && (
                              <div className="text-yellow-600">
                                Waiting for approval
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}