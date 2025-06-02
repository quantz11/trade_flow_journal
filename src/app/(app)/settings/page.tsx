
import { SettingsManager } from "@/components/settings/settings-manager";
// import { CustomColumnsManager } from "@/components/settings/custom-columns-manager"; // Removed import
import { FIELD_LABELS, INITIAL_OPTIONS } from "@/lib/constants";
import type { JournalEntryField } from "@/types";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const fieldsToManage = Object.keys(INITIAL_OPTIONS) as JournalEntryField[];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Application Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage journal form options and default values. Custom table columns are now managed directly on the Entry Log page.
        </p>
      </header>
      
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Form Field Options & Defaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fieldsToManage.map((fieldName) => (
            <SettingsManager
              key={fieldName}
              fieldName={fieldName}
              fieldLabel={FIELD_LABELS[fieldName]}
            />
          ))}
        </div>
      </div>

      {/* Section for CustomColumnsManager removed */}
      {/* 
      <Separator />

      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Custom Journal Columns</h2>
        <CustomColumnsManager />
      </div> 
      */}
    </div>
  );
}
