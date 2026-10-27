// ─── Urdu mode ────────────────────────────────────────────────────────────────
// A per-device switch (sidebar profile menu) that shows the dashboard in Urdu,
// right to left. The screens stay written in English: lib/urdu-dictionary.json
// maps each visible English string to Urdu, and a MutationObserver swaps text
// in place as React renders, the same way a browser's own translate does.
// Anything not in the dictionary — client names, numbers, new text added since
// the dictionary was built — is simply left in English.
//
// ponytail: text built with template literals (`${n} clients`) isn't matched;
// add regex entries here if those matter, or move screens to real t() calls.

const LANG_KEY = "werzio_lang";
const FONT_URL = "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap";
const ATTRS = ["placeholder", "title", "aria-label", "alt"];
// Receipts and slips go to customers, so they keep English (see translate="no" on their roots).
const SKIP = "script,style,textarea,code,pre,[translate=no],[contenteditable=true]";

export type Lang = "en" | "ur";

export function getLang(): Lang {
  try { return localStorage.getItem(LANG_KEY) === "ur" ? "ur" : "en"; } catch { return "en"; }
}

/** Saves the choice and reloads — switching back to English needs the untouched text anyway. */
export function setLang(lang: Lang): void {
  try { localStorage.setItem(LANG_KEY, lang); } catch { /* private mode: nothing to remember */ }
  window.location.reload();
}

/** Turns Urdu mode on for this page; returns a function that stops watching for new text. */
export async function startUrdu(): Promise<() => void> {
  const dict = (await import("./urdu-dictionary.json")).default as Record<string, string>;
  const html = document.documentElement;
  html.lang = "ur";
  html.dir = "rtl";
  if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.appendChild(link);
  }

  // Swaps only the trimmed text, so the spacing React put around it survives.
  const translate = (raw: string): string | null => {
    const text = raw.trim();
    const urdu = text && dict[text.replace(/\s+/g, " ")];
    return urdu ? raw.replace(text, () => urdu) : null;
  };
  const doText = (node: Text) => {
    if (!node.parentElement || node.parentElement.closest(SKIP)) return;
    const urdu = translate(node.nodeValue || "");
    if (urdu !== null && urdu !== node.nodeValue) node.nodeValue = urdu;
  };
  const doElement = (el: Element) => {
    if (el.closest(SKIP)) return;
    for (const attr of ATTRS) {
      const value = el.getAttribute(attr);
      const urdu = value && translate(value);
      if (urdu && urdu !== value) el.setAttribute(attr, urdu);
    }
  };
  const walk = (root: Node) => {
    if (root.nodeType === Node.TEXT_NODE) return doText(root as Text);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    doElement(root as Element);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.nodeType === Node.TEXT_NODE) doText(node as Text);
      else doElement(node as Element);
    }
  };

  walk(document.body);
  // Setting Urdu text fires another mutation, but Urdu is never a dictionary key, so it settles.
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "characterData") doText(m.target as Text);
      else if (m.type === "attributes") doElement(m.target as Element);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return () => observer.disconnect();
}
