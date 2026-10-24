import React, { useState, useEffect } from 'react';
import { Sliders, Shield, HardDrive, Key, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [deptsData, catsData] = await Promise.all([
          api.getDepartments(),
          api.getDocumentCategories(),
        ]);
        setDepartments(deptsData);
        setCategories(catsData);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-[#E5D7C8]">
        <h1 className="text-2xl font-extrabold text-[#3B2923]">System Governance & Settings</h1>
        <p className="text-xs text-[#88776B] mt-1">
          Cryptographic policies, private storage vault configuration, and authorized law enforcement departments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Parameters */}
        <div className="card-cream p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5D7C8]">
            <Key className="w-4 h-4 text-[#B8875B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B2923]">
              Cryptographic & Security Policies
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 rounded-lg bg-[#F7F3EE]">
              <div>
                <span className="font-bold text-[#30241F]">Document Integrity Checksum Standard</span>
                <p className="text-[11px] text-[#88776B]">SHA-256 (FIPS 180-4 compliant)</p>
              </div>
              <span className="badge-verified">ACTIVE</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-[#F7F3EE]">
              <div>
                <span className="font-bold text-[#30241F]">Credential Cryptographic Protection</span>
                <p className="text-[11px] text-[#88776B]">Argon2id (time=3, mem=64MB, p=4)</p>
              </div>
              <span className="badge-verified">ENFORCED</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-[#F7F3EE]">
              <div>
                <span className="font-bold text-[#30241F]">Session Cookie Protection</span>
                <p className="text-[11px] text-[#88776B]">HttpOnly, SameSite=Lax, Expire=480m</p>
              </div>
              <span className="badge-verified">PROTECTED</span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-[#F7F3EE]">
              <div>
                <span className="font-bold text-[#30241F]">Tamper-Evident Ledger Architecture</span>
                <p className="text-[11px] text-[#88776B]">Append-Only Parent-Chained Cryptographic Ledger</p>
              </div>
              <span className="badge-verified">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Private Vault Storage */}
        <div className="card-cream p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5D7C8]">
            <HardDrive className="w-4 h-4 text-[#795548]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B2923]">
              Private Evidence Storage Vault
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-[#F7F3EE] space-y-1">
              <span className="text-[#88776B]">Vault Storage Directory:</span>
              <p className="font-mono text-[11px] text-[#30241F] break-all">d:\evilock\storage\vault</p>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-[#F7F3EE]">
              <span className="text-[#88776B]">Maximum File Upload Size:</span>
              <span className="font-bold text-[#30241F]">50 MB per file</span>
            </div>

            <div className="flex justify-between p-3 rounded-lg bg-[#F7F3EE]">
              <span className="text-[#88776B]">Storage Privacy:</span>
              <span className="font-bold text-[#397451]">PRIVATE / ACCESS-CONTROLLED</span>
            </div>
          </div>
        </div>

        {/* Authorized Law Enforcement Departments */}
        <div className="card-cream p-6 space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#E5D7C8]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3B2923]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B2923]">
                Authorized Law Enforcement & Judicial Agencies
              </h3>
            </div>
            <span className="text-xs text-[#88776B] font-mono">{departments.length} Agencies Registered</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map((d) => (
              <div key={d.id} className="p-3.5 rounded-lg bg-[#F7F3EE] border border-[#E5D7C8] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#30241F]">{d.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E5D7C8] text-[#795548]">
                    {d.code}
                  </span>
                </div>
                <p className="text-[11px] text-[#88776B] leading-tight">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
