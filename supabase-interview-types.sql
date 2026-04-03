-- Voeg interview_type kolom toe aan interviews tabel
-- 'profile' = gericht op ICP/aanbod/positionering/tone_of_voice
-- 'content' = wekelijkse content interviews
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interview_type text DEFAULT 'profile' CHECK (interview_type IN ('profile', 'content'));

-- Voeg een topic kolom toe voor content interviews (vrij onderwerp)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS topic text;

-- Voeg een output_content kolom toe aan assignments voor de AI-output van content interviews
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS output_content text;
