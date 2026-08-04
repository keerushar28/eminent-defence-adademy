"use client";

import { useEffect, useState } from "react";
import { getIssuances } from "@/features/admin/inventory/actions/issuance-actions";
import IssuanceList from "@/features/admin/inventory/issuances/IssuanceList";
import IssueToStudent from "@/features/admin/inventory/issuances/IssueToStudent";
import { IStudentIssuance } from "@/features/admin/inventory/types/inventory-types";
import { Loader2 } from "lucide-react";

export default function IssueItemsPage() {
    const [issuances, setIssuances] = useState<IStudentIssuance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isIssueOpen, setIsIssueOpen] = useState(false);

    useEffect(() => {
        loadIssuances();
    }, []);

    const loadIssuances = async () => {
        setIsLoading(true);
        try {
            const data = await getIssuances();
            setIssuances(data);
        } catch (error) {
            console.error("Error loading issuances:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIssueSuccess = () => {
        setIsIssueOpen(false);
        loadIssuances();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Issue Items to Students</h1>
                <p className="text-muted-foreground">
                    Issue inventory items to students and manage returns
                </p>
            </div>

            <IssuanceList
                issuances={issuances}
                onIssueClick={() => setIsIssueOpen(true)}
            />

            <IssueToStudent
                isOpen={isIssueOpen}
                onClose={() => setIsIssueOpen(false)}
                onSuccess={handleIssueSuccess}
            />
        </div>
    );
}
