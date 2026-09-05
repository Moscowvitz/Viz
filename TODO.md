# Story Engine - Evolution Roadmap (North Star Alignment)

## 🏁 The Commitment
"If we can't build a story notebook that's better than Notes + ChatGPT in 15 minutes for casual storytellers, we don't deserve to build the grand vision."

---

## Phase 1: Foundation & Invisible Consciousness ✅
- [x] **Stable Auth**: ES256 JWT validation with Supabase.
- [x] **Sacred Narration**: Raw user input is preserved unchanged in `raw_narrations`.
- [x] **AI Listener**: Gemini 2.0 Flash providing empathetic feedback.
- [x] **Entity Extraction**: Accuracy-focused extraction of Characters, Locations, and Orgs.

## Phase 3: The Narrative Hub & UX Refactor ✅
### [x] Task 3.1: Story Identity & AI Branding
- [x] UI: Edit Story Title/Description with "AI Brainstorm" button.
- [x] AI: Generate 3 title/description options based on current story context.
- [x] Feature: User selects an option to instantly rebrand their story.

### [x] Task 3.2: UX Overhaul
- [x] Layout: Move Suggestions to a horizontal scrollable card bar at the bottom.
- [x] Component: `World Bible` (formerly Entity Dossier) - cleaner sidebar-less detail view.
- [x] Component: `Vertical Narrative Flow` - redesigned graph/timeline hybrid.
- [x] Renaming: Universal shift from "Elements/Entities" to "World Bible / Facts".

### [x] Task 3.3: User Management
- [x] Home: Create a "Story Landing Page" (Dashboard) showing story cards.
- [x] Profile: Create a User Profile page with account settings.
- [x] Auth: Implement Logout functionality.

## Phase 4: Mastery & Professionalism 🚀
### [x] Task 4.1: Story Gamification
- [x] Backend: Add `xp` and `level` to `profiles` table.
- [x] Backend: Implement `GamificationService` to award XP for narrations and confirmations.
- [x] UI: Add "Mastery Level" bar to the main header.
- [ ] UI: Implement XP gain animations.

### [x] Task 4.2: Scene Simulation (Living World)
- [x] Backend: Create `ai/simulate` endpoint for character dialogue.
- [x] UI: Create "Ask a Character" interface in the World Bible.
- [x] AI: Implement character-specific prompt logic using historical facts.

### [x] Task 4.3: Professional Export
- [x] UI: Add "Export Story" modal with format options (Markdown, PDF).
- [ ] Backend: Implement document generation for World Bible and Timeline.

### [ ] Task 4.4: Cinematic Visuals
- [x] UI: Implement high-fidelity location backgrounds in the World Bible.
- [ ] AI: Auto-generate character portraits and location imagery based on descriptions.

---

## 📋 Prioritized Functional Tasks (Upcoming Sprint)

### 🗂️ 1. Story Management & Search
- [ ] **Delete Story**: Add story deletion capability on dashboard cards with safe confirmation modal and state invalidation.
- [ ] **Search Stories**: Live client-side search by title and description with instant query clear.
- [ ] **Story Metadata**: Add genre tags (*Dark Fantasy*, *Sci-Fi*, *Mystery*, etc.), status pills (*Concept*, *Drafting*, *Revising*), and custom cover art.

### 🏛️ 2. World Bible & Entity CRUD
- [ ] **Entity Reclassification**: Enable manual type correction (e.g. reclassify misidentified location $\leftrightarrow$ character $\leftrightarrow$ organization $\leftrightarrow$ concept).
- [ ] **Entity Status Management**: Toggle entities between draft/suggested and confirmed canon.
- [ ] **Manual Entity Creation**: Dialog to create new characters, locations, or factions without needing prior narration.
- [ ] **Entity Editing & Deletion**: Update entity names, descriptions, traits, and remove outdated entities.

### 🕸️ 3. Relationship (Nexus) CRUD
- [ ] **Create Relationship**: Manual connection creation linking two entities with relationship type, sentiment/emotional charge, and description.
- [ ] **Edit Relationship**: Modify existing connection types, weights, and descriptions.
- [ ] **Delete Relationship**: Remove outdated or incorrect relationship links from the Nexus.
- [ ] **Interactive Relationship Web**: Force-directed visual node graph linking entities by relationship strands.

### 🧠 4. Writer's Co-Pilot & Immersion
- [ ] **Lore Consistency & Conflict Guard**: AI continuity checker alerting on contradictions against established facts.
- [ ] **"What Happens Next?" Spark Engine**: 3 dynamic narrative branches (Action/Twist, Character Moment, World Mystery) for creative block.
- [ ] **Enhanced Interview Studio**: Dialogue streaming, emotional tone selector (defensive, menace, playful), and "Convert to Scene" button.
- [ ] **Distraction-Free Manuscript Reader**: Clean reading mode with interactive inline lore tooltips.

### ⚡ 5. Gamification & Writing Momentum
- [ ] **Daily Writing Streak & Heatmap**: Contribution grid tracking daily narrations and word count.
- [ ] **Level-Up & Milestone Celebrations**: Micro-animations and author rank badges (*Novice Scribe* $\rightarrow$ *Master Chronicler*).

### 📑 6. Productivity & Export Suite
- [ ] **Compiled Manuscript Export**: Multi-format exporter for complete story (Markdown bundle, formatted PDF, EPUB).
- [ ] **Power-User Keyboard Shortcuts**: `Ctrl+K` command palette for fast navigation and `Ctrl+Enter` narration submission.

---

## 🛠️ Active Architectural Tasks
- [x] **Rewind & Correction**: Master edit mode is active.
- [x] **Nexus Propagation**: Fixed vertical graph visualization.
- [x] **Database Documentation**: Sync `database_system.md` with confirm_item_id.
