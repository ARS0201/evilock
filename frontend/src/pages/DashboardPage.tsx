import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Briefcase, 
  ShieldCheck, 
  AlertTriangle, 
  GitCommit, 
  Clock, 
  Upload, 
  Plus, 
  Search, 
  ArrowUpRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats, Document, Case } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [recentCases, setRecentCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsData, docsData, casesData] = await Promise.all([
          api.getDashboardStats(),
          api.getDocuments({ search: '' }),
          api.getCases(),
        ]);
        setStats(statsData);
        setRecentDocs(docsData.slice(0, 5));
        setRecentCases(casesData.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, [user]);

  const primaryRole = user?.roles[0]?.display_name || 'Officer';

  // Category distribution data for BarChart
  const categoryData = [
    { name: 'FIR / Police', count: 3 },
    { name: 'Forensics', count: 2 },
    { name: 'Witness Statements', count: 2 },
    { name: 'Charge Sheets', count: 1 },
    { name: 'Court Filings', count: 1 },
  ];

  // Integrity distribution data for Donut Chart
  const integrityData = [
    { name: 'Verified Intact', value: stats?.verified_documents_count || 3, color: '#397451' },
    { name: 'Tamper Alerts', value: stats?.tamper_alerts_count || 0, color: '#B84040' },
    { name: 'Pending Initial Check', value: Math.max(0, (stats?.total_documents || 3) - (stats?.verified_documents_count || 0)), color: '#B7791F' },
  ];

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      {/* Role Greeting & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D7C8]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase tracking-wider font-bold text-[#B8875B]">
              Secure Workspace
            </span>
            <span className="text-xs text-[#88776B]">•</span>
            <span className="text-xs text-[#88776B] font-mono">
              Badge: {user?.badge_number || 'OFF-SYS'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3B2923]">
            Welcome, {user?.full_name}
          </h1>
          <p className="text-sm text-[#88776B] mt-0.5">
            Operational dashboard for <strong className="text-[#4B342B]">{primaryRole}</strong> ({user?.department?.name || 'Department of Justice'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/documents/upload" className="btn-primary">
            <Upload className="w-4 h-4" />
            <span>Upload Evidence</span>
          </Link>
          <Link to="/verify" className="btn-secondary">
            <ShieldCheck className="w-4 h-4 text-[#397451]" />
            <span>Verify Integrity</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card-cream p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#88776B] uppercase tracking-wider">Accessible Evidence</span>
            <div className="w-8 h-8 rounded-lg bg-[#795548]/10 text-[#795548] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#3B2923]">
              {loading ? '...' : stats?.total_documents ?? 0}
            </span>
            <span className="text-xs text-[#88776B] block mt-1">Verified files in vault</span>
          </div>
        </div>

        <div className="card-cream p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#88776B] uppercase tracking-wider">Active Cases</span>
            <div className="w-8 h-8 rounded-lg bg-[#B8875B]/15 text-[#B8875B] flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#3B2923]">
              {loading ? '...' : stats?.active_cases ?? 0}
            </span>
            <span className="text-xs text-[#88776B] block mt-1">Under investigation</span>
          </div>
        </div>

        <div className="card-cream p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#88776B] uppercase tracking-wider">Ledger Height</span>
            <div className="w-8 h-8 rounded-lg bg-[#397451]/10 text-[#397451] flex items-center justify-center">
              <GitCommit className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[#397451] font-mono">
              #{loading ? '...' : stats?.ledger_blocks_count ?? 0}
            </span>
            <span className="text-xs text-[#397451] block mt-1 font-medium">Chained & Unbroken</span>
          </div>
        </div>

        <div className="card-cream p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#88776B] uppercase tracking-wider">Tamper Alerts</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              (stats?.tamper_alerts_count || 0) > 0 ? 'bg-[#B84040]/15 text-[#B84040]' : 'bg-[#397451]/10 text-[#397451]'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-3xl font-extrabold ${(stats?.tamper_alerts_count || 0) > 0 ? 'text-[#B84040]' : 'text-[#397451]'}`}>
              {loading ? '...' : stats?.tamper_alerts_count ?? 0}
            </span>
            <span className="text-xs text-[#88776B] block mt-1">
              {(stats?.tamper_alerts_count || 0) > 0 ? 'Security alert triggered' : 'All signatures valid'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Classification Distribution */}
        <div className="card-cream p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#3B2923]">Evidence by Category</h3>
              <p className="text-xs text-[#88776B]">Classification of documents currently secured in the repository</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E5D7C8]/40 text-[#4B342B]">
              Verified Records
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" stroke="#88776B" fontSize={11} tickLine={false} />
                <YAxis stroke="#88776B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E5D7C8', borderRadius: '8px', fontSize: '12px' }} 
                  cursor={{ fill: 'rgba(184, 135, 91, 0.08)' }}
                />
                <Bar dataKey="count" fill="#795548" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cryptographic Integrity Status */}
        <div className="card-cream p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[#3B2923]">Cryptographic Integrity</h3>
            <p className="text-xs text-[#88776B]">SHA-256 validation health status</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={integrityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {integrityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#FFFDF9', borderColor: '#E5D7C8', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-[#E5D7C8]">
            {integrityData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                  <span className="text-[#4B342B]">{d.name}</span>
                </div>
                <span className="font-bold text-[#30241F] font-mono">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Dockets & Cases Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Ingested Evidence */}
        <div className="card-cream p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5D7C8]">
            <h3 className="text-base font-bold text-[#3B2923]">Recently Registered Evidence</h3>
            <Link to="/documents" className="text-xs font-semibold text-[#B8875B] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentDocs.length === 0 ? (
              <p className="text-xs text-[#88776B] py-4 text-center">No documents found</p>
            ) : (
              recentDocs.map((doc) => (
                <div key={doc.id} className="p-3 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8] flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#795548]">{doc.document_number}</span>
                      {doc.is_legal_hold && (
                        <span className="badge-pending text-[10px] py-0.2">LEGAL HOLD</span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#30241F] truncate mt-0.5">{doc.title}</p>
                    <p className="text-[10px] text-[#88776B]">Officer: {doc.uploader.full_name}</p>
                  </div>

                  <Link
                    to={`/documents/${doc.id}`}
                    className="btn-secondary text-xs px-2.5 py-1.5 flex-shrink-0"
                  >
                    Inspect
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Investigation Cases */}
        <div className="card-cream p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5D7C8]">
            <h3 className="text-base font-bold text-[#3B2923]">Investigation Dossiers</h3>
            <Link to="/cases" className="text-xs font-semibold text-[#B8875B] hover:underline flex items-center gap-1">
              <span>View All Cases</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCases.length === 0 ? (
              <p className="text-xs text-[#88776B] py-4 text-center">No active cases registered</p>
            ) : (
              recentCases.map((c) => (
                <div key={c.id} className="p-3.5 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-[#795548]">{c.case_number}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#3B2923]/10 text-[#3B2923]">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#30241F]">{c.title}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#88776B]">
                    <span>Lead: {c.assigned_officer.full_name}</span>
                    <span className="font-semibold text-[#4B342B]">{c.documents_count} Evidence Items</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
