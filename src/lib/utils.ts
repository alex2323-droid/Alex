import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFirestoreDate(dateValue: any): Date | null {
  if (!dateValue) return null;
  
  // If it's a Firestore Timestamp with toDate method
  if (typeof dateValue.toDate === 'function') {
    try {
      return dateValue.toDate();
    } catch (e) {
      return null;
    }
  }
  
  // If it's an object with seconds (serialized Timestamp)
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    return new Date(dateValue.seconds * 1000);
  }
  
  // Try to parse as normal JS Date or ISO string
  try {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch (e) {
    // Ignore error
  }
  
  return null;
}
