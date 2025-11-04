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
      className="relative overflow-hidden rounded-xl p-6 transition-all hover:scale-105 hover:shadow-2xl group"
      style={{ background: gradient }}
    >
      {/* Decorative Icons Background */}
      <div className="absolute top-0 right-0 opacity-10 transform rotate-12">
        <svg className="w-32 h-32 text-white -mr-8 -mt-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 opacity-10 transform -rotate-12">
        <svg className="w-24 h-24 text-white -ml-6 -mb-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-4">
          {icon}
        </div>

        <div className="mb-1">
          <p className="text-white text-sm font-medium opacity-90">{label}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-white text-4xl font-bold">{value}</span>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
    </div>
  );
}
