import { formatCurrency } from "../utils/utils";
import { HostelLedgerSummary } from "../types";

interface HostelSummaryCardsProps {
  summary: HostelLedgerSummary;
}

export default function HostelSummaryCards({ summary }: HostelSummaryCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-card rounded-lg p-3 border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Total Students</p>
        <p className="text-sm font-semibold mb-2">{summary.totalStudents}</p>
        <div className="flex items-center gap-1 flex-wrap text-xs">
          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-medium">
            {summary.fullyPaid} Paid
          </span>
          <span className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded font-medium">
            {summary.partial} Partial
          </span>
          <span className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded font-medium">
            {summary.pending} Pending
          </span>
          {summary.overpaid > 0 && (
            <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded font-medium">
              {summary.overpaid} Overpaid
            </span>
          )}
        </div>
      </div>

      <div className="bg-card rounded-lg p-3 border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Total Collected</p>
        <p className="text-sm font-semibold text-primary">
          {formatCurrency(summary.totalFeesCollected)}
        </p>
      </div>

      <div className="bg-card rounded-lg p-3 border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Pending Fees</p>
        <p className="text-sm font-semibold text-destructive">
          {formatCurrency(summary.totalPendingFees)}
        </p>
      </div>

      <div className="bg-card rounded-lg p-3 border">
        <p className="text-xs font-medium text-muted-foreground mb-1">Overpaid Amount</p>
        <p className="text-sm font-semibold text-primary">
          {formatCurrency(summary.totalOverpaidAmount)}
        </p>
      </div>
    </div>
  );
}
