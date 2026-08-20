"use client";

import { useEffect } from "react";
import { startRealtimeSync } from "@/lib/realtimeSync";

export default function RealtimeSync() {
  useEffect(() => startRealtimeSync(), []);
  return null;
}