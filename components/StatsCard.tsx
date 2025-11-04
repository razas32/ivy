interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bgColor: string;
}

export default function StatsCard({ icon, label, value, bgColor }: StatsCardProps) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4">
        <div className={`${bgColor} rounded-full p-3 flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
