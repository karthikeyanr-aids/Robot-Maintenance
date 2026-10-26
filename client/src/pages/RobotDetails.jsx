import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { robotsAPI, predictionsAPI, errorsAPI, maintenanceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HealthBadge, RiskBadge, StatusBadge } from '../components/common/Badges';
import { TelemetryGauge } from '../components/robots/TelemetryGauge';
import { ScheduleMaintenanceModal } from '../components/robots/ScheduleMaintenanceModal';
import { LoadingSpinner } from '../components/common/Modal';
import {
  Bot,
  BrainCircuit,
  Wrench,
  AlertTriangle,
  Clock,
  Layers,
  Thermometer,
  Activity,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Zap,
  RefreshCw,
} from 'lucide-react';

export const RobotDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [robot, setRobot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('components'); // 'components' | 'errors' | 'maintenance' | 'predictions'
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRobotDetails();
  }, [id]);

  const fetchRobotDetails = async () => {
    setLoading(true);
    try {
      const res = await robotsAPI.getById(id);
      if (res.data.success) {
        setRobot(res.data.data);
        if (res.data.data.latestPrediction) {
          setPredictionResult(res.data.data.latestPrediction);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch robot details');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictMaintenance = async () => {
    setPredicting(true);
    try {
      const res = await predictionsAPI.analyze(robot.robotId);
      if (res.data.success) {
        setPredictionResult(res.data);
        // Refresh robot stats
        setRobot((prev) => ({
          ...prev,
          healthScore: res.data.healthScore,
          status: res.data.riskLevel === 'CRITICAL' ? 'CRITICAL' : res.data.riskLevel === 'HIGH' ? 'WARNING' : 'HEALTHY',
          latestPrediction: res.data,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run prediction analysis');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Querying robotic controller and telemetry logs..." size="lg" />;
  if (error || !robot) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">Robot Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'Requested robot ID does not exist.'}</p>
        <button
          onClick={() => navigate('/robots')}
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Return to Fleet
        </button>
      </div>
    );
  }

  const { components = [], errorLogs = [], maintenanceRecords = [], predictions = [] } = robot;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/robots')}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg px-2.5 py-0.5 rounded-lg bg-slate-900 text-cyan-400">
                {robot.robotId}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{robot.name}</h2>
              <StatusBadge status={robot.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {robot.manufacturer} • {robot.model} • Location: <span className="font-medium text-slate-700">{robot.location}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handlePredictMaintenance}
            disabled={predicting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {predicting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-300" />
            )}
            <span>{predicting ? 'Running Neural Inference...' : 'PREDICT MAINTENANCE'}</span>
          </button>

          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
          >
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Schedule Maintenance</span>
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Gauges Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TelemetryGauge
          label="Operating Temp"
          value={robot.temperature}
          unit="°C"
          min={30}
          max={100}
          warningThreshold={65}
          criticalThreshold={75}
          icon={Thermometer}
        />
        <TelemetryGauge
          label="RMS Vibration"
          value={robot.vibration}
          unit=" mm/s"
          min={0}
          max={15}
          warningThreshold={4.5}
          criticalThreshold={6.5}
          icon={Activity}
        />
        <TelemetryGauge
          label="Cumulative Runtime"
          value={robot.runtimeHours}
          unit=" hrs"
          min={0}
          max={15000}
          warningThreshold={8000}
          criticalThreshold={12000}
          icon={Clock}
        />
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Robot Health Index</span>
            <BrainCircuit className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-extrabold text-slate-900">{robot.healthScore}%</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <HealthBadge score={robot.healthScore} size="sm" />
        </div>
      </div>

      {/* ML Diagnostic & Prediction Spotlight Card */}
      {predictionResult && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 rounded-2xl p-6 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div
            className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
              predictionResult.riskLevel === 'CRITICAL'
                ? 'bg-red-500'
                : predictionResult.riskLevel === 'HIGH'
                ? 'bg-orange-500'
                : 'bg-cyan-500'
            }`}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <BrainCircuit className="w-4 h-4" />
                <span>TensorFlow.js Predictive Analysis Result</span>
              </div>
              <h3 className="text-xl font-extrabold text-white">
                Failure Probability & Diagnostic Assessment
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-semibold">FAILURE RISK</span>
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    predictionResult.failurePercentage >= 70 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {predictionResult.failurePercentage}%
                </span>
              </div>
              <RiskBadge risk={predictionResult.riskLevel} size="lg" />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-xs">
            {/* Root Causes / Contributing Factors */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Detected Telemetry Root Causes:
              </span>
              <div className="space-y-1.5">
                {predictionResult.reasons && predictionResult.reasons.length > 0 ? (
                  predictionResult.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">All sensor features operating within standard limits.</p>
                )}
              </div>
            </div>

            {/* Prescriptive Maintenance Recommendation */}
            <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Prescriptive Maintenance Recommendation:</span>
              </span>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-medium">
                {predictionResult.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-4 gap-2 overflow-x-auto">
          {[
            { key: 'components', label: `Components (${components.length})`, icon: Layers },
            { key: 'errors', label: `Error Logs (${errorLogs.length})`, icon: AlertTriangle },
            { key: 'maintenance', label: `Maintenance Logs (${maintenanceRecords.length})`, icon: Wrench },
            { key: 'predictions', label: `Prediction History (${predictions.length})`, icon: BrainCircuit },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-cyan-600 text-cyan-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Tab 1: Components Health */}
          {activeTab === 'components' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {components.map((comp) => (
                  <div key={comp._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{comp.name}</h4>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">{comp.type}</span>
                      </div>
                      <StatusBadge status={comp.status} size="sm" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-500">Remaining Life:</span>
                        <span
                          className={`font-bold ${
                            comp.remainingLifePercent < 25
                              ? 'text-rose-600'
                              : comp.remainingLifePercent < 50
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {comp.remainingLifePercent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            comp.remainingLifePercent < 25
                              ? 'bg-rose-500'
                              : comp.remainingLifePercent < 50
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${comp.remainingLifePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
                      <span>Used: {comp.usedLifeHours.toLocaleString()}h</span>
                      <span>Expected: {comp.expectedLifeHours.toLocaleString()}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Error Logs */}
          {activeTab === 'errors' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Error Code</th>
                    <th className="py-2.5 px-3">Error Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">No error logs recorded for this robot.</td>
                    </tr>
                  ) : (
                    errorLogs.map((err) => (
                      <tr key={err._id}>
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {new Date(err.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{err.errorCode}</td>
                        <td className="py-2.5 px-3 font-semibold">{err.errorType}</td>
                        <td className="py-2.5 px-3 text-slate-600">{err.description}</td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={err.severity} size="sm" />
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              err.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {err.resolved ? 'RESOLVED' : 'UNRESOLVED'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Maintenance History */}
          {activeTab === 'maintenance' && (
            <div className="space-y-3">
              {maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No maintenance records logged.</div>
              ) : (
                maintenanceRecords.map((m) => (
                  <div key={m._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{m.problem}</h4>
                      <StatusBadge status={m.status} size="sm" />
                    </div>
                    {m.actionTaken && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-700">Action Taken: </span>
                        {m.actionTaken}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60 font-mono">
                      <span>Scheduled: {new Date(m.scheduledDate).toLocaleDateString()}</span>
                      {m.completedDate && (
                        <span>Completed: {new Date(m.completedDate).toLocaleDateString()}</span>
                      )}
                      <span>Maintenance Engineer: {m.technicianId?.name || 'Unassigned'}</span>
                      <span>Downtime: {m.downtime || 0}h</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: Predictions History */}
          {activeTab === 'predictions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Failure Prob</th>
                    <th className="py-2.5 px-3">Health Score</th>
                    <th className="py-2.5 px-3">Risk Level</th>
                    <th className="py-2.5 px-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {predictions.map((p) => (
                    <tr key={p._id}>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                        {p.failurePercentage}%
                      </td>
                      <td className="py-2.5 px-3">
                        <HealthBadge score={p.healthScore} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        <RiskBadge risk={p.riskLevel} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 line-clamp-1">{p.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      <ScheduleMaintenanceModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        robot={robot}
        onSuccess={(newRecord) => {
          setRobot((prev) => ({
            ...prev,
            maintenanceRecords: [newRecord, ...(prev.maintenanceRecords || [])],
          }));
        }}
      />
    </div>
  );
};
