import { S3Service, buildAttachmentKey } from "@upstream/shared";
import { env } from "../config.js";

// Helper to extract bucket name from URL if someone pastes console URL
function extractBucketName(value: string): string {
  if (value.includes("://")) {
    try {
      const url = new URL(value);
      const pathParts = url.pathname.split("/");
      const bucketIndex = pathParts.indexOf("buckets");
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts[bucketIndex + 1];
      }
      if (url.protocol === "s3:") {
        return url.hostname || url.pathname.split("/")[0];
      }
    } catch {
      const match = value.match(/buckets\/([^\/\?]+)/);
      if (match) return match[1];
    }
  }
  if (value.includes("/")) {
    return value.split("/").pop() || value;
  }
  return value;
}

const s3Service = new S3Service({
  region: env.S3_REGION,
  bucket: extractBucketName(env.S3_BUCKET),
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
});

export { buildAttachmentKey };

export async function uploadFromUrl(
  url: string,
  key: string,
  contentType?: string
): Promise<string> {
  return s3Service.uploadFromUrl(url, key, contentType);
}
