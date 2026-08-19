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
    <div className="surface lift-on-hover mobile-card stagger-item rounded-2xl p-5">
      <p className="text-sm text-gray-500">{title}</p>

      <h3 className="mt-3 text-2xl font-bold tracking-tight">{value}</h3>

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