import { S3Service, buildAttachmentKey } from "@upstream/shared";

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

let _s3Service: S3Service | null = null;

export function getS3Service() {
  if (!_s3Service) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.S3_BUCKET || !process.env.S3_REGION) {
      throw new Error("S3 configuration is missing");
    }
    
    _s3Service = new S3Service({
      region: process.env.S3_REGION,
      bucket: extractBucketName(process.env.S3_BUCKET),
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }
  return _s3Service;
}

export const s3Service = new Proxy({} as S3Service, {
  get(target, prop) {
    return getS3Service()[prop as keyof S3Service];
  },
});

export { buildAttachmentKey };
