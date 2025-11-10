'use client'

import { useState } from 'react'

interface TestRequest {
  id: string
  status: string
  currentLevel: number
  requiredLevels: number
  resourceType: string
  projectName: string
  userEmail: string
}

export default function TestApprovalsPage() {
  const [requests, setRequests] = useState<TestRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Simulate creating a test request
  const createTestRequest = async (approvalLevels: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/resource-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'test-template-id', // This would be a real template ID
          requestedQuantity: 1,
          requestedConfig: {
            memory: '8GB',
            storage: '256GB SSD',
            purpose: 'Development testing'
          },
          justification: `Testing ${approvalLevels}-level approval workflow`,
          phaseId: 'test-phase-id' // This would be a real phase ID
        })
      })

      if (response.ok) {
        const newRequest = await response.json()
        setRequests(prev => [...prev, newRequest])
        setMessage(`Test request created with ${approvalLevels} approval levels`)
      } else {
        setMessage('Failed to create test request')
      }
    } catch (error) {
      setMessage('Error creating test request')
    }
    setLoading(false)
  }

  // Process approval action
  const processApproval = async (requestId: string, action: 'approve' | 'reject', comments?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          action,
          comments: comments || `${action === 'approve' ? 'Approved' : 'Rejected'} via test interface`
        })
      })

      if (response.ok) {
        const result = await response.json()
        setMessage(result.message)
        
        // Update the request in our local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, ...result.request }
            : req
        ))
      } else {
        const error = await response.json()
        setMessage(`Failed to ${action}: ${error.message}`)
      }
    } catch (error) {
      setMessage(`Error processing ${action}`)
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Multi-Stage Approval System Test</h1>
      
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('Failed') || message.includes('Error') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      {/* Test Request Creation */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create Test Requests</h2>
        <p className="text-gray-600 mb-4">
          Create test requests with different approval levels to test the workflow:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => createTestRequest(0)}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Auto-Approve (Level 0)
          </button>
          
          <button
            onClick={() => createTestRequest(1)}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Dept Head (Level 1)
          </button>
          
          <button
            onClick={() => createTestRequest(2)}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            IT Head (Level 2)
          </button>
          
          <button
            onClick={() => createTestRequest(3)}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          >
            Admin (Level 3)
          </button>
        </div>
      </div>

      {/* Approval Level Explanation */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Approval Level Workflow</h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium mr-3">Level 0</span>
            <span>Auto-approved (no manual approval required)</span>
          </div>
          <div className="flex items-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">Level 1</span>
            <span>Department Head approval required</span>
          </div>
          <div className="flex items-center">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium mr-3">Level 2</span>
            <span>Level 1 → IT Head approval required</span>
          </div>
          <div className="flex items-center">
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium mr-3">Level 3</span>
            <span>Level 1 → Level 2 → Admin approval required</span>
          </div>
        </div>
      </div>

      {/* Test Requests List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Test Requests</h2>
        
        {requests.length === 0 ? (
          <p className="text-gray-500">No test requests created yet. Use the buttons above to create test requests.</p>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{request.resourceType}</h3>
                    <p className="text-sm text-gray-600">Project: {request.projectName}</p>
                    <p className="text-sm text-gray-600">Request ID: {request.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                    request.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-800' :
                    request.status === 'ASSIGNED_TO_IT' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Level: {request.currentLevel} / {request.requiredLevels}
                    <div className="w-64 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(request.currentLevel / Math.max(request.requiredLevels, 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {request.status === 'PENDING_APPROVAL' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => processApproval(request.id, 'approve')}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => processApproval(request.id, 'reject', 'Rejected during testing')}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3">Testing Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Create test requests with different approval levels using the buttons above</li>
          <li>For requests requiring approval, use the &quot;Approve&quot; or &quot;Reject&quot; buttons to simulate approver actions</li>
          <li>Watch how requests progress through the approval levels automatically</li>
          <li>Level 3 requests will go through: Level 1 → Level 2 → Level 3 → IT Assignment</li>
          <li>Email notifications are sent at each approval stage (check server logs)</li>
          <li>Final approval assigns the task to IT team members</li>
        </ol>
      </div>
    </div>
  )
}