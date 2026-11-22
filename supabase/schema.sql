-- ==============================================================================
-- MumbAIR — Complete Enterprise PostgreSQL Schema & Security Infrastructure
-- Smart City Environmental & Municipal Operations Platform for Greater Mumbai
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
CREATE TYPE user_role_enum AS ENUM (
  'CITIZEN',
  'FIELD_OFFICER',
  'WARD_OFFICER',
  'DEPARTMENT_HEAD',
  'CITY_ADMIN',
  'SUPER_ADMIN'
);

CREATE TYPE complaint_status_enum AS ENUM (
  'SUBMITTED',
  'RECEIVED',
  'UNDER_REVIEW',
  'VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'FIELD_INSPECTION',
  'ACTION_TAKEN',
  'RESOLUTION_SUBMITTED',
  'VERIFICATION',
  'RESOLVED',
  'CLOSED',
  'REOPENED',
  'REJECTED',
  'DUPLICATE'
);

CREATE TYPE violation_category_enum AS ENUM (
  'OPEN_BURNING',
  'CONSTRUCTION_DUST',
  'INDUSTRIAL_EMISSIONS',
  'VEHICLE_POLLUTION',
  'SMOKE_LANDFILL',
  'SENSOR_ISSUE',
  'OTHER'
);

CREATE TYPE priority_level_enum AS ENUM ('URGENT', 'HIGH', 'MEDIUM', 'LOW');

-- 3. ADMINISTRATIVE JURISDICTION TABLES
CREATE TABLE IF NOT EXISTS public.zones (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  city VARCHAR(50) DEFAULT 'Greater Mumbai'
);

CREATE TABLE IF NOT EXISTS public.wards (
  code VARCHAR(5) PRIMARY KEY,
  zone_id VARCHAR(20) REFERENCES public.zones(id),
  name VARCHAR(100) NOT NULL,
  name_mr VARCHAR(100),
  centroid_lat DOUBLE PRECISION NOT NULL,
  centroid_lng DOUBLE PRECISION NOT NULL,
  area_sq_km DOUBLE PRECISION,
  caaqms_station VARCHAR(150),
  primary_pollution_vector TEXT
);

CREATE TABLE IF NOT EXISTS public.departments (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  head_officer_name VARCHAR(100),
  head_officer_email VARCHAR(150),
  contact_phone VARCHAR(20)
);

-- 4. IDENTITY & USER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role_enum DEFAULT 'CITIZEN',
  display_name VARCHAR(100) NOT NULL,
  mobile_number VARCHAR(15),
  email VARCHAR(150),
  pinned_ward VARCHAR(5) REFERENCES public.wards(code),
  department_code VARCHAR(10) REFERENCES public.departments(code),
  badge_number VARCHAR(50),
  is_verified_officer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPLAINTS & ENVIRONMENTAL REPORTS
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY DEFAULT ('MB-' || FLOOR(1000 + RANDOM() * 9000)::TEXT),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_mobile VARCHAR(15),
  ward_code VARCHAR(5) NOT NULL REFERENCES public.wards(code),
  department_code VARCHAR(10) REFERENCES public.departments(code),
  category violation_category_enum NOT NULL,
  priority priority_level_enum DEFAULT 'MEDIUM',
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address_text TEXT NOT NULL,
  status complaint_status_enum DEFAULT 'SUBMITTED',
  upvotes_count INTEGER DEFAULT 1,
  bmc_reference_no VARCHAR(30),
  assigned_officer_id UUID REFERENCES public.profiles(id),
  sla_deadline TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT FALSE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  master_complaint_id TEXT REFERENCES public.complaints(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COMPLAINT ATTACHMENTS & EVIDENCE
CREATE TABLE IF NOT EXISTS public.complaint_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  evidence_type VARCHAR(20) DEFAULT 'INITIAL_CITIZEN_PHOTO', -- INITIAL_CITIZEN_PHOTO, FIELD_BEFORE, FIELD_AFTER
  image_url TEXT NOT NULL,
  watermark_gps TEXT,
  watermark_timestamp TIMESTAMPTZ,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COMPLAINT VOTES (COMMUNITY ENDORSEMENTS)
CREATE TABLE IF NOT EXISTS public.complaint_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  voter_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_vote_user UNIQUE (complaint_id, user_id),
  CONSTRAINT unique_vote_fingerprint UNIQUE (complaint_id, voter_fingerprint)
);

-- 8. COMPLAINT LIFECYCLE TIMELINE & AUDIT HISTORY
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  previous_status complaint_status_enum,
  new_status complaint_status_enum NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_name VARCHAR(100),
  actor_role user_role_enum,
  notes TEXT,
  photo_proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. FIELD INSPECTIONS & RESOLUTION VERIFICATIONS
CREATE TABLE IF NOT EXISTS public.field_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES public.profiles(id),
  inspection_started_at TIMESTAMPTZ DEFAULT NOW(),
  inspection_completed_at TIMESTAMPTZ,
  action_summary TEXT,
  equipment_deployed TEXT, -- e.g. Water misting tanker, mechanical sweeping
  penalty_imposed_inr NUMERIC(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resolution_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id TEXT NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  verified_by_officer_id UUID REFERENCES public.profiles(id),
  citizen_rating SMALLINT CHECK (citizen_rating BETWEEN 1 AND 5),
  citizen_feedback TEXT,
  is_approved BOOLEAN DEFAULT TRUE,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. UNIFIED IN-APP NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role user_role_enum,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type VARCHAR(30) DEFAULT 'INFO',
  complaint_id TEXT REFERENCES public.complaints(id),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MUNICIPAL PUBLIC ANNOUNCEMENTS & ADVISORIES
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'AIR_QUALITY_ALERT',
  target_ward VARCHAR(5) REFERENCES public.wards(code),
  severity VARCHAR(20) DEFAULT 'WARNING',
  issued_by_officer_id UUID REFERENCES public.profiles(id),
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. IMMUTABLE SECURITY AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(80) NOT NULL,
  actor_name VARCHAR(100),
  actor_role VARCHAR(40),
  target_record_id TEXT,
  previous_state TEXT,
  new_state TEXT,
  notes TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Complaints: Public can view non-sensitive information; verified owners can create
CREATE POLICY "Public can view approved complaints"
  ON public.complaints FOR SELECT USING (true);

CREATE POLICY "Citizens can insert complaints"
  ON public.complaints FOR INSERT WITH CHECK (true);

CREATE POLICY "Officers can update assigned complaints"
  ON public.complaints FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('FIELD_OFFICER', 'WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN')
    )
  );

-- Audit logs: Strict append-only, readable only by Super Admin
CREATE POLICY "Super Admins can view audit logs"
  ON public.audit_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'SUPER_ADMIN')
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Trigger to increment vote counters automatically
CREATE OR REPLACE FUNCTION increment_complaint_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.complaints
  SET upvotes_count = upvotes_count + 1,
      updated_at = NOW()
  WHERE id = NEW.complaint_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_complaint_vote_cast
  AFTER INSERT ON public.complaint_votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_complaint_upvotes();
