import React, { useState, useEffect } from 'react';
import { KeyRound, Check, X, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { AccessRequest } from '../types';

export const AccessRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.getAccessRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load access requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDecision = async (reqId: string, approved: boolean) => {
    const reason = prompt(
      approved 
        ? "Enter approval note and authorized duration (e.g., 'Approved for trial preparation, 72 hours'):" 
        : "Enter reason for rejection:"
    );
    if (reason === null) return;

    try {
      await api.decideAccessRequest(reqId, approved, reason);
      await loadRequests();
    } catch (err: any) {
      alert(`Error deciding request: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto">
      {/* Title */}
      <div className="pb-4 border-b border-[#E5D7C8]">
        <h1 className="text-2xl font-extrabold text-[#3B2923]">Access Request Approvals</h1>
        <p className="text-xs text-[#88776B] mt-1">
          Review, grant, or reject inter-agency authorization requests for restricted documents with strict audit logging
        </p>
      </div>

      {/* Requests List */}
      <div className="card-cream overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-[#88776B]">
            <div className="w-8 h-8 border-4 border-[#B8875B] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Loading Access Requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#88776B]">
            No access requests pending review. All confidential records secured.
          </div>
        ) : (
          <div className="divide-y divide-[#E5D7C8]">
            {requests.map((r) => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F3EE]/50 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#30241F]">{r.requester.full_name}</span>
                    <span className="text-[10px] text-[#88776B] font-mono">({r.requester.badge_number || 'Staff'})</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E5D7C8]/50 text-[#4B342B]">
                      {r.permission_requested}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      r.status === 'APPROVED' ? 'bg-[#397451]/15 text-[#397451]' :
                      r.status === 'REJECTED' ? 'bg-[#B84040]/15 text-[#B84040]' :
                      'bg-[#B7791F]/15 text-[#B7791F]'
                    }`}>
                      {r.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#4B342B] font-medium">
                    <strong>Reason:</strong> {r.reason}
                  </p>

                  <div className="text-[11px] text-[#88776B] flex items-center gap-4">
                    <span>Target Document: <code className="text-[#795548] font-bold">#{r.document_id.slice(0, 8)}</code></span>
                    <span>Requested: {new Date(r.created_at).toLocaleDateString()}</span>
                    {r.decision_reason && (
                      <span className="text-[#30241F]">Note: {r.decision_reason}</span>
                    )}
                  </div>
                </div>

                {r.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecision(r.id, true)}
                      className="btn-caramel text-xs px-3 py-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDecision(r.id, false)}
                      className="btn-danger text-xs px-3 py-1.5"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
