export const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="w-full rounded-2xl bg-white p-4 shadow-sm">
    <h2 className="mb-3 text-lg font-semibold text-slate-800">{title}</h2>
    {children}
  </section>
);
