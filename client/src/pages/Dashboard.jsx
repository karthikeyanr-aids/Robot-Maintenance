import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import { HealthBadge, RiskBadge, StatusBadge } from '../components/common/Badges';
import { LoadingSpinner } from '../components/common/Modal';
import {
  Bot,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Wrench,
  Clock,
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Zap,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await analyticsAPI.getDashboard();
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Connecting to robotics telemetry feeds..." size="lg" />;
  if (error) return <div className="p-8 text-center text-rose-600">{error}</div>;

  const {
    kpis = {},
    robotHealthOverview = [],
    riskDistribution = [],
    recentHighRiskPredictions = [],
    runtimeDistribution = [],
    topErrorTypes = [],
    upcomingMaintenance = [],
    recentErrors = [],
    recentAlerts = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4" />
            <span>Industrial Predictive Health Hub</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Active Workcell Fleet Overview</h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time multi-axial robot sensor telemetry with TensorFlow.js failure prediction.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/robots')}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>View Fleet</span>
          </button>
          <button
            onClick={() => navigate('/predictions')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>ML Predictions</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Robots"
          value={kpis.totalRobots || 0}
          unit="units"
          icon={Bot}
          color="blue"
          subtitle="Monitored Fleet"
        />
        <StatCard
          title="Healthy"
          value={kpis.healthy || 0}
          unit="units"
          icon={ShieldCheck}
          color="emerald"
          subtitle="Optimal Status"
        />
        <StatCard
          title="Warning"
          value={kpis.warning || 0}
          unit="units"
          icon={AlertTriangle}
          color="amber"
          subtitle="Elevated Wear"
        />
        <StatCard
          title="Critical"
          value={kpis.critical || 0}
          unit="units"
          icon={AlertOctagon}
          color="rose"
          subtitle="Immediate Action"
        />
        <StatCard
          title="Avg Health Score"
          value={`${kpis.averageHealthScore || 0}%`}
          icon={Activity}
          color="cyan"
          subtitle="Fleet Resilience"
        />
      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Fleet Risk Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Predicted failure exposure</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val, name) => [`${val} Robots`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 dark:text-white">{kpis.totalRobots || 0}</span>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {riskDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}</span>
                <span className="font-bold text-slate-800 dark:text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Runtime Hours & Health Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between lg:col-span-2 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Robot Runtime vs. Health Index</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cumulative operational hours compared with calculated health</p>
            </div>
            <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={runtimeDistribution} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="robotId" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#0284c7" fontSize={11} domain={[0, 15000]} unit="h" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} domain={[0, 100]} unit="%" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="runtimeHours"
                  name="Runtime (Hours)"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="healthScore"
                  name="Health Score (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-cyan-600 rounded-full" />
              <span>Runtime Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-emerald-500 rounded-full" />
              <span>Health Score (%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Top Errors + Recent High Risk Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Error Types Horizontal Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Top Robotic Error Types</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Frequency of telemetry and controller faults</p>
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topErrorTypes}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="type"
                  stroke="#64748b"
                  fontSize={10}
                  width={140}
                  tickFormatter={(val) => (val.length > 20 ? val.substring(0, 18) + '...' : val)}
                />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Occurrences" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent High Risk Predictions */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent High Risk Predictions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">TensorFlow.js priority diagnostics</p>
            </div>
            <button
              onClick={() => navigate('/predictions')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentHighRiskPredictions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No high-risk predictions recorded.</div>
            ) : (
              recentHighRiskPredictions.map((pred) => (
                <div
                  key={pred._id}
                  onClick={() => navigate(`/robots/${pred.robotId?.robotId || pred.robotId}`)}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-100">
                        {pred.robotId?.robotId || 'RBT'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {pred.robotId?.name || 'Robot'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Component: <span className="font-medium text-slate-700 dark:text-slate-300">{pred.componentId?.name || 'System'}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <span className="text-xs font-bold text-rose-600 block">
                        {pred.failurePercentage}% Fail Prob
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(pred.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <RiskBadge risk={pred.riskLevel} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Third Row: Robot Health Overview Table + Upcoming Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Robot Health Overview Table */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Robot Health Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live operational telemetry & health score ranking</p>
            </div>
            <button
              onClick={() => navigate('/robots')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              Full Fleet <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <tr>
                  <th className="py-2.5 px-3">Robot ID</th>
                  <th className="py-2.5 px-3">Name & Workcell</th>
                  <th className="py-2.5 px-3">Temp</th>
                  <th className="py-2.5 px-3">Vib</th>
                  <th className="py-2.5 px-3">Health</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {robotHealthOverview.slice(0, 7).map((robot) => (
                  <tr key={robot._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{robot.robotId}</td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[160px]">{robot.name}</p>
                      <p className="text-[10px] text-slate-400">{robot.location}</p>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{robot.temperature}°C</td>
                    <td className="py-2.5 px-3 font-mono">{robot.vibration} mm/s</td>
                    <td className="py-2.5 px-3">
                      <HealthBadge score={robot.healthScore} size="sm" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={robot.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => navigate(`/robots/${robot.robotId}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-700 dark:hover:text-cyan-400 text-slate-600 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Maintenance Tasks */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Upcoming Maintenance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled work orders</p>
            </div>
            <button
              onClick={() => navigate('/maintenance')}
              className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingMaintenance.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No upcoming maintenance scheduled.</div>
            ) : (
              upcomingMaintenance.map((m) => (
                <div key={m._id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {m.robotId?.robotId || 'RBT'}
                    </span>
                    <StatusBadge status={m.status} size="sm" />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1">{m.problem}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-750">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(m.scheduledDate).toLocaleDateString()}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {m.technicianId?.name === 'Lead Technician' ? 'Maintenance Engineer' : (m.technicianId?.name || 'Assigned Pool')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
