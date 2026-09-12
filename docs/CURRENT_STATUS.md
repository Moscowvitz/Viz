# Story Engine - Current Product Status

Last reviewed: 2026-09-12

This document describes the currently implemented frontend pages, story-workspace tabs, feature modules, AI behavior, and persistence/CRUD support.

## Page map

```text
Application
├── /login
│   └── Login
├── /signup
│   └── Signup
└── Protected pages
    ├── /
    │   └── Story Dashboard
    ├── /story/:id
    │   └── Story Session
    └── /profile
        └── Storyteller Profile
```

All protected pages require authentication through `ProtectedRoute`. Story data is accessed through authenticated NestJS API routes backed by Supabase.

## 1. Login page

**Module:** `frontend/src/features/auth/LoginPage.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| User login | Authenticates an existing user and redirects to the dashboard. | No | Yes - authentication/session read |
| Demo/mock fallback | Supports the local mock auth setup when configured. | No | Local/session dependent |

## 2. Signup page

**Module:** `frontend/src/features/auth/SignupPage.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Account creation | Creates a user account and starts an authenticated session. | No | Yes - create auth user |

## 3. Story Dashboard (`/`)

**Module:** `frontend/src/features/stories/Dashboard.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Story listing | Displays the authenticated user's stories. | No | Read |
| Story search | Live filters by title, description, and genre. | No | Read/filter |
| Create story | Creates a new story and opens its story session. | No | Create |
| Delete story | Confirmation modal followed by story deletion. | No | Delete |
| Story cards | Shows title, description, genre, and creation date. | No | Read |
| Profile navigation | Opens the profile page. | No | No direct CRUD |

## 4. Story Session (`/story/:id`)

**Module:** `frontend/src/features/narration/StorySession.tsx`

The Story Session is the main co-creation workspace. It currently contains these tabs:

### 4.1 Narration tab

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Story narration feed | Displays the ordered narration history. | Partly - narration responses and extraction are AI-generated | Read |
| Add narration | Accepts the next story contribution from the user. | Yes - the backend analyzes the narration and generates a listener response | Create |
| Extracted characters/events | Shows entities and events extracted from the narration. | Yes | Read; persisted as AI suggestions/elements after processing |
| Listener response | Displays the AI's acknowledgement and narrative continuation response. | Yes | Read |
| Story interview | Guided interview used when a story has no narrations yet. | Yes | Creates narrations after completion |

### 4.2 Active Entities tab

**Module:** `frontend/src/features/entities/EntityList.tsx`, `EntityDossier.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Entity list | Lists characters, locations, and organizations for the story. | No | Read |
| Entity filtering | Filters entities by type and search criteria. | No | Read/filter |
| Create entity/fact | Manually creates a narrative entity. | No, unless the user enters AI-generated text | Create |
| Edit entity | Updates name, type, status, attributes, and description. | No | Update |
| Delete entity | Removes an entity from the story. | No | Delete |
| Confirm/draft status | Toggles whether an entity is user-confirmed. | No | Update |
| Reclassify entity | Changes an entity between character, location, and organization. | No | Update |
| Merge entities | Combines a duplicate entity into another entity. | No | Update/delete-style domain operation |
| Character description refresh | Rebuilds a character description from story context. | Yes | Update |
| Character interview | Simulates a conversation with a selected character. | Yes | Read context; response is generated, not persisted as a separate record |
| Generate visual | Generates a cinematic visual and stores its URL on the entity. | Yes | Update |
| World Bible export | Exports entity facts to Markdown. | No | Read/export |

### 4.3 Relationship Nexus tab

**Module:** `frontend/src/features/visualization/NarrativeGraph.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Relationship graph | Visualizes connections between story entities. | No | Read |
| Create relationship | Links two entities with a relationship type and description. | No | Create |
| Edit relationship | Changes relationship metadata and description. | No | Update |
| Delete relationship | Removes a relationship. | No | Delete |
| Relationship search/filter | Finds connections and filters graph data. | No | Read/filter |

### 4.4 World Bible tab

**Module:** `frontend/src/features/entities/EntityDossier.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Searchable fact repository | Presents confirmed and draft story facts in detail views. | No | Read |
| Entity detail view | Shows descriptions, metadata, mentions, and related connections. | No | Read |
| Fact maintenance | Uses the entity create/edit/delete/reclassification operations. | No | Create/update/delete |
| Markdown export | Exports the current world facts. | No | Read/export |

### 4.5 Timeline tab

**Module:** `frontend/src/features/timeline/Timeline.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Timeline display | Shows narrative moments in chronological/story order. | No | Read |
| Edit moment | Changes the event title and description. | No | Update |
| Delete moment | Removes a timeline moment. | No | Delete |
| Generate label | Generates a concise event title and meaningful description from the source narration. | Yes | Update |
| Revert moment | Reverts an AI-created moment through the suggestion workflow. | No | Domain update/delete |
| Emotional signature and weight | Displays stored narrative analysis metadata. | Yes - values originate from narration analysis | Read |

### 4.6 Story Details tab

**Module:** `frontend/src/features/narration/StorySession.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Edit story name | Updates the story title. | No | Update |
| Edit story description | Updates the story premise/description. | No | Update |
| Edit genre | Updates the story genre. | No | Update |
| AI brainstorming | Produces alternative title and description options. | Yes | Reads story context; selected result is saved through story update |

### 4.7 Pending Narrative Truths

**Module:** `frontend/src/features/suggestions/SuggestionsOverlay.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Pending suggestions | Displays AI-proposed elements, moments, and connections awaiting approval. | Yes - suggestions originate from narration analysis | Read |
| Edit suggestion | Allows a proposed name/title to be corrected before confirmation. | No | Update suggestion |
| Confirm suggestion | Promotes a suggestion into the relevant story entity/moment/connection. | No at confirmation time | Create/update domain record |
| Reject suggestion | Removes a pending suggestion. | No | Delete/reject |
| Revert confirmed item | Reverts confirmed AI-created elements or moments where supported. | No | Domain delete/revert |

## 5. Storyteller Profile (`/profile`)

**Module:** `frontend/src/features/auth/ProfilePage.tsx`

| Feature | Description | AI-driven | DB CRUD |
|---|---|---:|---|
| Account summary | Displays email, join date, story count, XP, and level. | No | Read auth/profile/stories |
| Display name and bio editing | Updates the visible profile information. | No | Currently local/session metadata update; not a dedicated backend profile mutation |
| XP and level display | Shows gamification progress. | No | Read; XP can be changed by backend gamification flows |
| Logout | Ends the authenticated session. | No | Auth/session update |

## AI capability summary

AI is currently used in the backend for:

- Narration analysis and extraction of characters, events, and connections.
- Listener responses to user narration.
- Story title/description brainstorming.
- Character interview simulation.
- Character description refresh.
- Cinematic entity visual generation.
- Timeline title/description generation.

The AI service supports configured model providers and heuristic/fallback behavior where applicable. AI-created data is surfaced as pending suggestions when user confirmation is required.

## Persistence and CRUD summary

| Domain | Create | Read | Update | Delete |
|---|---:|---:|---:|---:|
| Stories | Yes | Yes | Yes | Yes |
| Narrations | Yes | Yes | Not exposed in current UI/API | Not exposed in current UI/API |
| Entities/facts | Yes | Yes | Yes | Yes |
| Relationships | Yes | Yes | Yes | Yes |
| Timeline moments | AI/suggestion workflow | Yes | Yes | Yes |
| Suggestions | AI-generated | Yes | Yes | Reject/delete and confirm |
| User profile | Auth account creation | Yes | Local/session metadata only in current page | Logout/session removal |

## Current implementation notes

- The Story Session currently shows Story Details as a dedicated tab, while the settings button still opens the existing Story Identity modal.
- The frontend and backend compile successfully with the current implementation.
- Profile edits should be moved to a dedicated authenticated profile update endpoint if database-backed profile persistence is required.
- Narration editing and deletion are not currently exposed; narrations are append-only from the current UI.
- The timeline is primarily populated from narration analysis and suggestion confirmation, with manual edit/delete available afterward.
