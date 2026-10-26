import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictionsAPI } from '../services/api';
import { HealthBadge, RiskBadge } from '../components/common/Badges';
import { LoadingSpinner } from '../components/common/Modal';
import { BrainCircuit, Search, Filter, ExternalLink, Calendar, Sparkles } from 'lucide-react';

export const Predictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPredictions();
  }, [riskFilter]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;
      const res = await predictionsAPI.getAll(params);
      if (res.data.success) {
        setPredictions(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const filtered = predictions.filter((p) => {
    const q = search.toLowerCase();
    const rId = p.robotId?.robotId?.toLowerCase() || '';
    const rName = p.robotId?.name?.toLowerCase() || '';
    const rec = p.recommendation?.toLowerCase() || '';
    return rId.includes(q) || rName.includes(q) || rec.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          AI Predictive Maintenance Logs
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Historical neural network inference outputs, risk classifications, and prescriptive recommendations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by robot ID, name, or recommendation keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-cyan-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Risk Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((risk) => (
            <button
              key={risk}
              onClick={() => setRiskFilter(risk)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                riskFilter === risk
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {risk}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Fetching ML prediction records..." />
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <BrainCircuit className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            No predictions found matching current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Inference Date</th>
                  <th className="py-3 px-4">Robot</th>
                  <th className="py-3 px-4">Failure Prob</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Diagnostic Reasons & Prescriptions</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filtered.map((p) => (
                  <tr
                    key={p._id}
                    onClick={() => navigate(`/robots/${p.robotId?.robotId || p.robotId}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()} <br />
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-900">{p.robotId?.robotId || 'RBT'}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {p.robotId?.name || 'Industrial Robot'}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm">
                      <span className={p.failurePercentage >= 70 ? 'text-rose-600' : 'text-slate-800'}>
                        {p.failurePercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <HealthBadge score={p.healthScore} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <RiskBadge risk={p.riskLevel} size="sm" />
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="text-xs text-slate-800 font-medium line-clamp-1 mb-1">
                        {p.recommendation}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {p.reasons?.slice(0, 2).map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/robots/${p.robotId?.robotId || p.robotId}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-semibold text-xs transition-colors flex items-center gap-1 ml-auto"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
