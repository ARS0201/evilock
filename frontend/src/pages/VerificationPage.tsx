import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RefreshCw, 
  GitCommit, 
  Bug,
  Info,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { Document, VerifyResult } from '../types';

export const VerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedDocId = searchParams.get('document_id');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(preselectedDocId || '');
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tamperSuccessMsg, setTamperSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const docs = await api.getDocuments();
        setDocuments(docs);
        if (docs.length > 0 && !selectedDocId) {
          setSelectedDocId(docs[0].id);
        }
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };
    loadDocuments();
  }, []);

  const handleRunVerification = async () => {
    if (!selectedDocId) return;
    setIsVerifying(true);
    setVerifyResult(null);
    setTamperSuccessMsg(null);
    try {
      const res = await api.verifyDocument(selectedDocId);
      setVerifyResult(res);
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!selectedDocId) return;
    if (!window.confirm("This will inject a simulated alteration into the test file bytes to demonstrate tamper detection. Proceed?")) {
      return;
    }
    try {
      const res = await api.simulateTampering(selectedDocId);
      setTamperSuccessMsg(res.message);
      setVerifyResult(null);
    } catch (err: any) {
      alert(`Error simulating tamper: ${err.message}`);
    }
  };

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B2923]">Evidence Cryptographic Integrity Hub</h1>
          <p className="text-xs text-[#88776B] mt-1">
            Independent, on-demand verification of digital evidence against the append-only SHA-256 integrity ledger
          </p>
        </div>

        <Link to="/ledger" className="btn-secondary text-xs">
          <GitCommit className="w-4 h-4 text-[#795548]" />
          <span>Inspect Integrity Ledger</span>
        </Link>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-[#F7F3EE] border border-[#E5D7C8] flex items-start gap-3 text-xs text-[#4B342B]">
        <Info className="w-4 h-4 text-[#B8875B] flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-[#30241F]">Cryptographic Verification Philosophy</p>
          <p className="text-[#88776B] leading-relaxed">
            EviLock recalculates the SHA-256 hash in real-time from the physical binary file stored in the private vault, comparing it against both the database record and the immutable hash-chain block. No simulated or fabricated results are shown.
          </p>
        </div>
      </div>

      {/* Verification Workstation Controls */}
      <div className="card-cream p-6 shadow-card space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-2">
            Select Document to Verify
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setVerifyResult(null);
                setTamperSuccessMsg(null);
              }}
              className="input-cream flex-1 font-medium"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.document_number} — {doc.title} ({doc.category.name})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunVerification}
              disabled={isVerifying || !selectedDocId}
              className="btn-primary whitespace-nowrap text-xs px-5 py-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Integrity...' : 'Verify Integrity'}</span>
            </button>

            <button
              onClick={handleSimulateTamper}
              className="btn-danger whitespace-nowrap text-xs px-4 py-2.5"
              title="Simulate data alteration to test tamper detection"
            >
              <Bug className="w-4 h-4" />
              <span>Simulate Tamper Test</span>
            </button>
          </div>
        </div>

        {/* Selected Document Snapshot */}
        {selectedDoc && (
          <div className="p-4 rounded-xl bg-[#F7F3EE] border border-[#E5D7C8] text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[#88776B] block">Docket Reference:</span>
                <span className="font-bold text-[#3B2923] font-mono">{selectedDoc.document_number}</span>
              </div>
              <div>
                <span className="text-[#88776B] block">Recorded Version:</span>
                <span className="font-bold text-[#4B342B]">v{selectedDoc.latest_version?.version_number ?? 1} ({selectedDoc.latest_version?.file_name})</span>
              </div>
              <div>
                <span className="text-[#88776B] block">Seizure / Upload Date:</span>
                <span className="font-bold text-[#4B342B]">{new Date(selectedDoc.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tamper Alert Notice */}
      {tamperSuccessMsg && (
        <div className="p-4 rounded-xl bg-[#B84040]/15 border border-[#B84040] text-xs text-[#30241F] flex items-center justify-between shadow-card">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-[#B84040]" />
            <span><strong>Tamper Test Active:</strong> Storage file content has been altered. Click <strong>"Verify Integrity"</strong> above to examine tamper detection in action!</span>
          </div>
          <button
            onClick={handleRunVerification}
            className="btn-danger text-xs px-3 py-1.5"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Real-time Verification Outcome Result Card */}
      {verifyResult && (
        <div className={`card-cream p-6 shadow-elevation border-2 transition-all ${
          verifyResult.status === 'VERIFIED'
            ? 'border-[#397451] bg-[#397451]/5'
            : 'border-[#B84040] bg-[#B84040]/5'
        }`}>
          <div className="flex items-start gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              verifyResult.status === 'VERIFIED' ? 'bg-[#397451] text-white shadow-card' : 'bg-[#B84040] text-white shadow-card'
            }`}>
              {verifyResult.status === 'VERIFIED' ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5D7C8]">
                <div>
                  <span className={`text-base font-extrabold tracking-wide uppercase ${
                    verifyResult.status === 'VERIFIED' ? 'text-[#397451]' : 'text-[#B84040]'
                  }`}>
                    Outcome: {verifyResult.status}
                  </span>
                  <p className="text-xs text-[#4B342B] font-medium mt-0.5">{verifyResult.message}</p>
                </div>
                <div className="text-right text-[11px] text-[#88776B] font-mono">
                  <span>Checked at: {new Date(verifyResult.verified_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Hash Proof Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-lg bg-white border border-[#E5D7C8]">
                  <span className="text-[10px] text-[#88776B] uppercase font-bold block mb-1">
                    Recorded Ledger Checksum (v{verifyResult.version_number}):
                  </span>
                  <p className="break-all font-semibold text-[#30241F] select-all">
                    {verifyResult.expected_hash}
                  </p>
                </div>

                <div className={`p-3.5 rounded-lg border ${
                  verifyResult.is_hash_matching 
                    ? 'bg-white border-[#E5D7C8]' 
                    : 'bg-[#B84040]/15 border-[#B84040] text-[#B84040]'
                }`}>
                  <span className="text-[10px] text-[#88776B] uppercase font-bold block mb-1">
                    Live Recomputed File Checksum (from Vault bytes):
                  </span>
                  <p className="break-all font-semibold select-all">
                    {verifyResult.actual_hash}
                  </p>
                </div>
              </div>

              {/* Status Verification Checklist */}
              <div className="p-3.5 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#4B342B]">Vault File Checksum Match:</span>
                  <span className={`font-bold ${verifyResult.is_hash_matching ? 'text-[#397451]' : 'text-[#B84040]'}`}>
                    {verifyResult.is_hash_matching ? 'MATCHED (Exact Cryptographic Match)' : 'MISMATCH (Unauthorized Modification)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4B342B]">Ledger Block Chain Continuity:</span>
                  <span className={`font-bold ${verifyResult.is_chain_intact ? 'text-[#397451]' : 'text-[#B84040]'}`}>
                    {verifyResult.is_chain_intact ? 'INTACT (Sequential Chain Linkage Valid)' : 'COMPROMISED'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4B342B]">Audit Trail Event Created:</span>
                  <span className="font-bold text-[#397451] font-mono">RECORDED IN OFFICIAL AUDIT LOG</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
