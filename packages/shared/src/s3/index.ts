import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

// Helper to extract region from S3 endpoint
function extractRegionFromEndpoint(endpoint: string): string | null {
  // Format: bucket.s3.region.amazonaws.com
  const match = endpoint.match(/\.s3\.([^.]+)\.amazonaws\.com/);
  return match ? match[1] : null;
}

// Create S3 client with proper region
function createS3Client(config: S3Config, region?: string): S3Client {
  return new S3Client({
    region: region || config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: false,
  });
}

export class S3Service {
  private client: S3Client;
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
    this.client = createS3Client(config);
  }

  async uploadFromUrl(
    url: string,
    key: string,
    contentType?: string
  ): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to download file: ${response.status} ${response.statusText}`
      );
    }
    const body = Buffer.from(await response.arrayBuffer());

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    } catch (error: unknown) {
      // Handle PermanentRedirect by retrying with correct region
      if (
        error &&
        typeof error === "object" &&
        "Code" in error &&
        error.Code === "PermanentRedirect" &&
        "Endpoint" in error &&
        typeof error.Endpoint === "string"
      ) {
        const correctRegion = extractRegionFromEndpoint(error.Endpoint);
        if (correctRegion && correctRegion !== this.config.region) {
          console.warn(
            `S3 redirect detected. Retrying with region: ${correctRegion}`
          );
          const correctedClient = createS3Client(this.config, correctRegion);
          await correctedClient.send(
            new PutObjectCommand({
              Bucket: this.config.bucket,
              Key: key,
              Body: body,
              ContentType: contentType,
            })
          );
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
    return key;
  }

  async uploadBuffer(
    buffer: Buffer,
    key: string,
    contentType?: string
  ): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
      );
    } catch (error: unknown) {
      // Handle PermanentRedirect by retrying with correct region
      if (
        error &&
        typeof error === "object" &&
        "Code" in error &&
        error.Code === "PermanentRedirect" &&
        "Endpoint" in error &&
        typeof error.Endpoint === "string"
      ) {
        const correctRegion = extractRegionFromEndpoint(error.Endpoint);
        if (correctRegion && correctRegion !== this.config.region) {
          console.warn(
            `S3 redirect detected. Retrying with region: ${correctRegion}`
          );
          const correctedClient = createS3Client(this.config, correctRegion);
          await correctedClient.send(
            new PutObjectCommand({
              Bucket: this.config.bucket,
              Key: key,
              Body: buffer,
              ContentType: contentType,
            })
          );
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
    return key;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  getPublicUrl(key: string): string {
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}

export const buildAttachmentKey = (parts: string[]) => parts.join("/");

