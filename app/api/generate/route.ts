// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import JSZip from "jszip";
import { convertAmountToWords } from "@/lib/numberToWords";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { metadata, items, financials } = payload;

    const totalInWords = convertAmountToWords(financials.grandTotal);

    const templateData = {
      hospitalName: metadata.hospitalName,
      hospitalAddress: metadata.hospitalAddress,
      sqNumber: metadata.sqNumber,
      tenderTitle: metadata.title,
      date: new Date(metadata.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      deliveryTerms: metadata.deliveryTerms,
      validityTerms: metadata.validityTerms,
      paymentTerms: metadata.paymentTerms,

      // Adjusted casing to match your template's {{subTotal}}
      subTotal: financials.subtotal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      taxAmount: financials.taxAmount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      grandTotal: financials.grandTotal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      }),
      grandTotalWords: totalInWords,

      lineItems: items.map((item: any, idx: number) => ({
        nums: idx + 1, // Adjusted to match your template's {{nums}}
        description: item.description,
        uom: item.uom,
        qty: item.qty,
        unitPrice: item.unitPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
        totalPrice: item.totalPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
        }),
      })),
    };

    // TEMPLATE MANAGEMENT AND DOCUMENT ASSEMBLY LOGIC
    const targetTemplates = [
      "COVER PAGE.docx",
      "BID FORM 1.docx",
      "BID FORM 2.docx",
      "PRICE SCHEDULE.docx",
      "BID FORM 5.docx",
      "TABLE OF CONTENTS.docx",
      "SUB TITTLESfinal.docx",
    ];

    const outputZipEngine = new JSZip();

    // Explicit absolute base tracking path configuration
    const templatesDir = path.join(process.cwd(), "public", "templates");

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

    const finalZipContentBuffer = await outputZipEngine.generateAsync({
      type: "nodebuffer",
    });

    return new NextResponse(finalZipContentBuffer, {
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
