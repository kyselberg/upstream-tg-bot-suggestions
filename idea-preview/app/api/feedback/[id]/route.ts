import { db, schema } from "@/lib/db";
import { s3Service } from "@/lib/s3";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const feedbackData = await db.query.feedback.findFirst({
      where: eq(schema.feedback.id, id),
      with: {
        attachments: true,
        user: true,
      },
    });

    if (!feedbackData) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    // Generate signed URLs for attachments
    const attachmentsWithUrls = await Promise.all(
      feedbackData.attachments.map(async (attachment) => {
        const url = await s3Service.getSignedUrl(attachment.s3Key, 3600);
        return {
          ...attachment,
          url,
        };
      })
    );

    return NextResponse.json({
      ...feedbackData,
      attachments: attachmentsWithUrls,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

