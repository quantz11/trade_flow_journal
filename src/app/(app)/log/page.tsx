import { JournalEntryList } from "@/components/log/journal-entry-list";

export default function LogPage() {
  return (
    <div className="space-y-6">
      {/* <h1 className="text-3xl font-bold tracking-tight text-foreground">Trading Log</h1> */}
      <JournalEntryList />
    </div>
  );
}
