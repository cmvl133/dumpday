export function Header() {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            DumpDay
          </h1>
          <p className="text-sm text-muted-foreground">
            Dump your thoughts. Own your day.
          </p>
        </div>
      </div>
    </header>
  );
}
