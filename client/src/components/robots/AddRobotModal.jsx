import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { robotsAPI } from '../../services/api';
import { Bot, AlertCircle } from 'lucide-react';

export const AddRobotModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    robotId: '',
    name: '',
    model: '',
    manufacturer: 'FANUC',
    location: '',
    runtimeHours: 1200,
    temperature: 45.0,
    vibration: 1.5,
    status: 'AUTO',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate preview health score and status dynamically
  const calculatePreview = () => {
    const temp = Number(formData.temperature) || 45;
    const vib = Number(formData.vibration) || 1.5;
    const hours = Number(formData.runtimeHours) || 0;

    let risk = 0.02;
    if (temp > 55) {
      if (temp >= 80) risk += 0.45 + Math.min((temp - 80) / 20, 0.40);
      else if (temp >= 70) risk += 0.25 + ((temp - 70) / 10) * 0.20;
      else risk += ((temp - 55) / 15) * 0.20;
    }
    if (vib > 2.5) {
      if (vib >= 6.0) risk += 0.40 + Math.min((vib - 6.0) / 6.0, 0.45);
      else if (vib >= 4.0) risk += 0.20 + ((vib - 4.0) / 2.0) * 0.20;
      else risk += ((vib - 2.5) / 1.5) * 0.15;
    }
    if (hours > 2000) risk += Math.min((hours - 2000) / 12000, 1.0) * 0.15;

    if (formData.status === 'CRITICAL') risk = Math.max(risk, 0.82);
    else if (formData.status === 'WARNING') risk = Math.max(risk, 0.45);

    const prob = Math.min(Math.max(risk, 0.01), 0.99);
    const score = Math.max(0, Math.min(100, Math.round((1 - prob) * 100)));

    let status = 'HEALTHY';
    if (formData.status && formData.status !== 'AUTO') {
      status = formData.status;
    } else {
      if (prob >= 0.80) status = 'CRITICAL';
      else if (prob >= 0.35) status = 'WARNING';
      else status = 'HEALTHY';
    }

    return { score, status };
  };

  const preview = calculatePreview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await robotsAPI.create({
        ...formData,
        robotId: formData.robotId.trim().toUpperCase(),
        runtimeHours: Number(formData.runtimeHours),
        temperature: Number(formData.temperature),
        vibration: Number(formData.vibration),
        status: formData.status,
        healthScore: preview.score,
      });

      if (res.data.success) {
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create robot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Industrial Robot to Fleet" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Robot ID (Unique) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. RBT-017"
              value={formData.robotId}
              onChange={(e) => setFormData({ ...formData, robotId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 uppercase font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Manufacturer *
            </label>
            <select
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="FANUC">FANUC</option>
              <option value="KUKA">KUKA</option>
              <option value="ABB">ABB</option>
              <option value="Yaskawa">Yaskawa Motoman</option>
              <option value="Universal Robots">Universal Robots</option>
              <option value="Staubli">Staubli</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Robot Name / Application *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. High-Speed Sealing Cobot 17"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Model Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. FANUC M-20iD/35M"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Plant Location / Workcell *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Production Line C - Cell 4"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Operational Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 font-semibold"
            >
              <option value="AUTO">⚡ Auto (Calculate from Telemetry)</option>
              <option value="CRITICAL">🔴 Critical (Immediate Action)</option>
              <option value="WARNING">🟡 Warning (Needs Attention)</option>
              <option value="HEALTHY">🟢 Healthy (Optimal)</option>
              <option value="MAINTENANCE">🔵 Maintenance Window</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Runtime (Hours)
            </label>
            <input
              type="number"
              min="0"
              value={formData.runtimeHours}
              onChange={(e) => setFormData({ ...formData, runtimeHours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Operating Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Vibration Velocity (mm/s RMS)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.vibration}
              onChange={(e) => setFormData({ ...formData, vibration: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Real-time Dynamic Health Preview Banner */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all shadow-sm ${
          preview.status === 'CRITICAL' ? 'bg-rose-50 border-rose-300 text-rose-800' :
          preview.status === 'WARNING' ? 'bg-amber-50 border-amber-300 text-amber-800' :
          preview.status === 'MAINTENANCE' ? 'bg-blue-50 border-blue-300 text-blue-800' :
          'bg-emerald-50 border-emerald-300 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="font-bold uppercase tracking-wider text-[11px]">Calibrated Health Index:</span>
            <span className="text-base font-black tracking-tight">{preview.score}%</span>
            <span className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase text-[10px] tracking-wider shadow-sm border ${
              preview.status === 'CRITICAL' ? 'bg-rose-600 text-white border-rose-700' :
              preview.status === 'WARNING' ? 'bg-amber-500 text-white border-amber-600' :
              preview.status === 'MAINTENANCE' ? 'bg-blue-600 text-white border-blue-700' :
              'bg-emerald-600 text-white border-emerald-700'
            }`}>
              {preview.status}
            </span>
          </div>
          <span className="text-[11px] font-medium hidden sm:inline opacity-80">
            {preview.status === 'CRITICAL' ? 'High risk telemetry detected' :
             preview.status === 'WARNING' ? 'Elevated sensor thresholds' :
             'Optimal operating parameters'}
          </span>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            <span>{loading ? 'Adding Robot...' : 'Add Robot'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
