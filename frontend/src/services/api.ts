import {
  User, Document, DocumentCategory, Case, LedgerBlock, 
  VerifyResult, ChainAuditSummary, AuditLog, AccessRequest, DashboardStats, NotificationItem
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : '/api');

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('evilock_token', token);
    } else {
      localStorage.removeItem('evilock_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('evilock_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends HttpOnly cookies
    });

    if (!response.ok) {
      let errorMsg = `Request failed: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(username_or_email: string, password: string):Promise<{ access_token: string; user: User }> {
    const res = await this.request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/audit/stats');
  }

  // Documents
  async getDocuments(params?: { case_id?: string; category_id?: string; search?: string }): Promise<Document[]> {
    const query = new URLSearchParams();
    if (params?.case_id) query.append('case_id', params.case_id);
    if (params?.category_id) query.append('category_id', params.category_id);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return this.request<Document[]>(`/documents${qs ? `?${qs}` : ''}`);
  }

  async getDocumentCategories(): Promise<DocumentCategory[]> {
    return this.request<DocumentCategory[]>('/documents/categories');
  }

  async getDocumentDetails(id: string): Promise<Document> {
    return this.request<Document>(`/documents/${id}`);
  }

  async uploadDocument(formData: FormData): Promise<Document> {
    return this.request<Document>('/documents', {
      method: 'POST',
      body: formData,
    });
  }

  async uploadNewVersion(documentId: string, formData: FormData): Promise<Document> {
    return this.request<Document>(`/documents/${documentId}/versions`, {
      method: 'POST',
      body: formData,
    });
  }

  async updateDocumentMetadata(documentId: string, metadata: {
    title?: string;
    description?: string;
    confidentiality_level?: string;
    tags?: string;
    is_legal_hold?: boolean;
    legal_hold_reason?: string;
  }): Promise<Document> {
    return this.request<Document>(`/documents/${documentId}/metadata`, {
      method: 'PATCH',
      body: JSON.stringify(metadata),
    });
  }

  async verifyDocument(documentId: string, versionId?: string): Promise<VerifyResult> {
    return this.request<VerifyResult>(`/documents/${documentId}/verify${versionId ? `?version_id=${versionId}` : ''}`, {
      method: 'POST',
    });
  }

  async simulateTampering(documentId: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(`/documents/${documentId}/simulate-tamper`, {
      method: 'POST',
    });
  }

  getDownloadUrl(documentId: string, versionId?: string): string {
    const token = this.getToken();
    return `${API_BASE}/documents/${documentId}/download${versionId ? `?version_id=${versionId}` : ''}`;
  }

  // Cases
  async getCases(status?: string): Promise<Case[]> {
    return this.request<Case[]>(`/cases${status ? `?status=${status}` : ''}`);
  }

  async getCaseDetails(caseId: string): Promise<{ case: Case; members: any[]; documents: Document[] }> {
    return this.request<{ case: Case; members: any[]; documents: Document[] }>(`/cases/${caseId}`);
  }

  async createCase(data: {
    case_number: string;
    title: string;
    case_type: string;
    description?: string;
    department_id: string;
    confidentiality_level?: string;
    collaborator_ids?: string[];
  }): Promise<Case> {
    return this.request<Case>('/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCase(caseId: string, data: { status?: string; title?: string; description?: string }): Promise<Case> {
    return this.request<Case>(`/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Ledger
  async getLedgerBlocks(limit = 50): Promise<LedgerBlock[]> {
    return this.request<LedgerBlock[]>(`/ledger?limit=${limit}`);
  }

  async auditLedgerChain(): Promise<ChainAuditSummary> {
    return this.request<ChainAuditSummary>('/ledger/audit-chain');
  }

  // Audit Logs
  async getAuditLogs(params?: { limit?: number; action?: string; result?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.action) query.append('action', params.action);
    if (params?.result) query.append('result', params.result);
    const qs = query.toString();
    return this.request<AuditLog[]>(`/audit/logs${qs ? `?${qs}` : ''}`);
  }

  // Workflow & Access Requests
  async getAccessRequests(): Promise<AccessRequest[]> {
    return this.request<AccessRequest[]>('/workflow/access-requests');
  }

  async requestAccess(documentId: string, reason: string): Promise<AccessRequest> {
    return this.request<AccessRequest>('/workflow/access-requests', {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, reason }),
    });
  }

  async decideAccessRequest(requestId: string, approved: boolean, reason?: string): Promise<AccessRequest> {
    return this.request<AccessRequest>(`/workflow/access-requests/${requestId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ approved, decision_reason: reason }),
    });
  }

  // Notifications
  async getNotifications(): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>('/workflow/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/workflow/notifications/${id}/read`, { method: 'PATCH' });
  }

  // Users & Departments
  async getUsers(role?: string): Promise<User[]> {
    return this.request<User[]>(`/users${role ? `?role_name=${role}` : ''}`);
  }

  async getDepartments(): Promise<any[]> {
    return this.request<any[]>('/users/departments');
  }
}

export const api = new ApiService();
