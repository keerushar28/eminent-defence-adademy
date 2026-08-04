'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/features/core/components/button"
import { Badge } from "@/features/core/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card"
import { Separator } from "@/features/core/components/separator"
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    MapPin,
    Calendar,
    User,
    Ruler,
    Weight,
    CreditCard,
    Loader2,
    AlertCircle,
    FileText,
    Paperclip,
    Eye,
    Home,
    Plus,
    X,
    ZoomIn
} from "lucide-react"
import { toast } from "sonner"
import { getStudentById } from "../actions/student-actions"
import { IStudent } from "../types/types"
import EditStudent from "./EditStudent"
import ImageLightbox from "@/features/core/components/shared/ImageLightboxGallery"
import IssuanceHistory from "./IssuanceHistory"
import StudentCategoryManagement from "./StudentCategoryManagement"
import { convertAdToBs } from "@/features/core/utils/convertAdToBs"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/features/core/components/dialog"

interface StudentDetailViewProps {
    studentId: string
}

// Helper Components
function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            <span className="text-sm font-medium truncate">{value}</span>
        </div>
    )
}

function ServiceBadge({ label, value }: { label: string; value: boolean }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
            <span className="text-sm font-medium">{label}</span>
            <Badge variant={value ? "default" : "outline"} className="text-xs">
                {value ? "Yes" : "No"}
            </Badge>
        </div>
    )
}

export default function StudentDetailView({ studentId }: StudentDetailViewProps) {
    const [student, setStudent] = useState<IStudent | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [lightboxIndex, setLightboxIndex] = useState(0)
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
    const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0)
    const router = useRouter()

    const fetchStudent = async () => {
        try {
            setLoading(true)
            setError(null)
            const studentData = await getStudentById(studentId)

            if (studentData) {
                setStudent(studentData)
                // Filter only image files for lightbox
                const images = studentData.images?.filter(url => {
                    const ext = url.split('.').pop()?.toLowerCase()
                    return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')
                }) || []
                setImageUrls(images)
            } else {
                setError("Student not found")
            }
        } catch (err) {
            console.error("Error fetching student:", err)
            setError("Failed to load student information")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (studentId) {
            fetchStudent()
        }
    }, [studentId])

    const handleEditSuccess = () => {
        fetchStudent()
        setCategoryRefreshTrigger(prev => prev + 1)
        toast.success("Student updated successfully!")
    }



    const formatBloodGroup = (bloodGroup: string) => {
        return bloodGroup.replace('_', ' ')
    }

    const calculateAge = (dob: Date | string) => {
        const birthDate = typeof dob === 'string' ? new Date(dob) : dob
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }

        return age
    }

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase()

        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
            return 'image'
        } else if (ext === 'pdf') {
            return 'pdf'
        } else if (['doc', 'docx'].includes(ext || '')) {
            return 'word'
        } else if (['xls', 'xlsx'].includes(ext || '')) {
            return 'excel'
        } else if (['ppt', 'pptx'].includes(ext || '')) {
            return 'powerpoint'
        }
        return 'file'
    }

    const getFileName = (path: string) => {
        return path.split('/').pop() || path
    }

    const openLightbox = (imageUrl: string) => {
        const index = imageUrls.indexOf(imageUrl)
        if (index !== -1) {
            setLightboxIndex(index)
            setLightboxOpen(true)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading student information...</span>
                </div>
            </div>
        )
    }

    if (error || !student) {
        return (
            <div className="container mx-auto py-6">
                <div className="flex flex-col items-center justify-center h-64">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Error Loading Student</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-6 animate-in fade-in-50 duration-500">
            <div className="w-full space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-semibold">{student.fullname}</h1>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsEditOpen(true)} size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                </div>

                {/* Profile Card */}
                <div className="flex gap-6 p-6 border rounded-lg bg-card">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-muted group cursor-pointer" onClick={() => setIsImagePreviewOpen(true)}>
                        <Image
                            src={`/api/images${student.student_image}` || "/uploads/default.jpg"}
                            alt={`${student.fullname}'s photo`}
                            width={80}
                            height={80}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/uploads/default.jpg"
                            }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="h-4 w-4 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                                {student.gender.charAt(0).toUpperCase() + student.gender.slice(1).toLowerCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {calculateAge(student.dob)} years
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {formatBloodGroup(student.blood_group)}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal */}
                    <div className="p-4 border rounded-lg bg-card">
                        <h3 className="text-sm font-semibold mb-3">Personal</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date of Birth</span>
                                <span className="font-medium">{convertAdToBs(student.dob)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Registration Date</span>
                                <span className="font-medium">{convertAdToBs(student.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Citizenship</span>
                                <span className="font-medium">{student.citizenship_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Height</span>
                                <span className="font-medium">{student.height} {student.heightUnit || 'cm'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Weight</span>
                                <span className="font-medium">{student.weight} {student.weightUnit || 'kg'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="p-4 border rounded-lg bg-card">
                        <h3 className="text-sm font-semibold mb-3">Contact</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Student Phone</span>
                                <span className="font-medium">{student.contact_number_student}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Parent Phone</span>
                                <span className="font-medium">{student.contact_number_parent}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Parent Name</span>
                                <span className="font-medium">{student.parentName}</span>
                            </div>
                            {student.guardianName && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Guardian Name</span>
                                    <span className="font-medium">{student.guardianName}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="p-4 border rounded-lg bg-card md:col-span-2">
                        <h3 className="text-sm font-semibold mb-3">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Permanent</p>
                                <p className="line-clamp-2">{student.permanent_address}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs mb-1">Temporary</p>
                                <p className="line-clamp-2">{student.temporary_address}</p>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="p-4 border rounded-lg bg-card">
                        <h3 className="text-sm font-semibold mb-3">Services</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Dress</span>
                                <Badge variant={student.dress ? "default" : "outline"} className="text-xs">
                                    {student.dress ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Books</span>
                                <Badge variant={student.books ? "default" : "outline"} className="text-xs">
                                    {student.books ? "Yes" : "No"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Hostel</span>
                                <Badge variant={student.hostel ? "default" : "outline"} className="text-xs">
                                    {student.hostel ? "Yes" : "No"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Qualifications */}
                    {student.qualifications && student.qualifications.length > 0 && (
                        <div className="p-4 border rounded-lg bg-card">
                            <h3 className="text-sm font-semibold mb-3">Qualifications</h3>
                            <div className="flex flex-wrap gap-2">
                                {student.qualifications.map((qual, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                        {qual}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Attachments */}
                {student.images && student.images.length > 0 && (
                    <div className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold">Attachments</h3>
                            <Badge variant="secondary" className="text-xs">{student.images.length}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {student.images.map((imageUrl, index) => {
                                const fileType = getFileIcon(imageUrl)
                                const fileName = getFileName(imageUrl)

                                return (
                                    <div
                                        key={index}
                                        className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-all bg-muted"
                                    >
                                        {fileType === 'image' ? (
                                            <div className="aspect-square relative cursor-pointer" onClick={() => openLightbox(imageUrl)}>
                                                <Image
                                                    src={`/api/images${imageUrl}`}
                                                    alt={`Attachment ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/uploads/placeholder.png"
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <Eye className="h-4 w-4 text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-square flex items-center justify-center">
                                                <FileText className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Category Assignments */}
                <StudentCategoryManagement
                    studentId={studentId}
                    studentName={student.fullname}
                    refreshTrigger={categoryRefreshTrigger}
                />

                {/* Issued Items */}
                <div className="p-4 border rounded-lg bg-card">
                    <h3 className="text-sm font-semibold mb-4">Issued Items</h3>
                    <IssuanceHistory studentId={studentId} />
                </div>

                {/* Hostel Allocations & Payments */}
                {(student as any).hostelAllocations && (student as any).hostelAllocations.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Hostel Allocations</h3>
                            <Badge variant="secondary" className="text-xs">{(student as any).hostelAllocations.length}</Badge>
                        </div>
                        <div className="space-y-3">
                            {(student as any).hostelAllocations.map((allocation: any) => {
                                const paidUntil = new Date(allocation.paidUntil)
                                const today = new Date()
                                const isExpired = paidUntil < today
                                const daysRemaining = Math.ceil((paidUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                                return (
                                    <div key={allocation.id} className="p-4 border rounded-lg bg-card">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold">
                                                    Room {allocation.bed?.room?.roomNumber} / Bed {allocation.bed?.bedNumber}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Allocated {new Date(allocation.allocationDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge 
                                                variant={allocation.isActive ? "default" : "outline"} 
                                                className="text-xs"
                                            >
                                                {allocation.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </div>

                                        {/* Payment Status */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-3">
                                            <div>
                                                <p className="text-muted-foreground">Paid Until</p>
                                                <p className="font-semibold">{paidUntil.toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Credit Balance</p>
                                                <p className="font-semibold text-green-600">NPR {Number(allocation.creditBalance).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Days Remaining</p>
                                                <p className={`font-semibold ${isExpired ? "text-red-600" : "text-green-600"}`}>
                                                    {isExpired ? "Expired" : `${daysRemaining}d`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Payment History */}
                                        {allocation.payments && allocation.payments.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">Recent Payments</p>
                                                <div className="space-y-1">
                                                    {allocation.payments.slice(0, 3).map((payment: any) => (
                                                        <div key={payment.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                                                            <div>
                                                                <p className="font-medium">NPR {Number(payment.amount).toLocaleString()}</p>
                                                                <p className="text-muted-foreground">
                                                                    {new Date(payment.paymentDate).toLocaleDateString()} • {payment.daysPurchased}d
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Image Lightbox */}
            <ImageLightbox
                images={imageUrls}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />

            {/* Profile Image Preview Dialog */}
            <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{student?.fullname}'s Profile Photo</DialogTitle>
                    </DialogHeader>
                    <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                        <Image
                            src={`/api/images${student?.student_image}` || "/uploads/default.jpg"}
                            alt={`${student?.fullname}'s photo`}
                            fill
                            className="object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/uploads/default.jpg"
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            {isEditOpen && (
                <EditStudent
                    studentId={student.id}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    )
}