import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  ShieldCheck, 
  Download, 
  Eye, 
  Clock, 
  Lock,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { Document, DocumentCategory } from '../types';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const [docsData, catsData] = await Promise.all([
        api.getDocuments({
          category_id: selectedCategory || undefined,
          search: searchTerm || undefined,
        }),
        api.getDocumentCategories(),
      ]);
      setDocuments(docsData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#3B2923]">Evidence Vault Repository</h1>
          <p className="text-xs text-[#88776B] mt-1">
            Access-controlled legal filings, FIRs, and forensic records protected by SHA-256 integrity verification
          </p>
        </div>
        <Link to="/documents/upload" className="btn-primary self-start sm:self-auto">
          <Upload className="w-4 h-4" />
          <span>Upload New Evidence</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-cream p-4 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#88776B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, document ID, reference number, or tags..."
              className="input-cream pl-10"
            />
          </div>
          <button type="submit" className="btn-secondary whitespace-nowrap">
            Search Vault
          </button>
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-[#E5D7C8]/60 text-xs">
          <span className="text-[#88776B] font-semibold flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 rounded-full font-medium transition-colors flex-shrink-0 ${
              selectedCategory === '' 
                ? 'bg-[#795548] text-white shadow-xs' 
                : 'bg-[#F7F3EE] text-[#4B342B] hover:bg-[#E5D7C8]'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full font-medium transition-colors flex-shrink-0 ${
                selectedCategory === cat.id 
                  ? 'bg-[#795548] text-white shadow-xs' 
                  : 'bg-[#F7F3EE] text-[#4B342B] hover:bg-[#E5D7C8]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="card-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#4B342B] text-white font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Doc Number</th>
                <th className="py-3.5 px-4">Title & Classification</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Recording Officer / Dept</th>
                <th className="py-3.5 px-4">Version</th>
                <th className="py-3.5 px-4">Legal Hold</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5D7C8] text-[#30241F]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#88776B]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#B8875B] border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrieving verified document records...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-[#88776B]">
                    No evidence records found matching the active criteria.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#F7F3EE]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#795548]">
                      {doc.document_number}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-[#30241F] truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-[#88776B]">
                          {doc.confidentiality_level}
                        </span>
                        {doc.reference_number && (
                          <span className="text-[10px] text-[#88776B] font-mono">
                            Ref: {doc.reference_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#4B342B] font-medium">
                      {doc.category.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#30241F]">{doc.uploader.full_name}</p>
                      <p className="text-[10px] text-[#88776B]">{doc.uploader.department?.name || 'Authorized Unit'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-semibold px-2 py-0.5 rounded bg-[#E5D7C8]/50 text-[#4B342B]">
                        v{doc.latest_version?.version_number ?? 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.is_legal_hold ? (
                        <span className="badge-pending text-[10px]">
                          HOLD ACTIVE
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#88776B]/70">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="p-1.5 rounded hover:bg-[#E5D7C8]/50 text-[#795548] title='Inspect Dossier'"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/verify?document_id=${doc.id}`}
                          className="p-1.5 rounded hover:bg-[#397451]/10 text-[#397451]"
                          title="Verify Evidence Integrity"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </Link>
                      </div>
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
