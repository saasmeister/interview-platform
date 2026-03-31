-- ==============================================
-- Interview Platform: Documenten & Uploads Setup
-- Voer dit uit in de Supabase SQL Editor
-- ==============================================

-- 1. Document type toevoegen aan interviews
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS document_type TEXT;

-- 2. Documents tabel
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  source_assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, type)
);

-- 3. Document suggestions tabel
CREATE TABLE IF NOT EXISTS document_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  suggested_content TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('interview', 'upload')),
  source_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Uploads tabel
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_document_suggestions_document_id ON document_suggestions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_suggestions_status ON document_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_uploads_client_id ON uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_uploads_document_type ON uploads(document_type);

-- 6. RLS inschakelen
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies voor documents
CREATE POLICY "Admins full access documents" ON documents
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own documents" ON documents
  FOR SELECT USING (auth.uid() = client_id);

-- 8. RLS Policies voor document_suggestions
CREATE POLICY "Admins full access suggestions" ON document_suggestions
  FOR ALL USING (is_admin());

CREATE POLICY "Clients view own suggestions" ON document_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_suggestions.document_id
      AND documents.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients update own suggestions" ON document_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_suggestions.document_id
      AND documents.client_id = auth.uid()
    )
  );

-- 9. RLS Policies voor uploads
CREATE POLICY "Admins full access uploads" ON uploads
  FOR ALL USING (is_admin());

CREATE POLICY "Clients full access own uploads" ON uploads
  FOR ALL USING (auth.uid() = client_id);

-- 10. Supabase Storage bucket (voer dit apart uit of maak handmatig aan)
-- Ga naar Storage in Supabase Dashboard > New Bucket > naam: "client-uploads" > Public: uit
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-uploads', 'client-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Clients upload own files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'client-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Clients view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'client-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins full access storage" ON storage.objects
  FOR ALL USING (
    bucket_id = 'client-uploads'
    AND is_admin()
  );
