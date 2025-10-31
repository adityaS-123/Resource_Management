'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navigation from '@/components/navigation'

interface Project {
  id: string
  name: string
  client: string
  startDate: string
  endDate: string
  phases: any[]
  users: any[]
  createdBy: any
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      console.log('Fetching projects...')
      try {
        const response = await fetch('/api/projects')
        const data = await response.json()
        console.log('Fetched', data.length, 'projects')
        setProjects(data)
      } catch (error) {
        console.error('Error fetching projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()

    // Add event listener for page visibility changes to detect if user navigates back
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible - user may have navigated back')
      }
    }

    const handleFocus = () => {
      console.log('Window received focus - user may have navigated back')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will permanently delete all associated phases, resources, and requests.')) return

    try {
      console.log('Attempting to delete project with ID:', id)
      const response = await fetch(`/api/projects/${id}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('Delete response status:', response.status)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Delete failed with error:', error)
        throw new Error(error.error || 'Failed to delete project')
      }
      
      const result = await response.json()
      console.log('Delete successful:', result)
      
      // Remove from local state only if deletion was successful
      setProjects(prevProjects => {
        const updatedProjects = prevProjects.filter(p => p.id !== id)
        console.log('Updated projects list, new length:', updatedProjects.length)
        return updatedProjects
      })
      
      alert('Project deleted successfully!')
    } catch (error) {
      console.error('Error deleting project:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error deleting project: ${errorMessage}`)
    }
  }

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
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <Link href="/admin/projects/new">
              <Button>Create New Project</Button>
            </Link>
          </div>

          <div className="grid gap-6">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No projects found</p>
                  <Link href="/admin/projects/new">
                    <Button className="mt-4">Create Your First Project</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <p className="text-gray-600 mt-1">Client: {project.client}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/admin/projects/${project.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Link href={`/admin/projects/${project.id}?tab=manage`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteProject(project.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">
                          {new Date(project.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium">
                          {new Date(project.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Phases</p>
                        <Badge variant="outline">{project.phases.length} phases</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assigned Users</p>
                        <Badge variant="outline">{project.users.length} users</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created By</p>
                        <Badge variant="outline">{project.createdBy.name}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}