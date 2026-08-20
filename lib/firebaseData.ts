import { get, ref, set } from "firebase/database";
import { realtimeDatabase } from "@/lib/firebase";

export async function mirrorToDatabase(
  path: string,
  value: unknown,
  options: { throwOnError?: boolean } = {}
) {
  try {
    await set(ref(realtimeDatabase, path), value);
  } catch (error: unknown) {
    console.error(`Firebase write failed for ${path}`, error);
    if (options.throwOnError) throw error;
  }
}

export async function fetchFromDatabase<T>(path: string, fallback: T) {
  try {
    const snapshot = await get(ref(realtimeDatabase, path));
    return snapshot.exists() ? (snapshot.val() as T) : fallback;
  } catch {
    return fallback;
  }
}
