import { toast } from "sonner";
import { deleteStudent, updateStudent, deleteMultipleStudents } from "../actions/student-actions";

export const useStudent = () => {
  const handleDeleteStudent = async (id: string) => {
    try {
      const result = await deleteStudent(id);
      if (result.success) {
        toast.success("Student deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete student");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const handleDeleteMultipleStudents = async (ids: string[]) => {
    try {
      const result = await deleteMultipleStudents(ids);
      if (result.success) {
        toast.success(`${result.deletedCount} student(s) deleted successfully`);
        return result;
      } else {
        toast.error(result.error || "Failed to delete students");
        return result;
      }
    } catch (error) {
      console.error("Error deleting students:", error);
      toast.error("Failed to delete students");
      return { success: false, error: "Failed to delete students" };
    }
  };

  const handleUpdateStudent = async (id: string, formData: FormData) => {
    try {
      const result = await updateStudent(id, formData);
      if (result.success) {
        toast.success("Student updated successfully");
        return result;
      } else {
        toast.error(result.error || "Failed to update student");
        return result;
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast.error("Failed to update student");
      return { success: false, error: "Failed to update student" };
    }
  };

  return {
    handleDeleteStudent,
    handleDeleteMultipleStudents,
    handleUpdateStudent,
  };
};
