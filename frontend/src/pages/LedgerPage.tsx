import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitCommit, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Clock, 
  ArrowDown,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { LedgerBlock, ChainAuditSummary } from '../types';

export const LedgerPage: React.FC = () => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>([]);
  const [auditSummary, setAuditSummary] = useState<ChainAuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const [blocksData, auditData] = await Promise.all([
        api.getLedgerBlocks(50),
        api.auditLedgerChain(),
      ]);
      setBlocks(blocksData);
      setAuditSummary(auditData);
    } catch (err) {
      console.error('Failed to load ledger data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedgerData();
  }, []);

  const handleRunAudit = async () => {
    setAuditing(true);
    try {
      const auditData = await api.auditLedgerChain();
      setAuditSummary(auditData);
    } catch (err: any) {
      alert(`Ledger audit error: ${err.message}`);
    } finally {
      setAuditing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B2923]">Tamper-Evident Integrity Ledger</h1>
          <p className="text-xs text-[#88776B] mt-1">
            Sequential append-only cryptographic ledger maintaining non-repudiation and chain of custody
          </p>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={auditing}
          className="btn-primary text-xs"
        >
          <RefreshCw className={`w-4 h-4 ${auditing ? 'animate-spin' : ''}`} />
          <span>{auditing ? 'Verifying Audit Chain...' : 'Verify Ledger Chain Integrity'}</span>
        </button>
      </div>

      {/* Chain Status Card */}
      {auditSummary && (
        <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          auditSummary.is_chain_healthy 
            ? 'bg-[#397451]/10 border-[#397451]/30' 
            : 'bg-[#B84040]/10 border-[#B84040]/30'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              auditSummary.is_chain_healthy ? 'bg-[#397451] text-white' : 'bg-[#B84040] text-white'
            }`}>
              {auditSummary.is_chain_healthy ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <p className={`text-sm font-extrabold uppercase tracking-wide ${
                auditSummary.is_chain_healthy ? 'text-[#397451]' : 'text-[#B84040]'
              }`}>
                {auditSummary.is_chain_healthy ? 'Ledger Chain Cryptographically Intact' : 'Discontinuity Error Detected'}
              </p>
              <p className="text-xs text-[#4B342B] font-medium mt-0.5">{auditSummary.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <div>
              <span className="text-[#88776B] block">Current Height:</span>
              <span className="text-base font-bold text-[#3B2923]">#{auditSummary.total_blocks} Blocks</span>
            </div>
            <div>
              <span className="text-[#88776B] block">Latest Block Hash:</span>
              <span className="text-xs font-semibold text-[#795548] truncate max-w-[140px] block">
                {auditSummary.latest_block_hash.slice(0, 16)}...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Architecture Disclaimer */}
      <div className="p-4 rounded-xl bg-[#F7F3EE] border border-[#E5D7C8] flex items-start gap-3 text-xs text-[#4B342B]">
        <Info className="w-4 h-4 text-[#B8875B] flex-shrink-0 mt-0.5" />
        <p className="text-[#88776B] leading-relaxed">
          <strong>Architecture Note:</strong> This append-only integrity ledger employs cryptographic parent-block chaining to guarantee sequential continuity and non-repudiation. Any retroactive alteration immediately breaks mathematical verification. Confidential document contents remain in the secure encrypted vault and are never exposed on the ledger.
        </p>
      </div>

      {/* Sequential Blocks Chain View */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-sm text-[#88776B]">
            <div className="w-8 h-8 border-4 border-[#B8875B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading Ledger Blocks...</span>
          </div>
        ) : blocks.length === 0 ? (
          <div className="card-cream p-12 text-center text-sm text-[#88776B]">
            Integrity ledger is currently in Genesis state (No blocks recorded yet).
          </div>
        ) : (
          blocks.map((b, index) => (
            <div key={b.id} className="card-cream p-5 shadow-card hover:border-[#B8875B] transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5D7C8] gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-extrabold text-sm px-3 py-1 rounded-lg bg-[#3B2923] text-white">
                    Block #{b.id}
                  </span>
                  <span className="badge-verified text-[11px]">
                    {b.event_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#88776B] font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(b.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 text-xs font-mono">
                {/* Previous Entry Hash */}
                <div className="p-3 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8]">
                  <span className="text-[10px] text-[#88776B] uppercase font-bold block mb-1">
                    Previous Block Link:
                  </span>
                  <span className="break-all font-semibold text-[#4B342B] select-all">
                    {b.previous_entry_hash}
                  </span>
                </div>

                {/* Document SHA-256 */}
                <div className="p-3 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8]">
                  <span className="text-[10px] text-[#88776B] uppercase font-bold block mb-1">
                    Document File Checksum:
                  </span>
                  <span className="break-all font-semibold text-[#795548] select-all">
                    {b.document_sha256}
                  </span>
                </div>

                {/* Block Entry Hash */}
                <div className="p-3 rounded-lg bg-[#FFFDF9] border border-[#B8875B]/60 shadow-xs">
                  <span className="text-[10px] text-[#B8875B] uppercase font-bold block mb-1">
                    Block Cryptographic Hash:
                  </span>
                  <span className="break-all font-semibold text-[#30241F] select-all">
                    {b.entry_hash}
                  </span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between text-[11px] text-[#88776B]">
                <span>Actor ID: <code className="text-[#30241F]">{b.actor_id.slice(0, 8)}...</code></span>
                <Link to={`/documents/${b.document_id}`} className="text-[#B8875B] hover:underline font-semibold font-sans">
                  Inspect Associated Evidence →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
