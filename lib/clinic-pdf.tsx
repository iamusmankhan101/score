/**
 * PDFs for aesthetic clinics: a signed consent form and a prescription /
 * skincare plan. Rendered server-side like the invoice PDF (lib/salon-invoice-pdf.tsx).
 */

import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ConsentRecord, Prescription } from "@/lib/clinic";

/** `logo` is an absolute URL or a data URL; the clinic name is printed instead when it's missing or can't be loaded. */
export interface ClinicPdfHeader { name: string; phone?: string; address?: string; logo?: string }

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#111111", lineHeight: 1.45 },
  clinic: { fontSize: 15, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  clinicLine: { fontSize: 8.5, color: "#555555", marginTop: 2, textAlign: "right" },
  head: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headLogo: { width: 190, height: 56, objectFit: "contain", objectPosition: "left center" },
  headInfo: { alignItems: "flex-end", maxWidth: 230 },
  headName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#222222", textAlign: "right" },
  rule: { borderBottomWidth: 2, borderBottomColor: "#1f3d2b", marginTop: 12, marginBottom: 18 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  meta: { fontSize: 9, color: "#555555", marginBottom: 2 },
  body: { fontSize: 10, marginTop: 12 },
  sigBox: { marginTop: 24, borderWidth: 1, borderColor: "#cccccc", borderRadius: 4, padding: 12 },
  sig: { height: 70, objectFit: "contain", alignSelf: "flex-start" },
  label: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#777777", textTransform: "uppercase", marginBottom: 4 },
  section: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  item: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  product: { width: "38%", fontFamily: "Helvetica-Bold" },
  detail: { width: "62%", color: "#333333" },
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, fontSize: 8, color: "#888888", textAlign: "center" },
});

function Header({ clinic }: { clinic: ClinicPdfHeader }) {
  return (
    <View>
      <View style={s.head}>
        {clinic.logo ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt
          <Image src={clinic.logo} style={s.headLogo} />
        ) : (
          <Text style={s.clinic}>{clinic.name}</Text>
        )}
        <View style={s.headInfo}>
          {clinic.logo ? <Text style={s.headName}>{clinic.name}</Text> : null}
          {clinic.address ? <Text style={s.clinicLine}>{clinic.address}</Text> : null}
          {clinic.phone ? <Text style={s.clinicLine}>{clinic.phone}</Text> : null}
        </View>
      </View>
      <View style={s.rule} />
    </View>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" });

function drawConsentPdf(clinic: ClinicPdfHeader, c: ConsentRecord): Promise<Buffer> {
  return renderToBuffer(
    <Document title={c.title}>
      <Page size="A4" style={s.page}>
        <Header clinic={clinic} />
        <Text style={s.title}>{c.title}</Text>
        <Text style={s.meta}>Patient: {c.signedName}</Text>
        <Text style={s.meta}>Signed: {when(c.signedAt)} (Pakistan time)</Text>
        {c.staffName ? <Text style={s.meta}>Witness: {c.staffName}</Text> : null}
        <Text style={s.body}>{c.body}</Text>
        <View style={s.sigBox} wrap={false}>
          <Text style={s.label}>Patient signature</Text>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
          <Image src={c.signature} style={s.sig} />
          <Text style={s.meta}>{c.signedName} · {when(c.signedAt)}</Text>
        </View>
        <Text style={s.footer} fixed>Signed electronically. Record ID {c.id}.</Text>
      </Page>
    </Document>,
  );
}

const rxStyles = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", letterSpacing: 1, color: "#1f3d2b", textTransform: "uppercase" },
  date: { fontSize: 10, color: "#555555" },
  panel: { backgroundColor: "#f4f7f5", borderRadius: 6, padding: 12, flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", marginBottom: 8 },
  cellLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#6b7a72", textTransform: "uppercase", letterSpacing: 0.6 },
  cellValue: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 2 },
  rxMark: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1f3d2b", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  thead: { flexDirection: "row", backgroundColor: "#1f3d2b", paddingVertical: 6, paddingHorizontal: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  th: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.4 },
  tr: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#e5e9e7" },
  trAlt: { backgroundColor: "#fafbfa" },
  cNo: { width: "6%", color: "#6b7a72" },
  cMed: { width: "36%" },
  cDose: { width: "16%" },
  cFreq: { width: "18%" },
  cDur: { width: "14%" },
  cWhen: { width: "10%" },
  med: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  how: { fontSize: 8.5, color: "#555555", marginTop: 2 },
  notes: { marginTop: 16, borderLeftWidth: 3, borderLeftColor: "#1f3d2b", paddingLeft: 10 },
  notesLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7a72", textTransform: "uppercase", marginBottom: 3 },
  signRow: { marginTop: 44, flexDirection: "row", justifyContent: "flex-end" },
  signBox: { width: 200, borderTopWidth: 1, borderTopColor: "#111111", paddingTop: 5, alignItems: "center" },
  signName: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
  signLabel: { fontSize: 8, color: "#6b7a72" },
});

function drawPrescriptionPdf(clinic: ClinicPdfHeader, patientName: string, rx: Prescription): Promise<Buffer> {
  const col = (label: string, value?: string) => value ? (
    <View style={rxStyles.cell}>
      <Text style={rxStyles.cellLabel}>{label}</Text>
      <Text style={rxStyles.cellValue}>{value}</Text>
    </View>
  ) : null;
  return renderToBuffer(
    <Document title={`Prescription — ${patientName}`}>
      <Page size="A4" style={s.page}>
        <Header clinic={clinic} />
        <View style={rxStyles.titleRow}>
          <Text style={rxStyles.title}>Prescription</Text>
          <Text style={rxStyles.date}>{rx.date}</Text>
        </View>
        <View style={rxStyles.panel}>
          {col("Patient", patientName)}
          {col("Diagnosis", rx.diagnosis)}
          {col("Treatment", rx.treatment)}
          {col("Prescribed by", rx.practitionerName)}
        </View>

        <Text style={rxStyles.rxMark}>Medicines</Text>
        <View style={rxStyles.thead} fixed>
          <Text style={[rxStyles.th, rxStyles.cNo]}>#</Text>
          <Text style={[rxStyles.th, rxStyles.cMed]}>Medicine / product</Text>
          <Text style={[rxStyles.th, rxStyles.cDose]}>Dose</Text>
          <Text style={[rxStyles.th, rxStyles.cFreq]}>Frequency</Text>
          <Text style={[rxStyles.th, rxStyles.cDur]}>Duration</Text>
          <Text style={[rxStyles.th, rxStyles.cWhen]}>When</Text>
        </View>
        {rx.items.map((i, idx) => (
          <View key={idx} style={[rxStyles.tr, idx % 2 ? rxStyles.trAlt : {}]} wrap={false}>
            <Text style={rxStyles.cNo}>{idx + 1}</Text>
            <View style={rxStyles.cMed}>
              <Text style={rxStyles.med}>{i.product}</Text>
              {i.instructions ? <Text style={rxStyles.how}>{i.instructions}</Text> : null}
            </View>
            <Text style={rxStyles.cDose}>{i.dosage || "-"}</Text>
            <Text style={rxStyles.cFreq}>{i.frequency || "-"}</Text>
            <Text style={rxStyles.cDur}>{i.duration || "-"}</Text>
            <Text style={rxStyles.cWhen}>{i.time}</Text>
          </View>
        ))}

        {rx.notes ? (
          <View style={rxStyles.notes} wrap={false}>
            <Text style={rxStyles.notesLabel}>Advice / notes</Text>
            <Text>{rx.notes}</Text>
          </View>
        ) : null}

        <View style={rxStyles.signRow} wrap={false}>
          <View style={rxStyles.signBox}>
            {rx.practitionerName ? <Text style={rxStyles.signName}>{rx.practitionerName}</Text> : null}
            <Text style={rxStyles.signLabel}>Doctor&apos;s signature</Text>
          </View>
        </View>
        <Text style={s.footer} fixed>Follow these instructions unless your doctor tells you otherwise. Stop and contact the clinic if you have a reaction.</Text>
      </Page>
    </Document>,
  );
}

/**
 * The server fetches the logo itself, so only addresses we trust are accepted
 * (an inline image, our own site, or the image host); anything else is ignored
 * rather than fetched on a client's say-so.
 */
export function trustedLogo(logo: string | undefined, origin: string): string | undefined {
  if (!logo) return undefined;
  if (/^data:image\/(png|jpeg|webp);base64,/.test(logo)) return logo;
  try {
    const u = new URL(logo);
    return u.protocol === "https:" && (u.origin === origin || u.hostname === "res.cloudinary.com") ? logo : undefined;
  } catch { return undefined; }
}

/** A logo that can't be loaded must never stop the PDF: retry without it. */
async function withLogoFallback(clinic: ClinicPdfHeader, draw: (c: ClinicPdfHeader) => Promise<Buffer>): Promise<Buffer> {
  try { return await draw(clinic); } catch (err) {
    if (!clinic.logo) throw err;
    return draw({ ...clinic, logo: undefined });
  }
}

export const renderConsentPdf = (clinic: ClinicPdfHeader, c: ConsentRecord) => withLogoFallback(clinic, (h) => drawConsentPdf(h, c));
export const renderPrescriptionPdf = (clinic: ClinicPdfHeader, patientName: string, rx: Prescription) => withLogoFallback(clinic, (h) => drawPrescriptionPdf(h, patientName, rx));
