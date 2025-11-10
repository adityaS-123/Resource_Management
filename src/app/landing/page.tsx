'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Users, 
  Server, 
  Shield, 
  Workflow,
  BarChart3,
  Zap,
  Settings,
  FileText,
  UserCheck,
  Building2,
  Globe,
  ChevronRight
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: <Workflow className="h-8 w-8 text-blue-600" />,
      title: "Multi-Level Approval Workflow",
      description: "Streamlined approval process with Department Head, IT Head, and Admin levels ensuring proper resource governance.",
      badge: "Core Feature"
    },
    {
      icon: <Server className="h-8 w-8 text-green-600" />,
      title: "Resource Template System",
      description: "Pre-configured templates for VMs, databases, storage, and custom resources with dynamic field validation.",
      badge: "Flexibility"
    },
    {
      icon: <UserCheck className="h-8 w-8 text-purple-600" />,
      title: "Role-Based Access Control",
      description: "Granular permissions for Regular Users, Department Heads, IT Teams, and Administrators.",
      badge: "Security"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-orange-600" />,
      title: "Project Management",
      description: "Organize resources by projects and phases with cost tracking and allocation management.",
      badge: "Organization"
    },
    {
      icon: <Settings className="h-8 w-8 text-indigo-600" />,
      title: "IT Task Management",
      description: "Dedicated workflow for IT teams to provision, configure, and deliver approved resources.",
      badge: "Automation"
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Audit Trail",
      description: "Complete tracking of all requests, approvals, and resource lifecycle with detailed logging.",
      badge: "Compliance"
    }
  ]

  const workflowSteps = [
    {
      step: 1,
      title: "Submit Request",
      description: "Users create resource requests using customizable templates with detailed specifications.",
      icon: <FileText className="h-6 w-6" />
    },
    {
      step: 2,
      title: "Multi-Level Approval",
      description: "Requests flow through Department Head → IT Head → Admin approval levels as configured.",
      icon: <UserCheck className="h-6 w-6" />
    },
    {
      step: 3,
      title: "IT Provisioning",
      description: "Approved requests are assigned to IT teams for resource provisioning and configuration.",
      icon: <Settings className="h-6 w-6" />
    },
    {
      step: 4,
      title: "Resource Delivery",
      description: "IT teams complete the request and provide access credentials and configuration details.",
      icon: <CheckCircle className="h-6 w-6" />
    }
  ]

  const stats = [
    { label: "Approval Levels", value: "3", icon: <UserCheck className="h-5 w-5" /> },
    { label: "User Roles", value: "5", icon: <Users className="h-5 w-5" /> },
    { label: "Request Types", value: "∞", icon: <Server className="h-5 w-5" /> },
    { label: "Projects", value: "Multi", icon: <Building2 className="h-5 w-5" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <div className="text-white font-bold text-lg">AM</div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Resource Management</h1>
                <p className="text-sm text-gray-600">Powered by Amnex</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" className="bg-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Enterprise Resource Management
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Streamline Your
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Resource </span>
            Workflow
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Automate resource provisioning with multi-level approvals, project management, 
            and IT task orchestration. Built for enterprise teams who need control, 
            visibility, and efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 bg-white">
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Resource Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to manage, approve, and provision resources across your organization
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, transparent workflow from request to delivery
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="border-0 shadow-lg h-full">
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                      {step.step}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center mb-3 text-blue-600">
                      {step.icon}
                    </div>
                    <CardDescription className="text-center text-gray-600 leading-relaxed">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
                {index < workflowSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-blue-400">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Resource Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join organizations that trust our platform to streamline their resource workflows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" variant="outline" className="border-white text-black hover:bg-white/10 text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-col items-center gap-8">
            <div>
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <div className="text-white font-bold text-sm">AM</div>
                </div>
                <div>
                  <h3 className="font-bold">Resource Management</h3>
                  <p className="text-sm text-gray-400">Powered by Amnex</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                Enterprise-grade resource management platform for organizations.
              </p>
            </div>
            
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Amnex. All rights reserved. Resource Management Platform.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}