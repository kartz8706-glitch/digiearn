type StatCardProps = {
  title: string;
  value: string;
  change?: string;
  positive?: boolean;
};

export default function StatCard({
  title,
  value,
  change,
  positive = true,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#1c3026] bg-[#0c1813] p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <h3 className="mt-3 text-2xl font-bold">{value}</h3>

      {change && (
        <p
          className={`mt-2 text-sm ${
            positive ? "text-[#43e58c]" : "text-red-400"
          }`}
        >
          {change}
        </p>
      )}
    </div>
  );
}