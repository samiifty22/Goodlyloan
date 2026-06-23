import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Clean filename to prevent path traversal
  const fileExt = path.extname(file.name);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExt}`;

  // Check if Cloudflare R2 is configured in env
  const hasR2 =
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_ENDPOINT;

  if (hasR2) {
    try {
      // Dynamic import of S3 client to avoid build errors if @aws-sdk/client-s3 is not installed
      // or if users want to run strictly local. We can upload using S3 API or direct HTTP PUT.
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Return R2 public URL
      const publicUrl = process.env.R2_PUBLIC_URL || "";
      return `${publicUrl.replace(/\/$/, "")}/${fileName}`;
    } catch (error) {
      console.error("Failed uploading to Cloudflare R2, falling back to local storage:", error);
    }
  }

  // Local Storage Fallback
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return `/uploads/${fileName}`;
}
