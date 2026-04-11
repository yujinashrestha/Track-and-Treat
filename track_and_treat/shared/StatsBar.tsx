'use client';

// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/components/shared/StatsBar.tsx
// ─────────────────────────────────────────────────────────────────────────────

interface StatsBarProps {
  streak:      number;
  goalStreak:  number;
  weeklyScore: number;
}

export default function StatsBar({ streak, goalStreak, weeklyScore }: StatsBarProps) {
  console.log('StatsBar rendered with:', { streak, goalStreak, weeklyScore });
  const stats = [
    { icon: '🔥', label: 'Log Streak',   value: `${streak} days`,     bg: 'bg-orange-50 border-orange-100',   numColor: 'text-orange-500'  },
    { icon: '🏆', label: 'Goal Streak',  value: `${goalStreak} days`, bg: 'bg-emerald-50 border-emerald-100', numColor: 'text-emerald-600' },
    { icon: '📈', label: 'Weekly Score', value: `${weeklyScore}%`,    bg: 'bg-indigo-50 border-indigo-100',   numColor: 'text-indigo-500'  },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((s, i) => (
        <div key={i} className={`${s.bg} border rounded-2xl p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl">
            {s.icon}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
            <p className={`text-xl font-black ${s.numColor}`}>{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
