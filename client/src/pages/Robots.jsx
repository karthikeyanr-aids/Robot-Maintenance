import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { robotsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HealthBadge, RiskBadge, StatusBadge } from '../components/common/Badges';
import { AddRobotModal } from '../components/robots/AddRobotModal';
import { LoadingSpinner } from '../components/common/Modal';
import {
  Bot,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  LayoutGrid,
  List,
  ChevronRight,
  Thermometer,
  Gauge,
  Clock,
  Trash2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const Robots = () => {
  const [robots, setRobots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState('');
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRobots();
  }, [statusFilter]);

  const fetchRobots = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await robotsAPI.getAll(params);
      if (res.data.success) {
        setRobots(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch robots');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRobot = async (id, robotId, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete robot ${robotId}? This will remove associated telemetry logs.`)) {
      return;
    }

    try {
      await robotsAPI.delete(id);
      setRobots((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete robot');
    }
  };

  const filteredRobots = robots.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.robotId.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.manufacturer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Robotic Fleet Fleet Center</h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status, health indexing, and diagnostic routing for all workcells.
          </p>
        </div>

        {hasRole('ADMIN') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Robot</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by ID, name, manufacturer, or workcell..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'HEALTHY', 'WARNING', 'CRITICAL', 'MAINTENANCE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg ${
              viewMode === 'grid' ? 'bg-white shadow-sm text-cyan-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg ${
              viewMode === 'table' ? 'bg-white shadow-sm text-cyan-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner text="Fetching fleet telemetry..." />
      ) : filteredRobots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No robots found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or status filter.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRobots.map((robot) => (
            <div
              key={robot._id}
              onClick={() => navigate(`/robots/${robot.robotId}`)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm card-hover cursor-pointer flex flex-col justify-between"
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-400">
                      {robot.robotId}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {robot.manufacturer}
                    </span>
                  </div>
                  <StatusBadge status={robot.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{robot.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{robot.location}</p>

                {/* Health & Risk Bar */}
                <div className="flex items-center justify-between gap-2 mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-150">
                  <HealthBadge score={robot.healthScore} size="sm" />
                  {robot.latestPrediction && (
                    <RiskBadge risk={robot.latestPrediction.riskLevel} size="sm" />
                  )}
                </div>

                {/* Sensor Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">RUNTIME</span>
                    <span className="font-bold text-slate-800">{robot.runtimeHours.toLocaleString()}h</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">TEMP</span>
                    <span className={`font-bold ${robot.temperature > 70 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {robot.temperature}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">VIBRATION</span>
                    <span className={`font-bold ${robot.vibration > 6 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {robot.vibration} mm/s
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                <span className="text-[11px] text-cyan-600 font-semibold flex items-center gap-1">
                  View Diagnostics <ChevronRight className="w-3.5 h-3.5" />
                </span>

                {hasRole('ADMIN') && (
                  <button
                    onClick={(e) => handleDeleteRobot(robot._id, robot.robotId, e)}
                    title="Delete Robot"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Robot ID</th>
                  <th className="py-3 px-4">Name / Workcell</th>
                  <th className="py-3 px-4">Model & Make</th>
                  <th className="py-3 px-4">Runtime</th>
                  <th className="py-3 px-4">Telemetry</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredRobots.map((robot) => (
                  <tr
                    key={robot._id}
                    onClick={() => navigate(`/robots/${robot.robotId}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{robot.robotId}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-800">{robot.name}</p>
                      <p className="text-[10px] text-slate-400">{robot.location}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-800 font-medium">{robot.model}</p>
                      <p className="text-[10px] text-slate-400">{robot.manufacturer}</p>
                    </td>
                    <td className="py-3 px-4 font-mono">{robot.runtimeHours.toLocaleString()} hrs</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono ${robot.temperature > 70 ? 'text-rose-600 font-bold' : ''}`}>
                          {robot.temperature}°C
                        </span>
                        <span className={`font-mono ${robot.vibration > 6 ? 'text-rose-600 font-bold' : ''}`}>
                          {robot.vibration} mm/s
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <HealthBadge score={robot.healthScore} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={robot.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/robots/${robot.robotId}`)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 font-semibold text-slate-600 transition-colors"
                        >
                          Details
                        </button>
                        {hasRole('ADMIN') && (
                          <button
                            onClick={(e) => handleDeleteRobot(robot._id, robot.robotId, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Robot Modal */}
      <AddRobotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(newRobot) => {
          setRobots((prev) => [newRobot, ...prev]);
        }}
      />
    </div>
  );
};
