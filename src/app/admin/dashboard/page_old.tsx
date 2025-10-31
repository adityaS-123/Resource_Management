'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import Navigation from '@/components/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  DollarSign, 
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  Plus,
  FileText
} from 'lucide-react'

interface DashboardStats {
  totalProjects: number
  totalRequests: number
  pendingRequests: number
  totalCost: number
  totalProfit: number
}

interface RecentRequest {
  id: string
  requestedType: string
  requestedCPU: number
  requestedRAM: number
  requestedQty: number
  user: {
    id: string
    name: string
    email: string
  }
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  phase: {
    name: string
    project: {
      name: string
    }
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalRequests: 0,
    pendingRequests: 0,
    totalCost: 0,
    totalProfit: 0
  })
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [projectsRes, requestsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/requests')
        ])

        const projects = await projectsRes.json()
        const requests = await requestsRes.json()

        const totalCost = projects.reduce((sum: number, p: any) => sum + p.totalCost, 0)
        const totalProfit = projects.reduce((sum: number, p: any) => sum + (p.totalCost * p.profitMargin / 100), 0)
        const pendingRequests = requests.filter((r: any) => r.status === 'PENDING').length

        setStats({
          totalProjects: projects.length,
          totalRequests: requests.length,
          pendingRequests,
          totalCost,
          totalProfit
        })

        setRecentRequests(requests.slice(0, 5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'default',
      APPROVED: 'default',
      REJECTED: 'destructive'
    } as const

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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProjects}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingRequests}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.totalCost.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.totalProfit.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Resource Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {recentRequests.length === 0 ? (
                <p className="text-gray-500">No recent requests</p>
              ) : (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{request.user.name}</div>
                        <div className="text-sm text-gray-500">
                          {request.phase.project.name} - {request.phase.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.requestedType}: {request.requestedCPU} CPU, {request.requestedRAM}GB RAM, Qty: {request.requestedQty}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(request.status)}
                        <div className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
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