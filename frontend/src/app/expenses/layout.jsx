export default function ExpensePageLayout({ children }) {
  return (
    <section className="flex flex-col w-full">
      <div className="w-full">
        {children}
      </div>
    </section>
  );
}
