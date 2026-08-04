'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/features/core/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/features/core/components/card'
import { Badge } from '@/features/core/components/badge'
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/features/core/components/alert-dialog'
import { getPendingDeletionRequests, approveDeletionRequest, rejectDeletionRequest } from '@/features/admin/students/actions/deletion-request-actions'
import { getStudentById } from '@/features/admin/students/actions/student-actions'
import NepaliDate from 'nepali-date-converter'

interface DeletionRequest {
  id: string
  studentId: string
  studentName: string
  requestedBy: string
  requestedByRole: string
  status: string
  reason?: string
  approvedBy?: string
  approvedAt?: Date
  createdAt: Date
  requester?: {
    id: string
    username: string
    email: string
    role: string
  }
}

interface StudentInfo {
  email?: string
  student_image?: string
  contact_number_student?: string
  gender?: string
}

const formatDateString = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  try {
    const nepaliDate = new NepaliDate(dateObj)
    return nepaliDate.format('DD MMMM YYYY')
  } catch {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
}

export default function DeletionRequestsPage() {
  const [requests, setRequests] = useState<(DeletionRequest & { studentInfo?: StudentInfo; requesterInfo?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const data = await getPendingDeletionRequests()
      
      // Fetch student info for each request
      const requestsWithInfo = await Promise.all(
        (data as DeletionRequest[]).map(async (request) => {
          try {
            const studentData = await getStudentById(request.studentId)
            return {
              ...request,
              studentInfo: studentData || undefined,
            }
          } catch (error) {
            console.error(`Error fetching student ${request.studentId}:`, error)
            return request
          }
        })
      )
      
      setRequests(requestsWithInfo as any)
    } catch (error) {
      console.error('Error fetching deletion requests:', error)
      toast.error('Failed to fetch deletion requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (request: DeletionRequest) => {
    setSelectedRequest(request)
    setAction('approve')
    setDialogOpen(true)
  }

  const handleReject = (request: DeletionRequest) => {
    setSelectedRequest(request)
    setAction('reject')
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedRequest || !action) return

    try {
      if (action === 'approve') {
        setApproving(selectedRequest.id)
        const result = await approveDeletionRequest(selectedRequest.id, selectedRequest.studentId)
        if (result.success) {
          toast.success('Deletion approved', {
            description: `${selectedRequest.studentName} has been deleted`,
          })
          setRequests(requests.filter(r => r.id !== selectedRequest.id))
        } else {
          toast.error(result.error || 'Failed to approve deletion')
        }
      } else {
        setRejecting(selectedRequest.id)
        const result = await rejectDeletionRequest(selectedRequest.id)
        if (result.success) {
          toast.success('Deletion rejected', {
            description: `Deletion request for ${selectedRequest.studentName} has been rejected`,
          })
          setRequests(requests.filter(r => r.id !== selectedRequest.id))
        } else {
          toast.error(result.error || 'Failed to reject deletion')
        }
      }
    } finally {
      setApproving(null)
      setRejecting(null)
      setDialogOpen(false)
      setSelectedRequest(null)
      setAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading deletion requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Student Deletion Requests</h1>
        <p className="text-muted-foreground mt-2">Review and approve/reject student deletion requests from staff</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">No pending requests</p>
            <p className="text-muted-foreground">All deletion requests have been processed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  {/* Student Image and Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted border">
                      <Image
                        src={`/api/images${request.studentInfo?.student_image || '/uploads/default.jpg'}`}
                        alt={request.studentName}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/uploads/default.jpg'
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{request.studentName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.studentInfo?.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {request.studentInfo?.contact_number_student}
                      </p>
                    </div>
                  </div>

                  {/* Request Date */}
                  <Badge variant="outline" className="text-xs shrink-0">
                    {formatDateString(request.createdAt)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Requester Info */}
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Requested by</p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{request.requester?.username || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">{request.requester?.email || 'No email available'}</p>
                    <p className="text-xs text-muted-foreground">Role: {request.requester?.role || request.requestedByRole}</p>
                  </div>
                </div>

                {/* Student Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Gender</p>
                    <p className="font-medium capitalize">{request.studentInfo?.gender?.toLowerCase() || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Contact</p>
                    <p className="font-medium text-xs">{request.studentInfo?.contact_number_student || '-'}</p>
                  </div>
                </div>

                {request.reason && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Reason</p>
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">{request.reason}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(request)}
                    disabled={approving === request.id || rejecting === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {approving === request.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleReject(request)}
                    disabled={approving === request.id || rejecting === request.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    {rejecting === request.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approve' ? 'Approve Deletion' : 'Reject Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approve' ? (
                <>
                  Are you sure you want to approve the deletion of <span className="font-semibold">{selectedRequest?.studentName}</span>?
                  <p className="mt-2 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    This action cannot be undone.
                  </p>
                </>
              ) : (
                <>
                  Are you sure you want to reject the deletion request for <span className="font-semibold">{selectedRequest?.studentName}</span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
