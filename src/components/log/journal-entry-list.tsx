
"use client";

import React, { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Loader2, Eye, PlusCircle, Info, Link as LinkIcon, Save, Search, X, Calendar as CalendarIcon, Pencil, Settings2, Trash2, Columns as ColumnsIcon, ArrowUp, ArrowDown, Eraser } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getJournalEntries, getCustomColumnDefinitions, updateJournalEntry, addCustomColumnDefinition, removeCustomColumnDefinition, deleteJournalEntry, deleteAllJournalEntriesForUser } from "@/lib/firestore-service";
import type { JournalEntry, CustomColumn, JournalEntryField } from "@/types";
import { JOURNAL_ENTRY_FIELDS } from "@/types";
import { cn, getTextBasedTailwindColors } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIELD_LABELS, MULTI_SELECT_FIELDS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user-context"; 

const LOCALSTORAGE_COLUMN_ORDER_KEY_PREFIX = 'tradeflow-journal-column-order-';
const LOCALSTORAGE_VISIBLE_COLUMNS_KEY_PREFIX = 'tradeflow-journal-visible-columns-';


interface TableColumnConfig {
  key: string;
  label: string;
  isStandard: boolean;
}

export function JournalEntryList() {
  const [allEntries, setAllEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [fetchedCustomColumns, setFetchedCustomColumns] = useState<CustomColumn[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [editableCustomData, setEditableCustomData] = useState<{ [key: string]: string }>({});
  const [isSavingCustomData, startSavingTransition] = useTransition();
  const [isDeletingEntry, startDeletingTransition] = useTransition();
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [isDeletingAll, startDeletingAllTransition] = useTransition();


  const { toast } = useToast();
  const router = useRouter();
  const { username, isLoadingUser } = useUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPair, setFilterPair] = useState<string>("");
  const [filterOutcome, setFilterOutcome] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);

  const [isManageColumnsDialogOpen, setIsManageColumnsDialogOpen] = useState(false);
  const [newCustomColumnName, setNewCustomColumnName] = useState("");
  const [isMutatingColumnDef, startColumnDefMutation] = useTransition();

  const [allPossibleColumns, setAllPossibleColumns] = useState<TableColumnConfig[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());

  const columnOrderKey = username ? `${LOCALSTORAGE_COLUMN_ORDER_KEY_PREFIX}${username}` : '';
  const visibleColumnsKey = username ? `${LOCALSTORAGE_VISIBLE_COLUMNS_KEY_PREFIX}${username}` : '';


  useEffect(() => {
    const standardCols: TableColumnConfig[] = JOURNAL_ENTRY_FIELDS.map(key => ({
      key,
      label: FIELD_LABELS[key] || key,
      isStandard: true,
    }));
    const customColsConfig: TableColumnConfig[] = fetchedCustomColumns.map(cc => ({
      key: cc.id,
      label: cc.name,
      isStandard: false,
    }));
    const combined = [...standardCols, ...customColsConfig];
    setAllPossibleColumns(combined);
  }, [fetchedCustomColumns]);

  useEffect(() => {
    if (allPossibleColumns.length === 0 || !username) return;

    const allKeys = new Set(allPossibleColumns.map(c => c.key));
    let loadedOrder: string[] = [];
    let loadedVisible: Set<string> = new Set();

    try {
      const storedOrder = localStorage.getItem(columnOrderKey);
      if (storedOrder) loadedOrder = JSON.parse(storedOrder).filter((key: string) => allKeys.has(key));
      
      const storedVisible = localStorage.getItem(visibleColumnsKey);
      if (storedVisible) loadedVisible = new Set(JSON.parse(storedVisible).filter((key: string) => allKeys.has(key)));
    } catch (e) {
      console.error("Failed to load column settings from localStorage", e);
    }

    let finalOrder = loadedOrder.length > 0 ? loadedOrder : allPossibleColumns.map(c => c.key);
    let finalVisible = loadedVisible.size > 0 ? loadedVisible : new Set(allPossibleColumns.map(c => c.key));

    const currentOrderKeys = new Set(finalOrder);
    const newColumns = allPossibleColumns.filter(c => !currentOrderKeys.has(c.key));
    if (newColumns.length > 0) {
      finalOrder = [...finalOrder, ...newColumns.map(c => c.key)];
      newColumns.forEach(c => finalVisible.add(c.key));
    }
    finalOrder = finalOrder.filter(key => allKeys.has(key)); 
    finalVisible = new Set([...finalVisible].filter(key => allKeys.has(key)));

    setColumnOrder(finalOrder);
    setVisibleColumns(finalVisible);

  }, [allPossibleColumns, username, columnOrderKey, visibleColumnsKey]);


  useEffect(() => {
    if (columnOrder.length > 0 && username) {
      localStorage.setItem(columnOrderKey, JSON.stringify(columnOrder));
    }
  }, [columnOrder, username, columnOrderKey]);

  useEffect(() => {
     if ((visibleColumns.size > 0 || allPossibleColumns.length > 0) && username) {
      localStorage.setItem(visibleColumnsKey, JSON.stringify(Array.from(visibleColumns)));
    }
  }, [visibleColumns, allPossibleColumns, username, visibleColumnsKey]);


  const uniquePairs = useMemo(() => Array.from(new Set(allEntries.map(e => e.pair).filter(Boolean))).sort(), [allEntries]);
  const uniqueOutcomes = useMemo(() => Array.from(new Set(allEntries.map(e => e.outcome).filter(Boolean))).sort(), [allEntries]);

  const loadData = useCallback(async () => {
    if (!username) {
      setAllEntries([]);
      setFilteredEntries([]);
      setIsLoadingData(false);
      return;
    }
    setIsLoadingData(true);
    try {
      const [fetchedEntriesData, fetchedCustomColsData] = await Promise.all([
        getJournalEntries(username),
        getCustomColumnDefinitions(),
      ]);
      setAllEntries(fetchedEntriesData);
      setFilteredEntries(fetchedEntriesData); // Initially, filtered is same as all
      setFetchedCustomColumns(fetchedCustomColsData);
    } catch (error) {
      console.error("Failed to load journal entries or custom columns:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not load journal entries or custom columns.";
      toast({ title: "Error Loading Data", description: errorMessage, variant: "destructive" });
      setAllEntries([]); 
      setFilteredEntries([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [username, toast]);

  useEffect(() => {
    if (!isLoadingUser && username) { // Ensure username is available before loading data
        loadData();
    } else if (!isLoadingUser && !username) { // User is not logged in
      setIsLoadingData(false); // Stop loading indicator
      setAllEntries([]);
      setFilteredEntries([]);
    }
  }, [loadData, isLoadingUser, username]);


  useEffect(() => {
    if (selectedEntry) setEditableCustomData(selectedEntry.customData || {});
    else setEditableCustomData({});
  }, [selectedEntry]);

  useEffect(() => {
    let currentFiltered = [...allEntries];
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentFiltered = currentFiltered.filter(entry => {
        return [
          entry.pair, entry.type, ...(Array.isArray(entry.premarketCondition) ? entry.premarketCondition : []),
          ...(Array.isArray(entry.poi) ? entry.poi : []), ...(Array.isArray(entry.reactionToPoi) ? entry.reactionToPoi : []),
          ...(Array.isArray(entry.tp) ? entry.tp : []), ...(Array.isArray(entry.sl) ? entry.sl : []),
          entry.entryType, entry.session, ...(Array.isArray(entry.psychology) ? entry.psychology : []),
          entry.outcome, entry.rrRatio?.toString() || '', entry.tradingviewChartUrl || '',
          ...Object.values(entry.customData || {})
        ].join(' ').toLowerCase().includes(lowerSearchTerm);
      });
    }
    if (filterPair) currentFiltered = currentFiltered.filter(entry => entry.pair === filterPair);
    if (filterOutcome) currentFiltered = currentFiltered.filter(entry => entry.outcome === filterOutcome);
    if (filterDateFrom) {
      const from = new Date(filterDateFrom); from.setHours(0,0,0,0);
      currentFiltered = currentFiltered.filter(entry => new Date(entry.date) >= from);
    }
    if (filterDateTo) {
      const to = new Date(filterDateTo); to.setHours(23,59,59,999);
      currentFiltered = currentFiltered.filter(entry => new Date(entry.date) <= to);
    }
    setFilteredEntries(currentFiltered);
  }, [allEntries, searchTerm, filterPair, filterOutcome, filterDateFrom, filterDateTo]);


  const handleSaveCustomData = () => {
    if (!selectedEntry || !selectedEntry.id || !username) return;
    startSavingTransition(async () => {
      try {
        await updateJournalEntry(selectedEntry.id!, username, { customData: editableCustomData });
        toast({ title: "Success", description: "Custom data saved." });
        setAllEntries(prev => prev.map(e => e.id === selectedEntry.id ? { ...e, customData: { ...editableCustomData } } : e));
        // setSelectedEntry(prev => prev ? {...prev, customData: {...editableCustomData}} : null); // Keep dialog open for user to see success
        setSelectedEntry(null); // Close dialog after successful save
      } catch (error) {
        console.error("Error saving custom data:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to save custom data.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  const handleCustomDataChange = (columnName: string, value: string) => setEditableCustomData(prev => ({ ...prev, [columnName]: value }));
  const handleEditEntry = (entryId?: string) => {
    if (entryId) router.push(`/journal?edit=${entryId}`);
    setSelectedEntry(null);
  };

  const handleDeleteConfirmed = () => {
    if (!entryToDelete || !entryToDelete.id || !username) return;
    const idToDelete = entryToDelete.id;
    startDeletingTransition(async () => {
      try {
        await deleteJournalEntry(idToDelete, username);
        setAllEntries(prev => prev.filter(entry => entry.id !== idToDelete));
        setFilteredEntries(prev => prev.filter(entry => entry.id !== idToDelete)); 
        if (selectedEntry?.id === idToDelete) setSelectedEntry(null);
        toast({ title: "Success", description: "Journal entry deleted." });
      } catch (error) {
        console.error("Error deleting entry:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete entry.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      } finally {
        setEntryToDelete(null); 
      }
    });
  };

  const handleConfirmDeleteAll = () => {
    if (!username) {
      toast({ title: "Error", description: "Username not found. Cannot delete entries.", variant: "destructive" });
      return;
    }
    startDeletingAllTransition(async () => {
      try {
        await deleteAllJournalEntriesForUser(username);
        setAllEntries([]);
        setFilteredEntries([]); 
        toast({ title: "Success", description: "All trade history has been deleted." });
      } catch (error) {
        console.error("Error deleting all entries:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete all trade history.";
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
      }
    });
  };

  const clearFilters = () => { setSearchTerm(""); setFilterPair(""); setFilterOutcome(""); setFilterDateFrom(null); setFilterDateTo(null); };
  const getOutcomeBadgeVariant = (outcome: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (outcome?.toLowerCase()) {
      case "win": return "default"; case "loss": return "destructive";
      case "breakeven": return "secondary"; default: return "outline";
    }
  };

  const renderCellContent = (entry: JournalEntry, columnKey: string) => {
    const columnConfig = allPossibleColumns.find(c => c.key === columnKey);
    if (!columnConfig) return "-";
    let value: any = columnConfig.isStandard ? entry[columnKey as keyof JournalEntry] : entry.customData?.[columnConfig.label];

    if (columnKey === 'date') return value ? format(new Date(value as string), "MMM dd, yyyy") : "-";
    if (columnKey === 'outcome') return <Badge variant={getOutcomeBadgeVariant(value as string)} className="capitalize">{value || '-'}</Badge>;
    if (MULTI_SELECT_FIELDS.includes(columnKey as JournalEntryField) && Array.isArray(value)) {
      if (value.length === 0) return "-";
      return (
        <div className="flex flex-wrap gap-1">
          {(value as string[]).map((item, index) => {
            const colors = getTextBasedTailwindColors(item);
            return (
              <Badge
                key={index}
                className={cn(
                  "whitespace-nowrap",
                  colors.background,
                  colors.text,
                  colors.hoverBackground,
                  colors.border
                )}
              >
                {item}
              </Badge>
            );
          })}
        </div>
      );
    }
    if (columnKey === 'rrRatio') return (value !== undefined && value !== null) ? `${value}R` : "-";
    if (columnKey === 'tradingviewChartUrl' && value) return <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline"><LinkIcon className="inline h-3.5 w-3.5 mr-1" />Link</a>;
    return value?.toString() || "-";
  };

  const handleAddCustomColumn = () => {
    if (!newCustomColumnName.trim()) {
      toast({ title: "Validation Error", description: "Column name cannot be empty.", variant: "destructive" }); return;
    }
    startColumnDefMutation(async () => {
      try {
        await addCustomColumnDefinition(newCustomColumnName.trim());
        setNewCustomColumnName("");
        const updatedCols = await getCustomColumnDefinitions();
        setFetchedCustomColumns(updatedCols);
        toast({ title: "Success", description: `Custom column "${newCustomColumnName.trim()}" added.` });
      } catch (error: any) {
        toast({ title: "Error Adding Column", description: error.message || "Failed to add custom column.", variant: "destructive" });
      }
    });
  };

  const handleRemoveCustomColumn = (columnId: string, columnName: string) => {
    startColumnDefMutation(async () => {
      try {
        await removeCustomColumnDefinition(columnId);
        setFetchedCustomColumns(prev => prev.filter(c => c.id !== columnId));
        setColumnOrder(prev => prev.filter(key => key !== columnId));
        setVisibleColumns(prev => { const newSet = new Set(prev); newSet.delete(columnId); return newSet; });
        toast({ title: "Success", description: `Custom column "${columnName}" removed.` });
      } catch (error: any) {
        toast({ title: "Error Removing Column", description: error.message || "Failed to remove custom column.", variant: "destructive" });
      }
    });
  };

  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...columnOrder];
    const itemToMove = newOrder[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex >= 0 && swapIndex < newOrder.length) {
      newOrder[index] = newOrder[swapIndex];
      newOrder[swapIndex] = itemToMove;
      setColumnOrder(newOrder);
    }
  };
  
  if (isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user session...</p>
      </div>
    );
  }

  if (!username) {
    return (
        <Card className="shadow-lg text-center py-10">
            <CardHeader><Info className="mx-auto h-12 w-12 text-primary mb-4" /><CardTitle>Login Required</CardTitle><CardDescription>Please log in to view your trade log.</CardDescription></CardHeader>
            <CardContent><Button asChild className="mt-4"><Link href="/login">Go to Login</Link></Button></CardContent>
        </Card>
    );
  }

  if (isLoadingData && !isLoadingUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading journal entries for {username}...</p>
      </div>
    );
  }

  const displayableOrderedColumns = columnOrder.filter(key => visibleColumns.has(key));
  const colSpanForMessages = displayableOrderedColumns.length > 0 ? displayableOrderedColumns.length : 1;


  return (
    <>
      <Card className="shadow-lg mb-6">
        <CardHeader><CardTitle className="text-xl">Filter & Search Trades</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div><Label htmlFor="search-term">Search</Label><Input id="search-term" placeholder="Search any text..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mt-1"/></div>
            <div>
              <Label htmlFor="filter-pair">Pair</Label>
              <Select value={filterPair} onValueChange={setFilterPair}>
                <SelectTrigger id="filter-pair" className="mt-1"><SelectValue placeholder="All Pairs" /></SelectTrigger>
                <SelectContent>{uniquePairs.map(pair => (<SelectItem key={pair} value={pair}>{pair}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-outcome">Outcome</Label>
              <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                <SelectTrigger id="filter-outcome" className="mt-1"><SelectValue placeholder="All Outcomes" /></SelectTrigger>
                <SelectContent>{uniqueOutcomes.map(outcome => (<SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2"><Button onClick={clearFilters} variant="outline" className="w-full"><X className="mr-2 h-4 w-4" /> Clear Filters</Button></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div><Label htmlFor="date-from">Date From</Label><Popover><PopoverTrigger asChild><Button id="date-from" variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-1",!filterDateFrom && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filterDateFrom ? format(filterDateFrom, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateFrom ?? undefined} onSelect={(date) => setFilterDateFrom(date || null)} initialFocus /></PopoverContent></Popover></div>
            <div><Label htmlFor="date-to">Date To</Label><Popover><PopoverTrigger asChild><Button id="date-to" variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-1", !filterDateTo && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filterDateTo ? format(filterDateTo, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateTo ?? undefined} onSelect={(date) => setFilterDateTo(date || null)} initialFocus /></PopoverContent></Popover></div>
          </div>
        </CardContent>
      </Card>

      {allEntries.length === 0 && !isLoadingData && !isLoadingUser && (
        <Card className="text-center py-10 shadow-lg">
          <CardHeader><Info className="mx-auto h-12 w-12 text-primary mb-4" /><CardTitle>No Entries Yet for {username}</CardTitle><CardDescription>You haven't logged any trades. Start by adding a new entry!</CardDescription></CardHeader>
          <CardContent><Button asChild className="mt-4"><Link href="/journal"><PlusCircle className="mr-2 h-4 w-4" /> Add First Entry</Link></Button></CardContent>
        </Card>
      )}

      {allEntries.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div className="flex-grow">
              <CardTitle className="text-2xl">Trade History ({filteredEntries.length} of {allEntries.length})</CardTitle>
              <CardDescription>A chronological list of your logged trades. Click a row to see details.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><ColumnsIcon className="mr-2 h-4 w-4" /> Columns</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 max-h-[400px]">
                  <DropdownMenuLabel>Customize Displayed Columns</DropdownMenuLabel><DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto pr-1">
                    {columnOrder.map((key, index) => {
                      const columnConfig = allPossibleColumns.find(c => c.key === key); if (!columnConfig) return null;
                      return (
                        <DropdownMenuItem key={key} className="flex justify-between items-center pr-2 focus:bg-accent/50" onSelect={(e) => e.preventDefault()}>
                          <div className="flex items-center gap-2 flex-grow overflow-hidden">
                            <Checkbox id={`col-vis-${key}`} checked={visibleColumns.has(key)} onCheckedChange={(checked) => setVisibleColumns(prev => { const ns = new Set(prev); if (checked) ns.add(key); else ns.delete(key); return ns; })} aria-label={`Toggle visibility of ${columnConfig.label} column`}/>
                            <Label htmlFor={`col-vis-${key}`} className="font-normal cursor-pointer truncate" title={columnConfig.label}>{columnConfig.label}</Label>
                          </div>
                          <div className="flex items-center ml-2 shrink-0">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent" onClick={() => handleMoveColumn(index, 'up')} disabled={index === 0} aria-label={`Move ${columnConfig.label} column up`}><ArrowUp className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent" onClick={() => handleMoveColumn(index, 'down')} disabled={index === columnOrder.length - 1} aria-label={`Move ${columnConfig.label} column down`}><ArrowDown className="h-4 w-4" /></Button>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog open={isManageColumnsDialogOpen} onOpenChange={setIsManageColumnsDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Settings2 className="mr-2 h-4 w-4" /> Manage Custom Cols</Button></DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Manage Custom Columns</DialogTitle><DialogDescription>Define additional columns for your journal. (Global for all users)</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div><Label htmlFor="new-custom-column-name" className="text-sm font-medium">Add New Custom Column</Label><div className="flex gap-2 mt-1"><Input id="new-custom-column-name" type="text" value={newCustomColumnName} onChange={(e) => setNewCustomColumnName(e.target.value)} placeholder="e.g., Trade Notes" className="flex-grow" disabled={isMutatingColumnDef} onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomColumn();}}/><Button onClick={handleAddCustomColumn} disabled={isMutatingColumnDef || !newCustomColumnName.trim()}>{isMutatingColumnDef ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}<span className="ml-2 hidden sm:inline">Add</span></Button></div></div>
                    {fetchedCustomColumns.length === 0 && (<p className="text-sm text-muted-foreground text-center py-2">No custom columns defined yet.</p>)}
                    {fetchedCustomColumns.length > 0 && (<div className="space-y-2 max-h-60 overflow-y-auto pr-1"><Label className="text-sm font-medium">Existing Columns</Label><ul className="space-y-1" role="list">{fetchedCustomColumns.map((column) => (<li key={column.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors text-sm" role="listitem"><span className="text-foreground flex-grow truncate pr-2">{column.name}</span><Button size="icon" variant="ghost" disabled={isMutatingColumnDef} className="text-destructive hover:text-destructive/80 h-7 w-7" aria-label={`Delete custom column ${column.name}`} onClick={() => handleRemoveCustomColumn(column.id, column.name)}><Trash2 className="h-4 w-4" /></Button></li>))}</ul></div>)}
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setIsManageColumnsDialogOpen(false)}>Close</Button></DialogFooter>
                  <CardFooter className="mt-4 p-0 pt-4 border-t"><p className="text-xs text-muted-foreground">Deleting a column definition here does not delete the data from existing journal entries.</p></CardFooter>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeletingAll || allEntries.length === 0}>
                    <Eraser className="mr-2 h-4 w-4" />
                    Delete All Trades
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete ALL trade history for user "{username}".
                      This action will remove {allEntries.length} trade(s).
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeletingAll}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDeleteAll}
                      disabled={isDeletingAll}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete all"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <Table>
                <TableCaption>A list of your recent trades. Click a row to view details.</TableCaption>
                <TableHeader>
                  <TableRow>
                    {displayableOrderedColumns.map((key) => { const colCfg = allPossibleColumns.find(c => c.key === key); if (!colCfg) return null; let headerText = colCfg.label; if (colCfg.isStandard) { if (key === 'poi') headerText = 'POI'; else if (key === 'pair') headerText = 'Pair'; else if (key === 'session') headerText = 'Session'; else if (key === 'tradingviewChartUrl') headerText = 'TradingView Chart';} return (<TableHead key={key} className="min-w-[120px] px-3 py-2 whitespace-nowrap">{headerText}</TableHead>);})}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 && (<TableRow><TableCell colSpan={colSpanForMessages} className="text-center h-24">No entries match your current filters.</TableCell></TableRow>)}
                  {filteredEntries.map((entry) => (
                    <TableRow 
                      key={entry.id} 
                      onClick={() => setSelectedEntry(entry)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      {displayableOrderedColumns.map((key) => (<TableCell key={`cell-${key}`} className="px-3 py-2 max-w-xs">{renderCellContent(entry, key)}</TableCell>))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedEntry} onOpenChange={(isOpen) => { if (!isOpen) setSelectedEntry(null); }}>
        {selectedEntry && (
          <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col !p-0"> 
            <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Trade Details: {selectedEntry.pair} - {selectedEntry.date ? format(new Date(selectedEntry.date), "PPP") : 'N/A'}</DialogTitle>
              <DialogDescription>View standard trade details and view/edit custom fields.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow min-h-0 overflow-y-auto">
              <div className="space-y-4 px-6 py-4"> 
                <h3 className="text-md font-semibold text-foreground border-b pb-2 mb-3">Standard Details</h3>
                <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-2 text-sm">
                  {JOURNAL_ENTRY_FIELDS.map(fieldName => { const colCfg = allPossibleColumns.find(c => c.key === fieldName && c.isStandard); if (!colCfg || !visibleColumns.has(fieldName)) return null; return (<React.Fragment key={fieldName}><span className="font-semibold text-muted-foreground text-right whitespace-nowrap">{colCfg.label}:</span><div className="break-words">{renderCellContent(selectedEntry, fieldName)}</div></React.Fragment>)})}
                </div>
                {fetchedCustomColumns.length > 0 && (<><h3 className="text-md font-semibold text-foreground border-b pb-2 mb-3 pt-4">Custom Fields (Editable)</h3><div className="space-y-3">{fetchedCustomColumns.filter(cc => visibleColumns.has(cc.id)).map(col => (<div key={col.id}><Label htmlFor={`custom-${col.id}`} className="block text-sm font-medium text-muted-foreground mb-1">{col.name}</Label><Textarea id={`custom-${col.id}`} value={editableCustomData[col.name] || ""} onChange={(e) => handleCustomDataChange(col.name, e.target.value)} placeholder={`Enter ${col.name}...`} className="min-h-[60px]" disabled={isSavingCustomData}/></div>))}</div></>)}
                {fetchedCustomColumns.length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">No custom columns defined. You can add them via the "Manage Custom Cols" button.</p>)}
                 {fetchedCustomColumns.length > 0 && fetchedCustomColumns.filter(cc => visibleColumns.has(cc.id)).length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">All custom columns are currently hidden. You can manage visibility via the "Columns" button on the log page.</p>)}
              </div>
            </div>
            <DialogFooter className="shrink-0 px-6 py-4 border-t flex flex-col sm:flex-row sm:justify-between gap-2">
              <div className="flex gap-2">
                 <Button 
                    variant="outline" 
                    onClick={() => handleEditEntry(selectedEntry?.id)} 
                    disabled={isSavingCustomData || isDeletingEntry}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Edit Full Entry
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (selectedEntry) {
                        setEntryToDelete(selectedEntry); 
                      }
                    }}
                    disabled={isSavingCustomData || isDeletingEntry}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
                  </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedEntry(null)} 
                  disabled={isSavingCustomData || isDeletingEntry}
                >
                  Close
                </Button>
                {fetchedCustomColumns.filter(cc => visibleColumns.has(cc.id)).length > 0 && (
                  <Button 
                    onClick={handleSaveCustomData} 
                    disabled={isSavingCustomData || isDeletingEntry}
                  >
                    {isSavingCustomData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
                    Save Custom Data
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <AlertDialog open={!!entryToDelete} onOpenChange={(isOpen) => { if(!isOpen) setEntryToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the journal entry for trade <span className="font-semibold">{entryToDelete?.pair}</span> on <span className="font-semibold">{entryToDelete ? format(new Date(entryToDelete.date), "PPP") : ''}</span>.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setEntryToDelete(null)} disabled={isDeletingEntry}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirmed} disabled={isDeletingEntry} className="bg-destructive hover:bg-destructive/90">{isDeletingEntry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete it"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
    
