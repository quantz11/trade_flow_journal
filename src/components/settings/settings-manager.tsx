
"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { PlusCircle, Edit3, Trash2, Loader2, Save, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectComboBox, MultiSelectItem } from "@/components/common/multi-select-combobox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { JournalEntryField } from "@/types";
import {
  getFieldOptions,
  addOptionToField,
  removeOptionFromField,
  editOptionInField,
  getFieldDefaultValue,
  setFieldDefaultValue
} from "@/lib/firestore-service";
import { MULTI_SELECT_FIELDS } from "@/lib/constants";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useUser } from "@/context/user-context"; // Import useUser

interface SettingsManagerProps {
  fieldName: JournalEntryField;
  fieldLabel: string;
}

export function SettingsManager({ fieldName, fieldLabel }: SettingsManagerProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [editingOption, setEditingOption] = useState<{ old: string; current: string } | null>(null);

  const [currentDefault, setCurrentDefault] = useState<string | string[] | undefined>(undefined);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isMutating, startMutation] = useTransition();
  const { toast } = useToast();
  const { username } = useUser(); // Get username

  const isMultiSelect = MULTI_SELECT_FIELDS.includes(fieldName);
  const isInputOnlyField = fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl';


  const fetchAllData = useCallback(async () => {
    if (!username) {
      setIsLoadingOptions(false);
      setIsLoadingDefault(false);
      setOptions([]);
      setCurrentDefault(undefined);
      return;
    }

    setIsLoadingOptions(true);
    setIsLoadingDefault(true);

    try {
      if (!isInputOnlyField) {
        const opts = await getFieldOptions(fieldName, username);
        setOptions(opts);
      } else {
        setOptions([]); // No options for these fields
      }
    } catch (error) {
      console.error(`Failed to load options for ${fieldLabel}:`, error);
      toast({ title: "Error", description: `Could not load ${fieldLabel} options.`, variant: "destructive" });
    } finally {
      setIsLoadingOptions(false);
    }

    try {
      const defValue = await getFieldDefaultValue(fieldName, username);
      setCurrentDefault(defValue);
    } catch (error) {
      console.error(`Failed to load default for ${fieldLabel}:`, error);
      toast({ title: "Error", description: `Could not load default for ${fieldLabel}.`, variant: "destructive" });
    } finally {
      setIsLoadingDefault(false);
    }
  }, [fieldName, fieldLabel, toast, username, isInputOnlyField]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleAddOption = () => {
    if (!username || !newOption.trim() || isInputOnlyField) return;
    startMutation(async () => {
      try {
        await addOptionToField(fieldName, username, newOption.trim());
        setNewOption("");
        await fetchAllData();
        toast({ title: "Success", description: `Option "${newOption.trim()}" added to ${fieldLabel}.` });
      } catch (error) {
        toast({ title: "Error", description: `Failed to add option.`, variant: "destructive" });
      }
    });
  };

  const handleRemoveOption = (option: string) => {
    if (!username || isInputOnlyField) return;
    startMutation(async () => {
      try {
        await removeOptionFromField(fieldName, username, option);
        await fetchAllData();
        toast({ title: "Success", description: `Option "${option}" removed from ${fieldLabel}.` });
      } catch (error) {
        toast({ title: "Error", description: `Failed to remove option.`, variant: "destructive" });
      }
    });
  };

  const handleStartEdit = (option: string) => {
    if (isInputOnlyField) return;
    setEditingOption({ old: option, current: option });
  };

  const handleSaveEdit = () => {
    if (!username || !editingOption || !editingOption.current.trim() || isInputOnlyField) return;
    startMutation(async () => {
      try {
        await editOptionInField(fieldName, username, editingOption.old, editingOption.current.trim());
        setEditingOption(null);
        await fetchAllData();
        toast({ title: "Success", description: `Option updated in ${fieldLabel}.` });
      } catch (error) {
        toast({ title: "Error", description: `Failed to update option.`, variant: "destructive" });
      }
    });
  };

  const handleSetDefault = (value: string | string[] | number) => {
    if (!username) return;
    // For rrRatio, ensure it's a number or undefined
    let valueToSet: string | string[] | number | null = value;
    if (fieldName === 'rrRatio') {
        const numVal = Number(value);
        valueToSet = isNaN(numVal) ? null : numVal;
    }

    startMutation(async () => {
      try {
        await setFieldDefaultValue(fieldName, username, valueToSet);
        setCurrentDefault(valueToSet ?? undefined); // Update local state
        toast({ title: "Success", description: `Default value for ${fieldLabel} updated.` });
      } catch (error) {
        toast({ title: "Error", description: `Failed to set default value.`, variant: "destructive" });
      }
    });
  };

  const handleClearDefault = () => {
    if (!username) return;
    startMutation(async () => {
      try {
        await setFieldDefaultValue(fieldName, username, null); // Pass null to clear
        setCurrentDefault(undefined);
        toast({ title: "Success", description: `Default value for ${fieldLabel} cleared.` });
      } catch (error) {
        toast({ title: "Error", description: `Failed to clear default value.`, variant: "destructive" });
      }
    });
  };

  const defaultSelectorOptions: MultiSelectItem[] = options.map(opt => ({ value: opt, label: opt }));

  if (!username) {
    return (
      <Card>
        <CardHeader><CardTitle>{fieldLabel}</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Please log in to manage settings.</p></CardContent>
      </Card>
    );
  }

  if (isLoadingOptions || isLoadingDefault) {
    return (
      <Card>
        <CardHeader><CardTitle>{fieldLabel}</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading settings for {username}...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">{fieldLabel}</CardTitle>
        <CardDescription>Manage selectable options and set a default value for "{fieldLabel}".</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {/* Options Management (Not for rrRatio or tradingviewChartUrl) */}
        {!isInputOnlyField && (
          <div>
            <Label htmlFor={`new-option-${fieldName}`}>Manage Options</Label>
            <div className="flex gap-2 mt-1">
              <Input id={`new-option-${fieldName}`} type="text" value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder={`Add new option`} className="flex-grow" disabled={isMutating}/>
              <Button onClick={handleAddOption} disabled={isMutating || !newOption.trim()} className="bg-primary hover:bg-primary/90">
                {isMutating && !editingOption ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Add</span>
              </Button>
            </div>
            {options.length === 0 && (<p className="text-sm text-muted-foreground text-center py-4">No options configured yet.</p>)}
            <ul className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
              {options.map((option) => (
                <li key={option} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md hover:bg-secondary/50 transition-colors text-sm">
                  {editingOption?.old === option ? (
                    <div className="flex-grow flex items-center gap-2">
                      <Input type="text" value={editingOption.current} onChange={(e) => setEditingOption({ ...editingOption, current: e.target.value })} className="flex-grow h-8" disabled={isMutating} autoFocus/>
                      <Button size="icon" variant="ghost" onClick={handleSaveEdit} disabled={isMutating || !editingOption.current.trim()} className="text-green-600 hover:text-green-700 h-8 w-8">{isMutating && editingOption ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}</Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingOption(null)} disabled={isMutating} className="text-gray-500 hover:text-gray-600 h-8 w-8"><XCircle className="h-4 w-4" /></Button>
                    </div>
                  ) : ( <>
                      <span className="text-foreground flex-grow truncate pr-2">{option}</span>
                      <div className="flex items-center gap-0.5">
                        <Button size="icon" variant="ghost" onClick={() => handleStartEdit(option)} disabled={isMutating} className="text-primary hover:text-primary/80 h-8 w-8"><Edit3 className="h-4 w-4" /></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button size="icon" variant="ghost" disabled={isMutating} className="text-destructive hover:text-destructive/80 h-8 w-8"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will remove the option "{option}". If it's set as default, the default will be cleared. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRemoveOption(option)} disabled={isMutating} className="bg-destructive hover:bg-destructive/90">{isMutating ? <Loader2 className="h-4 w-4 animate-spin"/> : "Delete"}</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div></>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {isInputOnlyField && <p className="text-sm text-muted-foreground">This field accepts direct input. No predefined options to manage.</p>}

        <Separator className="my-6" />

        {/* Default Value Management */}
        <div className="space-y-2">
          <Label htmlFor={`default-value-${fieldName}`}>Set Default Value</Label>
          {fieldName === 'rrRatio' ? (
            <Input
              id={`default-value-${fieldName}`}
              type="number"
              step="any"
              placeholder="e.g., 1.5"
              value={currentDefault === undefined ? "" : String(currentDefault)}
              onChange={(e) => handleSetDefault(e.target.value === "" ? null : Number(e.target.value))}
              disabled={isMutating}
              className="w-full"
            />
          ) : fieldName === 'tradingviewChartUrl' ? (
             <p className="text-sm text-muted-foreground">Default value not applicable for URL fields.</p>
          ) : isInputOnlyField && fieldName !== 'rrRatio' ? ( // Handles any other future input-only fields
            <p className="text-sm text-muted-foreground">Default value setting not applicable for this field type.</p>
          ) : options.length === 0 && !isInputOnlyField ? (
            <p className="text-sm text-muted-foreground">Add some options first to set a default.</p>
          ) : isMultiSelect ? (
            <MultiSelectComboBox options={defaultSelectorOptions} selected={(currentDefault as string[] | undefined) || []} onChange={(selectedValues) => handleSetDefault(selectedValues)} placeholder={`Select default ${fieldLabel.toLowerCase()}(s)...`} disabled={isMutating || options.length === 0} className="w-full"/>
          ) : (
            <Select value={(currentDefault as string | undefined) || ""} onValueChange={(value) => handleSetDefault(value)} disabled={isMutating || options.length === 0}>
              <SelectTrigger id={`default-value-${fieldName}`} className="w-full"><SelectValue placeholder={`Select default ${fieldLabel.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>{defaultSelectorOptions.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
            </Select>
          )}
          {(currentDefault !== undefined && currentDefault !== null && (Array.isArray(currentDefault) ? currentDefault.length > 0 : String(currentDefault).trim() !== "") && fieldName !== 'tradingviewChartUrl') && (
            <Button variant="outline" size="sm" onClick={handleClearDefault} disabled={isMutating} className="mt-2 w-full">
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Clear Default for {fieldLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
