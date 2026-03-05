import { NextResponse } from "next/server";
import { imagekit } from "@/lib/imagekit";

export const dynamic = "force-dynamic";


export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    
    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file: buffer.toString("base64"),
      fileName: fileName,
      folder: "/tenant-ids"
    });

    return NextResponse.json({ 
      success: true, 
      fileId: uploadResponse.fileId,
      fileUrl: uploadResponse.url 
    });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Upload failed: " + (error.message || "Unknown error") }, { status: 500 });
  }
}
