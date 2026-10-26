import React, { useState, useEffect } from 'react';
import { errorsAPI } from '../services/api';
import { StatusBadge } from '../components/common/Badges';
import { Modal, LoadingSpinner } from '../components/common/Modal';
import { AlertTriangle, Search, CheckCircle2, ShieldAlert, Filter, Wrench } from 'lucide-react';

export const ErrorLogs = () => {
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [resolvedFilter, setResolvedFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedError, setSelectedError] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);

  useEffect(() => {
    fetchErrors();
  }, [severityFilter, resolvedFilter]);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (resolvedFilter !== 'ALL') params.resolved = resolvedFilter === 'RESOLVED';
      const res = await errorsAPI.getAll(params);
      if (res.data.success) {
        setErrors(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching errors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolve = (err) => {
    setSelectedError(err);
    setResolutionText(err.resolution || 'Inspected and reset controller error register.');
    setIsResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await errorsAPI.update(selectedError._id, {
        resolved: true,
        resolution: resolutionText,
      });
      if (res.data.success) {
        setErrors((prev) => prev.map((item) => (item._id === selectedError._id ? res.data.data : item)));
        setIsResolveModalOpen(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve error log');
    }
  };

  const filtered = errors.filter((e) => {
    const q = search.toLowerCase();
    const rId = e.robotId?.robotId?.toLowerCase() || '';
    const code = e.errorCode?.toLowerCase() || '';
    const type = e.errorType?.toLowerCase() || '';
    const desc = e.description?.toLowerCase() || '';
    return rId.includes(q) || code.includes(q) || type.includes(q) || desc.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Robotic Error & Alarm Logs</h2>
        <p className="text-xs text-slate-500 mt-1">
          Historical and active fault codes, thermal alarms, harmonic anomalies, and bus errors.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by error code, type, or robot ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                severityFilter === sev ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Resolved Toggle */}
        <div className="flex items-center gap-1.5">
          {['ALL', 'UNRESOLVED', 'RESOLVED'].map((status) => (
            <button
              key={status}
              onClick={() => setResolvedFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                resolvedFilter === status ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching fault logs..." />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No error logs match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Robot ID</th>
                  <th className="py-3 px-4">Error Code</th>
                  <th className="py-3 px-4">Error Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map((err) => (
                  <tr key={err._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(err.timestamp).toLocaleDateString()} <br />
                      <span className="text-[10px] text-slate-400">
                        {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900">{err.robotId?.robotId || 'RBT'}</span>
                      <p className="text-[10px] text-slate-400">{err.robotId?.name}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-600">{err.errorCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{err.errorType}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={err.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600">
                      <p className="line-clamp-2">{err.description}</p>
                      {err.resolution && (
                        <p className="text-[10px] text-emerald-600 mt-1">Resolution: {err.resolution}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!err.resolved ? (
                        <button
                          onClick={() => handleOpenResolve(err)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-emerald-50 hover:text-emerald-700 text-rose-700 font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Alarm: ${selectedError?.errorCode || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-800">{selectedError?.errorType}</p>
            <p className="text-slate-600">{selectedError?.description}</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Resolution Notes / Corrective Action *
            </label>
            <textarea
              required
              rows="3"
              placeholder="e.g. Replaced faulty thermal sensor and verified bus communications."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResolveModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              Confirm Resolution
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
