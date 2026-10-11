// Runs the settings page's inline preview script (passed in as a file by run-tests.php)
// against a tiny fake jQuery, and checks B02 (parameter precedence) and B04 (no stale preview).
const fs = require("fs");
const code = fs.readFileSync(process.argv[2], "utf8");

const el = (props = {}) => ({ value: "", attrs: {}, props: {}, handlers: {}, ...props });
const dom = {
  "#scb-url": el(),
  "#scb-color": el(),
  "#scb-previews": el(),
  "#scb-url-msg": el(),
  layout: el({ value: "list" }),
  frames: [el({ src: "https://app.saloncentral.xyz/book/morning-glory" }), el({ src: "https://app.saloncentral.xyz/book/morning-glory" })],
};
const wrap = (items) => ({
  val: () => items[0].value,
  attr(name, value) { items.forEach((i) => { i.attrs[name] = value; if (name === "src") i.src = value; }); return this; },
  prop(name, value) { items.forEach((i) => (i.props[name] = value)); return this; },
  each(fn) { items.forEach((i) => fn.call(i)); return this; },
  on(evt, fn) { items.forEach((i) => (i.handlers[evt] = fn)); return this; },
  wpColorPicker(opts) { items.forEach((i) => (i.picker = opts)); return this; },
});
const $ = (sel) => {
  if (typeof sel === "function") return sel($);
  if (sel === ".scb-preview-frame") return wrap(dom.frames);
  if (sel === ".scb-color") return wrap([dom["#scb-color"]]);
  if (sel.startsWith("input[name='salon_central_booking_layout']")) return wrap([dom.layout]);
  return wrap([dom[sel]]);
};
global.jQuery = $;
global.setTimeout = (fn) => fn(); // run the 400ms debounce immediately
global.clearTimeout = () => {};
eval(code);

let fails = 0;
const check = (label, ok) => { console.log((ok ? "  ok    " : "  FAIL  ") + label); if (!ok) fails++; };
const type = (url) => { dom["#scb-url"].value = url; dom["#scb-url"].handlers.input(); };
const src = () => dom.frames[0].src;

type("https://app.saloncentral.xyz/book/morning-glory?layout=grid&accent=ff0000");
check("List + no colour strips layout/accent from the pasted link", src() === "https://app.saloncentral.xyz/book/morning-glory");
dom.layout.value = "grid"; dom.layout.handlers.change();
dom["#scb-color"].picker.change(null, { color: { toString: () => "#00AA55" } });
check("Grid + colour set once each", src() === "https://app.saloncentral.xyz/book/morning-glory?accent=00aa55&layout=grid");
dom["#scb-color"].picker.clear();
check("Clear removes accent again", src() === "https://app.saloncentral.xyz/book/morning-glory?layout=grid");
check("valid link: previews shown, no message", dom["#scb-previews"].props.hidden === false && dom["#scb-url-msg"].props.hidden === true);

type("https://wrong.example/book/other");
check("invalid link: previous salon no longer shown", dom.frames.every((f) => f.src === "about:blank"));
check("invalid link: previews hidden, message shown, field marked", dom["#scb-previews"].props.hidden === true && dom["#scb-url-msg"].props.hidden === false && dom["#scb-url"].attrs["aria-invalid"] === "true");

type("");
check("cleared link: previews hidden, no error message", dom["#scb-previews"].props.hidden === true && dom["#scb-url-msg"].props.hidden === true);

type("https://app.saloncentral.xyz/book/other-branch");
check("valid again: previews restored", dom["#scb-previews"].props.hidden === false && src().startsWith("https://app.saloncentral.xyz/book/other-branch"));

process.exit(fails ? 1 : 0);
