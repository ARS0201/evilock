import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Shield, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        action: actionFilter || undefined,
        result: resultFilter || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [resultFilter]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Action', 'Actor', 'Resource', 'Result', 'IP Address', 'Reason'];
    const rows = logs.map(l => [
      l.timestamp,
      l.action,
      l.actor?.full_name || l.actor_id || 'System',
      `${l.resource_type || ''} ${l.resource_id || ''}`,
      l.result,
      l.ip_address || '',
      `"${(l.reason || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EviLock_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B2923]">Chain of Custody Audit Trail</h1>
          <p className="text-xs text-[#88776B] mt-1">
            Immutable, non-repudiable log of every security, upload, verification, and access event
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn-secondary text-xs"
        >
          <Download className="w-4 h-4 text-[#795548]" />
          <span>Export Audit Certificate (CSV)</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="card-cream p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#88776B]" />
          <span className="font-semibold text-[#4B342B]">Filter by Result:</span>
          {['', 'SUCCESS', 'ALERT', 'DENIED'].map((r) => (
            <button
              key={r}
              onClick={() => setResultFilter(r)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                resultFilter === r
                  ? 'bg-[#795548] text-white'
                  : 'bg-[#F7F3EE] text-[#4B342B] hover:bg-[#E5D7C8]'
              }`}
            >
              {r === '' ? 'All Results' : r}
            </button>
          ))}
        </div>

        <span className="text-[#88776B] font-mono">
          Showing {logs.length} Logged Events
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="card-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#4B342B] text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Reason / Evidence Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D7C8] text-[#30241F]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#88776B]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#B8875B] border-t-transparent rounded-full animate-spin"></div>
                      <span>Querying Immutable Audit Store...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-[#88776B]">
                    No audit records match the filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F7F3EE]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#4B342B] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#3B2923]">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-[#4B342B]">
                      {log.actor?.full_name || 'System / Unauth'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#795548]">
                      {log.resource_type ? `${log.resource_type}:${(log.resource_id || '').slice(0, 8)}` : 'GLOBAL'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.result === 'SUCCESS' ? 'badge-verified' :
                        log.result === 'ALERT' ? 'badge-mismatch' :
                        'badge-pending'
                      }`}>
                        {log.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#88776B] max-w-sm truncate">
                      {log.reason || 'Normal authorized activity'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
