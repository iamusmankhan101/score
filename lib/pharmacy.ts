"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

// Pharmacy wording + medicine fields (strength) in Inventory, for this account only.
// ponytail: matches the signed-in email only — add a settings flag if more pharmacies sign up.
const PHARMACY_EMAILS = ["alinaweed@gmail.com", "alinaweed789@gmail.com"];

export function usePharmacy(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const email = getCurrentUser()?.email?.trim().toLowerCase() ?? "";
    setOn(PHARMACY_EMAILS.includes(email));
  }, []);
  return on;
}

// Medicine groups shown in place of the salon categories (the stored category values stay the same).
export const PHARMACY_LABELS: Record<string, string> = {
  "hair-color": "Tablets & Capsules", "skin-care": "Creams & Ointments", "nail": "Syrups & Liquids",
  "tools": "Injections & Devices", "consumables": "Supplies", "retail": "OTC / General",
};
