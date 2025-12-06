import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db, schema } from "@/lib/db";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function Home() {
  const allFeedback = await db.query.feedback.findMany({
    orderBy: [
      desc(schema.feedback.likesCount),
      desc(schema.feedback.createdAt),
    ],
    limit: 50,
    with: {
      user: true,
      attachments: true,
    },
  });

  const feedbackTypeLabels: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    idea: { label: "💡 Ідея", variant: "default" },
    problem: { label: "⚠️ Проблема", variant: "destructive" },
    thanks: { label: "🙏 Подяка", variant: "secondary" },
    question: { label: "❓ Питання", variant: "outline" },
  };

  const statusLabels: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    new: { label: "Нове", variant: "default" },
    seen: { label: "Переглянуто", variant: "secondary" },
    in_progress: { label: "В роботі", variant: "outline" },
    done: { label: "Виконано", variant: "secondary" },
    rejected: { label: "Неактуально", variant: "destructive" },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Всі відгуки</h1>
          <p className="text-muted-foreground">
            Перегляньте всі надіслані відгуки та пропозиції
          </p>
        </header>

        {allFeedback.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Відгуки не знайдено</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allFeedback.map((feedback) => {
              const typeInfo = feedbackTypeLabels[feedback.type] || {
                label: feedback.type,
                variant: "outline" as const,
              };
              const statusInfo = statusLabels[feedback.status] || {
                label: feedback.status,
                variant: "outline" as const,
              };
              const preview =
                feedback.text.length > 150
                  ? feedback.text.substring(0, 150) + "..."
                  : feedback.text;

              return (
                <Link key={feedback.id} href={`/feedback/${feedback.id}`}>
                  <Card className="h-full transition-colors hover:bg-accent cursor-pointer">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge variant={typeInfo.variant}>
                          {typeInfo.label}
                        </Badge>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-lg">
                        {preview.split("\n")[0] || "Без назви"}
                      </CardTitle>
                      <CardDescription>
                        {format(
                          new Date(feedback.createdAt),
                          "d MMMM yyyy, HH:mm",
                          { locale: uk }
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {preview}
                      </p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-2 text-xs text-muted-foreground">
                      {feedback.user?.name && (
                        <span>Від: {feedback.user.name}</span>
                      )}
                      {feedback.likesCount > 0 && (
                        <span className={feedback.user?.name ? "ml-2" : ""}>
                          ❤️ {feedback.likesCount}
                        </span>
                      )}
                      {feedback.attachments.length > 0 && (
                        <span className="ml-auto">
                          📎 {feedback.attachments.length}
                        </span>
                      )}
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
