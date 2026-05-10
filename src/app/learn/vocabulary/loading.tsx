export default function VocabularyLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="h-10 w-full max-w-xl rounded-md bg-muted" />
          <div className="h-5 w-full max-w-2xl rounded-md bg-muted" />
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-10 rounded-lg bg-muted" />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 rounded-lg border bg-card p-5">
              <div className="h-8 w-32 rounded-md bg-muted" />
              <div className="mt-4 h-20 rounded-md bg-muted" />
              <div className="mt-4 h-12 rounded-md bg-muted" />
              <div className="mt-10 h-9 rounded-md bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
