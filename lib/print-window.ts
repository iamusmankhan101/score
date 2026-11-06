/**
 * Prints a full HTML document in its own window. False if the browser blocked the window.
 *
 * The print call lives here rather than in a <script> inside `html`: a blank
 * window inherits this page's Content-Security-Policy, which refuses inline
 * scripts, so a script in the document would never run and nothing would print.
 */
export function printInNewWindow(html: string): boolean {
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  const print = () => { win.focus(); win.print(); };
  // Set after close(): opening the document clears any handlers set before it.
  if (win.document.readyState === "complete") print();
  else win.onload = print;
  return true;
}
