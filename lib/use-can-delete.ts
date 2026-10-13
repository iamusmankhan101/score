import { useEffect, useState } from "react";
import { hasPermission } from "@/lib/auth";

// Kept out of lib/auth.ts: server routes import that file, and they can't load React hooks.
/** Hides delete buttons from staff without the "Can delete records" tick. False until mounted, so nothing flashes. */
export function useCanDelete(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(hasPermission("delete")), []);
  return ok;
}
