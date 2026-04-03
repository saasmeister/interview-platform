-- ============================================
-- Invitation System - Database Migration
-- Voer dit uit in de Supabase SQL Editor
-- ============================================

-- Voeg invitation_token kolom toe aan profiles
ALTER TABLE profiles ADD COLUMN invitation_token TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN invitation_used BOOLEAN DEFAULT FALSE;

-- Index voor snelle token lookups
CREATE INDEX idx_profiles_invitation_token ON profiles(invitation_token);
