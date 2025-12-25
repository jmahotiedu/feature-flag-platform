CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS segments (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS flags (
  tenant_id TEXT NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL,
  variants JSONB NOT NULL,
  fallthrough_variant TEXT NOT NULL,
  rules JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS flag_versions (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  flag_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  actor TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  diff JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
