Here's how I'd break this down. The core loop you've built — narrate → AI extracts entities/moments/relationships → user confirms suggestions → world bible/timeline stay in sync — is genuinely the hard part of a story-building tool, and it's already working end-to-end. That's a strong foundation. The gaps are mostly around what happens *around* that loop: editing history, collaboration, and getting the story out of the app.

## Must-haves (gaps that limit what's already built)

These are things your own doc flags as missing, and they'll bite real users quickly:

- **Narration edit/delete** — right now narrations are append-only. A typo or a scene you want to walk back has no fix except living with it forever.
- **Real profile persistence** — display name/bio only update local/session state, not the DB. First session refresh or device switch loses it.
- **Unify Story Details tab vs. Story Identity modal** — two places editing the same thing is a bug waiting to happen (stale data, conflicting saves).
- **Account recovery basics** — password reset, email verification. Not glamorous, but you can't ship auth without it.
- **Full story/manuscript export** — you have World Bible export (facts) but no way to export the actual narrative as a readable document. For a *storytelling* tool, "get my story out as a doc" is arguably more core than the wiki export.
- **Undo/versioning beyond suggestions** — suggestion revert exists, but there's no broader safety net if an AI edit (description refresh, generated visual) goes wrong.

## Should-haves (high leverage, builds on what you have)

You already pay the cost of running narration analysis — these get more value out of that same AI investment:

- **Continuity/contradiction detection** — flag when new narration conflicts with confirmed entity facts or timeline events ("Character X was established as dead in Ch. 3"). This is a natural extension of the extraction pipeline you already run.
- **Semantic search across the story** — "when did I mention the lighthouse" across narrations/entities/timeline, not just literal filtering.
- **Story analytics/pacing view** — entity mention frequency, emotional-weight trend over the timeline (you're already storing emotional signature per moment — just needs a view).
- **Multi-user collaboration** — the product is called a "co-creation workspace" but looks single-user right now. Real-time or turn-based co-writing would be a big unlock.
- **Branching/alternate timelines** — let a suggestion or timeline moment fork instead of just confirm/reject, for "what if" exploration.
- **AI-suggested next beats** — extend the interview/brainstorming pattern into an on-demand "what could happen next" prompt during normal narration, not just at story start.

## Nice-to-haves

- Illustrated storybook / comic-style compilation of the generated cinematic visuals
- Text-to-speech playback of narration
- Voice dictation for narration input
- Export to Wattpad/Medium/other publishing targets
- AI style-mimicry that learns the user's own voice over time
- Achievements/streaks beyond the current XP/level system
- Public story discovery/community feed
- Import an existing manuscript to auto-bootstrap entities and timeline

If it's useful, I can turn any one of these into an actual spec — data model, API endpoints, UI flow — starting wherever you want to prioritize.