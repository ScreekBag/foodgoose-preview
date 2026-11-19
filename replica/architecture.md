# Architecture: Kuwait City audio guide (iOS, v1)

Reads: recon.md, features.csv. Date: 2026-11-19.

## Stack

| layer | choice | why |
| --- | --- | --- |
| app | Expo (React Native) + TypeScript + expo-router | builds for iPhone in the cloud (no Mac needed), ships to TestFlight with EAS |
| styling | StyleSheet + design tokens from replica-design | small app, no web build needed |
| audio | expo-audio with background mode | keeps playing with the phone locked, lock-screen controls |
| location | expo-location + expo-task-manager geofences | "the guide writes first" near a stop, works in background |
| notifications | expo-notifications (local only) | "You're near Seif Palace" — no push server needed |
| maps | react-native-maps (Apple Maps on iOS) | no API key, looks native |
| content | route JSON + audio MP3 + photos bundled in the app | works fully offline, nothing to download in v1 |
| on-phone data | expo-sqlite | thread history, progress, settings |
| "Ask the guide" | Supabase Edge Function → Claude API | keeps the AI key off the phone; Supabase is already connected |
| answer voice | same Edge Function → TTS service | answers are read aloud in the same voice |
| recorded audio | generated once from the scripts with a TTS service, checked by ear, bundled | consistent "living storyteller" voice |
| build & release | EAS Build + EAS Submit → TestFlight | Apple account needed (user owns it) |

One server function. No accounts, no login in v1 (nothing to delete → simpler App Review).

## Data

Bundled (read-only): `assets/routes/old-kuwait/route.json`

```
Route { id, city, title, summary, distance_m, duration_min, intro_audio, tips[],
        polyline[[lat,lng]], stops: Stop[] }
Stop  { id, order, title, title_ar, lat, lng, trigger_radius_m, image, image_credit,
        hours_note, practical[], audio, duration_s, transcript,
        more: [{ title, audio, transcript }], faq: [{ q, a }] }
```

On the phone (expo-sqlite) — see schema.sql. Times stored as UTC ISO strings.

## API

| method path | what | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| POST /functions/v1/ask-guide | answer a visitor question in the guide's voice | the app (anon key + per-device rate limit) | { question, route_id, stop_id, language, recent_messages[≤6] } | { text, audio_url? } | F03 |

Rules inside the function: system prompt = guide persona + the current stop's
verified facts; answer short (≤120 words), Russian, say "не знаю" rather than
invent; limit 30 questions per device per day.

No webhooks, no background server jobs.

## Parts that bite

- **Background location + audio**: iOS asks "Allow while using" first; geofences need "Always". Ask for "Always" only after the first stop, with a clear reason. Fallback: "Я на месте" button.
- **GPS between tall buildings**: radius 50–80 m, require 2 readings inside before triggering; never trigger the same stop twice.
- **Prayer times**: Grand Mosque closes to visitors around prayers and on Friday — the brief and the stop card warn by time of day.
- **Heat**: May–Sept midday is dangerous; brief warns and suggests evening.
- **Offline**: everything except "Ask the guide" works without internet; the input bar says so when offline.
- **Rate limits / cost** on the AI function: per-device daily cap.
- **App size**: ~7×4 min + extras of MP3 at 64 kbps mono ≈ 25–35 MB. Fine.
- **App Review**: background location must be justified in the permission text; Info.plist strings in Russian and English.
- **Copycat rule (4.1)**: own name, icon, colours — nothing from Duet.

## Build order

1. **Vertical slice** — S03 thread with a hard-coded Route card → S06 player playing one bundled MP3, built on EAS and installed via TestFlight. Proves the whole pipe to the user's iPhone.
2. **Must-haves** — S01 welcome, S02 permissions, S04 route sheet, S05 map, geofence triggers + local notifications, progress, all 7 stops' content and audio, lock-screen playback, "Я на месте".
3. **Should-haves** — Today's walk brief, "Расскажи ещё", ask by text then by voice (Edge Function), finish card, settings, tabs.
4. **Could-haves** — Saved tab, second route, "generate a tour" (F05).
