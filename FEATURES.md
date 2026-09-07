# Story Engine — Product Feature Inventory

> **Document Purpose**: This document is an authoritative, code-verified product feature inventory of Story Engine. It reflects strictly what is supported by the current codebase (frontend, backend, database schema, and AI service layers). It is not a roadmap, aspirational wish list, or technical architecture specification.
>
> **Core System Principle**: Story Engine is an emergent narrative understanding system, not an AI ghostwriter. The author's voice is sovereign. The foundational loop is:
> $$\text{Author Narration (Sacred Raw Input)} \longrightarrow \text{AI Perception (Draft Suggestions)} \longrightarrow \text{Author Confirmation / Correction} \longrightarrow \text{Structured Narrative Truth}$$

---

## Table of Contents
1. [Authentication & User Management](#1-authentication--user-management)
2. [Story Management](#2-story-management)
3. [Narration / Sacred Raw Input](#3-narration--sacred-raw-input)
4. [AI Understanding & Extraction](#4-ai-understanding--extraction)
5. [World Bible](#5-world-bible)
6. [Entities / Entity Resolution](#6-entities--entity-resolution)
7. [Relationships / Nexus](#7-relationships--nexus)
8. [Timeline / Events / Narrative Flow](#8-timeline--events--narrative-flow)
9. [Trust & Confirmation](#9-trust--confirmation)
10. [Character Journey / Emotional Arc](#10-character-journey--emotional-arc)
11. [AI Character Interaction / Simulation](#11-ai-character-interaction--simulation)
12. [Story Identity](#12-story-identity)
13. [Gamification](#13-gamification)
14. [Search / Navigation](#14-search--navigation)
15. [Export](#15-export)
16. [Visual / Cinematic Features](#16-visual--cinematic-features)
17. [Correction / Rewind](#17-correction--rewind)
18. [Categorized Status Rollup](#18-categorized-status-rollup)
    - [Implemented](#implemented)
    - [Partial](#partial)
    - [UI-Only](#ui-only)
    - [Planned / Missing](#planned--missing)
19. [Documentation Drift](#19-documentation-drift)

---

## 1. Authentication & User Management

### Email & Password Sign Up
- **What the user can do**: Create a new account with email, password, and author display name. An automatic database trigger provisions their author profile.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/auth/SignupPage.tsx`
  - Backend / DB: Supabase Auth client (`supabase.auth.signUp`), database trigger `handle_new_user()` in `supabase/schema.sql` (populates `public.profiles` with `display_name`, `xp = 0`, `level = 1`).
- **Limitations & Assumptions**: Requires a live Supabase connection with SMTP configured if email verification is enabled.

### Email & Password Sign In
- **What the user can do**: Sign in securely to access their stories, dashboard, and author profile.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/auth/LoginPage.tsx`
  - Backend / DB: `supabase.auth.signInWithPassword`.

### Session Sign Out
- **What the user can do**: Log out of their active session from the user profile screen.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/auth/ProfilePage.tsx` (`supabase.auth.signOut()`).

### Author Profile & Biography Management
- **What the user can do**: View their account email, registration date, lifetime XP, level progress bar, and edit their public author display name and bio.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/auth/ProfilePage.tsx`
  - Database: `public.profiles` table (`display_name`, `bio`, `xp`, `level`).

### Author Badges & Achievements
- **What the user can do**: View milestone badges (e.g., "Master of Words", "Nexus Weaver", "World Anchor") based on author statistics.
- **Current status**: `Partial`
- **Where it exists**:
  - Frontend: `frontend/src/features/auth/ProfilePage.tsx`
- **Limitations & Assumptions**: Badges are computed dynamically on the frontend based on simple story count and level thresholds. There is no dedicated `achievements` or `badges` database table, notification system, or historical unlock event listener.

---

## 2. Story Management

### Create New Story
- **What the user can do**: Click "New Story" on the dashboard to initialize a new narrative universe, auto-named "A New Narrative" or "Untitled Story", and immediately enter the story session workspace.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/stories/Dashboard.tsx`
  - Backend: `StoriesController.createStory` (`POST /api/stories`), `StoriesService.createStory`
  - Database: `public.stories` table (`id`, `user_id`, `title`, `created_at`).

### List User Stories
- **What the user can do**: View all personal stories displayed as rich visual cards on the dashboard, showing title, world premise, creation date, and last modified time.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/stories/Dashboard.tsx`
  - Backend: `StoriesController.getUserStories` (`GET /api/stories`), `StoriesService.getUserStories`
  - Database: `public.stories` table.

### Fetch Single Story Workspace
- **What the user can do**: Open any story card to load the active story session with narration feed, timeline sidebar, and tabbed tools.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/narration/StorySession.tsx`
  - Backend: `StoriesController.getStory` (`GET /api/stories/:id`), `StoriesService.getStoryById`.

### Story Metadata & Premise Update
- **What the user can do**: Open the "Story Identity" modal to edit the narrative title and overarching world premise.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `StoryEditModal` in `frontend/src/features/narration/StorySession.tsx`
  - Backend: `StoriesController.updateStory` (`PATCH /api/stories/:id`), `StoriesService.updateStory`
  - Database: `public.stories` table (`title`, `description`, `genre`).

### Delete Story with Cascading Cleanup
- **What the user can do**: Click the trash icon on a dashboard story card, review a confirmation modal, and permanently remove the story and all associated world data.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/stories/Dashboard.tsx`
  - Backend: `StoriesController.deleteStory` (`DELETE /api/stories/:id`), `StoriesService.deleteStory`
  - Database: Sequentially deletes child records in `narrative_connections`, `entity_mentions`, `narrative_elements`, `story_moments`, `ai_suggestions`, and `raw_narrations` before removing the parent `stories` row to maintain referential integrity.

---

## 3. Narration / Sacred Raw Input

### Immutable Raw Narration Ingestion
- **What the user can do**: Type unconstrained narrative prose into the main composer and submit. The raw text is preserved immutably and stamped with an incrementing sequence number.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/narration/StorySession.tsx`
  - Backend: `NarrationsController.addNarration` (`POST /api/stories/:id/narrations`), `NarrationsService.addNarration`
  - Database: `public.raw_narrations` table (`story_id`, `content`, `sequence_number`, `listener_response`, `extracted`, `created_at`).
- **Limitations & Assumptions**: Raw narration content cannot be edited or tampered with after submission, upholding the core "Sacred Input" tenet.

### Chronological Narration Feed & Sequence Playback
- **What the user can do**: Scroll through the chronological history of all submitted narrations, marked by sequence stamps (`SEQ // 001`, `SEQ // 002`) and paired with the AI listener's empathetic responses and detected entity badges.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/narration/StorySession.tsx` (Narration Tab)
  - Backend: `NarrationsController.getNarrations` (`GET /api/stories/:id/narrations`), `NarrationsService.getNarrations`
  - Database: `public.raw_narrations` ordered by `sequence_number ASC`.

### Cold-Start Story Interview (Onboarding Flow)
- **What the user can do**: When opening an empty story with 0 narrations, the user is guided through an interactive 4-step interview ("Let's meet your main character", "What's their biggest problem?", "Where does this take place?", "What's the spark that changes everything today?"). Submitting the interview converts the responses into the first sequential narrations.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/narration/StoryInterview.tsx`, triggered in `StorySession.tsx` when `narrations.length === 0`
  - Backend: Submits sequentially through `NarrationsService.addNarration`.

### Voice / Audio Narration Input
- **What the user can do**: Dictate or speak narrations through microphone capture.
- **Current status**: `Planned / Missing`
- **Where it exists**: None. No audio recording components, Web Audio API hooks, or speech-to-text endpoints exist in the codebase.

---

## 4. AI Understanding & Extraction

### Empathetic Listener Response
- **What the user can do**: Receive immediate, non-intrusive feedback from the AI following every narration (e.g., acknowledging character conflict or atmosphere), without the AI presuming to write or rewrite the prose.
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `AiService.analyzeNarration`, `NarrationsService.addNarration`
  - Frontend: Rendered in `StorySession.tsx` alongside each narration card.

### Multi-Category Narrative Extraction
- **What the user can do**: The system automatically identifies and extracts narrative components from raw prose:
  - Characters (name, traits, role, mention phrase, confidence)
  - Locations (name, sensory attributes, confidence)
  - Organizations / Factions (name, philosophy, structure)
  - Story Moments / Events (title, description, timeline position, narrative weight, characters involved)
  - Relationships / Connections (source entity, target entity, relationship type, dynamic description)
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `backend/src/ai/ai.service.ts` using Gemini 2.0 Flash (`gemini-2.0-flash`) with structured Zod schemas (`NarrationAnalysisSchema`).
  - Fallback: `AiService.generateHeuristicAnalysis` uses regex capitalization and keyword pattern matching when Gemini API keys are not supplied.

### Staging Extractions as Pending Suggestions
- **What the user can do**: The AI never injects extracted facts directly into canon. Instead, all extracted entities, moments, and connections are staged in an approval queue.
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `NarrationsService.createSuggestions` inserts items into `public.ai_suggestions` with status `'pending'`.
  - Database: `public.ai_suggestions` table (`story_id`, `narration_id`, `suggestion_type`, `suggested_data`, `status = 'pending'`).

---

## 5. World Bible

### World Bible Catalog & Card Directory
- **What the user can do**: Browse all established narrative entities in a searchable catalog, organized by classification tabs (Characters, Locations, Organizations, Concepts, Events, Relics/Artifacts).
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/entities/EntityDossier.tsx` (World Bible view)
  - Backend: `StoriesController.getStoryElements` (`GET /api/stories/:id/elements`)
  - Database: `public.narrative_elements` table.

### Active Entities Quick Sidebar
- **What the user can do**: Switch to the "Active Entities" tab in the session workspace to view a compact grouped list of active characters, locations, and factions with canon status indicators.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/entities/EntityList.tsx`
  - Backend: `GET /api/stories/:id/elements`.

### Deep Entity Dossier View
- **What the user can do**: Select any entity to open a detailed dossier containing:
  - Canonical name and classification
  - Visual concept portrait / art
  - Narrative lore and description
  - Essence traits and tags
  - Emotional life arc visualization (for characters)
  - Full narration mention chronology
  - Direct relationship links
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `EntityDossier.tsx` (selected entity mode).

### Manual Entity Creation
- **What the user can do**: Click "New World Fact" to manually create a character, location, faction, concept, or artifact with custom traits, description, visual URL, and canon/draft status without having to narrate it first.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `CreateEntityModal` in `frontend/src/features/entities/EntityDossier.tsx`
  - Backend: `StoriesController.createElement` (`POST /api/stories/:id/elements`), `StoriesService.createStoryElement`
  - Database: `public.narrative_elements` table.

### Manual Entity Editing
- **What the user can do**: Edit an entity's name, description, traits, and visual URL directly inside the dossier.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `EntityDossier.tsx` (`handleSave`)
  - Backend: `StoriesController.updateElement` (`PATCH /api/stories/:id/elements/:elementId`), `StoriesService.updateStoryElement`.

### Manual Entity Classification Correction
- **What the user can do**: Reclassify an entity if the AI miscategorized it (e.g., change a character mistakenly flagged as an organization back into a character).
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: Classification dropdown in `CreateEntityModal` and edit mode of `EntityDossier.tsx`
  - Backend: Updates `element_type` via `PATCH /api/stories/:id/elements/:elementId`.

### Canon Status Toggle (Confirmed vs Draft)
- **What the user can do**: Toggle an entity between confirmed canon truth and provisional draft status using a single switch.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `handleToggleStatus` in `EntityDossier.tsx`
  - Backend: Updates `user_confirmed` and `status` in `public.narrative_elements`.

### Entity Deletion
- **What the user can do**: Delete an outdated or mistaken entity from the World Bible with automated cascade deletion of its mentions and relationship connections.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `confirmDelete` in `EntityDossier.tsx`
  - Backend: `StoriesController.deleteElement` (`DELETE /api/stories/:id/elements/:elementId`), `StoriesService.deleteStoryElement`.

---

## 6. Entities / Entity Resolution

### Entity Mention Ingestion & History Tracking
- **What the user can do**: Whenever an entity is mentioned across different narrations, the mention context, sequence point, and emotional state are tracked and displayed in the entity's dossier.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `entityMentions` timeline in `EntityDossier.tsx`
  - Backend: `SuggestionsService.confirmSuggestion` creates entries in `public.entity_mentions`
  - Database: `public.entity_mentions` table (`story_id`, `element_id`, `narration_id`, `mention_context`, `emotional_state`, `created_at`).

### Extraction Entity Resolution Context
- **What the user can do**: The system passes the list of existing canonical entity names to the AI extraction prompt to encourage re-identifying established entities rather than creating duplicates.
- **Current status**: `Partial`
- **Where it exists**:
  - Backend: `NarrationsService.addNarration` fetches existing names from `narrative_elements` and passes them to `AiService.analyzeNarration`.
- **Limitations & Assumptions**: Resolution is prompt-assisted by the LLM. There is no deterministic fuzzy-matching, phonetic string matching, or separate `aliases` table in the database to reconcile variations like "Mikey" vs "Michael" if the LLM fails to associate them.

### Manual Entity Merge
- **What the user can do**: Open the Merge modal on an entity, select a duplicate candidate of the same classification, and merge them. All mentions, moments (`characters_involved`), and relationship connections (`from_id`/`to_id`) are safely transferred to the target entity, and the duplicate source is removed.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `MergeModal` in `frontend/src/features/entities/EntityDossier.tsx`
  - Backend: `StoriesController.mergeElements` (`POST /api/stories/:id/elements/merge`), `StoriesService.mergeEntities`
  - Database: Transactional re-assignment across `entity_mentions`, `story_moments`, `narrative_connections`, and `ai_suggestions`.

---

## 7. Relationships / Nexus

### Relationship Data Structure
- **What the user can do**: Entities can be connected by directional or mutual relationship bonds with dynamic types, descriptions, emotional charge, and weight (strength 1–10).
- **Current status**: `Implemented`
- **Where it exists**:
  - Database: `public.narrative_connections` table (`story_id`, `from_id`, `to_id`, `connection_type`, `description`, `weight`, `emotional_charge`, `created_at`).
  - Connection types: `ally`, `rival`, `enemy`, `mentor`, `apprentice`, `family`, `conflicted_past`, `subordinate`, `associated`, `creator`, `sworn_protector`.

### Vertical Relationship Nexus Web
- **What the user can do**: View a structured vertical connection stream showing source entity cards, target entity cards, dynamic relationship badges, strength indicators (dots 1–5), and narrative context notes.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/visualization/NarrativeGraph.tsx`.

### Manual Relationship Creation
- **What the user can do**:
  1. From the Nexus tab: Select any two entities, choose a bond type, adjust bond strength, type narrative context, and create the link.
  2. From an Entity Dossier: Click "Add Relationship" to link the active entity to any other entity in the story.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `ConnectionModal` in `NarrativeGraph.tsx`, `AddConnectionModal` in `EntityDossier.tsx`
  - Backend: `StoriesController.createConnection` (`POST /api/stories/:id/connections`), `StoriesService.createStoryConnection`.

### Relationship Editing
- **What the user can do**: Click the edit button on any relationship card to change its bond type, weight/strength slider, or dynamic description.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `ConnectionModal` in `NarrativeGraph.tsx`
  - Backend: `StoriesController.updateConnection` (`PATCH /api/stories/:id/connections/:connId`), `StoriesService.updateStoryConnection`.

### Relationship Deletion (Sever Bond)
- **What the user can do**: Delete an unwanted relationship with a safety confirmation modal.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `NarrativeGraph.tsx` (Sever Relationship modal) and `EntityDossier.tsx`
  - Backend: `StoriesController.deleteConnection` (`DELETE /api/stories/:id/connections/:connId`), `StoriesService.deleteStoryConnection`.

### Interactive Force-Directed D3/Canvas Physics Graph
- **What the user can do**: Pan, zoom, and drag physical nodes in a 2D canvas physics simulation with spring forces connecting related entities.
- **Current status**: `Planned / Missing`
- **Where it exists**: None. The component is named `NarrativeGraph.tsx`, but it renders a vertical list of connection cards, not an SVG or canvas force simulation.

---

## 8. Timeline / Events / Narrative Flow

### Story Moments Schema & Storage
- **What the user can do**: Key narrative events are captured with title, description, normalized timeline position (0.0 to 1.0), characters involved, narrative weight (1–10), and major turning point flags.
- **Current status**: `Implemented`
- **Where it exists**:
  - Database: `public.story_moments` table (`story_id`, `title`, `description`, `timeline_position`, `characters_involved`, `narrative_weight`, `is_major_turning_point`).

### Dual-Variant Timeline Visualization
- **What the user can do**:
  1. **Horizontal Timeline**: View chronological story beats plotted horizontally across a central continuum with narrative weight indicators and turning point stars.
  2. **Vertical Sidebar Timeline**: View a persistent vertical chronological flow in the left sidebar of the main story workspace.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/timeline/Timeline.tsx` (supports `variant="horizontal"` and `variant="vertical"`), embedded in `StorySession.tsx`.
  - Backend: `StoriesController.getStoryTimeline` (`GET /api/stories/:id/timeline`), `StoriesService.getStoryTimeline`.

### Correct Timeline Event (Inline Editing)
- **What the user can do**: Click on any timeline node to open a modal where the event title and description can be updated.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `renderModal()` in `frontend/src/features/timeline/Timeline.tsx`
  - Backend: `StoriesController.updateMoment` (`PATCH /api/stories/:id/moments/:momentId`), `StoriesService.updateStoryMoment`.

### Delete Timeline Event
- **What the user can do**: Delete an event beat from the timeline.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `Timeline.tsx` (`handleDelete`)
  - Backend: `StoriesController.deleteMoment` (`DELETE /api/stories/:id/moments/:momentId`), `StoriesService.deleteStoryMoment`.

### Manual Drag-and-Drop Timeline Reordering
- **What the user can do**: Drag event cards along the timeline to alter their sequence or adjust their normalized timeline position.
- **Current status**: `Planned / Missing`
- **Where it exists**: None. Events are ordered by `timeline_position ASC`, but there is no drag-and-drop or slider interaction to update `timeline_position`.

---

## 9. Trust & Confirmation

### Approval Queue (Pending Suggestions Bar)
- **What the user can do**: Review incoming AI extractions in a dedicated horizontal drawer at the bottom of the workspace. Cards display suggestion type (element, moment, connection), extracted name/title, quote snippet, and AI confidence percentage.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `frontend/src/features/suggestions/SuggestionsOverlay.tsx`
  - Backend: `SuggestionsController.getPending` (`GET /api/suggestions/:storyId/pending`), `SuggestionsService.getPendingSuggestions`
  - Database: `public.ai_suggestions` table (`status = 'pending'`).

### Inline Suggestion Editing Prior to Acceptance
- **What the user can do**: Click the edit pencil on any pending suggestion card to fix names, titles, or descriptions directly before confirming into canon.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `SuggestionsOverlay.tsx` (`startEditing`, `saveEdit`)
  - Backend: `SuggestionsController.update` (`PATCH /api/suggestions/:id`), `SuggestionsService.updateSuggestion`.

### Confirm Suggestion into Canon Truth
- **What the user can do**: Click "Confirm" on any suggestion card. The item is promoted into canonical tables (`narrative_elements`, `story_moments`, or `narrative_connections`), marked with `confirmed_item_id`, awarded +5 XP, and removed from the pending queue.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `SuggestionsOverlay.tsx` (`confirm`)
  - Backend: `SuggestionsController.confirm` (`POST /api/suggestions/:id/confirm`), `SuggestionsService.confirmSuggestion`.

### Reject Suggestion
- **What the user can do**: Dismiss false extractions with the "X" button. The suggestion status is updated to `'rejected'` and excluded from canon.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `SuggestionsOverlay.tsx` (`reject`)
  - Backend: `SuggestionsController.reject` (`POST /api/suggestions/:id/reject`), `SuggestionsService.rejectSuggestion`.

---

## 10. Character Journey / Emotional Arc

### Mention Sentiment Extraction
- **What the user can do**: For every entity mention, the AI assesses an emotional sentiment score and emotional state object.
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `AiService.analyzeNarration` produces `sentiment_score` (-10 to +10) stored in `entity_mentions.emotional_state`.

### Emotional Life Arc (SVG Sparkline)
- **What the user can do**: View an SVG curve in a character's dossier showing their emotional trajectory across narrations (ascent into positive states, descent into despair/conflict).
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `SentimentArc` component in `frontend/src/features/entities/EntityDossier.tsx`.
- **Limitations & Assumptions**: Requires at least 2 recorded mentions for the character with emotional scores to render the curve.

### Story-Wide Emotional Heatmaps
- **What the user can do**: Visualize high-tension vs low-tension emotional heatmaps across the entire story timeline.
- **Current status**: `Planned / Missing`
- **Where it exists**: None. Mentioned as an aspirational item in `features_status.md`, but no story-wide tension curve or heatmap component exists.

---

## 11. AI Character Interaction / Simulation

### Living Character Simulation ("Ask a Character")
- **What the user can do**: Open an interactive interview terminal with any character in the World Bible. The author can ask questions or test dialogue, and the character responds in their unique voice, slang, worldview, and knowledge boundaries.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `CharacterInterviewModal` in `frontend/src/features/entities/EntityDossier.tsx`
  - Backend: `StoriesController.interviewCharacter` (`POST /api/stories/:id/characters/:characterId/interview`), `StoriesService.interviewStoryCharacter`, `AiService.simulateCharacterDialogue`.

### Historical Fact & Moment Grounding
- **What the user can do**: Characters remember who they are: the simulation grounds the prompt with the character's core traits, description, and the 5 most recent timeline moments from the story.
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `StoriesService.interviewStoryCharacter` fetches `story_moments` and passes them as grounding context to Gemini.
  - Fallback: `AiService.simulateCharacterDialogue` returns an in-character quoted response if the Gemini API is offline.

### Tone Selector & "Convert Scene to Narration"
- **What the user can do**: Switch character emotional stance (playful, defensive, menacing) via UI controls or click a button to convert simulated dialogue into an official story narration.
- **Current status**: `Planned / Missing`
- **Where it exists**: Listed in `TODO.md` Task 4 (Sprint backlog), but not implemented.

---

## 12. Story Identity

### AI Story Brainstorming
- **What the user can do**: Click "Generate New Vibes" / "AI Brainstorm" inside the Story Identity settings modal. The AI analyzes all confirmed entities and recent moments to propose 3 alternative titles and evocative premises.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `StoryEditModal` in `frontend/src/features/narration/StorySession.tsx`
  - Backend: `StoriesController.brainstormOptions` (`POST /api/stories/:id/brainstorm`), `StoriesService.brainstormStoryOptions`, `AiService.brainstormStoryTheme`.
  - Fallback: Built-in curated genre themes if Gemini API is unreachable.

### One-Click Story Rebranding
- **What the user can do**: Click any of the AI-generated premise cards to instantly populate the title and premise fields, then save to update the story.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `StoryEditModal` in `StorySession.tsx`.

---

## 13. Gamification

### Author XP & Level Progression System
- **What the user can do**: Earn experience points (XP) for storytelling actions. Profile level scales dynamically using a quadratic threshold curve ($\text{Level}^2 \times 100$):
  - Level 1: 0–100 XP
  - Level 2: 100–400 XP
  - Level 3: 400–900 XP
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `GamificationService.awardXp` in `backend/src/gamification/gamification.service.ts`
  - Database: `public.profiles` (`xp`, `level`), `public.xp_ledger` (`user_id`, `amount`, `reason`, `created_at`).

### XP Award Triggers
- **What the user can do**:
  - Submit a narration: +10 XP awarded automatically via `NarrationsService.addNarration`.
  - Confirm an AI suggestion: +5 XP awarded automatically via `SuggestionsService.confirmSuggestion`.
- **Current status**: `Implemented`
- **Where it exists**:
  - Backend: `backend/src/narrations/narrations.service.ts`, `backend/src/suggestions/suggestions.service.ts`.

### Session Header Mastery Bar
- **What the user can do**: View active author level and XP progression directly in the top header of the narration workspace.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `StorySession.tsx` header (displays `Lvl X // Y XP` and animated gradient progress bar).

### Daily Writing Streak & Contribution Heatmap
- **What the user can do**: View consecutive writing days and a GitHub-style calendar contribution heatmap of narration activity.
- **Current status**: `Planned / Missing`
- **Where it exists**: Listed in `TODO.md` item 79 and `GEMINI.md` backlog, not implemented.

### Level-Up Animations & Confetti
- **What the user can do**: Experience micro-animations or celebratory modals upon leveling up.
- **Current status**: `Planned / Missing`
- **Where it exists**: Listed in `TODO.md` item 36/80, not implemented.

---

## 14. Search / Navigation

### Dashboard Story Search
- **What the user can do**: Search narratives in real-time by title, description, or genre tags on the dashboard.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `Dashboard.tsx` (`searchQuery` state and `filteredStories` memo).

### World Bible Entity Search & Filtering
- **What the user can do**: Filter World Bible entries by typing names or descriptions into the search bar, or clicking classification tabs (Character, Location, Organization, Concept, Event, Artifact).
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `EntityDossier.tsx` (`searchTerm`, `filterType`, `filteredElements`).

### Relationship Nexus Search & Dynamic Filtering
- **What the user can do**: Filter the relationship web by entity name, context description, or relationship type (`ally`, `rival`, `mentor`, etc.).
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `NarrativeGraph.tsx` (`searchQuery`, `filterType`, `nexusItems`).

### Quick Command Palette (`Ctrl+K`)
- **What the user can do**: Press `Ctrl+K` to open a universal command bar for rapid navigation between stories, entities, and actions.
- **Current status**: `Planned / Missing`
- **Where it exists**: Backlogged in `TODO.md` item 84 and `GEMINI.md`, not built.

---

## 15. Export

### World Bible Markdown Export
- **What the user can do**: Click the Export button in the World Bible to compile all confirmed Characters (with traits and descriptions), Locations, and Organizations into a structured Markdown document (`world_bible.md`) that downloads instantly in the browser.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `handleExport` in `frontend/src/features/entities/EntityDossier.tsx`.
- **Limitations & Assumptions**: Export is handled entirely client-side via a Blob download. Only includes entities (characters, locations, organizations); does not include timeline moments, relationship tables, or raw narrations.

### PDF & EPUB Manuscript Export
- **What the user can do**: Export full formatted manuscripts, screenplays, or PDFs with custom styling.
- **Current status**: `Planned / Missing`
- **Where it exists**: Mentioned in `TODO.md` item 44/83, but not implemented in code.

---

## 16. Visual / Cinematic Features

### AI Concept Art & Portrait Generation
- **What the user can do**: Click "Generate Concept Art" on any entity in the World Bible. The AI generates a tailored 1:1 portrait prompt based on the entity's name, type, traits, and description, invokes Imagen 3, and persists the result to `visual_url`.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `EntityDossier.tsx` (`handleGenerateVisual`)
  - Backend: `StoriesController.generateElementVisual` (`POST /api/stories/:id/elements/:elementId/visual`), `StoriesService.generateElementVisual`, `AiService.generateEntityVisual`
  - Fallbacks: High-quality curated Unsplash photographs matching entity classification keywords when Imagen API is unavailable.

### Custom Visual URL Specification
- **What the user can do**: Paste or edit a custom image URL directly during entity creation or from the entity dossier.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `CreateEntityModal` and `EntityDossier.tsx` (`customVisualUrl`).

### Entity Portrait Rendering
- **What the user can do**: View portrait visuals across Entity Dossier banners, Character Simulation avatars, and World Bible cards.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `EntityDossier.tsx`, `CharacterInterviewModal`.

### Full-Bleed Cinematic Scene Backdrops
- **What the user can do**: Immersive full-screen visual environment backdrops that morph dynamically based on the current scene location.
- **Current status**: `Planned / Missing`
- **Where it exists**: Mentioned in `TODO.md` item 48, not implemented.

---

## 17. Correction / Rewind

### Revert Confirmed Element to Draft Suggestion
- **What the user can do**: If an entity was confirmed prematurely or by accident, clicking "Revert to Draft" in the dossier removes the entity from `narrative_elements` and restores its original suggestion in `ai_suggestions` with status `'pending'`.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `handleRevert` in `EntityDossier.tsx`
  - Backend: `SuggestionsController.revertElement` (`POST /api/suggestions/revert-element/:elementId`), `SuggestionsService.revertToSuggestion`.

### Revert Confirmed Timeline Moment to Draft Suggestion
- **What the user can do**: Click "Revert to Draft" inside the timeline moment correction modal to delete the moment from canon and return it to the pending suggestions queue.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `handleRevert` in `Timeline.tsx`
  - Backend: `SuggestionsController.revertMoment` (`POST /api/suggestions/revert-moment/:momentId`), `SuggestionsService.revertToSuggestion`.

### Post-Confirmation Entity Editing & Reclassification
- **What the user can do**: Modify names, traits, lore descriptions, or reclassify the entity type long after confirmation without breaking foreign keys.
- **Current status**: `Implemented`
- **Where it exists**:
  - Frontend: `EntityDossier.tsx`
  - Backend: `StoriesService.updateStoryElement`.

### Raw Narration Content Editing (Sacred Input Guard)
- **What the user can do**: Edit previously submitted raw narration prose blocks directly.
- **Current status**: `Intentionally Omitted / Forbidden by Design`
- **Reason**: Story Engine treats author raw text as sacred and immutable. Once captured, raw narrations represent historical creative output. Corrections are made by submitting clarification narrations or modifying the structured narrative layer (elements, moments, connections).

---

## 18. Categorized Status Rollup

### Implemented
Features verified in both frontend UI and backend execution:
- Supabase Email/Password Sign Up, Sign In, and Sign Out
- Author Profile View, Bio & Display Name Editing
- Story Creation, Listing, Metadata Editing, and Deletion with Cascading Child Cleanup
- Immutable Raw Narration Ingestion with Auto-Incrementing Sequence Numbers
- Chronological Narration Playback Feed with Listener Reactions
- Cold-Start 4-Step Story Interview Flow
- Empathetic AI Listener Responses (Gemini 2.0 Flash with Heuristic Fallback)
- Multi-Category Extraction (Characters, Locations, Orgs, Moments, Connections)
- Staging Extractions into `ai_suggestions` Trust Layer
- World Bible Card Catalog with Multi-Type Filtering
- Active Entities Workspace Sidebar
- Deep Entity Dossier View
- Manual Entity Creation, Editing, Deletion, and Type Reclassification
- Entity Canon Status Toggle (Confirmed Canon vs Draft)
- Manual Entity Merge Engine (Transferring Mentions, Moments, Connections)
- Structured Relationship Model & Vertical Nexus Web
- Manual Relationship Creation, Editing, and Deletion
- Dual-Variant Timeline (Horizontal Continuum & Vertical Sidebar)
- Timeline Moment Editing and Deletion
- Pending Suggestions Drawer with Inline Editing, Confirmation, and Rejection
- Entity Mention Tracking and Emotional Sentiment Capture
- Emotional Life Arc SVG Sparkline for Characters
- Living Character Simulation ("Ask a Character" with Context Grounding)
- AI Story Brainstorming with One-Click Rebrand
- Author Gamification: XP Ledger, Quadratic Leveling, and Workspace Header Mastery Bar
- Dashboard Story Search, World Bible Search, and Nexus Search
- Client-Side World Bible Markdown Export
- AI Portrait Generation (Imagen 3 with Thematic Unsplash Fallbacks)
- Rewind / Correction: Revert Elements & Moments back to Draft Suggestions

### Partial
Features where functionality is present but limited in depth or relies on client heuristics:
- **Author Badges & Achievements**: Rendered on profile, but computed from static frontend rules rather than a dedicated backend achievements table.
- **Extraction Entity Resolution**: Existing entity names are provided to Gemini in the prompt context, but there is no deterministic alias dictionary or fuzzy-matching resolver in the database.
- **Timeline Ordering**: Moments store normalized float positions (`0.0` to `1.0`), but position adjustments can only be made via manual field edits, not interactive drag-and-drop.

### UI-Only
Features where UI controls exist without complete backend persistence:
- None. All current interactive UI controls in the application connect to verified backend NestJS controllers and Supabase tables.

### Planned / Missing
Features referenced in roadmaps, TODOs, or status files that do not exist in the codebase:
- **Audio / Voice Narration Capture**: No microphone recording, STT transcription, or streaming voice ingestion.
- **Interactive Force-Directed D3/Canvas Physics Graph**: `NarrativeGraph.tsx` is a vertical card connection list; no force-directed simulation exists.
- **Story-Wide Emotional Heatmaps**: No visual timeline heatmap of narrative tension zones.
- **Enhanced Interview Studio**: No dialogue streaming, tone selector, or "Convert to Scene" button.
- **Daily Writing Streak & Activity Heatmap**: No daily login/narration streak calculator or contribution calendar.
- **XP Micro-Animations & Celebrations**: No floating XP indicators or level-up particle effects.
- **Universal Command Palette (`Ctrl+K`)**: No global keyboard launcher.
- **PDF & EPUB Manuscript Export**: No backend PDF/EPUB compiler.
- **Full-Bleed Cinematic Scene Backdrops**: No environment scene art container.

---

## 19. Documentation Drift

This section audits discrepancies where existing documentation files (`features_status.md`, `TODO.md`, `GEMINI.md`) claim features are implemented or active, but the code reveals a different reality:

| Claimed Feature | Document Source | Document Claim | Actual Code Reality |
| :--- | :--- | :--- | :--- |
| **Nexus Graph** | `features_status.md` (Line 21) | *"Nexus Graph: A force-directed graph visualizes relationships between entities."* | **Drift**: `NarrativeGraph.tsx` does **not** use D3 or force simulation. It renders a clean vertical list of relationship cards with connection lines and strength dots. |
| **Entity Resolution** | `features_status.md` (Line 26) | *"Automatic mapping of aliases to canonical characters/places."* | **Drift**: The system passes existing entity names to the Gemini prompt, but there is no alias mapping table, fuzzy matcher, or automated resolution engine in code. |
| **Professional Export** | `TODO.md` (Line 44) & `GEMINI.md` | *"Pro Export: Markdown export for the World Bible. UI: Add 'Export Story' modal with format options (Markdown, PDF)."* | **Drift**: There is no format selection modal or PDF export. The only export is a client-side Markdown blob download (`world_bible.md`) inside `EntityDossier.tsx`. |
| **Cinematic Visuals** | `GEMINI.md` & `TODO.md` (Line 48) | *"Cinematic Visuals: Connect AI portrait/imagery generation to visual_url. UI: Implement high-fidelity location backgrounds."* | **Drift**: Entity portraits are implemented (`visual_url` and Imagen generation in `AiService`), but full-bleed location background scenes are not implemented. |
| **Living World Mode** | `features_status.md` (Line 70) | Listed under *"Priority 4: Long-Term Vision"* as unimplemented. | **Code Ahead of Docs**: Character simulation ("Ask a Character") is **already implemented** in `CharacterInterviewModal` and `AiService.simulateCharacterDialogue`. |
| **Story Gamification** | `features_status.md` (Line 69) | Listed under *"Priority 4: Long-Term Vision"* as unimplemented. | **Code Ahead of Docs**: Gamification (XP ledger, quadratic leveling, narration rewards, header progress bar) is **already implemented** in `GamificationService`. |
| **Rewind & Correction** | `features_status.md` (Line 40) | Listed under *"Priority 1: Immediate Focus"* as remaining. | **Code Ahead of Docs**: Revert element and revert moment endpoints (`revertToSuggestion`) and modal correction tools are **already implemented**. |
