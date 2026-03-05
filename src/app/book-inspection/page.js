import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

const BookInspectionForm = dynamicImport(() => import("@/components/BookInspectionForm"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
    </div>
  )
});

export default function BookInspectionPage() {
  return <BookInspectionForm />;
}
