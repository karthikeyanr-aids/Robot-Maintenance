import React, { useState, useEffect } from 'react';
import { maintenanceAPI, robotsAPI, usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/Badges';
import { Modal, LoadingSpinner } from '../components/common/Modal';
import {
  Wrench,
  Calendar,
  Clock,
  User,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Play,
  RotateCcw,
} from 'lucide-react';

export const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [robots, setRobots] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const { hasRole, user } = useAuth();

  // Create Modal Form
  const [createForm, setCreateForm] = useState({
    robotId: '',
    problem: '',
    priority: 'HIGH',
    scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    technicianId: '',
    notes: '',
  });

  // Update Status Modal Form
  const [updateForm, setUpdateForm] = useState({
    status: 'IN_PROGRESS',
    actionTaken: '',
    downtime: 2,
    cost: 500,
    notes: '',
  });

  useEffect(() => {
    fetchMaintenance();
    fetchAuxData();
  }, [statusFilter]);

  const fetchMaintenance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await maintenanceAPI.getAll(params);
      if (res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [robotsRes, techRes] = await Promise.all([robotsAPI.getAll(), usersAPI.getTechnicians()]);
      if (robotsRes.data.success) setRobots(robotsRes.data.data);
      if (techRes.data.success) setTechnicians(techRes.data.data);
    } catch (err) {
      console.error('Error fetching auxiliary data:', err);
    }
  };

  const handleOpenUpdateModal = (record) => {
    setSelectedRecord(record);
    setUpdateForm({
      status: record.status === 'SCHEDULED' ? 'IN_PROGRESS' : 'COMPLETED',
      actionTaken: record.actionTaken || '',
      downtime: record.downtime || 2,
      cost: record.cost || 500,
      notes: record.notes || '',
    });
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await maintenanceAPI.update(selectedRecord._id, updateForm);
      if (res.data.success) {
        setRecords((prev) => prev.map((r) => (r._id === selectedRecord._id ? res.data.data : r)));
        setIsUpdateModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update maintenance record');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await maintenanceAPI.create(createForm);
      if (res.data.success) {
        setRecords((prev) => [res.data.data, ...prev]);
        setIsCreateModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule maintenance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Maintenance Work Orders
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track, assign, and execute preventive and predictive robotic servicing.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Work Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        {['ALL', 'SCHEDULED', 'IN_PROGRESS', 'PENDING', 'COMPLETED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              statusFilter === status
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Maintenance Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Loading maintenance work orders..." />
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          No maintenance orders found for this status.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((rec) => (
            <div
              key={rec._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-400">
                    {rec.robotId?.robotId || 'RBT'}
                  </span>
                  <StatusBadge status={rec.status} size="sm" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1">{rec.problem}</h3>
                <p className="text-xs text-slate-500 mb-3">{rec.robotId?.name}</p>

                {rec.actionTaken && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs text-slate-600 mb-3">
                    <span className="font-semibold text-slate-700 block mb-0.5">Resolution Action:</span>
                    {rec.actionTaken}
                  </div>
                )}

                <div className="space-y-1.5 py-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Target Date:
                    </span>
                    <span className="font-mono font-medium">
                      {new Date(rec.scheduledDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Maintenance Engineer:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {rec.technicianId?.name || 'Unassigned'}
                    </span>
                  </div>

                  {rec.downtime > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Downtime:
                      </span>
                      <span className="font-mono">{rec.downtime} hours</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Button */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                {rec.status !== 'COMPLETED' ? (
                  <button
                    onClick={() => handleOpenUpdateModal(rec)}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{rec.status === 'SCHEDULED' ? 'Start Task' : 'Update / Complete'}</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold py-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed on {new Date(rec.completedDate || rec.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Maintenance Status Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Maintenance Status"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Work Order Status *
            </label>
            <select
              value={updateForm.status}
              onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED (Resolve & Restore Robot)</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Action Taken / Maintenance Notes *
            </label>
            <textarea
              required
              rows="3"
              placeholder="e.g. Replaced worn bearings, lubricated gear mesh, recalibrated axis offsets."
              value={updateForm.actionTaken}
              onChange={(e) => setUpdateForm({ ...updateForm, actionTaken: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Downtime (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={updateForm.downtime}
                onChange={(e) => setUpdateForm({ ...updateForm, downtime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Servicing Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={updateForm.cost}
                onChange={(e) => setUpdateForm({ ...updateForm, cost: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Create New Work Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Maintenance Work Order"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Select Industrial Robot *
            </label>
            <select
              required
              value={createForm.robotId}
              onChange={(e) => setCreateForm({ ...createForm, robotId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">-- Choose Robot --</option>
              {robots.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.robotId} - {r.name} ({r.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Problem / Task Objective *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Inspect motor cooling fan and gear backlash"
              value={createForm.problem}
              onChange={(e) => setCreateForm({ ...createForm, problem: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assign Maintenance Engineer
              </label>
              <select
                value={createForm.technicianId}
                onChange={(e) => setCreateForm({ ...createForm, technicianId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              >
                <option value="">-- Unassigned --</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.role === 'TECHNICIAN' ? 'Maintenance Engineer' : t.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Scheduled Target Date *
              </label>
              <input
                type="date"
                required
                value={createForm.scheduledDate}
                onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold"
            >
              Create Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
