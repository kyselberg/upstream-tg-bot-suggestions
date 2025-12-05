import { db, schema } from "@/lib/db";
import { buildAttachmentKey } from "@/lib/s3";
import { feedbackSubmissionSchema } from "@upstream/shared";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = feedbackSubmissionSchema.parse(body);

    // Create or update user
    let userId: string | null = null;
    if (validatedData.identityMode !== "anonymous") {
      const [user] = await db
        .insert(schema.users)
        .values({
          name: validatedData.name || null,
          relation: validatedData.relation || null,
          contact: validatedData.contact || null,
        })
        .returning({ id: schema.users.id });

      userId = user?.id || null;
    }

    // Create feedback
    const [feedback] = await db
      .insert(schema.feedback)
      .values({
        userId: userId,
        type: validatedData.feedbackType,
        text: validatedData.text,
        status: "new",
      })
      .returning({ id: schema.feedback.id });

    const feedbackId = feedback?.id;
    if (!feedbackId) {
      throw new Error("Failed to create feedback");
    }

    // Handle attachments
    if (validatedData.attachments && validatedData.attachments.length > 0) {
      const attachmentPromises = validatedData.attachments.map(
        async (attachment) => {
          // Extract base64 data
          const base64Data = attachment.dataUrl.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");

          // Generate S3 key
          const timestamp = Date.now();
          const key = buildAttachmentKey([
            "feedback",
            feedbackId,
            `${timestamp}-${attachment.name}`,
          ]);

          // Upload to S3 using the service's internal method
          // We need to use the S3 client directly for buffer uploads
          const { S3Client, PutObjectCommand } = await import(
            "@aws-sdk/client-s3"
          );

          const s3Client = new S3Client({
            region: process.env.S3_REGION!,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
          });

          await s3Client.send(
            new PutObjectCommand({
              Bucket: process.env.S3_BUCKET!.split("/").pop()!,
              Key: key,
              Body: buffer,
              ContentType: attachment.type,
            })
          );

          return {
            feedbackId,
            type: attachment.type.startsWith("image/")
              ? ("photo" as const)
              : ("document" as const),
            s3Key: key,
          };
        }
      );

      const attachmentsData = await Promise.all(attachmentPromises);

      await db.insert(schema.attachments).values(attachmentsData);
    }

    return NextResponse.json(
      {
        success: true,
        feedbackId,
        message: "Дякуємо за ваш відгук!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create feedback",
      },
      { status: 500 }
    );
  }
}
