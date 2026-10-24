import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Plus, FolderOpen, Users, Clock, ArrowRight, Shield } from 'lucide-react';
import { api } from '../services/api';
import { Case } from '../types';

export const CasesPage: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Case form
  const [caseNumber, setCaseNumber] = useState('');
  const [title, setTitle] = useState('');
  const [caseType, setCaseType] = useState('Cybercrime');
  const [description, setDescription] = useState('');
  const [confidentiality, setConfidentiality] = useState('CONFIDENTIAL');
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptId, setDeptId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCases = async () => {
    setLoading(true);
    try {
      const [casesData, deptsData] = await Promise.all([
        api.getCases(),
        api.getDepartments(),
      ]);
      setCases(casesData);
      setDepartments(deptsData);
      if (deptsData.length > 0) setDeptId(deptsData[0].id);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !title.trim() || !deptId) {
      alert('Please fill out all required fields.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createCase({
        case_number: caseNumber,
        title,
        case_type: caseType,
        description,
        department_id: deptId,
        confidentiality_level: confidentiality,
      });
      setShowCreateModal(false);
      setCaseNumber('');
      setTitle('');
      setDescription('');
      await loadCases();
    } catch (err: any) {
      alert(`Error creating case: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B2923]">Investigation Case Dossiers</h1>
          <p className="text-xs text-[#88776B] mt-1">
            Organized legal investigations unifying FIRs, digital forensics, depositions, and courtroom filings
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Case</span>
        </button>
      </div>

      {/* Cases Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-[#88776B]">
          <div className="w-8 h-8 border-4 border-[#B8875B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span>Loading Cases...</span>
        </div>
      ) : cases.length === 0 ? (
        <div className="card-cream p-12 text-center text-sm text-[#88776B]">
          No active investigation cases found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
            <div key={c.id} className="card-cream p-5 shadow-card hover:border-[#B8875B] transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#795548] px-2.5 py-1 rounded bg-[#E5D7C8]/40">
                    {c.case_number}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3B2923]/10 text-[#3B2923]">
                    {c.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#30241F] leading-snug">{c.title}</h3>
                
                <p className="text-xs text-[#88776B] line-clamp-2 leading-relaxed">
                  {c.description || 'Active criminal and electronic evidence investigation docket.'}
                </p>

                <div className="pt-2 border-t border-[#E5D7C8] space-y-1 text-xs text-[#88776B]">
                  <div className="flex justify-between">
                    <span>Department:</span>
                    <span className="font-semibold text-[#4B342B]">{c.department?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lead Officer:</span>
                    <span className="font-semibold text-[#4B342B]">{c.assigned_officer?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evidence Items:</span>
                    <span className="font-bold text-[#795548]">{c.documents_count} Files</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-[#E5D7C8] flex items-center justify-between">
                <span className="text-[10px] text-[#88776B]">
                  Opened {new Date(c.opening_date).toLocaleDateString()}
                </span>
                <Link
                  to={`/documents?case_id=${c.id}`}
                  className="text-xs font-bold text-[#B8875B] hover:text-[#795548] flex items-center gap-1"
                >
                  <span>Open Docket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#3B2923]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-cream p-6 max-w-lg w-full space-y-4 shadow-elevation">
            <h3 className="text-base font-bold text-[#3B2923]">Register Investigation Case Dossier</h3>
            
            <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase text-[#4B342B] mb-1">
                  Case Reference Number *
                </label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. CR-2026-0512 or CC-991"
                  className="input-cream"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#4B342B] mb-1">
                  Case Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. State vs. Cyber Extortion Ring"
                  className="input-cream"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase text-[#4B342B] mb-1">
                    Case Type *
                  </label>
                  <select
                    value={caseType}
                    onChange={(e) => setCaseType(e.target.value)}
                    className="input-cream"
                  >
                    <option value="Cybercrime">Cybercrime</option>
                    <option value="Financial Fraud">Financial Fraud</option>
                    <option value="Criminal Investigation">Criminal Investigation</option>
                    <option value="Forensic Analysis">Forensic Analysis</option>
                    <option value="Judicial Proceedings">Judicial Proceedings</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase text-[#4B342B] mb-1">
                    Department *
                  </label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="input-cream"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#4B342B] mb-1">
                  Confidentiality Level *
                </label>
                <select
                  value={confidentiality}
                  onChange={(e) => setConfidentiality(e.target.value)}
                  className="input-cream"
                >
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="TOP_SECRET">TOP SECRET</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold uppercase text-[#4B342B] mb-1">
                  Case Description & Brief
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summary of charges, alleged offenses, and investigating objectives..."
                  className="input-cream"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Registering...' : 'Create Case Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
