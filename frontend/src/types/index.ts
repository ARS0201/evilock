export type RoleName = 
  | 'ADMIN'
  | 'INVESTIGATING_OFFICER'
  | 'POLICE_OFFICER'
  | 'PROSECUTOR'
  | 'COURT_USER'
  | 'FORENSIC_EXPERT'
  | 'AUDITOR';

export interface Role {
  id: string;
  name: RoleName;
  display_name: string;
  description?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  badge_number?: string;
  designation?: string;
  is_active: boolean;
  mfa_enabled: boolean;
  department?: Department;
  roles: Role[];
  created_at: string;
}

export interface DocumentCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface DocumentVersion {
  id: string;
  version_number: number;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  change_summary?: string;
  is_superseded: boolean;
  created_at: string;
  created_by?: User;
}

export interface Document {
  id: string;
  document_number: string;
  title: string;
  description?: string;
  reference_number?: string;
  document_date: string;
  confidentiality_level: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
  status: 'ACTIVE' | 'SUBMITTED_FOR_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  is_legal_hold: boolean;
  legal_hold_reason?: string;
  tags?: string;
  case_id: string;
  category: DocumentCategory;
  uploader: User;
  latest_version?: DocumentVersion;
  versions?: DocumentVersion[];
  created_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  case_type: string;
  description?: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'UNDER_LEGAL_REVIEW' | 'SUBMITTED_TO_COURT' | 'CLOSED' | 'ARCHIVED';
  confidentiality_level: string;
  opening_date: string;
  closing_date?: string;
  department: Department;
  assigned_officer: User;
  created_at: string;
  documents_count: number;
}

export interface LedgerBlock {
  id: number;
  entry_id: string;
  document_id: string;
  version_id: string;
  document_sha256: string;
  previous_entry_hash: string;
  entry_hash: string;
  event_type: string;
  actor_id: string;
  actor?: User;
  created_at: string;
}

export interface VerifyResult {
  status: 'VERIFIED' | 'MISMATCH' | 'LEDGER ERROR' | 'UNVERIFIABLE';
  document_id: string;
  version_number: number;
  file_name: string;
  expected_hash: string;
  actual_hash: string;
  ledger_entry_hash?: string;
  is_hash_matching: boolean;
  is_chain_intact: boolean;
  tamper_detected: boolean;
  message: string;
  verified_at: string;
}

export interface ChainAuditSummary {
  total_blocks: number;
  is_chain_healthy: boolean;
  genesis_hash: string;
  latest_block_hash: string;
  invalid_block_id?: number;
  message: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_id?: string;
  actor?: User;
  action: string;
  resource_type?: string;
  resource_id?: string;
  result: 'SUCCESS' | 'FAILED' | 'DENIED' | 'ALERT';
  ip_address?: string;
  reason?: string;
  details_json?: string;
}

export interface AccessRequest {
  id: string;
  document_id: string;
  requester: User;
  approver?: User;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision_reason?: string;
  permission_requested: string;
  expires_at?: string;
  created_at: string;
}

export interface DashboardStats {
  total_documents: number;
  active_cases: number;
  pending_reviews: number;
  pending_access_requests: number;
  verified_documents_count: number;
  tamper_alerts_count: number;
  ledger_blocks_count: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string;
  category: string;
  is_read: boolean;
  created_at: string;
}
