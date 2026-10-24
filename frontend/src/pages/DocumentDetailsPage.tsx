import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Download, 
  Clock, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  GitCommit, 
  Lock, 
  Bug, 
  Plus, 
  Upload,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { Document, DocumentVersion, VerifyResult } from '../types';

export const DocumentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verification state
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Tamper simulation state
  const [tamperSuccessMsg, setTamperSuccessMsg] = useState<string | null>(null);

  // New Version modal
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  const loadDocument = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getDocumentDetails(id);
      setDocument(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve document details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [id]);

  const handleVerify = async (versionId?: string) => {
    if (!id) return;
    setIsVerifying(true);
    setVerifyResult(null);
    setTamperSuccessMsg(null);
    try {
      const res = await api.verifyDocument(id, versionId);
      setVerifyResult(res);
    } catch (err: any) {
      alert(`Verification check error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    if (!id) return;
    if (!window.confirm("This will inject a simulated modification into the vault storage file to test cryptographic tamper detection. Proceed?")) {
      return;
    }
    try {
      const res = await api.simulateTampering(id);
      setTamperSuccessMsg(res.message);
      setVerifyResult(null);
    } catch (err: any) {
      alert(`Failed to simulate tamper: ${err.message}`);
    }
  };

  const handleToggleLegalHold = async () => {
    if (!document) return;
    const nextHold = !document.is_legal_hold;
    try {
      const updated = await api.updateDocumentMetadata(document.id, {
        is_legal_hold: nextHold,
        legal_hold_reason: nextHold ? "Court-mandated preservation order under Section 91 CrPC" : undefined
      });
      setDocument(updated);
    } catch (err: any) {
      alert(`Could not toggle legal hold: ${err.message}`);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newVersionFile || !changeSummary.trim()) {
      alert("Please provide the modified file and explanation for superseding version.");
      return;
    }
    setIsUploadingVersion(true);
    try {
      const formData = new FormData();
      formData.append('change_summary', changeSummary);
      formData.append('file', newVersionFile);
      await api.uploadNewVersion(id, formData);
      setShowVersionModal(false);
      setChangeSummary('');
      setNewVersionFile(null);
      await loadDocument();
    } catch (err: any) {
      alert(`Failed to create version: ${err.message}`);
    } finally {
      setIsUploadingVersion(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[#88776B]">
        <div className="w-8 h-8 border-4 border-[#B8875B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <span>Loading Evidence Dossier...</span>
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div className="card-cream p-8 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-10 h-10 text-[#B84040] mx-auto" />
        <h2 className="text-lg font-bold text-[#3B2923]">Access Denied or Not Found</h2>
        <p className="text-xs text-[#88776B]">{errorMsg || 'Document record unavailable.'}</p>
        <Link to="/documents" className="btn-primary inline-flex">Return to Vault</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Back and Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div className="flex items-center gap-3">
          <Link to="/documents" className="p-2 rounded-lg hover:bg-[#E5D7C8]/50 text-[#795548]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#795548]">{document.document_number}</span>
              <span className="text-xs text-[#88776B]">•</span>
              <span className="text-xs font-bold text-[#88776B]">{document.category.name}</span>
              {document.is_legal_hold && (
                <span className="badge-pending text-[10px]">LEGAL HOLD ACTIVE</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-[#3B2923]">{document.title}</h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleVerify()}
            disabled={isVerifying}
            className="btn-caramel text-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? 'Computing Hash...' : 'Verify Live Integrity'}</span>
          </button>

          <a
            href={api.getDownloadUrl(document.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Evidence</span>
          </a>

          <button
            onClick={() => setShowVersionModal(true)}
            className="btn-secondary text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Version</span>
          </button>

          <button
            onClick={handleSimulateTamper}
            className="btn-danger text-xs"
            title="Simulate file modification to test cryptographic tamper detection"
          >
            <Bug className="w-4 h-4" />
            <span>Simulate Tamper Test</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner (Interactive Live Test Result) */}
      {verifyResult && (
        <div className={`p-5 rounded-xl border ${
          verifyResult.status === 'VERIFIED'
            ? 'bg-[#397451]/10 border-[#397451]/40 text-[#30241F]'
            : 'bg-[#B84040]/10 border-[#B84040]/40 text-[#30241F]'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              verifyResult.status === 'VERIFIED' ? 'bg-[#397451] text-white' : 'bg-[#B84040] text-white'
            }`}>
              {verifyResult.status === 'VERIFIED' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-extrabold tracking-wide uppercase ${
                  verifyResult.status === 'VERIFIED' ? 'text-[#397451]' : 'text-[#B84040]'
                }`}>
                  {verifyResult.status === 'VERIFIED' ? 'Cryptographic Integrity Confirmed' : 'Tamper Alert: Checksum Mismatch'}
                </span>
                <span className="text-[11px] text-[#88776B] font-mono">
                  {new Date(verifyResult.verified_at).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs font-medium text-[#4B342B]">{verifyResult.message}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#E5D7C8]">
                <div className="p-2 rounded bg-white/70 border border-[#E5D7C8]">
                  <span className="text-[#88776B] block">Recorded Ledger Checksum (v{verifyResult.version_number}):</span>
                  <span className="font-semibold break-all text-[#30241F]">{verifyResult.expected_hash}</span>
                </div>
                <div className={`p-2 rounded border ${verifyResult.is_hash_matching ? 'bg-white/70 border-[#E5D7C8]' : 'bg-[#B84040]/20 border-[#B84040] text-[#B84040]'}`}>
                  <span className="text-[#88776B] block">Live Recomputed File Checksum:</span>
                  <span className="font-semibold break-all">{verifyResult.actual_hash}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tamper Alert Notice */}
      {tamperSuccessMsg && (
        <div className="p-4 rounded-xl bg-[#B84040]/15 border border-[#B84040] text-xs text-[#30241F] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-[#B84040]" />
            <span><strong>Tamper Test Active:</strong> Vault file content has been altered. Click <strong>"Verify Live Integrity"</strong> to examine real-time tamper detection!</span>
          </div>
          <button
            onClick={() => handleVerify()}
            className="btn-danger text-xs px-3 py-1.5"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Metadata & Custody Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata Card */}
        <div className="card-cream p-6 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#4B342B] pb-2 border-b border-[#E5D7C8]">
              Legal Document Metadata
            </h3>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs">
              <div>
                <dt className="text-[#88776B]">Official Reference Number:</dt>
                <dd className="font-bold text-[#30241F] font-mono mt-0.5">{document.reference_number || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-[#88776B]">Confidentiality Level:</dt>
                <dd className="font-bold text-[#795548] mt-0.5">{document.confidentiality_level}</dd>
              </div>
              <div>
                <dt className="text-[#88776B]">Original Registration Date:</dt>
                <dd className="font-medium text-[#30241F] mt-0.5">{new Date(document.created_at).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[#88776B]">Recording Officer:</dt>
                <dd className="font-bold text-[#30241F] mt-0.5">{document.uploader.full_name} ({document.uploader.badge_number || 'Staff'})</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#88776B]">Tags & Indexing:</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {(document.tags || 'Evidence, Legal').split(',').map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#E5D7C8]/50 text-[#4B342B] text-[11px] font-medium">
                      {tag.trim()}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#88776B]">Custody Description:</dt>
                <dd className="mt-1 text-[#4B342B] bg-[#F7F3EE] p-3 rounded-lg border border-[#E5D7C8] leading-relaxed">
                  {document.description || 'Certified legal record registered in accordance with Evidence Act standards.'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Version History Timeline (Section 10) */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#E5D7C8] mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4B342B]">
                Immutable Version History
              </h3>
              <span className="text-[11px] text-[#88776B]">
                {document.versions?.length || 1} Total Versions Recorded
              </span>
            </div>

            <div className="space-y-4">
              {document.versions?.map((ver) => (
                <div key={ver.id} className="p-4 rounded-xl bg-[#F7F3EE] border border-[#E5D7C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#795548] text-white">
                        Version {ver.version_number}
                      </span>
                      <span className="text-xs font-semibold text-[#30241F]">{ver.file_name}</span>
                    </div>
                    <span className="text-[11px] text-[#88776B]">
                      {new Date(ver.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-[#4B342B]">
                    <strong>Change Summary:</strong> {ver.change_summary || 'Initial evidence registration'}
                  </p>

                  <div className="text-[11px] font-mono text-[#88776B] pt-1">
                    SHA-256: <span className="text-[#30241F] select-all">{ver.sha256_hash}</span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleVerify(ver.id)}
                      className="btn-secondary text-[11px] py-1 px-2.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#397451]" />
                      <span>Verify This Version</span>
                    </button>
                    <a
                      href={api.getDownloadUrl(document.id, ver.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-[11px] py-1 px-2.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Legal Hold & Integrity Sidebar */}
        <div className="space-y-6">
          {/* Legal Hold Card */}
          <div className="card-cream p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5D7C8]">
              <Scale className="w-4 h-4 text-[#795548]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B2923]">Court Preservation Order</h4>
            </div>

            <p className="text-xs text-[#88776B] leading-relaxed">
              When an active Legal Hold is placed, routine retention deletion is completely prohibited by system governance.
            </p>

            <div className="p-3 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8]">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#4B342B]">Legal Hold Status:</span>
                {document.is_legal_hold ? (
                  <span className="badge-pending text-[10px]">ACTIVE HOLD</span>
                ) : (
                  <span className="text-[11px] text-[#88776B]">NO HOLD</span>
                )}
              </div>
              {document.is_legal_hold && (
                <p className="text-[11px] text-[#88776B] mt-1">{document.legal_hold_reason}</p>
              )}
            </div>

            <button
              onClick={handleToggleLegalHold}
              className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                document.is_legal_hold
                  ? 'bg-[#F7F3EE] hover:bg-[#E5D7C8] text-[#4B342B] border border-[#E5D7C8]'
                  : 'bg-[#B7791F] hover:bg-[#976419] text-white shadow-xs'
              }`}
            >
              {document.is_legal_hold ? 'Release Legal Hold' : 'Apply Legal Hold Preservation'}
            </button>
          </div>

          {/* Quick Security Info */}
          <div className="card-cream p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5D7C8]">
              <GitCommit className="w-4 h-4 text-[#397451]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#3B2923]">Ledger Linkage</h4>
            </div>
            <p className="text-[#88776B] leading-relaxed">
              Every document version is cryptographically bound into the sequential hash-chain integrity ledger.
            </p>
            <Link to="/ledger" className="btn-secondary w-full text-xs text-center justify-center">
              Inspect Audit Ledger
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: New Version Upload */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-[#3B2923]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-cream p-6 max-w-lg w-full space-y-4 shadow-elevation">
            <h3 className="text-base font-bold text-[#3B2923]">Submit Superseding Document Version</h3>
            <p className="text-xs text-[#88776B]">
              Never overwrites historical records. Preserves existing version and appends a new verified version into the ledger.
            </p>

            <form onSubmit={handleCreateVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-[#4B342B] mb-1">
                  Change Description / Correction Reason *
                </label>
                <textarea
                  rows={2}
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Added certified forensic lab signature and appendix B"
                  className="input-cream"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-[#4B342B] mb-1">
                  Updated Document File *
                </label>
                <input
                  type="file"
                  onChange={(e) => e.target.files && setNewVersionFile(e.target.files[0])}
                  className="input-cream"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVersionModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingVersion}
                  className="btn-primary text-xs"
                >
                  {isUploadingVersion ? 'Registering Version...' : 'Commit Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
