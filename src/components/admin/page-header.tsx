export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <header>
      <h1 className="text-navy font-serif text-4xl font-medium">{title}</h1>
      {description && <p className="text-muted mt-1 text-sm">{description}</p>}
    </header>
  );
}
