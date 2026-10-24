import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { DocumentDetailsPage } from './pages/DocumentDetailsPage';
import { VerificationPage } from './pages/VerificationPage';
import { LedgerPage } from './pages/LedgerPage';
import { CasesPage } from './pages/CasesPage';
import { AccessRequestsPage } from './pages/AccessRequestsPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Dashboard Routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/documents/upload" element={<DocumentUploadPage />} />
            <Route path="/documents/:id" element={<DocumentDetailsPage />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/access-requests" element={<AccessRequestsPage />} />
            <Route path="/audit-trail" element={<AuditTrailPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
