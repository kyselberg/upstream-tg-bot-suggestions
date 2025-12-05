export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Перегляд відгуків</h1>
        <p className="text-muted-foreground">
          Використовуйте <code className="px-2 py-1 bg-muted rounded text-sm">/feedback/[id]</code> для перегляду відгуку
        </p>
      </div>
    </div>
  );
}
