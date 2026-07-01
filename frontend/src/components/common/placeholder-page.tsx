export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm text-slate-500">This page is part of the v1 scaffold and is ready for the next implementation pass.</p>
    </div>
  )
}
