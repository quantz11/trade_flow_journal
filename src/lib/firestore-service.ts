
// src/lib/firestore-service.ts
"use server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  getDoc,
  setDoc,
  where,
  writeBatch,
  deleteField,
  type QueryDocumentSnapshot,
  type DocumentData,
  type FieldValue,
} from "firebase/firestore";
import type { JournalEntry, JournalEntryField, JournalFormData, CustomColumn } from "@/types";
import { FIRESTORE_COLLECTIONS, INITIAL_OPTIONS, MULTI_SELECT_FIELDS } from "./constants";

function formatFirestoreError(baseMessage: string, error: unknown): string {
  let detailedMessage = baseMessage;
  if (error instanceof Error) {
    detailedMessage += ` Firestore Error: ${error.message}`;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    detailedMessage += ` Firestore Error: ${String(error.message)}`;
  }
  if (typeof error === 'object' && error !== null && 'code' in error) {
      detailedMessage += ` (Code: ${String(error.code)})`;
  }
  return detailedMessage;
}

// --- Journal Entries (Scoped by Username) ---

export async function addJournalEntry(entry: JournalFormData, username: string): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) throw new Error("Username is required to add a journal entry.");
  try {
    const dataToSave: { [key: string]: any } = {
      username: username,
      pair: entry.pair,
      date: Timestamp.fromDate(entry.date),
      type: entry.type,
      entryType: entry.entryType,
      session: entry.session,
      outcome: entry.outcome,
      createdAt: Timestamp.now(),
      customData: entry.customData || {},
      premarketCondition: Array.isArray(entry.premarketCondition) ? entry.premarketCondition : [],
      poi: Array.isArray(entry.poi) ? entry.poi : [],
      reactionToPoi: Array.isArray(entry.reactionToPoi) ? entry.reactionToPoi : [],
      psychology: Array.isArray(entry.psychology) ? entry.psychology : [],
      tp: Array.isArray(entry.tp) ? entry.tp : [],
      sl: Array.isArray(entry.sl) ? entry.sl : [],
    };

    // Conditionally add optional fields if they have valid values
    if (entry.tradingviewChartUrl && entry.tradingviewChartUrl.trim() !== "") {
      dataToSave.tradingviewChartUrl = entry.tradingviewChartUrl.trim();
    }
    if (entry.rrRatio !== undefined && entry.rrRatio !== null) {
      const numRRRatio = Number(entry.rrRatio);
      if (!isNaN(numRRRatio)) {
        dataToSave.rrRatio = numRRRatio;
      }
    }

    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES), dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Error adding journal entry: ", error);
    throw new Error(formatFirestoreError("Failed to add journal entry.", error));
  }
}

const normalizeMultiSelectField = (rawValue: any): string[] => {
  if (Array.isArray(rawValue)) {
    return rawValue.filter(item => typeof item === 'string');
  }
  if (typeof rawValue === 'string' && rawValue.trim() !== '') {
    return [rawValue.trim()];
  }
  return [];
};

export async function getJournalEntryById(id: string, username: string): Promise<JournalEntry | null> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) throw new Error("Username is required to fetch a journal entry.");
  try {
    const docRef = doc(db, FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData;
      if (data.username !== username) {
        console.warn(`User ${username} attempted to fetch entry ${id} belonging to ${data.username}`);
        return null; // Or throw an authorization error
      }
      const entry: JournalEntry = {
        id: docSnap.id,
        username: data.username,
        pair: data.pair as string,
        date: (data.date as Timestamp).toDate().toISOString(),
        type: data.type as string,
        entryType: data.entryType as string,
        session: data.session as string,
        outcome: data.outcome as string,
        rrRatio: data.rrRatio as number | undefined,
        tradingviewChartUrl: data.tradingviewChartUrl as string | undefined || undefined,
        customData: (data.customData as { [key: string]: string } | undefined) || {},
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
        premarketCondition: normalizeMultiSelectField(data.premarketCondition),
        poi: normalizeMultiSelectField(data.poi),
        reactionToPoi: normalizeMultiSelectField(data.reactionToPoi),
        psychology: normalizeMultiSelectField(data.psychology),
        tp: normalizeMultiSelectField(data.tp),
        sl: normalizeMultiSelectField(data.sl),
      };
      return entry;
    }
    return null;
  } catch (error) {
    console.error("Error fetching journal entry by ID: ", error);
    throw new Error(formatFirestoreError("Failed to fetch journal entry.", error));
  }
}

export async function getJournalEntries(username: string): Promise<JournalEntry[]> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) {
    throw new Error("Username is required to fetch journal entries.");
  }
  try {
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES),
      where("username", "==", username),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((docSnapshot: QueryDocumentSnapshot) => {
      const data = docSnapshot.data() as DocumentData;
      return {
        id: docSnapshot.id,
        username: data.username,
        pair: data.pair as string,
        date: (data.date as Timestamp).toDate().toISOString(),
        type: data.type as string,
        entryType: data.entryType as string,
        session: data.session as string,
        outcome: data.outcome as string,
        rrRatio: data.rrRatio as number | undefined,
        tradingviewChartUrl: data.tradingviewChartUrl as string | undefined,
        customData: (data.customData as { [key: string]: string } | undefined) || {},
        createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate().toISOString() : undefined,
        premarketCondition: normalizeMultiSelectField(data.premarketCondition),
        poi: normalizeMultiSelectField(data.poi),
        reactionToPoi: normalizeMultiSelectField(data.reactionToPoi),
        psychology: normalizeMultiSelectField(data.psychology),
        tp: normalizeMultiSelectField(data.tp),
        sl: normalizeMultiSelectField(data.sl),
      } as JournalEntry;
    });
  } catch (error) {
    console.error(`Error fetching journal entries for user ${username}: `, error);
    throw new Error(formatFirestoreError(`Failed to fetch journal entries for user ${username}.`, error));
  }
}

export async function updateJournalEntry(entryId: string, username: string, dataToUpdate: Partial<JournalFormData>): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) throw new Error("Username is required to update an entry.");
  try {
    const entryRef = doc(db, FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES, entryId);
    const docSnap = await getDoc(entryRef);
    if (!docSnap.exists() || docSnap.data()?.username !== username) {
        throw new Error("Entry not found or permission denied.");
    }

    const updateData: { [key: string]: any | FieldValue } = { ...dataToUpdate };
    delete updateData.username;
    if (dataToUpdate.date && dataToUpdate.date instanceof Date) {
      updateData.date = Timestamp.fromDate(dataToUpdate.date);
    }

    if (dataToUpdate.tradingviewChartUrl === "" || dataToUpdate.tradingviewChartUrl === undefined) {
      updateData.tradingviewChartUrl = deleteField();
    } else {
      updateData.tradingviewChartUrl = dataToUpdate.tradingviewChartUrl.trim();
    }

    if (dataToUpdate.rrRatio === undefined || dataToUpdate.rrRatio === null || isNaN(Number(dataToUpdate.rrRatio))) {
        updateData.rrRatio = deleteField();
    } else {
        updateData.rrRatio = Number(dataToUpdate.rrRatio);
    }
    const arrayFields: (keyof JournalFormData)[] = ['premarketCondition', 'poi', 'reactionToPoi', 'psychology', 'tp', 'sl'];
    arrayFields.forEach(field => {
        if (dataToUpdate.hasOwnProperty(field)) {
            const value = dataToUpdate[field];
            updateData[field] = Array.isArray(value) ? value : (value === undefined || value === null ? [] : [String(value)]);
        }
    });
    await updateDoc(entryRef, updateData);
  } catch (error) {
    console.error("Error updating journal entry: ", error);
    throw new Error(formatFirestoreError("Failed to update journal entry.", error));
  }
}

export async function deleteJournalEntry(entryId: string, username: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) throw new Error("Username is required to delete an entry.");
  try {
    const entryRef = doc(db, FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES, entryId);
    const docSnap = await getDoc(entryRef);
    if (!docSnap.exists() || docSnap.data()?.username !== username) {
        throw new Error("Entry not found or permission denied.");
    }
    await deleteDoc(entryRef);
  } catch (error) {
    console.error("Error deleting journal entry: ", error);
    throw new Error(formatFirestoreError("Failed to delete journal entry.", error));
  }
}

export async function deleteAllJournalEntriesForUser(username: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) throw new Error("Username is required to delete all entries.");

  try {
    const q = query(collection(db, FIRESTORE_COLLECTIONS.JOURNAL_ENTRIES), where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return; // No entries to delete
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error deleting all journal entries for user ${username}: `, error);
    throw new Error(formatFirestoreError(`Failed to delete all journal entries for user ${username}.`, error));
  }
}


// --- User Settings (Options and Defaults for Form Fields) ---

async function getUserSettingsDoc(username: string) {
  if (!db) throw new Error("Firestore is not initialized.");
  if (!username) throw new Error("Username is required for settings.");
  return doc(db, FIRESTORE_COLLECTIONS.USER_SETTINGS, username);
}

export async function getFieldOptions(fieldName: JournalEntryField, username: string): Promise<string[]> {
  if (fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl') return [];
  try {
    const userSettingsRef = await getUserSettingsDoc(username);
    const docSnap = await getDoc(userSettingsRef);
    const fieldKey = `fieldOptions_${fieldName}`;

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data[fieldKey] && Array.isArray(data[fieldKey])) {
        return data[fieldKey];
      }
    }
    const initial = INITIAL_OPTIONS[fieldName] || [];
    await setDoc(userSettingsRef, { [fieldKey]: initial }, { merge: true });
    return initial;
  } catch (error) {
    console.error(`Error fetching options for ${fieldName} for user ${username}: `, error);
    throw new Error(formatFirestoreError(`Failed to fetch options for ${fieldName}.`, error));
  }
}

export async function getFieldDefaultValue(fieldName: JournalEntryField, username: string): Promise<string | string[] | number | undefined> {
  try {
    const userSettingsRef = await getUserSettingsDoc(username);
    const docSnap = await getDoc(userSettingsRef);
    const fieldKey = `fieldDefault_${fieldName}`;

    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.hasOwnProperty(fieldKey)) {
        return data[fieldKey];
      }
    }
    return undefined;
  } catch (error) {
    console.error(`Error fetching default for ${fieldName} for user ${username}: `, error);
    throw new Error(formatFirestoreError(`Failed to fetch default for ${fieldName}.`, error));
  }
}

export async function setFieldDefaultValue(fieldName: JournalEntryField, username: string, defaultValue: string | string[] | number | null): Promise<void> {
  try {
    const userSettingsRef = await getUserSettingsDoc(username);
    const fieldKey = `fieldDefault_${fieldName}`;
    const updateData = defaultValue === null || defaultValue === undefined ? { [fieldKey]: deleteField() } : { [fieldKey]: defaultValue };
    await setDoc(userSettingsRef, updateData, { merge: true });
  } catch (error) {
    console.error(`Error setting default for ${fieldName} for user ${username}: `, error);
    throw new Error(formatFirestoreError(`Failed to set default for ${fieldName}.`, error));
  }
}

export async function updateFieldOptions(fieldName: JournalEntryField, username: string, options: string[]): Promise<void> {
  if (fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl') return;
  try {
    const userSettingsRef = await getUserSettingsDoc(username);
    const fieldKey = `fieldOptions_${fieldName}`;
    await setDoc(userSettingsRef, { [fieldKey]: options }, { merge: true });
  } catch (error) {
    console.error(`Error updating options for ${fieldName} for user ${username}: `, error);
    throw new Error(formatFirestoreError(`Failed to update options for ${fieldName}.`, error));
  }
}

export async function addOptionToField(fieldName: JournalEntryField, username: string, newOption: string): Promise<void> {
  if (fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl') return;
  const trimmedOption = newOption.trim();
  if (!trimmedOption) return;
  try {
    const currentOptions = await getFieldOptions(fieldName, username);
    if (!currentOptions.includes(trimmedOption)) {
      await updateFieldOptions(fieldName, username, [...currentOptions, trimmedOption]);
    }
  } catch (error) {
    // getFieldOptions can throw, so this will propagate its formatted error
    throw error;
  }
}

export async function removeOptionFromField(fieldName: JournalEntryField, username: string, optionToRemove: string): Promise<void> {
  if (fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl') return;
  try {
    const currentOptions = await getFieldOptions(fieldName, username);
    const updatedOptions = currentOptions.filter(opt => opt !== optionToRemove);
    await updateFieldOptions(fieldName, username, updatedOptions);

    const currentDefault = await getFieldDefaultValue(fieldName, username);
    if (currentDefault === undefined) return;

    if (typeof currentDefault === 'string' && currentDefault === optionToRemove) {
      await setFieldDefaultValue(fieldName, username, null);
    } else if (Array.isArray(currentDefault) && currentDefault.includes(optionToRemove)) {
      const updatedDefault = currentDefault.filter(d => d !== optionToRemove);
      await setFieldDefaultValue(fieldName, username, updatedDefault.length > 0 ? updatedDefault : null);
    }
  } catch (error) {
    // Errors from getFieldOptions, getFieldDefaultValue, setFieldDefaultValue will propagate
    throw error;
  }
}

export async function editOptionInField(fieldName: JournalEntryField, username: string, oldOption: string, newOptionValue: string): Promise<void> {
  if (fieldName === 'rrRatio' || fieldName === 'tradingviewChartUrl') return;
  const trimmedNewOption = newOptionValue.trim();
  if (!trimmedNewOption) return;
  try {
    const currentOptions = await getFieldOptions(fieldName, username);
    const optionIndex = currentOptions.indexOf(oldOption);
    if (optionIndex === -1) throw new Error(`Option "${oldOption}" not found in ${fieldName}.`);

    const updatedOptions = [...currentOptions];
    updatedOptions[optionIndex] = trimmedNewOption;
    await updateFieldOptions(fieldName, username, updatedOptions);

    const currentDefault = await getFieldDefaultValue(fieldName, username);
    if (currentDefault === undefined) return;

    if (typeof currentDefault === 'string' && currentDefault === oldOption) {
      await setFieldDefaultValue(fieldName, username, trimmedNewOption);
    } else if (Array.isArray(currentDefault) && currentDefault.includes(oldOption)) {
      const updatedDefault = currentDefault.map(d => d === oldOption ? trimmedNewOption : d);
      await setFieldDefaultValue(fieldName, username, updatedDefault);
    }
  } catch (error) {
    throw error;
  }
}

export async function seedAllInitialSettings(username: string): Promise<void> {
  if (!db || !username) {
    console.warn("Firestore not initialized or username missing. Skipping seeding of user settings.");
    return;
  }
  console.log(`Attempting to seed initial settings for user: ${username}...`);
  try {
    const userSettingsRef = await getUserSettingsDoc(username);
    const userSettingsSnap = await getDoc(userSettingsRef);
    const userSettingsData = userSettingsSnap.exists() ? userSettingsSnap.data() : {};
    
    const settingsUpdate: DocumentData = {};
    let needsUpdate = false;

    for (const field of Object.keys(INITIAL_OPTIONS) as JournalEntryField[]) {
      if (field === 'rrRatio' || field === 'tradingviewChartUrl') continue;

      const fieldKeyOptions = `fieldOptions_${field}`;
      if (!userSettingsData.hasOwnProperty(fieldKeyOptions) || !Array.isArray(userSettingsData[fieldKeyOptions])) {
        settingsUpdate[fieldKeyOptions] = INITIAL_OPTIONS[field];
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await setDoc(userSettingsRef, settingsUpdate, { merge: true });
      console.log(`Successfully seeded/updated initial settings for user: ${username}`);
    } else {
      console.log(`Initial settings already up-to-date for user: ${username}`);
    }
  } catch (error) {
    console.error(`Error seeding initial settings for user ${username}:`, error);
    // Do not throw here, as seeding is a background convenience. Log and continue.
  }
}

// --- Custom Table Columns (Global) ---

export async function getCustomColumnDefinitions(): Promise<CustomColumn[]> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const q = query(collection(db, FIRESTORE_COLLECTIONS.CUSTOM_COLUMNS), orderBy("name"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      name: docSnapshot.data().name as string,
    }));
  } catch (error) {
    console.error("Error fetching custom column definitions: ", error);
    throw new Error(formatFirestoreError("Failed to fetch custom column definitions.", error));
  }
}

export async function addCustomColumnDefinition(name: string): Promise<string> {
  if (!db) throw new Error("Firestore is not initialized.");
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Custom column name cannot be empty.");
  try {
    const q = query(collection(db, FIRESTORE_COLLECTIONS.CUSTOM_COLUMNS), where("name", "==", trimmedName));
    const existing = await getDocs(q);
    if (!existing.empty) {
      throw new Error(`A custom column with the name "${trimmedName}" already exists.`);
    }
    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.CUSTOM_COLUMNS), {
      name: trimmedName,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding custom column definition: ", error);
    if (error instanceof Error && (error.message.startsWith("Custom column name") || error.message.startsWith("A custom column with the name"))) {
        throw error;
    }
    throw new Error(formatFirestoreError(`Failed to add custom column "${trimmedName}".`, error));
  }
}

export async function removeCustomColumnDefinition(columnId: string): Promise<void> {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.CUSTOM_COLUMNS, columnId));
  } catch (error) {
    console.error("Error removing custom column definition: ", error);
    throw new Error(formatFirestoreError("Failed to remove custom column definition.", error));
  }
}
