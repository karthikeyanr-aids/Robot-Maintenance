import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { usersAPI, maintenanceAPI } from '../../services/api';
import { Calendar, User, AlertCircle, Wrench, FileText } from 'lucide-react';

export const ScheduleMaintenanceModal = ({ isOpen, onClose, robot, onSuccess }) => {
  const [technicians, setTechnicians] = useState([]);
  const [formData, setFormData] = useState({
    componentId: '',
    technicianId: '',
    problem: '',
    priority: 'HIGH',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTechnicians();
      if (robot?.latestPrediction?.recommendation) {
        setFormData((prev) => ({
          ...prev,
          problem: `Preventive Maintenance: ${robot.latestPrediction.recommendation}`,
          priority: robot.latestPrediction.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        }));
      }
    }
  }, [isOpen, robot]);

  const fetchTechnicians = async () => {
    try {
      const res = await usersAPI.getTechnicians();
      if (res.data.success) {
        setTechnicians(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        robotId: robot._id,
        componentId: formData.componentId || null,
        technicianId: formData.technicianId || null,
        problem: formData.problem,
        priority: formData.priority,
        scheduledDate: new Date(formData.scheduledDate),
        notes: formData.notes,
      };

      const res = await maintenanceAPI.create(payload);
      if (res.data.success) {
        onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Schedule Maintenance for ${robot?.robotId || 'Robot'} (${robot?.name || ''})`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Problem / Maintenance Objective *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Inspect motor cooling fan and dynamic balance"
            value={formData.problem}
            onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Target Component (Optional)
            </label>
            <select
              value={formData.componentId}
              onChange={(e) => setFormData({ ...formData, componentId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Entire Robot Subsystem --</option>
              {robot?.components?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.type} - {c.remainingLifePercent}% life)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Assign Maintenance Engineer
            </label>
            <select
              value={formData.technicianId}
              onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="">-- Unassigned (Auto Pool) --</option>
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.role === 'TECHNICIAN' ? 'Maintenance Engineer' : t.role} - {t.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Priority Level
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL (Immediate)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Scheduled Target Date *
            </label>
            <input
              type="date"
              required
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
            </input>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Operational Notes / Special Tooling
          </label>
          <textarea
            rows="2"
            placeholder="e.g. Requires safety lockout on Line A during shift change"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
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
            <Wrench className="w-4 h-4" />
            <span>{loading ? 'Scheduling...' : 'Schedule Task'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
