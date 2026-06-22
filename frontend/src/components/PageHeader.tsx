export function PageHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <div className="mb-8">
      <h1 className="display text-5xl font-bold sm:text-6xl">{title}</h1>
      <p className="eyebrow mt-3">{eyebrow}</p>
    </div>
  );
}
