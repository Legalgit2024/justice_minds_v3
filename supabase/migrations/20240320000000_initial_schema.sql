ok -- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Email metadata table
CREATE TABLE IF NOT EXISTS public.email_metadata (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email_id TEXT NOT NULL,
    thread_id TEXT,
    subject TEXT,
    from_address TEXT,
    to_address TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    labels TEXT[],
    has_attachments BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, email_id)
);

-- Shared emails table
CREATE TABLE IF NOT EXISTS public.shared_emails (
    share_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email_id TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(share_id)
);

-- Access logs table
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_metadata_user_id ON public.email_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_email_metadata_email_id ON public.email_metadata(email_id);
CREATE INDEX IF NOT EXISTS idx_shared_emails_created_by ON public.shared_emails(created_by);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON public.access_logs(resource_type, resource_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_metadata_updated_at
    BEFORE UPDATE ON public.email_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- User Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Email metadata policies
CREATE POLICY "Users can view their own emails"
    ON public.email_metadata FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own emails"
    ON public.email_metadata FOR ALL
    USING (auth.uid() = user_id);

-- Shared emails policies
CREATE POLICY "Users can view their shared emails"
    ON public.shared_emails FOR SELECT
    USING (auth.uid() = created_by OR is_active = true);

CREATE POLICY "Users can manage their own shares"
    ON public.shared_emails FOR ALL
    USING (auth.uid() = created_by);

-- Access logs policies
CREATE POLICY "Users can view their own access logs"
    ON public.access_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create access logs"
    ON public.access_logs FOR INSERT
    WITH CHECK (true);
