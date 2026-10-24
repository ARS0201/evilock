-- =========================================================
-- EviLock PostgreSQL / Supabase Production Schema DDL
-- Auto-generated for direct execution in Supabase SQL Editor
-- =========================================================

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
