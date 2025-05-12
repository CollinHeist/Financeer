export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 md:py-10">
      <div className="inline-block max-w-lg">
        {children}
      </div>
    </section>
  );
}
