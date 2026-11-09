export function StatsOverview({
  stats,
}: {
  stats: {
    totalUsers: number;
    activeSubforums: number;
    publishedDiscussions: number;
    pendingReports: number;
  };
}) {
  const cards = [
    {
      label: "Total Registered Users",
      value: stats.totalUsers,
      color: "bg-blue-50 border-blue-200 text-blue-800",
      icon: "👥",
    },
    {
      label: "Active Subforums",
      value: stats.activeSubforums,
      color: "bg-green-50 border-green-200 text-green-800",
      icon: "🏛️",
    },
    {
      label: "Published Discussions",
      value: stats.publishedDiscussions,
      color: "bg-purple-50 border-purple-200 text-purple-800",
      icon: "💬",
    },
    {
      label: "Pending Reports",
      value: stats.pendingReports,
      color: "bg-amber-50 border-amber-200 text-amber-800",
      icon: "⚠️",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${card.color}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xl">{card.icon}</span>
            <span className="text-3xl font-bold">{card.value}</span>
          </div>
          <h3 className="mt-3 text-sm font-semibold opacity-90">
            {card.label}
          </h3>
        </div>
      ))}
    </div>
  );
}
