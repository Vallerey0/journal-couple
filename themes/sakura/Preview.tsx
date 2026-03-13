export default function FirePreview({ data }: { data: any }) {
  return (
    <div className="min-h-screen p-6 bg-red-50">
      <h1 className="text-2xl font-bold">
        {data?.couple_name ?? "Fire Theme"}
      </h1>
    </div>
  );
}
