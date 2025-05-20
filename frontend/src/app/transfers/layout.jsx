export default function TransfersLayout({ children }) {
  return (
    <section className="flex flex-col md:py-10 w-full">
      <div className="w-full">
        {children}
      </div>
    </section>
  );
}
