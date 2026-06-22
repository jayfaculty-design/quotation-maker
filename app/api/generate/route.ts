import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { convertAmountToWords } from "@/lib/numberToWords";
import { getEntity } from "@/data/entities";
import { getDocType } from "@/data/documentTypes";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { metadata, items, financials, taxes, discount, entity, docType } =
      payload;

    if (!getEntity(entity) || !getDocType(docType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unknown company or document type: ${entity}/${docType}`,
        },
        { status: 400 },
      );
    }

    const totalInWords = convertAmountToWords(financials.grandTotal);

    // One document tax row per tax actually enabled in the workspace (and with a
    // non-zero rate). VAT-exempt quotes send no enabled taxes, so taxLines is
    // empty and the template's {{#taxLines}} loop drops the row entirely — the
    // figure and label always reflect what was ticked in the UI.
    const subtotalNum = Number(financials.subtotal) || 0;
    const taxLines = (Array.isArray(taxes) ? taxes : [])
      .filter(
        (t: { enabled?: boolean; percentage?: number }) =>
          t?.enabled && Number(t.percentage) > 0,
      )
      .map((t: { name: string; percentage: number }) => ({
        label: `${t.percentage}% ${t.name}`,
        amount: (subtotalNum * (t.percentage / 100)).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
      }));

    // A discount is a proforma-only deduction, rendered in the same {{#taxLines}}
    // loop with a negative amount (so the totals stay consistent without touching
    // every template). Only when enabled with a non-zero rate.
    const discPct = Number(discount?.percentage) || 0;
    if (docType === "proforma" && discount?.enabled && discPct > 0) {
      const discAmount = subtotalNum * (discPct / 100);
      taxLines.push({
        label: `${discPct}% Discount`,
        amount: `-${discAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      });
    }

    const ordinalSuffix = (num: number) => {
      const s = ["th", "st", "nd", "rd"],
        v = num % 100;
      return s[(v - 20) % 10] || s[v] || s[0];
    };
    // `<input type="date">` emits YYYY-MM-DD, which `new Date(...)` parses as
    // UTC midnight. Read it back in UTC so the day never shifts on non-UTC
    // (e.g. US-region / Vercel) servers.
    const d = new Date(metadata.date);
    const day = d.getUTCDate();
    const upper = (s: string) => (s ?? "").toUpperCase();

    function toTitleCase(s: string): string {
      const minor = new Set([
        "of",
        "and",
        "the",
        "for",
        "to",
        "in",
        "on",
        "a",
        "an",
        "or",
        "with",
        "at",
        "by",
      ]);
      const words = (s ?? "").toLowerCase().split(/\s+/).filter(Boolean);
      return words
        .map((w, i) =>
          i !== 0 && i !== words.length - 1 && minor.has(w)
            ? w
            : w.charAt(0).toUpperCase() + w.slice(1),
        )
        .join(" ");
    }

    const templateData = {
      hospitalName: metadata.hospitalName,
      hospitalAddress: metadata.hospitalAddress,
      sqNumber: metadata.sqNumber,
      tenderTitle: metadata.title,
      dateDay: day,
      dateMonthUpper: d
        .toLocaleDateString("en-US", { month: "long", timeZone: "UTC" })
        .toUpperCase(),
      daySuffix: ordinalSuffix(day),
      dateMonth: d.toLocaleDateString("en-US", {
        month: "long",
        timeZone: "UTC",
      }),
      dateYear: d.getUTCFullYear(),
      deliveryTerms: metadata.deliveryTerms,
      validityTerms: metadata.validityTerms,
      paymentTerms: metadata.paymentTerms,
      warranty: metadata.warranty,
      itemNameUpper: upper(metadata.itemName),
      itemNameTitle: toTitleCase(metadata.itemName),
      titleUpper: upper(metadata.title),
      titleTitle: toTitleCase(metadata.title),
      quantitySummary:
        items.length > 1 ? "VARIOUS" : String(items[0]?.qty ?? ""),

      // Adjusted casing to match your template's {{subTotal}}
      subTotal: financials.subtotal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      taxLines,
      taxAmount: financials.taxAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      grandTotal: financials.grandTotal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      grandTotalWords: totalInWords,

      lineItems: items.map((item: any, idx: number) => ({
        nums: idx + 1,
        description: item.description,
        uom: item.uom,
        brand: item.brand ?? "",
        country: item.country ?? "",
        qty: item.qty,
        unitPrice: item.unitPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
        totalPrice: item.totalPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
      })),
    };

    // Explicit absolute base tracking path configuration
    const templatesDir = path.join(
      process.cwd(),
      "public",
      "templates",
      entity,
      docType,
    );

    if (!fs.existsSync(templatesDir)) {
      return NextResponse.json(
        {
          success: false,
          error: `No template folder for ${entity}/${docType}. Expected: ${templatesDir}`,
        },
        { status: 400 },
      );
    }

    // TEMPLATE MANAGEMENT AND DOCUMENT ASSEMBLY LOGIC
    const targetTemplates = fs
      .readdirSync(templatesDir)
      .filter((f) => f.toLowerCase().endsWith(".docx") && !f.startsWith("~$"))
      .sort();

    if (targetTemplates.length === 0) {
      return NextResponse.json(
        { success: false, error: `Template folder is empty: ${templatesDir}` },
        { status: 400 },
      );
    }

    const outputZipEngine = new JSZip();

    for (const filename of targetTemplates) {
      const templateFilePath = path.join(templatesDir, filename);

      // Safety Guard 1: Verify file existence on disk
      if (!fs.existsSync(templateFilePath)) {
        return NextResponse.json(
          {
            success: false,
            error: `Template file not found at path: ${templateFilePath}. Please ensure it is inside /public/templates/`,
          },
          { status: 400 },
        );
      }

      // Safety Guard 2: Verify the file is not an old binary format
      if (filename.endsWith(".doc") && !filename.endsWith(".docx")) {
        return NextResponse.json(
          {
            success: false,
            error: `File ${filename} detected as legacy format. PizZip only accepts OpenXML .docx files.`,
          },
          { status: 400 },
        );
      }

      const fileBinaryBuffer = fs.readFileSync(templateFilePath);

      // Safety Guard 3: Verify the buffer is populated
      if (!fileBinaryBuffer || fileBinaryBuffer.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Template file [${filename}] is empty (0 bytes).`,
          },
          { status: 400 },
        );
      }

      // Try initializing the zip engine with a catch block to capture internal parsing faults
      let docZipInMemory;
      try {
        docZipInMemory = new PizZip(fileBinaryBuffer);
      } catch (zipError: any) {
        return NextResponse.json(
          {
            success: false,
            error: `PizZip failed parsing [${filename}]. Verify that this file is a healthy, valid .docx file. Internal error: ${zipError.message}`,
          },
          { status: 400 },
        );
      }

      const docxEngine = new Docxtemplater(docZipInMemory, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "{{", end: "}}" },
        nullGetter: () => "",
      });

      // Inject variables and expand structural array data loops
      docxEngine.render(templateData);

      const computedBufferOutput = docxEngine
        .getZip()
        .generate({ type: "nodebuffer", compression: "DEFLATE" });

      outputZipEngine.file(`FINAL_${filename}`, computedBufferOutput);
    }

    // Append the company's certificates (PDFs etc.) — copied verbatim, NOT run
    // through docxtemplater. They live one level up from the doc-type folder, at
    // public/templates/<entity>/certificates/. Bids (quotation/tender) carry the
    // company's compliance certificates; a proforma invoice is a standalone
    // document and does not, so it is excluded.
    const certsDir = path.join(
      process.cwd(),
      "public",
      "templates",
      entity,
      "certificates",
    );
    if (docType !== "proforma" && fs.existsSync(certsDir)) {
      const certFiles = fs
        .readdirSync(certsDir)
        .filter((f) => !f.startsWith("~$") && !f.startsWith("."))
        .sort();
      for (const filename of certFiles) {
        const certPath = path.join(certsDir, filename);
        if (!fs.statSync(certPath).isFile()) continue;
        outputZipEngine.file(
          `Certificates/${filename}`,
          fs.readFileSync(certPath),
        );
      }
    }

    const generatedZip = await outputZipEngine.generateAsync({
      type: "uint8array",
    });

    // Copy into a fresh Uint8Array backed by a concrete ArrayBuffer. JSZip types
    // its output as Uint8Array<ArrayBufferLike>, which (because ArrayBufferLike
    // admits SharedArrayBuffer) isn't assignable to NextResponse's BodyInit.
    const responseBody = new Uint8Array(generatedZip.length);
    responseBody.set(generatedZip);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=BID_PACKAGE.zip`,
      },
    });
  } catch (error: any) {
    console.error("Document assembly infrastructure fault:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
