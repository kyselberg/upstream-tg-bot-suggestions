import { db, schema } from "@/lib/db";
import { s3Service } from "@/lib/s3";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ImageGrid from "@/components/image-grid";
import LikeButton from "@/components/like-button";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackPage({ params }: PageProps) {
  const { id } = await params;

  const feedbackData = await db.query.feedback.findFirst({
    where: eq(schema.feedback.id, id),
    with: {
      attachments: true,
      user: true,
    },
  });

  if (!feedbackData) {
    notFound();
  }

  // Generate signed URLs for photo attachments
  const photoAttachments = feedbackData.attachments.filter(
    (att) => att.type === "photo"
  );
  
  const imageUrls = await Promise.all(
    photoAttachments.map(async (attachment) => {
      const url = await s3Service.getSignedUrl(attachment.s3Key, 3600);
      return {
        id: attachment.id,
        url,
        s3Key: attachment.s3Key,
      };
    })
  );

  const feedbackTypeLabels: Record<string, string> = {
    idea: "💡 Ідея / пропозиція",
    problem: "⚠️ Проблема / скарга",
    thanks: "🙏 Подяка / історія",
    question: "❓ Питання",
  };

  const statusLabels: Record<string, string> = {
    new: "Нове",
    seen: "Переглянуто",
    in_progress: "В роботі",
    done: "Виконано",
    rejected: "Неактуально",
  };

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
              {feedbackTypeLabels[feedbackData.type] || feedbackData.type}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground">
              {statusLabels[feedbackData.status] || feedbackData.status}
            </span>
            <div className="ml-auto">
              <LikeButton 
                feedbackId={feedbackData.id} 
                initialLikesCount={feedbackData.likesCount}
              />
            </div>
          </div>
          
          {feedbackData.user?.name && (
            <p className="text-sm text-muted-foreground mb-2">
              Від: {feedbackData.user.name}
            </p>
          )}
          
          <time className="text-sm text-muted-foreground">
            {format(new Date(feedbackData.createdAt), "d MMMM yyyy, HH:mm", { locale: uk })}
          </time>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">
            {feedbackData.text}
          </div>
        </div>

        {/* Image Grid */}
        {imageUrls.length > 0 && (
          <div className="mt-8">
            <ImageGrid images={imageUrls} />
          </div>
        )}
      </article>
    </div>
  );
}

