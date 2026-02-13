interface GradientStatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  gradient: string;
  iconBg: string;
}

export default function GradientStatsCard({ icon, label, value, gradient, iconBg }: GradientStatsCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border border-white/20 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:border-white/35 group"
      style={{ background: gradient }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)] pointer-events-none transition-opacity duration-200 group-hover:opacity-100" />

      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl border border-white/20 ${iconBg} mb-4`}>
          {icon}
        </div>

        <p className="text-white/85 text-sm font-medium tracking-wide">{label}</p>
        <p className="text-white text-3xl font-bold mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
