import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowLeft, Shield, Hash } from 'lucide-react';
import { api } from '../services/api';
import { DocumentCategory, Case } from '../types';

export const DocumentUploadPage: React.FC = () => {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [caseId, setCaseId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [confidentiality, setConfidentiality] = useState('CONFIDENTIAL');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<any | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const loadPrerequisites = async () => {
      try {
        const [catsData, casesData] = await Promise.all([
          api.getDocumentCategories(),
          api.getCases(),
        ]);
        setCategories(catsData);
        setCases(casesData);
        if (catsData.length > 0) setCategoryId(catsData[0].id);
        if (casesData.length > 0) setCaseId(casesData[0].id);
      } catch (err) {
        console.error('Failed to load upload prerequisites:', err);
      }
    };
    loadPrerequisites();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setErrorMsg('File exceeds maximum allowable size (50MB)');
        return;
      }
      setFile(selected);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please attach an official legal/evidence document file.');
      return;
    }
    if (!title.trim() || !caseId || !categoryId) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('case_id', caseId);
      formData.append('category_id', categoryId);
      formData.append('confidentiality_level', confidentiality);
      if (description) formData.append('description', description);
      if (referenceNumber) formData.append('reference_number', referenceNumber);
      if (tags) formData.append('tags', tags);
      formData.append('file', file);

      const result = await api.uploadDocument(formData);
      setUploadSuccess(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Evidence upload failed.');
    } finally {
      setLoading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 font-sans">
        <div className="card-cream p-8 text-center space-y-5 shadow-elevation">
          <div className="w-14 h-14 rounded-full bg-[#397451]/15 text-[#397451] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#3B2923]">Evidence Securely Registered</h2>
            <p className="text-xs text-[#88776B] mt-1">
              Document secured in private vault, SHA-256 checksum recorded, and chained into the immutable integrity ledger.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F3EE] border border-[#E5D7C8] text-left text-xs font-mono space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[#88776B]">Document Number:</span>
              <span className="font-bold text-[#3B2923]">{uploadSuccess.document_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#88776B]">Title:</span>
              <span className="font-bold text-[#4B342B] truncate max-w-xs">{uploadSuccess.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#88776B]">File Name:</span>
              <span>{uploadSuccess.latest_version?.file_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#88776B]">File Size:</span>
              <span>{((uploadSuccess.latest_version?.file_size_bytes || 0) / 1024).toFixed(1)} KB</span>
            </div>
            <div className="pt-1 border-t border-[#E5D7C8]">
              <span className="text-[#88776B] block mb-1">SHA-256 Cryptographic Checksum:</span>
              <p className="p-2 rounded bg-white border border-[#E5D7C8] text-[11px] text-[#30241F] break-all select-all">
                {uploadSuccess.latest_version?.sha256_hash}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Link to={`/documents/${uploadSuccess.id}`} className="btn-primary">
              View Document Dossier
            </Link>
            <button
              onClick={() => {
                setUploadSuccess(null);
                setTitle('');
                setFile(null);
                setDescription('');
                setReferenceNumber('');
                setTags('');
              }}
              className="btn-secondary"
            >
              Upload Another Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div className="flex items-center gap-3 pb-3 border-b border-[#E5D7C8]">
        <Link to="/documents" className="p-2 rounded-lg hover:bg-[#E5D7C8]/50 text-[#795548]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B2923]">Upload Legal & Investigation Evidence</h1>
          <p className="text-xs text-[#88776B] mt-0.5">
            Strict file verification, real-time SHA-256 checksum computation, and automatic chain-of-custody recording
          </p>
        </div>
      </div>

      <div className="card-cream p-6 sm:p-8 shadow-card">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-lg bg-[#B84040]/10 border border-[#B84040]/30 flex items-start gap-3 text-sm text-[#B84040]">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Upload Error</p>
              <p className="text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Attachment Dropzone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-2">
              Official Document Attachment *
            </label>
            <div className="border-2 border-dashed border-[#E5D7C8] hover:border-[#B8875B] rounded-xl p-6 text-center bg-[#F7F3EE]/50 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.docx,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.zip"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-[#E5D7C8]/60 flex items-center justify-center text-[#795548]">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-[#30241F]">
                  {file ? file.name : 'Click to select or drag and drop official document'}
                </span>
                <span className="text-[11px] text-[#88776B]">
                  Supported: PDF, DOCX, XLSX, CSV, TXT, JPEG, PNG, ZIP (Max 50MB)
                </span>
                {file && (
                  <span className="badge-verified mt-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected: {(file.size / 1024).toFixed(1)} KB</span>
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
              Document Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sworn Deposition of Eyewitness #3"
              className="input-cream"
              required
            />
          </div>

          {/* Case and Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
                Associated Case Dossier *
              </label>
              <select
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="input-cream"
                required
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
                Document Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-cream"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Classification and Ref Number Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
                Confidentiality Level *
              </label>
              <select
                value={confidentiality}
                onChange={(e) => setConfidentiality(e.target.value)}
                className="input-cream"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL LAW ENFORCEMENT</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="TOP_SECRET">TOP SECRET / RESTRICTED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
                Official Reference / GD Entry Number
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. FIR-2026/892 or GD-104"
                className="input-cream"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
              Keywords and Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma separated: Cyber, Hard Drive, Seizure, Court Certified"
              className="input-cream"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4B342B] mb-1.5">
              Custody Summary / Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contextual details regarding seizure, witness interview, or certified forensic dump..."
              className="input-cream"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-sm font-semibold"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing & Computing SHA-256 Checksum...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure & Register into Integrity Ledger</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
