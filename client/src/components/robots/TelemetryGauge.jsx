import React from 'react';

export const TelemetryGauge = ({ label, value, unit, max, min = 0, warningThreshold, criticalThreshold, icon: Icon }) => {
  const numVal = Number(value) || 0;
  const percentage = Math.min(100, Math.max(0, ((numVal - min) / (max - min)) * 100));

  let color = 'bg-emerald-500 text-emerald-600';
  let barBg = 'bg-emerald-500';
  let isExceeded = false;

  if (criticalThreshold && numVal >= criticalThreshold) {
    color = 'bg-rose-500 text-rose-600';
    barBg = 'bg-rose-500';
    isExceeded = true;
  } else if (warningThreshold && numVal >= warningThreshold) {
    color = 'bg-amber-500 text-amber-600';
    barBg = 'bg-amber-500';
    isExceeded = true;
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{numVal}</span>
        <span className="text-xs font-medium text-slate-500">{unit}</span>
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barBg}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  );
};
