
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { SessionPieChart } from "@/components/dashboard/session-pie-chart"; // Added import
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator"; // Added import

export default function DashboardPage() {
  return (
    <div className="space-y-8"> {/* Increased spacing for multiple cards */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visualize your trading performance and patterns.
          </p>
        </div>
      </header>

      <Suspense fallback={
        <div className="flex justify-center items-center h-64 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading Equity Curve...</p>
        </div>
      }>
        <EquityCurveChart />
      </Suspense>

      {/* Separator can be used if desired, or just rely on space-y */}
      {/* <Separator className="my-8" />  */}

      <Suspense fallback={
        <div className="flex justify-center items-center h-64 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-muted-foreground">Loading Session Distribution...</p>
        </div>
      }>
        <SessionPieChart />
      </Suspense>
    </div>
  );
}
