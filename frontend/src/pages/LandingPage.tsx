import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  FileText, 
  Lock, 
  History, 
  Search, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  GitCommit,
  Scale,
  FileCheck2,
  Database
} from 'lucide-react';
import { Logo } from '../components/common/Logo';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'Secure Document Repository',
      description: 'Private encrypted storage for FIRs, charge sheets, witness statements, and forensic reports with MIME and magic-byte validation.'
    },
    {
      icon: GitCommit,
      title: 'Evidence Integrity Verification',
      description: 'SHA-256 cryptographic hashing chained into an append-only, tamper-evident ledger with on-demand bit-level proof.'
    },
    {
      icon: Lock,
      title: 'Role-Based Access Control',
      description: 'Granular permissions enforcing least-privilege access across police, prosecutors, courts, forensic labs, and auditors.'
    },
    {
      icon: History,
      title: 'Transparent Audit Trails',
      description: 'Immutable, chronological record of every login, upload, view, download, permission grant, and verification attempt.'
    },
    {
      icon: Search,
      title: 'Intelligent Legal Search',
      description: 'Multi-field search across FIR reference numbers, case titles, keywords, dates, and confidentiality classifications.'
    },
    {
      icon: Users,
      title: 'Inter-Agency Collaboration',
      description: 'Controlled cross-departmental sharing between police units, judicial registries, and prosecution officers.'
    }
  ];

  const workflowSteps = [
    { num: '01', title: 'Upload Document', desc: 'Ingest FIR or evidence with strict format validation' },
    { num: '02', title: 'Generate Hash', desc: 'Compute live SHA-256 checksum at upload stream' },
    { num: '03', title: 'Classify & Organize', desc: 'Tag confidentiality, category, and case docket' },
    { num: '04', title: 'Assign Permissions', desc: 'Enforce RBAC and legal hold preservation rules' },
    { num: '05', title: 'Verify & Share', desc: 'Verify cryptographic proof or share time-limited links' },
    { num: '06', title: 'Maintain Audit', desc: 'Record immutable proof in the integrity ledger' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#30241F] flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-20 bg-[#FFFDF9]/90 backdrop-blur-md border-b border-[#E5D7C8] sticky top-0 z-30 px-6 lg:px-16 flex items-center justify-between">
        <Logo variant="light" size="md" showTagline={true} />

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#4B342B]">
          <a href="#features" className="hover:text-[#B8875B] transition-colors">Features</a>
          <a href="#workflow" className="hover:text-[#B8875B] transition-colors">Workflow</a>
          <a href="#security" className="hover:text-[#B8875B] transition-colors">Security Architecture</a>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="btn-primary"
          >
            <span>Access Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-6 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-14">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B8875B]/15 text-[#795548] border border-[#B8875B]/30 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5 text-[#B8875B]" />
            <span>Judicial & Forensic Evidence Integrity Architecture</span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold text-[#3B2923] tracking-tight leading-tight">
            Every Piece of Evidence Deserves to Be Protected.
          </h1>

          <p className="text-lg text-[#88776B] max-w-2xl leading-relaxed">
            EviLock brings legal documents, investigation records, and digital evidence into one secure workspace—preserving document integrity, controlling access, and maintaining a trustworthy record of every action.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-2">
            <Link
              to="/login"
              className="btn-caramel text-base px-6 py-3 w-full sm:w-auto"
            >
              <span>Access Secure Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="btn-secondary text-base px-6 py-3 w-full sm:w-auto"
            >
              Explore Features
            </a>
          </div>

          <div className="pt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-[#88776B]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#397451]" />
              <span>SHA-256 Tamper Proof</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#397451]" />
              <span>Argon2id Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#397451]" />
              <span>7 Specialized Roles</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Card */}
        <div className="w-full lg:w-5/12">
          <div className="bg-[#FFFDF9] border border-[#E5D7C8] rounded-2xl p-6 shadow-elevation space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D7C8]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#B84040]"></div>
                <div className="w-3 h-3 rounded-full bg-[#B7791F]"></div>
                <div className="w-3 h-3 rounded-full bg-[#397451]"></div>
              </div>
              <span className="text-[11px] font-mono font-semibold text-[#88776B]">EviLock Proof Engine v1.0</span>
            </div>

            <div className="p-4 rounded-xl bg-[#F7F3EE] border border-[#E5D7C8] space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-[#4B342B]">
                <span className="text-[#88776B]">DOCUMENT NUMBER:</span>
                <span className="font-bold">FIR-2026-0491</span>
              </div>
              <div className="flex justify-between items-center text-[#4B342B]">
                <span className="text-[#88776B]">RECORD TYPE:</span>
                <span className="font-bold text-[#795548]">Police FIR & Forensic Seizure</span>
              </div>
              <div className="text-[#88776B] text-[11px]">
                CRYPTOGRAPHIC SHA-256 CHECKSUM:
              </div>
              <div className="p-2.5 rounded bg-white border border-[#E5D7C8] text-[11px] text-[#3B2923] break-all select-all">
                e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="badge-verified">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#397451]" />
                  <span>INTEGRITY VERIFIED</span>
                </span>
                <span className="text-[11px] text-[#88776B]">Ledger Block #1042</span>
              </div>
            </div>

            <div className="text-xs text-[#88776B] text-center pt-2">
              Anchored in a tamper-evident audit ledger with zero-tolerance verification.
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-20 bg-[#FFFDF9] border-y border-[#E5D7C8] px-6 lg:px-16">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B8875B]">Engineered for Justice</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#3B2923]">
              Six Pillars of Evidence Integrity
            </h2>
            <p className="text-[#88776B] text-sm">
              Purpose-built to solve document tampering, unauthorized disclosure, and fragmented custody records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div 
                  key={i} 
                  className="card-cream p-7 hover:border-[#B8875B] transition-all hover:shadow-elevation group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F7F3EE] flex items-center justify-center text-[#795548] mb-5 group-hover:bg-[#795548] group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#3B2923] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#88776B] leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20 px-6 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B8875B]">End-to-End Chain of Custody</span>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-[#3B2923]">
            How EviLock Protects Evidence
          </h2>
          <p className="text-[#88776B] text-sm">
            From the crime scene station upload to judicial verdict examination.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflowSteps.map((step) => (
            <div key={step.num} className="bg-[#FFFDF9] border border-[#E5D7C8] p-6 rounded-xl space-y-3 relative overflow-hidden">
              <span className="text-3xl font-extrabold text-[#B8875B]/30 font-mono">
                {step.num}
              </span>
              <h4 className="text-base font-bold text-[#3B2923]">{step.title}</h4>
              <p className="text-xs text-[#88776B] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Architecture */}
      <section id="security" className="py-20 bg-[#3B2923] text-[#FFFDF9] px-6 lg:px-16 border-t border-[#4B342B]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B8875B]">Security Architecture</span>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white">
              Zero Trust by Design
            </h2>
            <p className="text-[#E5D7C8]/70 text-sm">
              We never fabricate results or make unsubstantiated claims. Everything is cryptographically computed and verifiable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-[#4B342B] border border-[#795548]/50 space-y-3">
              <FileCheck2 className="w-8 h-8 text-[#B8875B]" />
              <h4 className="text-lg font-bold text-white">SHA-256 Hash Chaining</h4>
              <p className="text-xs text-[#E5D7C8]/80 leading-relaxed">
                Every document ingestion creates a block chained to the previous entry hash. Modifying any historical record invalidates the entire mathematical chain.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-[#4B342B] border border-[#795548]/50 space-y-3">
              <Lock className="w-8 h-8 text-[#B8875B]" />
              <h4 className="text-lg font-bold text-white">Argon2id Authentication</h4>
              <p className="text-xs text-[#E5D7C8]/80 leading-relaxed">
                Enterprise-grade cryptographic key derivation highly resistant to brute-force attacks, combined with secure HttpOnly cookie session management.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-[#4B342B] border border-[#795548]/50 space-y-3">
              <Scale className="w-8 h-8 text-[#B8875B]" />
              <h4 className="text-lg font-bold text-white">Court Legal Holds</h4>
              <p className="text-xs text-[#E5D7C8]/80 leading-relaxed">
                Statutory retention policies and explicit legal holds strictly prevent unauthorized record deletion or destruction while cases are active or on appeal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#30241F] text-[#E5D7C8]/70 py-12 px-6 lg:px-16 border-t border-[#4B342B]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="dark" size="sm" showTagline={true} />
          <p className="text-xs text-center md:text-right">
            Enterprise Digital Evidence & Chain-of-Custody Integrity System.<br />
            Designed for professional law enforcement and judicial record preservation.
          </p>
        </div>
      </footer>
    </div>
  );
};
