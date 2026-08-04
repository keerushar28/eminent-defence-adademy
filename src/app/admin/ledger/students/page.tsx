import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import StudentLedgerPage from "@/features/admin/students/ledger/components/StudentLedgerPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StudentLedgerPage />
    </Suspense>
  );
}
