-- ==============================================================================
-- STORY ENGINE - CONSOLIDATED SUPABASE SCHEMA
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Profiles (extending auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Story',
  description TEXT,
  genre TEXT,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Raw Narrations
CREATE TABLE IF NOT EXISTS public.raw_narrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  sequence_number INTEGER NOT NULL,
  emotion_detected TEXT,
  listener_response TEXT,
  extracted JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, sequence_number)
);

-- 4. Narrative Elements (Characters, Locations, Organizations, Relics)
CREATE TABLE IF NOT EXISTS public.narrative_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  element_type TEXT NOT NULL, 
  name TEXT NOT NULL,
  attributes JSONB DEFAULT '{}'::jsonb,
  first_mentioned_in_narration UUID REFERENCES public.raw_narrations(id) ON DELETE SET NULL,
  last_mentioned_in_narration UUID REFERENCES public.raw_narrations(id) ON DELETE SET NULL,
  user_confirmed BOOLEAN DEFAULT FALSE,
  confidence_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Story Moments (Timeline)
CREATE TABLE IF NOT EXISTS public.story_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  timeline_position FLOAT NOT NULL CHECK (timeline_position BETWEEN 0.0 AND 1.0),
  created_from_narration UUID REFERENCES public.raw_narrations(id) ON DELETE SET NULL,
  characters_involved UUID[] DEFAULT '{}',
  location_id UUID REFERENCES public.narrative_elements(id) ON DELETE SET NULL,
  emotional_signature JSONB DEFAULT '{}'::jsonb,
  narrative_weight INTEGER DEFAULT 5,
  is_major_turning_point BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Narrative Connections (Character & World Relationships)
CREATE TABLE IF NOT EXISTS public.narrative_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  from_id UUID REFERENCES public.narrative_elements(id) ON DELETE CASCADE NOT NULL,
  to_id UUID REFERENCES public.narrative_elements(id) ON DELETE CASCADE NOT NULL,
  connection_type TEXT NOT NULL,
  description TEXT,
  weight INTEGER DEFAULT 5,
  emotional_charge INTEGER DEFAULT 0,
  created_from_narration UUID REFERENCES public.raw_narrations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Entity Mentions (Entity Journey Tracking)
CREATE TABLE IF NOT EXISTS public.entity_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  element_id UUID REFERENCES public.narrative_elements(id) ON DELETE CASCADE NOT NULL,
  narration_id UUID REFERENCES public.raw_narrations(id) ON DELETE CASCADE NOT NULL,
  mention_context TEXT,
  emotional_state JSONB DEFAULT '{}'::jsonb,
  importance_in_narration INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Suggestions (Pending User Confirmation)
CREATE TABLE IF NOT EXISTS public.ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  narration_id UUID REFERENCES public.raw_narrations(id) ON DELETE CASCADE NOT NULL,
  suggestion_type TEXT NOT NULL, -- 'element', 'moment', 'connection'
  suggested_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  user_feedback TEXT,
  confirmed_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. XP Ledger (Gamification)
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_entity_mentions_element_id ON public.entity_mentions(element_id);
CREATE INDEX IF NOT EXISTS idx_entity_mentions_narration_id ON public.entity_mentions(narration_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_pending ON public.ai_suggestions(story_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_confirmed_item ON public.ai_suggestions(confirmed_item_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_narrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own profile') THEN
        CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own stories') THEN
        CREATE POLICY "Users can manage own stories" ON public.stories FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage narrations in own stories') THEN
        CREATE POLICY "Users can manage narrations in own stories" ON public.raw_narrations FOR ALL USING (
          EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage elements in own stories') THEN
        CREATE POLICY "Users can manage elements in own stories" ON public.narrative_elements FOR ALL USING (
          EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage moments in own stories') THEN
        CREATE POLICY "Users can manage moments in own stories" ON public.story_moments FOR ALL USING (
          EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage connections in own stories') THEN
        CREATE POLICY "Users can manage connections in own stories" ON public.narrative_connections FOR ALL USING (
          EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage entity mentions in own stories') THEN
        CREATE POLICY "Users can manage entity mentions in own stories" ON public.entity_mentions FOR ALL USING (
          EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage suggestions in own stories') THEN
        CREATE POLICY "Users can manage suggestions in own stories" ON public.ai_suggestions FOR ALL USING (
          EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own xp') THEN
        CREATE POLICY "Users can manage own xp" ON public.xp_ledger FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Trigger: Automatically populate public.profiles when an auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, xp, level)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    0,
    1
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
