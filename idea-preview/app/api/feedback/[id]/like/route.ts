import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Fingerprint is required" },
        { status: 400 }
      );
    }

    // Check if already liked
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(schema.likes.feedbackId, id),
        eq(schema.likes.fingerprint, fingerprint)
      ),
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Already liked", liked: true },
        { status: 400 }
      );
    }

    // Add like
    await db.insert(schema.likes).values({
      feedbackId: id,
      fingerprint,
    });

    // Increment likes count
    await db
      .update(schema.feedback)
      .set({
        likesCount: sql`${schema.feedback.likesCount} + 1`,
      })
      .where(eq(schema.feedback.id, id));

    // Get updated count
    const updatedFeedback = await db.query.feedback.findFirst({
      where: eq(schema.feedback.id, id),
      columns: { likesCount: true },
    });

    return NextResponse.json({
      success: true,
      liked: true,
      likesCount: updatedFeedback?.likesCount || 0,
    });
  } catch (error) {
    console.error("Error adding like:", error);
    return NextResponse.json(
      { error: "Failed to add like" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Fingerprint is required" },
        { status: 400 }
      );
    }

    // Check if like exists
    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(schema.likes.feedbackId, id),
        eq(schema.likes.fingerprint, fingerprint)
      ),
    });

    if (!existingLike) {
      return NextResponse.json(
        { error: "Like not found", liked: false },
        { status: 400 }
      );
    }

    // Remove like
    await db
      .delete(schema.likes)
      .where(
        and(
          eq(schema.likes.feedbackId, id),
          eq(schema.likes.fingerprint, fingerprint)
        )
      );

    // Decrement likes count
    await db
      .update(schema.feedback)
      .set({
        likesCount: sql`GREATEST(${schema.feedback.likesCount} - 1, 0)`,
      })
      .where(eq(schema.feedback.id, id));

    // Get updated count
    const updatedFeedback = await db.query.feedback.findFirst({
      where: eq(schema.feedback.id, id),
      columns: { likesCount: true },
    });

    return NextResponse.json({
      success: true,
      liked: false,
      likesCount: updatedFeedback?.likesCount || 0,
    });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json(
      { error: "Failed to remove like" },
      { status: 500 }
    );
  }
}

// Check if user has liked
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get("fingerprint");

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Fingerprint is required" },
        { status: 400 }
      );
    }

    const existingLike = await db.query.likes.findFirst({
      where: and(
        eq(schema.likes.feedbackId, id),
        eq(schema.likes.fingerprint, fingerprint)
      ),
    });

    const feedback = await db.query.feedback.findFirst({
      where: eq(schema.feedback.id, id),
      columns: { likesCount: true },
    });

    return NextResponse.json({
      liked: !!existingLike,
      likesCount: feedback?.likesCount || 0,
    });
  } catch (error) {
    console.error("Error checking like:", error);
    return NextResponse.json(
      { error: "Failed to check like" },
      { status: 500 }
    );
  }
}

