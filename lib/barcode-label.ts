import JsBarcode from "jsbarcode";
import { printInNewWindow } from "./print-window";

/** In millimetres. `sheet` fits as many as it can on A4; otherwise each label is its own page, as label printers expect. */
export type LabelSize = { width: number; height: number; sheet: boolean };

export const LABEL_PRESETS = {
  roll: { width: 50, height: 25, sheet: false },
  sheet: { width: 63, height: 30, sheet: true },
} satisfies Record<string, LabelSize>;

export const LABEL_LIMITS = { minWidth: 20, maxWidth: 150, minHeight: 10, maxHeight: 150 };

export function isValidLabelSize({ width, height }: LabelSize): boolean {
  return width >= LABEL_LIMITS.minWidth && width <= LABEL_LIMITS.maxWidth && height >= LABEL_LIMITS.minHeight && height <= LABEL_LIMITS.maxHeight;
}

const LABEL_PADDING_MM = 1;
const TEXT_LINE_MM = 3.5;
const MIN_BARCODE_HEIGHT_MM = 8;

export type BarcodeLabel = { name: string; price?: string; barcode: string };

/** A new 10-digit code no item in `items` uses. Starts non-zero so spreadsheets can't strip a leading 0. */
export function generateBarcode(items: { barcode?: string }[]): string {
  const taken = new Set(items.map((i) => i.barcode?.trim()));
  let code: string;
  do code = String(1_000_000_000 + Math.floor(Math.random() * 9_000_000_000));
  while (taken.has(code));
  return code;
}

/** Code 128 as SVG markup, or null if the code has characters Code 128 can't carry. */
export function barcodeSvg(code: string): string | null {
  // Code 128 covers printable ASCII, which is also all a scanner would type back.
  if (!/^[\x20-\x7E]+$/.test(code)) return null;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  // 20 units either side = the 10-bar blank margin scanners need.
  JsBarcode(svg, code, { format: "CODE128", width: 2, height: 40, fontSize: 14, marginTop: 0, marginBottom: 0, marginLeft: 20, marginRight: 20 });
  return svg.outerHTML;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function labelsHtml(label: BarcodeLabel, svg: string, copies: number, size: LabelSize): string {
  const { width, height, sheet } = size;
  const pageCss = sheet
    ? `@page { size: A4; margin: 8mm; }
       body { display: grid; grid-template-columns: repeat(auto-fill, ${width}mm); gap: 2mm; }
       .label { border: 0.2mm dashed #bbb; break-inside: avoid; }`
    : `@page { size: ${width}mm ${height}mm; margin: 0; }
       .label { break-after: page; }
       .label:last-child { break-after: auto; }`;
  // On short labels the barcode has to stay scannable, so the price goes first, then the name.
  const lines = [label.name, label.price].filter((t): t is string => !!t);
  const barcodeHeight = () => height - 2 * LABEL_PADDING_MM - lines.length * TEXT_LINE_MM;
  while (lines.length && barcodeHeight() < MIN_BARCODE_HEIGHT_MM) lines.pop();
  const text = lines.map((t) => `<div class="text">${escapeHtml(t)}</div>`).join("");
  const tile = `<div class="label">${text}${svg}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8" /><title>Barcode labels</title>
    <style>
      ${pageCss}
      html, body { margin: 0; background: #fff; color: #000; }
      .label { width: ${width}mm; height: ${height}mm; padding: ${LABEL_PADDING_MM}mm 2mm; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
      .text { max-width: 100%; font: 600 8pt -apple-system, "Segoe UI", Roboto, sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      svg { display: block; width: 100%; height: ${barcodeHeight()}mm; flex: none; }
    </style>
    </head><body>${tile.repeat(copies)}</body></html>`;
}

/** Opens the labels in their own window and prints them. False if the browser blocked the window. */
export function printBarcodeLabels(label: BarcodeLabel, svg: string, copies: number, size: LabelSize): boolean {
  return printInNewWindow(labelsHtml(label, svg, copies, size));
}
