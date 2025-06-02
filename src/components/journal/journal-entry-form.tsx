
"use client";

import React, { useEffect, useState, useTransition, useMemo } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useRouter } from 'next/navigation';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { JournalEntryField, FieldOption, JournalFormData, JournalEntry } from "@/types";
import { addJournalEntry, getFieldOptions, getFieldDefaultValue, updateJournalEntry } from "@/lib/firestore-service";
import { FIELD_LABELS, MULTI_SELECT_FIELDS, INITIAL_OPTIONS } from "@/lib/constants";
import { MultiSelectComboBox, MultiSelectItem } from "@/components/common/multi-select-combobox";
import { useUser } from "@/context/user-context"; // Import useUser

const formSchema = z.object({
  pair: z.string().min(1, "Pair is required."),
  date: z.date({ required_error: "Date is required." }),
  type: z.string().min(1, "Type is required."),
  premarketCondition: z.array(z.string()).min(1, "At least one Premarket Condition is required."),
  poi: z.array(z.string()).min(1, "At least one POI is required."),
  reactionToPoi: z.array(z.string()).min(1, "At least one Reaction to POI is required."),
  entryType: z.string().min(1, "Entry Type is required."),
  session: z.string().min(1, "Session is required."),
  psychology: z.array(z.string()).optional(),
  outcome: z.string().min(1, "Outcome is required."),
  rrRatio: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({ invalid_type_error: "RR Ratio must be a number." })
      .positive({ message: "RR Ratio must be a positive number."})
      .optional()
      .nullable()
  ),
  tradingviewChartUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  tp: z.array(z.string()).min(1, "At least one Take Profit reason is required."),
  sl: z.array(z.string()).min(1, "At least one Stop Loss reason is required."),
});

type JournalFormValues = z.infer<typeof formSchema>;

const fieldNames: JournalEntryField[] = Object.keys(INITIAL_OPTIONS) as JournalEntryField[];

interface JournalEntryFormProps {
  entryToEdit?: JournalEntry | null;
}

export function JournalEntryForm({ entryToEdit }: JournalEntryFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { username } = useUser(); // Get username
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!entryToEdit;

  const [options, setOptions] = useState<Record<JournalEntryField, FieldOption[]>>(() => {
    const initial: Record<JournalEntryField, FieldOption[]> = {} as any;
    fieldNames.forEach(field => {
      initial[field] = INITIAL_OPTIONS[field].map(opt => ({ value: opt, label: opt }));
    });
    return initial;
  });
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  const initialFormValues: JournalFormValues = useMemo(() => ({
    pair: entryToEdit?.pair || "",
    date: entryToEdit?.date ? new Date(entryToEdit.date) : new Date(),
    type: entryToEdit?.type || "",
    premarketCondition: entryToEdit?.premarketCondition || [],
    poi: entryToEdit?.poi || [],
    reactionToPoi: entryToEdit?.reactionToPoi || [],
    entryType: entryToEdit?.entryType || "",
    session: entryToEdit?.session || "",
    psychology: entryToEdit?.psychology || [],
    outcome: entryToEdit?.outcome || "",
    rrRatio: entryToEdit?.rrRatio || undefined,
    tradingviewChartUrl: entryToEdit?.tradingviewChartUrl || "",
    tp: entryToEdit?.tp || [],
    sl: entryToEdit?.sl || [],
  }), [entryToEdit]);


  const form = useForm<JournalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialFormValues,
  });

  useEffect(() => {
    if (!username) {
      setIsLoadingOptions(false);
      setIsLoadingDefaults(false);
      return; // Don't load options/defaults if no user
    }

    async function loadFormSetup() {
      setIsLoadingOptions(true);
      if (!isEditMode) setIsLoadingDefaults(true); else setIsLoadingDefaults(false);

      try {
        const fetchedOptions: Record<JournalEntryField, FieldOption[]> = {} as any;
        for (const fieldName of fieldNames) {
          if (fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl') {
            fetchedOptions[fieldName] = [];
            continue;
          }
          const opts = await getFieldOptions(fieldName, username); // Pass username
          fetchedOptions[fieldName] = opts.map(opt => ({ value: opt, label: opt }));
        }
        setOptions(fetchedOptions);

        if (isEditMode && entryToEdit) {
          const editData: JournalFormValues = {
            pair: entryToEdit.pair,
            date: new Date(entryToEdit.date),
            type: entryToEdit.type,
            premarketCondition: Array.isArray(entryToEdit.premarketCondition) ? entryToEdit.premarketCondition : [],
            poi: Array.isArray(entryToEdit.poi) ? entryToEdit.poi : [],
            reactionToPoi: Array.isArray(entryToEdit.reactionToPoi) ? entryToEdit.reactionToPoi : [],
            entryType: entryToEdit.entryType,
            session: entryToEdit.session,
            psychology: Array.isArray(entryToEdit.psychology) ? entryToEdit.psychology : [],
            outcome: entryToEdit.outcome,
            rrRatio: entryToEdit.rrRatio || undefined,
            tradingviewChartUrl: entryToEdit.tradingviewChartUrl || "",
            tp: Array.isArray(entryToEdit.tp) ? entryToEdit.tp : [],
            sl: Array.isArray(entryToEdit.sl) ? entryToEdit.sl : [],
          };
          form.reset(editData);
        } else {
          const effectiveDefaults: Partial<JournalFormValues> = { ...initialFormValues, date: new Date(), rrRatio: undefined, tp: [], sl: [], psychology: [], premarketCondition: [] };
          for (const field of fieldNames) {
              if (field === 'date' || field === 'rrRatio' || field === 'tradingviewChartUrl') continue;
              const storedDefault = await getFieldDefaultValue(field, username); // Pass username
              if (storedDefault !== undefined && storedDefault !== null) {
                  if (MULTI_SELECT_FIELDS.includes(field)) {
                      (effectiveDefaults as any)[field] = Array.isArray(storedDefault) ? storedDefault : [String(storedDefault)];
                  } else {
                      (effectiveDefaults as any)[field] = String(storedDefault);
                  }
              } else if (MULTI_SELECT_FIELDS.includes(field)) {
                  (effectiveDefaults as any)[field] = [];
              }
          }
          const rrDefault = await getFieldDefaultValue('rrRatio', username); // Pass username
          if (typeof rrDefault === 'number') {
            effectiveDefaults.rrRatio = rrDefault;
          }
          form.reset(effectiveDefaults as JournalFormValues);
        }
      } catch (error) {
        console.error("Failed to load form setup:", error);
        toast({ title: "Error", description: "Could not load form options or defaults.", variant: "destructive" });
      } finally {
        setIsLoadingOptions(false);
        if (!isEditMode) setIsLoadingDefaults(false);
      }
    }
    loadFormSetup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryToEdit, isEditMode, toast, username]); // Add username to dependency array

  useEffect(() => {
    // This effect handles resetting the form when entryToEdit changes or when switching from edit to new.
    // It should ideally re-evaluate defaults based on the NEW username context if that changes,
    // but `username` is already in the main `loadFormSetup` effect.
    if (isEditMode && entryToEdit) {
      form.reset({
        ...initialFormValues, // Use the memoized initial values for the current entryToEdit
        date: new Date(entryToEdit.date),
        premarketCondition: Array.isArray(entryToEdit.premarketCondition) ? entryToEdit.premarketCondition : [],
        rrRatio: entryToEdit.rrRatio || undefined,
        tp: entryToEdit.tp || [],
        sl: entryToEdit.sl || [],
        psychology: entryToEdit.psychology || [],
      });
    } else if (!isEditMode && username) { // Only reset to defaults for new entries IF a user is logged in
      // The key prop on JournalEntryForm forces a re-mount for new entries.
      // The `loadFormSetup` effect will handle loading defaults for the current `username`.
    }
  }, [entryToEdit, isEditMode, form, initialFormValues, username]);


  const onSubmit: SubmitHandler<JournalFormValues> = (data) => {
    if (!username) {
      toast({ title: "Error", description: "You must be logged in to save an entry.", variant: "destructive" });
      return;
    }
    startTransition(async () => {
      try {
        const dataToSave: JournalFormData = {
          ...data,
          username: username, // Add username
          rrRatio: data.rrRatio === null || data.rrRatio === undefined ? undefined : Number(data.rrRatio),
          tradingviewChartUrl: data.tradingviewChartUrl?.trim() === "" ? undefined : data.tradingviewChartUrl,
          psychology: data.psychology || [],
          premarketCondition: data.premarketCondition || [],
        };

        if (isEditMode && entryToEdit?.id) {
          await updateJournalEntry(entryToEdit.id, username, dataToSave); // Pass username
          toast({ title: "Success!", description: "Journal entry updated." });
          router.push('/log');
        } else {
          await addJournalEntry(dataToSave, username); // Pass username
          toast({ title: "Success!", description: "Journal entry saved." });
          // Reset form to defaults for the current user
          const effectiveDefaults: Partial<JournalFormValues> = {
            pair: "", date: new Date(), type: "", premarketCondition: [], poi: [], reactionToPoi: [],
            entryType: "", session: "", psychology: [], outcome: "",
            rrRatio: undefined, tradingviewChartUrl: "", tp: [], sl: []
          };
          for (const field of fieldNames) {
              if (field === 'date' || field === 'rrRatio' || field === 'tradingviewChartUrl') continue;
              const storedDefault = await getFieldDefaultValue(field, username); // Pass username
              if (storedDefault !== undefined && storedDefault !== null) {
                   if (MULTI_SELECT_FIELDS.includes(field)) {
                      (effectiveDefaults as any)[field] = Array.isArray(storedDefault) ? storedDefault : [String(storedDefault)];
                  } else {
                      (effectiveDefaults as any)[field] = String(storedDefault);
                  }
              } else if (MULTI_SELECT_FIELDS.includes(field)) {
                 (effectiveDefaults as any)[field] = [];
              }
          }
          const rrDefault = await getFieldDefaultValue('rrRatio', username); // Pass username
          if (typeof rrDefault === 'number') {
            effectiveDefaults.rrRatio = rrDefault;
          }
          form.reset({...effectiveDefaults, date: new Date()} as JournalFormValues);
          // router.push('/log'); // Removed redirection to log page after successful new entry
        }
      } catch (error) {
        console.error("Failed to save/update journal entry", error);
        toast({ title: "Error", description: `Could not ${isEditMode ? 'update' : 'save'} journal entry. Please try again.`, variant: "destructive" });
      }
    });
  };

  if (!username) { // If no user, show a message or a disabled form
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-lg text-muted-foreground mb-4">Please log in to create or edit journal entries.</p>
        <Button onClick={() => router.push('/login')}>Go to Login</Button>
      </div>
    );
  }

  if (isLoadingOptions || isLoadingDefaults) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading form options and defaults for {username}...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fieldNames.map((fieldName) => (
            <FormField
              key={fieldName}
              control={form.control}
              name={fieldName as keyof JournalFormValues}
              render={({ field }) => {
                const currentOptions = options[fieldName] || [];

                if (fieldName === 'date') {
                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>{FIELD_LABELS[fieldName]}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value as Date} onSelect={(date) => field.onChange(date)} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                } else if (fieldName === 'tradingviewChartUrl') {
                  return (
                    <FormItem>
                      <FormLabel>{FIELD_LABELS[fieldName]}</FormLabel>
                      <FormControl>
                        <Input type="url" placeholder="https://www.tradingview.com/chart/..." {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Optional: Link to your TradingView chart analysis.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                } else if (fieldName === 'rrRatio') {
                  return (
                    <FormItem>
                      <FormLabel>{FIELD_LABELS[fieldName]}</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" placeholder="e.g., 2.5 or 2.55" {...field} value={field.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? undefined : (isNaN(Number(val)) ? undefined : Number(val)));
                          }} />
                      </FormControl>
                      <FormDescription>Enter the Risk/Reward ratio (e.g., 2.5 for 2.5R). Decimals are allowed.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }

                const isMulti = MULTI_SELECT_FIELDS.includes(fieldName);
                const multiSelectField = field as unknown as { value: string[]; onChange: (value: string[]) => void; name: string; };
                const singleSelectField = field as unknown as { value: string; onChange: (value: string) => void; name: string; };

                return (
                  <FormItem>
                    <FormLabel>{FIELD_LABELS[fieldName]}</FormLabel>
                    {isMulti ? (
                       <MultiSelectComboBox options={currentOptions} selected={multiSelectField.value || []} onChange={multiSelectField.onChange} placeholder={`Select ${FIELD_LABELS[fieldName]}...`} />
                    ) : (
                      <Select onValueChange={singleSelectField.onChange} value={singleSelectField.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder={`Select ${FIELD_LABELS[fieldName]}`} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {currentOptions.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending || !username} className="w-full md:w-auto">
            {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isEditMode ? 'Updating...' : 'Saving...'}</>) : (isEditMode ? "Update Entry" : "Save Entry")}
          </Button>
          {isEditMode && (<Button type="button" variant="outline" onClick={() => router.push('/log')} disabled={isPending}>Cancel</Button>)}
        </div>
      </form>
    </Form>
  );
}
