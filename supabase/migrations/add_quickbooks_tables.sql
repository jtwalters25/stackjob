-- QuickBooks Integration Tables

-- Table to store QuickBooks OAuth connections
CREATE TABLE IF NOT EXISTS quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  connected_at TIMESTAMP DEFAULT now(),
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

-- Table to track sync jobs
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'invoice', 'customer', 'payment'
  direction TEXT NOT NULL, -- 'to_qb', 'from_qb'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  qb_id TEXT, -- QuickBooks entity ID
  error_message TEXT,
  retry_count INT DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table to store detailed sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- 'info', 'warn', 'error'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qb_connections_user ON quickbooks_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_user ON sync_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_job_id ON sync_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_sync_job ON sync_logs(sync_job_id);

-- Row Level Security (RLS)
ALTER TABLE quickbooks_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own QuickBooks connections"
  ON quickbooks_connections
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sync jobs"
  ON sync_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sync logs"
  ON sync_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sync_jobs
      WHERE sync_jobs.id = sync_logs.sync_job_id
      AND sync_jobs.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quickbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_quickbooks_connections_updated_at
  BEFORE UPDATE ON quickbooks_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_quickbooks_updated_at();

CREATE TRIGGER update_sync_jobs_updated_at
  BEFORE UPDATE ON sync_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_quickbooks_updated_at();
