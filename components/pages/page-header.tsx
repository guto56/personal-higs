export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-3 px-4 pb-3 pt-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pt-8 lg:pl-6">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-[-0.01em]">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  );
}
