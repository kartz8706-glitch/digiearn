import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { firestoreDatabase } from "@/lib/firebase";
import type { AdminUser } from "@/lib/adminStore";

export async function saveUserProfile(
  userId: string,
  profile: Record<string, unknown>
) {
  await setDoc(doc(firestoreDatabase, "users", userId), profile, {
    merge: true,
  });
}

export async function deleteUserProfile(userId: string) {
  await deleteDoc(doc(firestoreDatabase, "users", userId));
}

export async function fetchUserProfile<T>(userId: string, fallback: T) {
  try {
    const snapshot = await getDoc(doc(firestoreDatabase, "users", userId));
    return snapshot.exists() ? (snapshot.data() as T) : fallback;
  } catch (error) {
    console.error("Firestore profile read failed", error);
    return fallback;
  }
}

export async function fetchFirestoreUsers() {
  try {
    const snapshot = await getDocs(collection(firestoreDatabase, "users"));
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as AdminUser[];
  } catch (error) {
    console.error("Firestore users read failed", error);
    throw error;
  }
}
