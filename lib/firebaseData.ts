import { get, ref, set } from "firebase/database";
import { realtimeDatabase } from "@/lib/firebase";

export function mirrorToDatabase(path: string, value: unknown) {
  void set(ref(realtimeDatabase, path), value).catch((error: unknown) => {
    console.error(`Firebase write failed for ${path}`, error);
  });
}

export async function fetchFromDatabase<T>(path: string, fallback: T) {
  try {
    const snapshot = await get(ref(realtimeDatabase, path));
    return snapshot.exists() ? (snapshot.val() as T) : fallback;
  } catch (error) {
    console.error(`Firebase read failed for ${path}`, error);
    return fallback;
  }
}
