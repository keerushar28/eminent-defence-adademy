"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized";
import { InvoiceGenerator } from "@/features/invoice/components/InvoiceGenerator";
import { FileText, Search } from "lucide-react";
import { getAllStudents } from "@/features/invoice/actions/invoice-actions";
import { useEffect } from "react";

export default function Invoice() {
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");
    const [selectedStudentName, setSelectedStudentName] = useState<string>("");
    const [students, setStudents] = useState<Record<string, unknown>[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const data = await getAllStudents();
                setStudents(data);
            } catch (error) {
                console.error("Error loading students:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStudents();
    }, []);

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentId(studentId);
        const student = students.find((s) => s.id === studentId);
        setSelectedStudentName((student?.fullname as string) || "");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b bg-card">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold">
                            Invoice Generator
                        </h1>
                    </div>
                    <p className="text-muted-foreground ml-11">
                        Generate and export student invoices in PDF format
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 py-4">
                {/* Student Selector */}
                <div className="mb-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Search className="h-4 w-4 text-muted-foreground" />
                                <CardTitle>Select Student</CardTitle>
                            </div>
                            <CardDescription>
                                Choose a student to generate their invoice
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StudentSelectorOptimized
                                value={selectedStudentId}
                                onValueChange={handleStudentSelect}
                                placeholder="Search by name, email, or ID..."
                                showAvatar={true}
                                showEmail={true}
                                showPhone={false}
                                showCategories={false}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Invoice Generator */}
                {selectedStudentId && selectedStudentName ? (
                    <div className="animate-in fade-in duration-300">
                        <InvoiceGenerator
                            studentId={selectedStudentId}
                            studentName={selectedStudentName}
                        />
                    </div>
                ) : (
                    <Card>
                        <CardContent className="pt-12 pb-12">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="p-3 bg-muted rounded-full mb-4">
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">
                                    No student selected
                                </h3>
                                <p className="text-muted-foreground">
                                    Search and select a student to generate their invoice
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
