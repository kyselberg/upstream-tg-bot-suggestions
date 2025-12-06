"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">Щось пішло не так</h2>
        <p className="text-muted-foreground mb-6">
          Виникла помилка при завантаженні сторінки. Будь ласка, спробуйте ще раз.
        </p>
        {process.env.NODE_ENV === "development" && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
              Деталі помилки (тільки в режимі розробки)
            </summary>
            <pre className="text-xs bg-muted p-4 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Спробувати ще раз
        </button>
      </div>
    </div>
  );
}

