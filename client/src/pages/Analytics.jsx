import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { LoadingSpinner } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import { HealthBadge } from '../components/common/Badges';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  AlertTriangle,
  BrainCircuit,
  Bot,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

export const Analytics = () => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const res = await analyticsAPI.getTrends();
      if (res.data.success) {
        setTrends(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching analytics trends:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Computing fleet reliability analytics & MTBF metrics..." size="lg" />;

  const {
    summary = {},
    robotHealthRanking = [],
    componentStats = [],
    errorSeverityDistribution = [],
  } = trends || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Robotic Analytics & Reliability Metrics
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative degradation analysis, component lifespan curves, and cumulative downtime impact.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Maintenance Cost"
          value={`$${summary.totalCost?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="emerald"
          subtitle="Cumulative Fleet Servicing"
        />
        <StatCard
          title="Cumulative Downtime"
          value={`${summary.totalDowntime || 0}`}
          unit="hrs"
          icon={Clock}
          color="amber"
          subtitle="Total Line Stoppage"
        />
        <StatCard
          title="Total Error Alarms"
          value={summary.totalErrors || 0}
          unit="alarms"
          icon={AlertTriangle}
          color="rose"
          subtitle="All Time Logged"
        />
        <StatCard
          title="ML Inferences Run"
          value={summary.totalPredictions || 0}
          unit="inferences"
          icon={BrainCircuit}
          color="cyan"
          subtitle="TensorFlow.js Diagnostics"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Health By Type */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Avg Remaining Life by Component Category</h3>
              <p className="text-xs text-slate-500">Subsystem degradation comparison</p>
            </div>
            <Layers className="w-4 h-4 text-cyan-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={componentStats} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="type"
                  stroke="#94a3b8"
                  fontSize={10}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} unit="%" />
                <RechartsTooltip
                  formatter={(val) => [`${val}% Remaining Life`, 'Average Life']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avgRemainingLife" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Severity Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Alarm Severity Proportions</h3>
              <p className="text-xs text-slate-500">Distribution of historical error events</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={errorSeverityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {errorSeverityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val, name) => [`${val} Faults`, `${name} Severity`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2 pt-3 border-t border-slate-100">
            {errorSeverityDistribution.map((item) => (
              <div key={item.name} className="text-center">
                <span className="text-[10px] text-slate-400 font-semibold block">{item.name}</span>
                <span className="text-sm font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fleet Health Ranking Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Fleet Health Ranking (Ascending Risk)</h3>
            <p className="text-xs text-slate-500">Robots requiring closest operational attention</p>
          </div>
          <TrendingUp className="w-4 h-4 text-cyan-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Robot ID</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Operating Temp</th>
                <th className="py-2.5 px-3">Vibration</th>
                <th className="py-2.5 px-3">Runtime</th>
                <th className="py-2.5 px-3">Health Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {robotHealthRanking.map((r) => (
                <tr key={r.robotId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.robotId}</td>
                  <td className="py-2.5 px-3">{r.name}</td>
                  <td className="py-2.5 px-3 font-mono">{r.temperature}°C</td>
                  <td className="py-2.5 px-3 font-mono">{r.vibration} mm/s</td>
                  <td className="py-2.5 px-3 font-mono">{r.runtimeHours.toLocaleString()}h</td>
                  <td className="py-2.5 px-3">
                    <HealthBadge score={r.healthScore} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
