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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Runtime (Hrs)
            </label>
            <input
              type="number"
              min="0"
              value={formData.runtimeHours}
              onChange={(e) => setFormData({ ...formData, runtimeHours: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Temp (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Vib (mm/s)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.vibration}
              onChange={(e) => setFormData({ ...formData, vibration: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
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
