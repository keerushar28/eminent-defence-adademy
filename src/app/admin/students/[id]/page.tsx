import StudentDetailView from "@/features/admin/students/components/StudentDetailView"

interface StudentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { id } = await params
  return <StudentDetailView studentId={id} />
} 