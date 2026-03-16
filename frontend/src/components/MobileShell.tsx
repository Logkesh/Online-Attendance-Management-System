export const MobileShell = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <main className="mx-auto min-h-screen w-full max-w-md px-4 py-6">
    <div className="rounded-[2rem] border border-indigo-100 bg-white/95 p-5 shadow-xl shadow-indigo-100">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-500">Smart Attendance</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </header>
      {children}
    </div>
  </main>
);
