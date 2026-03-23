export function PlaceholderPage({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <h1 className="text-2xl font-semibold text-zinc-50">{title}</h1>
      {children ?? (
        <p className="text-zinc-500">
          Placeholder — connect to Nest API and port PHP controller logic.
        </p>
      )}
    </div>
  );
}
