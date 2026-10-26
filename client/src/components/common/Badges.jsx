import React from 'react';

export const HealthBadge = ({ score, size = 'md' }) => {
  const numScore = Number(score) || 0;
  let bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dot = 'bg-emerald-500 shadow-emerald-400';

  if (numScore < 30) {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    dot = 'bg-rose-500 shadow-rose-400';
  } else if (numScore < 70) {
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500 shadow-amber-400';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-semibold' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClass}`}>
      <span className={`w-2 h-2 rounded-full ${dot} shadow-sm animate-pulse-subtle`}></span>
      <span>{numScore}% Health</span>
    </span>
  );
};

export const RiskBadge = ({ risk, size = 'md' }) => {
  const level = (risk || 'LOW').toUpperCase();
  let styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dot = 'bg-emerald-500';

  if (level === 'CRITICAL') {
    styles = 'bg-red-50 text-red-700 border-red-200 font-bold';
    dot = 'bg-red-600 animate-ping';
  } else if (level === 'HIGH') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
    dot = 'bg-orange-500';
  } else if (level === 'MEDIUM') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
    dot = 'bg-amber-500';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${styles} ${sizeClass}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`}></span>
      <span>{level} RISK</span>
    </span>
  );
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const s = (status || 'HEALTHY').toUpperCase();
  let color = 'bg-slate-100 text-slate-700 border-slate-200';

  if (s === 'HEALTHY' || s === 'OK' || s === 'COMPLETED') {
    color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'WARNING' || s === 'IN_PROGRESS' || s === 'SCHEDULED') {
    color = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'CRITICAL' || s === 'HIGH') {
    color = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'MAINTENANCE' || s === 'PENDING') {
    color = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center rounded-full border ${color} ${sizeClass}`}>
      {s.replace('_', ' ')}
    </span>
  );
};
