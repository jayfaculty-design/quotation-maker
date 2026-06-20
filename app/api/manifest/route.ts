import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getEntity } from "@/data/entities";
import { getDocType } from "@/data/documentTypes";

// Lists what a generated package will actually contain for a given entity/docType:
// the rendered `.docx` forms from <entity>/<docType>/ plus the static certificates
// from <entity>/certificates/. The workspace uses this so its document count
// reflects the real files on disk (which vary per entity) rather than a hardcoded
// list. Mirrors the path validation + filtering in api/generate.
export async function GET(req: NextRequest) {
  const entity = req.nextUrl.searchParams.get("entity") ?? "";
  const docType = req.nextUrl.searchParams.get("docType") ?? "";

  if (!getEntity(entity) || !getDocType(docType)) {
    return NextResponse.json(
      { documents: [], certificates: [], error: "Unknown company or document type" },
      { status: 400 },
    );
  }

  const base = path.join(process.cwd(), "public", "templates", entity);

  const readDir = (dir: string, isDoc: boolean) => {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => {
        if (f.startsWith("~$") || f.startsWith(".")) return false;
        if (isDoc) return f.toLowerCase().endsWith(".docx");
        return fs.statSync(path.join(dir, f)).isFile();
      })
      .sort();
  };

  return NextResponse.json({
    documents: readDir(path.join(base, docType), true),
    certificates: readDir(path.join(base, "certificates"), false),
  });
}
