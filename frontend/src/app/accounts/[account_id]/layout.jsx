export default function AccountDetailsLayout({ children }) {
  return (
    <section className="flex flex-col gap-4 md:py-10">
      <div className="inline-block">
        {children}
      </div>
    </section>
  );
}
