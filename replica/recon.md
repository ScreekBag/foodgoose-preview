# Recon map: Claude Duet → audio-tour app for Kuwait City (iOS)

Scope: Duet's UX patterns only (one conversational thread, voice or text,
proactive messages, rich cards inside the chat, quick-reply buttons, calm
minimal look). Applied to a new product: an AI audio guide. v1 = one walking
route in Kuwait City, worked out in full detail.
For: the user's own app, installed via TestFlight on their iPhone first.
Date: 2026-11-19

Note: Duet is a work assistant, not a tour app. We take *how it feels*, not
what it does, and nothing it owns (name, icon, colours, copy).

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | product page (marketing + interactive demo) | https://claude.com/product/claude-duet | demo shows thread, morning brief, inline cards, Approve / Not now, Yes / No / Not now chips, tabs Chat / Tasks / Make, push notification |
| 2 | announcement | https://claude.com/resources/articles/claude-duet | one ongoing thread, typing or voice, "comes to you first", notifies when done, asks before acting |
| 3 | route source: GPSmyCity Downtown walk | https://www.gpsmycity.com/tours/kuwait-city-downtown-walking-tour-3717.html | 7 stops, 3.5 km, ~2 h, "first-time visit" |
| 4 | route cross-check: Like a Local, TripAdvisor, Marriott guide, Girl About The Globe | search results 2026-11-19 | same cluster everywhere: Grand Mosque, Souq Al-Mubarakiya, National Museum, Sadu House, Liberation Tower |

## Duet patterns we keep (and how they map)

| Duet pattern | In our app |
| --- | --- |
| One thread, history in one place | One conversation with the guide. The whole walk lives in it. |
| "Comes to you first" / proactive | When you get near a stop, the guide writes first and offers the story. |
| Morning brief | "Today's walk" brief: weather/heat, prayer times that close the mosque, what's open, total time. |
| Inline cards (deck, dashboard, payment) | Route card, Stop card with audio player, Map card, Finish card. |
| Approve / Not now | Play / Later on each stop card. |
| Yes / No / Not now chips | Quick replies: "Tell me more", "Next stop", "Skip". |
| Text or voice input | Ask the guide anything, typed or spoken. |
| Push notification "now" | "You're 50 m from Seif Palace. Your story is ready." |
| Tabs Chat / Tasks / Make | Guide / Routes / Saved. |

## Core loop

Open the app, start the route, walk; at each stop the guide offers a story,
you listen, ask questions if you want, and it leads you to the next stop.

## Screens

| ID | screen | how to reach | purpose | key components | states |
| --- | --- | --- | --- | --- | --- |
| S01 | Welcome | first launch | what the app is, pick narration language | logo, one line, language chips, Start button | default |
| S02 | Permissions (inside the thread) | after Start | ask for location and notifications, with reasons | guide message, Allow / Not now chips | allowed, denied, later |
| S03 | Guide thread (home) | tab Guide | the one conversation | messages, cards, quick replies, input bar with mic | empty (first day), filled, offline, error |
| S04 | Route card → Route sheet | tap route card | overview before starting | map with line, 7 stops, distance/time, tips (heat, dress code, hours), Download, Start | not downloaded, downloading, downloaded |
| S05 | Map / way to next stop | tap "Show the way" | walk to next stop | map, your dot, line, distance, "Open in Apple Maps" | locating, on route, far off route, no GPS |
| S06 | Player (full screen) | tap a stop card | listen | photo, title, play/pause, −15 s, speed, transcript, "Ask about this" | playing, paused, finished, loading |
| S07 | Voice input | hold mic | ask by voice | live waveform, release to send, cancel | listening, no mic permission |
| S08 | Routes tab | tab Routes | list of routes | route cards (1 now, "more coming") | 1 route, coming soon |
| S09 | Saved tab | tab Saved | downloaded audio, favourite stops | list, storage used, delete | empty, filled |
| S10 | Settings | gear in header | language, voice speed, auto-play near stops, downloads, about | toggles, pickers | default |
| S11 | Finish card | after last stop | sum-up of the walk | km walked, time, stops heard, "where to eat now", rate | default |
| S12 | Lock screen / Now Playing | system | control audio with phone locked | title, artwork, play/pause, skip | playing, paused |

## Flows

```
F01 First launch to first story
    S01 -> S02 -> S03 (Today's walk brief + Route card) -> S04 -> Start -> S05 -> S06
    happy path taps: 5 (Start, Allow, Allow, open route, Start walk)
    edge: location denied (manual "I'm here" button), notifications denied, no internet

F02 Walk the route
    S05 -> near stop (≈60 m) -> guide message + push -> Play -> S06 -> "Next stop" -> S05 ... -> S11
    happy path taps per stop: 2 (Play, Next stop)
    edge: phone locked (S12 + push), skipped stop, walked past a stop, mosque closed for prayer,
          heat warning midday, GPS drift between tall buildings

F03 Ask the guide
    S03 or S06 -> type or hold mic (S07) -> answer as text + voice in thread
    edge: no internet (say so, offer stored answers), off-topic question

F04 Prepare offline
    S04 -> Download -> progress -> done (S09 shows it)
    edge: low storage, download interrupted

F05 Generate a new tour (later, the long-term vision)
    S03 "Make me a 1-hour walk around Salmiya" -> guide builds route + stories -> Route card
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Message bubble | guide, user, system note | default, sending, failed | S03 |
| Brief card | Today's walk | default | S03 |
| Route card | compact (in thread), full (sheet) | not downloaded, downloading, ready, in progress, done | S03, S04, S08 |
| Stop card | upcoming, nearby, playing, heard, skipped | — | S03 |
| Audio mini-player | docked above input bar | playing, paused | S03, S05 |
| Quick-reply chips | 1–3 options | default, pressed, disabled | S02, S03 |
| Input bar | text + mic | empty, typing, listening | S03, S06 |
| Map | route line, stops, user dot | locating, ok, no GPS | S04, S05 |
| Tab bar | Guide / Routes / Saved | — | all |
| Toast | info, error | — | all |

## Inferred data model (our own design, not Duet's)

```
Route     id, city, title, summary, distance_m, duration_min, best_time,
          tips[], cover_image, stops[] (ordered), languages[]
          confidence: high (we define it)
Stop      id, route_id, order, title, lat, lng, trigger_radius_m,
          image, short_text, transcript, audio_file per language,
          duration_s, opening_hours, practical_notes, more_stories[]
Message   id, role (guide|user|system), kind (text|brief|route|stop|map|finish),
          payload, created_at
Progress  route_id, started_at, current_stop, heard_stop_ids[], finished_at, distance_walked_m
Settings  language, playback_speed, autoplay_nearby, downloaded_route_ids[]
```

Relationships: Route 1-n Stop; Message refers to Route/Stop; Progress 1-1 Route.
v1 keeps everything on the phone (no accounts, no server) except "Ask the guide".

## The route (v1): Old Kuwait City — from the Gulf to the Souq

Based on the GPSmyCity downtown walk (source 3), re-ordered so the walk ends
where you can eat (the souq), Liberation Tower as an optional finale.

| # | stop | why |
| --- | --- | --- |
| 1 | National Assembly (exterior) | Jørn Utzon's building, the sail/tent roof on the Gulf |
| 2 | Kuwait National Museum | the country's story, the dhow, the planetarium |
| 3 | Sadu House | Bedouin weaving, the old mud-brick house |
| 4 | Seif Palace (exterior) & clock tower | seat of the Emir, blue-tiled tower |
| 5 | Grand Mosque | largest mosque in Kuwait (visit hours, dress code) |
| 6 | Souq Al-Mubarakiya | the old market: dates, spices, gold, food |
| 7 | Liberation Tower (optional) | symbol of 1991 liberation, seen from outside |

≈3.5 km, ≈2–2.5 h with listening. All facts to be verified per stop before recording.

## Feature matrix

See `features.csv`. Must 16, should 9, could 5, skip 5.

## Out of scope (cannot or should not be taken)

- Duet's name, icon, colours, wording, Anthropic branding.
- Duet's business features (connectors, payments, agent computer) — not relevant.
- Interior of Seif Palace and National Assembly: not open to the public; exterior stories only.
- Photos from other tour apps or Wikimedia without checking the licence.

## Size

Screens 12, flows 5, entities 5. Hard parts: (1) writing and checking the
content for 7 stops, (2) natural-sounding voice in the chosen language,
(3) GPS triggers + audio that keeps playing with the phone locked.
Size: M (a few weeks of part-time work) for a polished v1 in TestFlight.
