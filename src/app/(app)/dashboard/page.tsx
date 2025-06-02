
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visualize your trading performance, including your equity curve based on RR.
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
    </div>
  );
}
