-- =================================================================
-- EVILOCK GLOBAL DATABASE: FULL DDL & DEMO SEED SCRIPT FOR SUPABASE
-- Project: EVILOCK (ap-northeast-2)
-- Run this in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- =================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE TABLE departments (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	code VARCHAR(20) NOT NULL, 
	description VARCHAR(255), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (code)
);

CREATE TABLE document_categories (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	code VARCHAR(50) NOT NULL, 
	description VARCHAR(255), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name), 
	UNIQUE (code)
);

CREATE TABLE retention_policies (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	retention_years INTEGER NOT NULL, 
	description VARCHAR(255), 
	disposal_action VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE roles (
	id VARCHAR(36) NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	display_name VARCHAR(100) NOT NULL, 
	description VARCHAR(255), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id)
);

CREATE TABLE users (
	id VARCHAR(36) NOT NULL, 
	username VARCHAR(50) NOT NULL, 
	email VARCHAR(120) NOT NULL, 
	full_name VARCHAR(100) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	badge_number VARCHAR(50), 
	designation VARCHAR(100), 
	is_active BOOLEAN NOT NULL, 
	is_locked BOOLEAN NOT NULL, 
	failed_login_attempts INTEGER NOT NULL, 
	mfa_enabled BOOLEAN NOT NULL, 
	mfa_secret VARCHAR(64), 
	department_id VARCHAR(36), 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id)
);

CREATE TABLE audit_logs (
	id VARCHAR(36) NOT NULL, 
	timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	actor_id VARCHAR(36), 
	action VARCHAR(100) NOT NULL, 
	resource_type VARCHAR(50), 
	resource_id VARCHAR(100), 
	result VARCHAR(30) NOT NULL, 
	ip_address VARCHAR(45), 
	user_agent VARCHAR(255), 
	reason VARCHAR(255), 
	details_json TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(actor_id) REFERENCES users (id)
);

CREATE TABLE cases (
	id VARCHAR(36) NOT NULL, 
	case_number VARCHAR(50) NOT NULL, 
	title VARCHAR(200) NOT NULL, 
	case_type VARCHAR(50) NOT NULL, 
	description TEXT, 
	status VARCHAR(50) NOT NULL, 
	confidentiality_level VARCHAR(50) NOT NULL, 
	opening_date TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	closing_date TIMESTAMP WITHOUT TIME ZONE, 
	department_id VARCHAR(36) NOT NULL, 
	assigned_officer_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(department_id) REFERENCES departments (id), 
	FOREIGN KEY(assigned_officer_id) REFERENCES users (id)
);

CREATE TABLE notifications (
	id VARCHAR(36) NOT NULL, 
	recipient_id VARCHAR(36) NOT NULL, 
	title VARCHAR(150) NOT NULL, 
	message TEXT NOT NULL, 
	link VARCHAR(255), 
	category VARCHAR(50) NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(recipient_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE user_roles (
	user_id VARCHAR(36) NOT NULL, 
	role_id VARCHAR(36) NOT NULL, 
	PRIMARY KEY (user_id, role_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE TABLE case_members (
	id VARCHAR(36) NOT NULL, 
	case_id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36) NOT NULL, 
	role_in_case VARCHAR(50) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE documents (
	id VARCHAR(36) NOT NULL, 
	document_number VARCHAR(50) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT, 
	reference_number VARCHAR(100), 
	document_date TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	confidentiality_level VARCHAR(50) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	is_legal_hold BOOLEAN NOT NULL, 
	legal_hold_reason VARCHAR(255), 
	tags VARCHAR(255), 
	case_id VARCHAR(36) NOT NULL, 
	category_id VARCHAR(36) NOT NULL, 
	retention_policy_id VARCHAR(36), 
	uploader_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(category_id) REFERENCES document_categories (id), 
	FOREIGN KEY(retention_policy_id) REFERENCES retention_policies (id), 
	FOREIGN KEY(uploader_id) REFERENCES users (id)
);

CREATE TABLE access_requests (
	id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	requester_id VARCHAR(36) NOT NULL, 
	approver_id VARCHAR(36), 
	reason TEXT NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	decision_reason VARCHAR(255), 
	permission_requested VARCHAR(50) NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(requester_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(approver_id) REFERENCES users (id)
);

CREATE TABLE document_permissions (
	id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	user_id VARCHAR(36), 
	department_id VARCHAR(36), 
	can_view BOOLEAN NOT NULL, 
	can_download BOOLEAN NOT NULL, 
	can_edit_metadata BOOLEAN NOT NULL, 
	can_create_version BOOLEAN NOT NULL, 
	can_share BOOLEAN NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	FOREIGN KEY(department_id) REFERENCES departments (id) ON DELETE CASCADE
);

CREATE TABLE document_shares (
	id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	created_by_id VARCHAR(36) NOT NULL, 
	token_hash VARCHAR(64) NOT NULL, 
	recipient_email VARCHAR(120) NOT NULL, 
	recipient_name VARCHAR(100), 
	access_password_hash VARCHAR(255), 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	max_downloads INTEGER NOT NULL, 
	downloads_count INTEGER NOT NULL, 
	is_revoked BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);

CREATE TABLE document_versions (
	id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	version_number INTEGER NOT NULL, 
	file_name VARCHAR(255) NOT NULL, 
	file_size_bytes INTEGER NOT NULL, 
	mime_type VARCHAR(100) NOT NULL, 
	storage_path VARCHAR(500) NOT NULL, 
	sha256_hash VARCHAR(64) NOT NULL, 
	change_summary TEXT, 
	is_superseded BOOLEAN NOT NULL, 
	created_by_id VARCHAR(36) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);

CREATE TABLE digital_signatures (
	id VARCHAR(36) NOT NULL, 
	version_id VARCHAR(36) NOT NULL, 
	signer_id VARCHAR(36) NOT NULL, 
	algorithm VARCHAR(50) NOT NULL, 
	signature_data TEXT NOT NULL, 
	certificate_fingerprint VARCHAR(100), 
	signer_designation VARCHAR(100), 
	is_verified BOOLEAN NOT NULL, 
	signed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(version_id) REFERENCES document_versions (id) ON DELETE CASCADE, 
	FOREIGN KEY(signer_id) REFERENCES users (id)
);

CREATE TABLE document_reviews (
	id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	version_id VARCHAR(36) NOT NULL, 
	reviewer_id VARCHAR(36) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	comments TEXT, 
	reviewed_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(version_id) REFERENCES document_versions (id) ON DELETE CASCADE, 
	FOREIGN KEY(reviewer_id) REFERENCES users (id)
);

CREATE TABLE integrity_ledger (
	id SERIAL NOT NULL, 
	entry_id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	version_id VARCHAR(36) NOT NULL, 
	document_sha256 VARCHAR(64) NOT NULL, 
	previous_entry_hash VARCHAR(64) NOT NULL, 
	entry_hash VARCHAR(64) NOT NULL, 
	event_type VARCHAR(50) NOT NULL, 
	actor_id VARCHAR(36) NOT NULL, 
	timestamp_canonical VARCHAR(50) NOT NULL, 
	metadata_payload TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (entry_id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(version_id) REFERENCES document_versions (id) ON DELETE CASCADE, 
	FOREIGN KEY(actor_id) REFERENCES users (id)
);

-- Seed departments
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES ('44a2fdc1-8b66-4ac8-b249-2c673a6ae4d0', 'Cyber Crime Investigation Cell', 'CCIC', 'Specialized cyber forensic and crime cell', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES ('5d468320-0159-4c55-9881-89bcbcd96c6d', 'Criminal Investigation Department', 'CID', 'State central investigation agency', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES ('8c3ff7a0-530c-4fe8-8749-ccbf7429e57f', 'Forensic Science Laboratory', 'FSL', 'Government certified digital and ballistics forensics', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES ('b01ae0c2-aae6-4e61-b2e4-e8e525e3325b', 'District & Sessions Court', 'DSC', 'Judicial record and trial chamber', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO departments (id, name, code, description, created_at, updated_at) VALUES ('bdec459d-f40c-43df-b848-dc8f7133b674', 'Directorate of Prosecution', 'DOP', 'Public prosecution and legal review unit', '2026-10-22 13:50:12', '2026-10-22 13:50:12');

-- Seed document_categories
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('a82857e6-220f-41b5-8e04-06b1cdc14bdc', 'FIR and Police Reports', 'FIR_POLICE', 'First Information Reports and station diaries', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('79f4a79e-2ecc-460b-ba6f-30673ca778f8', 'Investigation Records', 'INVESTIGATION', 'Case diaries, search and seizure memos', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('5c60a244-0c1f-414a-b746-bc6dd2986492', 'Witness Statements', 'WITNESS_STMT', 'Recorded statements under Section 161/164 CrPC', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('a38ee7bf-3ef0-452e-bc32-3da3bf5d4356', 'Charge Sheets', 'CHARGE_SHEET', 'Final formal police investigative reports', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('0b7995b3-16b3-4f2b-a018-e5cedda001a7', 'Court Filings', 'COURT_FILING', 'Bail petitions, charge orders, legal appeals', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('22a92edd-ebec-4e42-b42c-cae4c36ce94b', 'Evidence Records', 'EVIDENCE_REC', 'Chain-of-custody memos and physical item records', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('106fde3b-1bbe-4d3c-a380-b3ca75589e8e', 'Forensic Reports', 'FORENSIC_REP', 'Certified forensic digital and laboratory reports', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('19fe314d-0994-4431-933a-ca006ff03159', 'Legal Notices', 'LEGAL_NOTICE', 'Summons, production notices, warrant orders', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('207cc032-f964-4c3e-9a82-891a252d1acf', 'Court Judgments', 'COURT_JUDG', 'Judicial orders, interim rulings, final verdicts', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO document_categories (id, name, code, description, created_at, updated_at) VALUES ('a8d192b1-59e0-4817-98f8-a292ab0d3544', 'Other Authorized Documents', 'OTHER_AUTH', 'Authorized legal and procedural records', '2026-10-22 13:50:12', '2026-10-22 13:50:12');

-- Seed retention_policies
INSERT INTO retention_policies (id, name, retention_years, description, disposal_action, created_at, updated_at) VALUES ('4f740c69-4932-42bb-b3e7-4dd98799940a', 'Permanent Legal Retention', 99, 'Permanent retention for heinous crime and evidence records', 'PERMANENT_RETAIN', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO retention_policies (id, name, retention_years, description, disposal_action, created_at, updated_at) VALUES ('fae99f63-16de-48eb-bd80-6aaf1f68d198', '10-Year Criminal Case Hold', 10, 'Standard 10-year holding period from trial completion', 'ARCHIVE', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO retention_policies (id, name, retention_years, description, disposal_action, created_at, updated_at) VALUES ('ffa70125-506d-4ead-8078-efd93c551b1b', '5-Year Summary Retention', 5, 'Minor procedural notices and summary proceedings', 'REVIEW', '2026-10-22 13:50:12', '2026-10-22 13:50:12');

-- Seed roles
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('88ddbc7e-45f7-4e30-8b53-1a2b272226b4', 'ADMIN', 'System Administrator', 'Full system configuration and governance', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('da4094b5-a004-4802-b812-57b564ccd2dd', 'INVESTIGATING_OFFICER', 'Investigating Officer', 'Lead cases, evidence ingestion, versions, verification', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('70aab94b-26c1-43fc-b1c2-5b463ea74032', 'POLICE_OFFICER', 'Police Officer', 'Upload police reports, FIR submissions, case search', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('3ae58941-46a8-43a2-aaa2-f85f88a80d6d', 'PROSECUTOR', 'Legal Officer / Prosecutor', 'Review dockets, charge sheets, legal filings', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('fb388999-4879-4ce4-b903-ceba6f8208c3', 'COURT_USER', 'Court-Authorized User', 'Court registry, judicial verification, docket access', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('9fcfcdc3-41a2-4c26-89ca-38101acc3db8', 'FORENSIC_EXPERT', 'Forensic Expert', 'Forensic evidence reports, checksum verification', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO roles (id, name, display_name, description, created_at, updated_at) VALUES ('1c41020f-a07c-4937-8dce-2ef2d1fa11e0', 'AUDITOR', 'Authorized Auditor', 'Audit log inspection, chain-of-custody verification', '2026-10-22 13:50:12', '2026-10-22 13:50:12');

-- Seed users
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'admin', 'admin@evilock.gov.in', 'Vikramaditya Rathore (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$tAjLr1Utj0Zr1GBl1uxmug$RGC1HHKywCq/qJF+ATNS5RuvgLDatrPVQQcBXrwYFN4', 'ADM-001', 'Director of IT & Security', TRUE, FALSE, 0, FALSE, NULL, '44a2fdc1-8b66-4ac8-b249-2c673a6ae4d0', '2026-10-22 13:50:12', '2026-10-24 15:35:34');
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('e4017f09-9e98-4362-80b8-6a63c64748c1', 'io_rajesh', 'rajesh.kumar@cid.gov.in', 'Insp. Rajesh Kumar (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$ETFAZs1AVKy4RpxgCia5Jg$Bgb6pcbEoltLle4haxeJSz2MpFhnQ4Gj4UJ8GsR6DZo', 'CID-7892', 'Senior Investigating Officer', TRUE, FALSE, 0, FALSE, NULL, '5d468320-0159-4c55-9881-89bcbcd96c6d', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('64c91cff-4b41-42da-aeb8-31500142629e', 'po_vikram', 'vikram.singh@police.gov.in', 'Sub-Insp. Vikram Singh (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$mRCcq6r1tWDhvuF4Pv1VLQ$+7IuaYgaH8uNgxOGCukY0ujBkTneYUmTOBtxr6ZCVgE', 'POL-4051', 'Station Sub-Inspector', TRUE, FALSE, 0, FALSE, NULL, '44a2fdc1-8b66-4ac8-b249-2c673a6ae4d0', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('c28b2cf0-a90e-4ee4-a6d9-399e925be78c', 'prosecutor_meera', 'meera.sen@prosecution.gov.in', 'Adv. Meera Sen (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$/mN7UrQiveLL5jOEfCiI5w$xBKpSnAOH2kM+9ipwVWUf62IUHBiiE6Dso9lGixSpc4', 'BAR-6124', 'Public Prosecutor', TRUE, FALSE, 0, FALSE, NULL, 'bdec459d-f40c-43df-b848-dc8f7133b674', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('d9e11dd3-b474-4ebc-b5f2-4d5ebb395129', 'judge_sharma', 'k.sharma@judiciary.gov.in', 'Hon. Justice K. P. Sharma (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$pXguNvy6TtHCN3at+WijAQ$mwj7IuIc6IVbxXhxXwyrVRiO05I9CHpvQf9tkbdE8E4', 'JUD-1092', 'Additional District Judge', TRUE, FALSE, 0, FALSE, NULL, 'b01ae0c2-aae6-4e61-b2e4-e8e525e3325b', '2026-10-22 13:50:12', '2026-10-22 13:50:12');
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('7f0cdac8-edee-41f6-a941-87504b678eb6', 'dr_sunita', 'sunita.rao@fsl.gov.in', 'Dr. Sunita Rao (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$4TmlW0OWmRYdG/OmL4fBUA$tLsK63nobyFlVdIV+OM6AztdYKgtT4nRP5hWk44h9Zs', 'FSL-3381', 'Head of Digital Forensics Division', TRUE, FALSE, 0, FALSE, NULL, '8c3ff7a0-530c-4fe8-8749-ccbf7429e57f', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO users (id, username, email, full_name, hashed_password, badge_number, designation, is_active, is_locked, failed_login_attempts, mfa_enabled, mfa_secret, department_id, created_at, updated_at) VALUES ('2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'auditor_verma', 'anand.verma@cag.gov.in', 'Anand Verma (DEMO)', '$argon2id$v=19$m=65536,t=3,p=4$5B8VxUhYzFGmJtElKYMn8w$wmJKeAmWlshsq+mhfyBtTw1hAXwetNCbgQO261BG5Pc', 'AUD-9910', 'Principal Security Auditor', TRUE, FALSE, 0, FALSE, NULL, 'b01ae0c2-aae6-4e61-b2e4-e8e525e3325b', '2026-10-22 13:50:13', '2026-10-22 13:50:13');

-- Seed audit_logs
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('907c09ec-512b-4cf3-bca5-76a4fec9f6d8', '2026-10-22 13:50:13', '64c91cff-4b41-42da-aeb8-31500142629e', 'DOCUMENT_UPLOADED', 'DOCUMENT', '497b047e-dcab-4200-b3b2-53158ba7f00c', 'SUCCESS', NULL, NULL, 'Ingested FIR_204_2026_Certified.pdf (SHA-256: 405b13380aae1cbc..., Ledger Block #1)', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('2f272357-1c96-43f6-b009-7cbde7a4dea9', '2026-10-22 13:50:13', '7f0cdac8-edee-41f6-a941-87504b678eb6', 'DOCUMENT_UPLOADED', 'DOCUMENT', '70e6da43-c86e-4cf5-91d3-630e1bbad5b8', 'SUCCESS', NULL, NULL, 'Ingested Forensic_Memory_Analysis_FSL883.pdf (SHA-256: 4aa89d6a28373c12..., Ledger Block #2)', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('e2306c37-4861-443e-b64d-8368d478cab7', '2026-10-22 13:50:13', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_UPLOADED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'SUCCESS', NULL, NULL, 'Ingested Witness_Affidavit_Chief_Architect.pdf (SHA-256: 0c364516ed81cf20..., Ledger Block #3)', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('fde0d2ca-3ecb-411a-a2c2-450ea5521a39', '2026-10-22 14:04:36', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', '127.0.0.1', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('082bab3e-c8f4-4529-af21-5b304f885195', '2026-10-22 14:04:58', '64c91cff-4b41-42da-aeb8-31500142629e', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', '127.0.0.1', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('ca54f9e4-3605-4e36-9fc0-88105fe78b8d', '2026-10-22 14:06:20', 'c28b2cf0-a90e-4ee4-a6d9-399e925be78c', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', '127.0.0.1', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('46b1135e-8f94-4b5c-bee8-00ec16b36ab6', '2026-10-23 04:54:44', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d672c53f-964e-4d08-b76c-7e82a06a1ce8', '2026-10-23 04:54:45', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('0d2d66e0-ac46-480e-9d6d-abb7f489e6a9', '2026-10-23 04:54:45', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('fe9c3a07-4578-40fe-86ea-b052cbd7127f', '2026-10-23 04:54:45', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('e8fdb976-a23a-4426-ba15-0365f2acf153', '2026-10-23 04:54:45', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_INTEGRITY_VERIFIED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'SUCCESS', 'testclient', NULL, 'INTEGRITY VERIFIED: Document SHA-256 matches cryptographic ledger block #3. Evidence chain is intact.', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "status": "VERIFIED"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('5fb5af40-c519-442e-81c1-cfcf110805a2', '2026-10-23 04:54:45', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('95b10908-4e9d-4133-a74f-641bcd2b4015', '2026-10-23 04:54:45', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('5507bf7c-0deb-4780-954c-fc970527634b', '2026-10-23 04:54:45', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('a15f0207-0b89-4316-a467-4a8a609b1d60', '2026-10-24 15:26:23', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('557289d3-577b-420e-8019-78073a456d4e', '2026-10-24 15:26:23', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('7bbe7247-e302-46c7-aaf3-4d4890acc4e5', '2026-10-24 15:26:23', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('8ea51f43-ca05-4c26-95b0-aecb7a713fb3', '2026-10-24 15:26:23', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('e6727bb9-b8b7-4017-8cb5-12829376c82d', '2026-10-24 15:26:24', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('24648476-75e3-49f8-90b4-b49dfc53723b', '2026-10-24 15:26:24', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('50355e86-b582-4f8f-b7b6-ce0e841bbdc8', '2026-10-24 15:26:24', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('082b346e-c3dd-49f4-8ef4-e5bd3ef5fbc2', '2026-10-24 15:26:24', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2be3f44bfc41d436...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2be3f44bfc41d436a3b59d5809a8deac1d413813a0f94a7d169d665b87baea63", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('b9e9ab5d-05ac-4b0c-94a7-2b0b052c6dc4', '2026-10-24 15:26:38', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('9895d1b6-b2f9-44ed-a6d2-44af888258f2', '2026-10-24 15:26:38', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('aef37daa-2f14-4872-a0a5-af3d88ad3bfd', '2026-10-24 15:26:38', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('b9ffa185-d39d-414d-abff-bd8daa5c8d95', '2026-10-24 15:26:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('9a8a7103-a823-4e09-9dd4-d05b3223b725', '2026-10-24 15:26:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2be3f44bfc41d436...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2be3f44bfc41d436a3b59d5809a8deac1d413813a0f94a7d169d665b87baea63", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('f934dc59-f891-4961-a654-ae015493b6aa', '2026-10-24 15:26:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('5ed9e7df-9e8d-4f03-b08e-df68fdeec353', '2026-10-24 15:26:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('38c2d3e1-39ec-4a33-b702-ea7727f9bffb', '2026-10-24 15:26:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (819704e406b652b0...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "819704e406b652b0c1192e4828b48352a45dd36ccbb94a4e91cc768176761da3", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('7bedb766-1b6a-4536-a8f6-a73c2d6355ed', '2026-10-24 15:27:13', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('6cf3641d-6734-439f-ae77-965048ba32f7', '2026-10-24 15:27:13', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d2be0fb7-c74f-4ef4-8efe-f504bfa26c28', '2026-10-24 15:27:13', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('26f310d1-f6d5-4a38-854b-e34c2fcede7f', '2026-10-24 15:27:14', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('6abadb1c-b35d-438a-ad4f-970333b7040a', '2026-10-24 15:27:14', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (819704e406b652b0...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "819704e406b652b0c1192e4828b48352a45dd36ccbb94a4e91cc768176761da3", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('824d5cd6-81fa-41d3-a5b6-6da59c0ae9f1', '2026-10-24 15:27:14', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('f96a7256-47bf-407a-8b07-f5f837de4941', '2026-10-24 15:27:14', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('1a6cc784-b8a7-411a-addd-4ff40f87956e', '2026-10-24 15:27:14', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (afdde7f2d6dc2f15...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "afdde7f2d6dc2f158f6683d945e46cd54d51e30026ecda1bb96940b5778d64d8", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('35488085-909c-43e2-bbd4-6dd28f813c64', '2026-10-24 15:27:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('42defb55-5e39-4353-9817-4cc05529e7d8', '2026-10-24 15:27:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (afdde7f2d6dc2f15...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "afdde7f2d6dc2f158f6683d945e46cd54d51e30026ecda1bb96940b5778d64d8", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('ffe14440-d201-4c87-9a20-3397017fca82', '2026-10-24 15:28:37', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('dcfffed0-4ac4-4465-be9d-feac0476635a', '2026-10-24 15:28:37', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d8a97fed-8eb6-48a6-a987-09050842c5d2', '2026-10-24 15:28:37', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('9393fd47-ce49-4fa6-ada2-a35606c03b60', '2026-10-24 15:28:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('ef57e672-b24e-4bca-aabf-1801db78950d', '2026-10-24 15:28:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_INTEGRITY_VERIFIED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'SUCCESS', 'testclient', NULL, 'INTEGRITY VERIFIED: Document SHA-256 matches cryptographic ledger block #3. Evidence chain is intact.', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "status": "VERIFIED"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('50646d68-c0a0-4376-a19f-71e9cd222fe6', '2026-10-24 15:28:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('4249e102-3dba-48c7-bbe7-784add30b5a9', '2026-10-24 15:28:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('f1f65954-8365-48ed-b5e0-e08f4ddc1a7c', '2026-10-24 15:28:38', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d6a6624c-b4f5-43bf-bb34-54b4273eb584', '2026-10-24 15:32:05', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d084e35c-d017-45e6-9300-8147e2b0028c', '2026-10-24 15:32:05', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('a66dca68-6fe4-41f9-a5f8-0dc1ac3d2731', '2026-10-24 15:32:05', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('855ec442-b90d-44cc-a2bd-4b1eb65dcb8c', '2026-10-24 15:32:05', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('89e9995b-5722-4b5d-8b67-3ef46e1c8c69', '2026-10-24 15:32:05', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('8c3e4904-7775-4306-9157-907a990b4c4e', '2026-10-24 15:32:05', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('b4b55c7d-4cc2-40e9-9e13-36525d9b5918', '2026-10-24 15:32:05', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('15ac46c2-35ea-47e1-94a2-fd82f26bffab', '2026-10-24 15:32:05', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2be3f44bfc41d436...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2be3f44bfc41d436a3b59d5809a8deac1d413813a0f94a7d169d665b87baea63", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('0815ba41-e886-4269-bca7-5c2ec4f8c317', '2026-10-24 15:32:34', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('82c884ac-d390-4ef8-9a77-8668c0d40e97', '2026-10-24 15:32:34', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('8f1f0f17-1a8d-4819-8c1a-0b580aa7e09c', '2026-10-24 15:32:34', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('e779bdf7-96d9-4414-9c71-763d40519713', '2026-10-24 15:32:35', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d0399aae-af91-4025-af37-6cf6c3c0e894', '2026-10-24 15:32:35', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_INTEGRITY_VERIFIED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'SUCCESS', 'testclient', NULL, 'INTEGRITY VERIFIED: Document SHA-256 matches cryptographic ledger block #3. Evidence chain is intact.', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "status": "VERIFIED"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('6e738789-18f8-424d-8f4e-0661f8e657d6', '2026-10-24 15:32:35', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('f3d1f100-d2d8-4284-b10a-ccc01a20a9b1', '2026-10-24 15:32:35', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('cb5409eb-f047-4427-b683-1a7ce8c09647', '2026-10-24 15:32:35', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('0cf11edc-fdcb-493b-a19d-6b132e589149', '2026-10-24 15:32:45', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('2cb7fb09-9139-4edd-80f5-f00658da3f84', '2026-10-24 15:32:45', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('fc206092-1a20-453b-b52f-0d27bacd2402', '2026-10-24 15:32:45', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('ca4e8c2a-7ef3-4161-bcca-1a5ff65886df', '2026-10-24 15:32:45', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('f47d1cb7-94f8-41e1-9fee-f43b6739d613', '2026-10-24 15:32:46', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_INTEGRITY_VERIFIED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'SUCCESS', 'testclient', NULL, 'INTEGRITY VERIFIED: Document SHA-256 matches cryptographic ledger block #3. Evidence chain is intact.', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "status": "VERIFIED"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('b25342f4-77c3-48da-be83-7d284315ac1f', '2026-10-24 15:32:46', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('6c0caa2f-065c-4a0f-a67d-4d71c6139230', '2026-10-24 15:32:46', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('da820ff6-745c-43f8-a87c-5c909e84ba4d', '2026-10-24 15:32:46', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('49aaa592-a587-4dc2-80fc-4633a09f11f0', '2026-10-24 15:35:34', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_FAILED', NULL, NULL, 'DENIED', 'testclient', NULL, 'Incorrect password', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('e99126c2-1336-45ce-924c-76fc0ae91ea7', '2026-10-24 15:35:34', 'ca0da5eb-b2cb-4cd5-bad4-82b397b18072', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('994ac633-99c4-470b-8f7b-3accd38e116b', '2026-10-24 15:35:34', '2e6bf568-ada2-4d06-a5a4-03911bf448f3', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('3f6762c8-5e94-41ed-a78b-b518daa2ff8b', '2026-10-24 15:35:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('832e4cc6-42a5-40dd-a218-6932509d569d', '2026-10-24 15:35:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_INTEGRITY_VERIFIED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'SUCCESS', 'testclient', NULL, 'INTEGRITY VERIFIED: Document SHA-256 matches cryptographic ledger block #3. Evidence chain is intact.', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "status": "VERIFIED"}');
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('d57a3ce2-bcf2-4af0-9583-3db270910234', '2026-10-24 15:35:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'AUTH_LOGIN_SUCCESS', NULL, NULL, 'SUCCESS', 'testclient', NULL, 'Argon2id authentication succeeded', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('03cd0dff-3e21-4345-b4f3-9cde0fa48794', '2026-10-24 15:35:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DEMO_SIMULATE_TAMPER', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', NULL, NULL, 'Injected test bit-flip into storage file ''Witness_Affidavit_Chief_Architect.pdf'' to demonstrate tamper detection.', NULL);
INSERT INTO audit_logs (id, timestamp, actor_id, action, resource_type, resource_id, result, ip_address, user_agent, reason, details_json) VALUES ('1184e768-f7f2-448b-bfb5-d8ba4644ea9e', '2026-10-24 15:35:34', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'DOCUMENT_TAMPER_DETECTED', 'DOCUMENT', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'ALERT', 'testclient', NULL, 'TAMPER ALERT: Live file SHA-256 (2248068edc464375...) DOES NOT MATCH recorded hash (0c364516ed81cf20...). Document bytes have been altered!', '{"version": 1, "expected_hash": "0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2", "actual_hash": "2248068edc464375fd08169ca55203ab32c227ea02c11b41696faeee65cbe013", "status": "MISMATCH"}');

-- Seed cases
INSERT INTO cases (id, case_number, title, case_type, description, status, confidentiality_level, opening_date, closing_date, department_id, assigned_officer_id, created_at, updated_at) VALUES ('934a2225-5522-4ae8-b614-28d73324b5c7', 'CR-2026-0491', 'State vs. Cyber Heist Syndicate & Data Exfiltration', 'Cybercrime & Evidence Tampering', 'DEMO CASE: Investigation into unauthorized electronic penetration, digital document tampering, and evidence chain manipulation at Apex Financial Systems.', 'UNDER_INVESTIGATION', 'CONFIDENTIAL', '2026-10-22 13:50:13', NULL, '5d468320-0159-4c55-9881-89bcbcd96c6d', 'e4017f09-9e98-4362-80b8-6a63c64748c1', '2026-10-22 13:50:13', '2026-10-22 13:50:13');

-- Seed user_roles
INSERT INTO user_roles (user_id, role_id) VALUES ('ca0da5eb-b2cb-4cd5-bad4-82b397b18072', '88ddbc7e-45f7-4e30-8b53-1a2b272226b4');
INSERT INTO user_roles (user_id, role_id) VALUES ('e4017f09-9e98-4362-80b8-6a63c64748c1', 'da4094b5-a004-4802-b812-57b564ccd2dd');
INSERT INTO user_roles (user_id, role_id) VALUES ('64c91cff-4b41-42da-aeb8-31500142629e', '70aab94b-26c1-43fc-b1c2-5b463ea74032');
INSERT INTO user_roles (user_id, role_id) VALUES ('c28b2cf0-a90e-4ee4-a6d9-399e925be78c', '3ae58941-46a8-43a2-aaa2-f85f88a80d6d');
INSERT INTO user_roles (user_id, role_id) VALUES ('d9e11dd3-b474-4ebc-b5f2-4d5ebb395129', 'fb388999-4879-4ce4-b903-ceba6f8208c3');
INSERT INTO user_roles (user_id, role_id) VALUES ('7f0cdac8-edee-41f6-a941-87504b678eb6', '9fcfcdc3-41a2-4c26-89ca-38101acc3db8');
INSERT INTO user_roles (user_id, role_id) VALUES ('2e6bf568-ada2-4d06-a5a4-03911bf448f3', '1c41020f-a07c-4937-8dce-2ef2d1fa11e0');

-- Seed case_members
INSERT INTO case_members (id, case_id, user_id, role_in_case, created_at, updated_at) VALUES ('121b2794-5373-41b1-9c49-5ec3537491bf', '934a2225-5522-4ae8-b614-28d73324b5c7', 'e4017f09-9e98-4362-80b8-6a63c64748c1', 'LEAD_INVESTIGATOR', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO case_members (id, case_id, user_id, role_in_case, created_at, updated_at) VALUES ('3badb30b-43c9-4e3d-8e1a-6b41846ea91b', '934a2225-5522-4ae8-b614-28d73324b5c7', '64c91cff-4b41-42da-aeb8-31500142629e', 'INVESTIGATOR', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO case_members (id, case_id, user_id, role_in_case, created_at, updated_at) VALUES ('9c84071d-3eec-48fe-8966-693051cc041f', '934a2225-5522-4ae8-b614-28d73324b5c7', '7f0cdac8-edee-41f6-a941-87504b678eb6', 'FORENSIC_ANALYST', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO case_members (id, case_id, user_id, role_in_case, created_at, updated_at) VALUES ('ae06ec82-5c50-40e4-ab58-2ab431998281', '934a2225-5522-4ae8-b614-28d73324b5c7', 'c28b2cf0-a90e-4ee4-a6d9-399e925be78c', 'PROSECUTOR', '2026-10-22 13:50:13', '2026-10-22 13:50:13');

-- Seed documents
INSERT INTO documents (id, document_number, title, description, reference_number, document_date, confidentiality_level, status, is_legal_hold, legal_hold_reason, tags, case_id, category_id, retention_policy_id, uploader_id, created_at, updated_at) VALUES ('497b047e-dcab-4200-b3b2-53158ba7f00c', 'DOC-2026-10491', 'FIR No. 204/2026 - Initial Complaint & Station Diary', 'Initial First Information Report registered under Sections 420, 468, and 66C IT Act.', 'FIR-CC-204', '2026-10-22 13:50:13', 'CONFIDENTIAL', 'ACTIVE', TRUE, 'Court-mandated preservation order under Section 91 CrPC', 'Cyber, Evidence, Tamper-Resistant, Court-Certified', '934a2225-5522-4ae8-b614-28d73324b5c7', 'a82857e6-220f-41b5-8e04-06b1cdc14bdc', 'fae99f63-16de-48eb-bd80-6aaf1f68d198', '64c91cff-4b41-42da-aeb8-31500142629e', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO documents (id, document_number, title, description, reference_number, document_date, confidentiality_level, status, is_legal_hold, legal_hold_reason, tags, case_id, category_id, retention_policy_id, uploader_id, created_at, updated_at) VALUES ('70e6da43-c86e-4cf5-91d3-630e1bbad5b8', 'DOC-2026-10492', 'FSL Digital Memory Dump & Forensic Analysis', 'Forensic memory snapshot and hash integrity report of seized server hard drives.', 'FSL-REP-883', '2026-10-22 13:50:13', 'CONFIDENTIAL', 'ACTIVE', TRUE, 'Court-mandated preservation order under Section 91 CrPC', 'Cyber, Evidence, Tamper-Resistant, Court-Certified', '934a2225-5522-4ae8-b614-28d73324b5c7', '106fde3b-1bbe-4d3c-a380-b3ca75589e8e', 'fae99f63-16de-48eb-bd80-6aaf1f68d198', '7f0cdac8-edee-41f6-a941-87504b678eb6', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO documents (id, document_number, title, description, reference_number, document_date, confidentiality_level, status, is_legal_hold, legal_hold_reason, tags, case_id, category_id, retention_policy_id, uploader_id, created_at, updated_at) VALUES ('b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 'DOC-2026-10493', 'Witness Statement - Chief Security Architect', 'Deposition and signed affidavit describing unauthorized privileged credential escalation.', 'WIT-AFF-012', '2026-10-22 13:50:13', 'CONFIDENTIAL', 'ACTIVE', FALSE, NULL, 'Cyber, Evidence, Tamper-Resistant, Court-Certified', '934a2225-5522-4ae8-b614-28d73324b5c7', '5c60a244-0c1f-414a-b746-bc6dd2986492', 'fae99f63-16de-48eb-bd80-6aaf1f68d198', 'e4017f09-9e98-4362-80b8-6a63c64748c1', '2026-10-22 13:50:13', '2026-10-22 13:50:13');

-- Seed document_versions
INSERT INTO document_versions (id, document_id, version_number, file_name, file_size_bytes, mime_type, storage_path, sha256_hash, change_summary, is_superseded, created_by_id, created_at, updated_at) VALUES ('ffb9b0bd-55b5-4220-b471-fcdf2a835e31', '497b047e-dcab-4200-b3b2-53158ba7f00c', 1, 'FIR_204_2026_Certified.pdf', 242, 'application/pdf', 'd:\evilock\storage\vault\DOC-2026-10491.dat', '405b13380aae1cbc4531215a0beef2981dd630e2fcc4928ac3b0a6179547402f', 'Original ingested evidence record registered into cryptographic vault', FALSE, '64c91cff-4b41-42da-aeb8-31500142629e', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO document_versions (id, document_id, version_number, file_name, file_size_bytes, mime_type, storage_path, sha256_hash, change_summary, is_superseded, created_by_id, created_at, updated_at) VALUES ('2617856c-114f-4620-8801-c1a8b73b7ffa', '70e6da43-c86e-4cf5-91d3-630e1bbad5b8', 1, 'Forensic_Memory_Analysis_FSL883.pdf', 320, 'application/pdf', 'd:\evilock\storage\vault\DOC-2026-10492.dat', '4aa89d6a28373c121416d52f6413cb6dd328935205325da415711e056310e9fa', 'Original ingested evidence record registered into cryptographic vault', FALSE, '7f0cdac8-edee-41f6-a941-87504b678eb6', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO document_versions (id, document_id, version_number, file_name, file_size_bytes, mime_type, storage_path, sha256_hash, change_summary, is_superseded, created_by_id, created_at, updated_at) VALUES ('58ae4bd2-eb69-4df5-a669-9d8994d84a6e', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', 1, 'Witness_Affidavit_Chief_Architect.pdf', 261, 'application/pdf', 'd:\evilock\storage\vault\DOC-2026-10493.dat', '0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2', 'Original ingested evidence record registered into cryptographic vault', FALSE, 'e4017f09-9e98-4362-80b8-6a63c64748c1', '2026-10-22 13:50:13', '2026-10-22 13:50:13');

-- Seed integrity_ledger
INSERT INTO integrity_ledger (id, entry_id, document_id, version_id, document_sha256, previous_entry_hash, entry_hash, event_type, actor_id, timestamp_canonical, metadata_payload, created_at, updated_at) VALUES (1, 'd98d1d8b-7483-4c57-b986-82a6e606e388', '497b047e-dcab-4200-b3b2-53158ba7f00c', 'ffb9b0bd-55b5-4220-b471-fcdf2a835e31', '405b13380aae1cbc4531215a0beef2981dd630e2fcc4928ac3b0a6179547402f', '0000000000000000000000000000000000000000000000000000000000000000', '86b0b7eaadb29d9489454483454183e6aeef63e0bb44c75bde562a56afb7dfcf', 'INITIAL_UPLOAD', '64c91cff-4b41-42da-aeb8-31500142629e', '2026-10-22T13:50:13Z', 'Title: FIR No. 204/2026 - Initial Complaint & Station Diary | Ref: FIR-CC-204', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO integrity_ledger (id, entry_id, document_id, version_id, document_sha256, previous_entry_hash, entry_hash, event_type, actor_id, timestamp_canonical, metadata_payload, created_at, updated_at) VALUES (2, 'c93d53b0-1c0a-40a8-84c6-d0b5c49ea062', '70e6da43-c86e-4cf5-91d3-630e1bbad5b8', '2617856c-114f-4620-8801-c1a8b73b7ffa', '4aa89d6a28373c121416d52f6413cb6dd328935205325da415711e056310e9fa', '86b0b7eaadb29d9489454483454183e6aeef63e0bb44c75bde562a56afb7dfcf', '3e812229d7469c84c155d88b656eb0fcdbb6be68c662790224915ed1ce914227', 'INITIAL_UPLOAD', '7f0cdac8-edee-41f6-a941-87504b678eb6', '2026-10-22T13:50:13Z', 'Title: FSL Digital Memory Dump & Forensic Analysis | Ref: FSL-REP-883', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
INSERT INTO integrity_ledger (id, entry_id, document_id, version_id, document_sha256, previous_entry_hash, entry_hash, event_type, actor_id, timestamp_canonical, metadata_payload, created_at, updated_at) VALUES (3, 'fc40531f-0527-4668-8da5-61f3137cd5c3', 'b375e6e8-3f48-4c94-be2e-5f13ad736a9f', '58ae4bd2-eb69-4df5-a669-9d8994d84a6e', '0c364516ed81cf203700ad6541963842c16dd9048acd1a69d0daa7529bf7dbb2', '3e812229d7469c84c155d88b656eb0fcdbb6be68c662790224915ed1ce914227', '5e53826850d76f8df2f989806714929ea5fa83d4facff9ab622f9b0fe25dd5ea', 'INITIAL_UPLOAD', 'e4017f09-9e98-4362-80b8-6a63c64748c1', '2026-10-22T13:50:13Z', 'Title: Witness Statement - Chief Security Architect | Ref: WIT-AFF-012', '2026-10-22 13:50:13', '2026-10-22 13:50:13');
