# Glyko roadmap

What we're building, in order. Tick items off as they're done.

## The user journey

Discover → landing page → sign up → consent → profile (6 questions) → first-meal walkthrough → daily loop (before reading → photo → confirm → reminder → after reading → spike) → history and ranking → weekly insights → settings → log out, export data or delete account.

## Phase 0: Make it work

- [ ] Add `ANTHROPIC_API_KEY` locally (`.env.local`) and on Vercel
- [ ] Run the 3 MVP tests with real photos (dosa, idli, keyboard)
- [x] Delete a logged meal (clears practice meals before a demo)
- [x] Open HEIC (iPhone) photos in desktop browsers

## Phase 1: Accounts and database

- [ ] Choose the backend (proposed: Supabase for login, database and photo storage)
- [ ] Sign up and log in
- [ ] Save meals per user in the database instead of the browser
- [ ] Move existing browser meals into the account on first login

## Phase 2: Entry experience

- [ ] Landing page
- [ ] Consent screen for health data
- [ ] Profile: name, age, sex, weight, diabetes medicines, food type

## Phase 3: Core loop, polished

- [ ] Home screen: today's meals and "Log a meal"
- [ ] Reminder about 2 hours after a meal to take the after-reading
- [ ] Meal history and meal detail
- [ ] Edit a logged meal

## Phase 4: Insights

- [ ] Weekly summary: biggest and smallest spikes
- [ ] Dishes that spike you most, across meals
- [ ] Spike trend over time

## Phase 5: Launch-ready

- [ ] Privacy policy and terms
- [ ] Export my data, delete my account
- [ ] Limit AI calls per user to control cost
- [ ] Error monitoring
- [ ] Installable on the phone home screen (PWA)

## Later

Hindi and regional languages, WhatsApp reminders, doctor report, CGM integration.

## Throughout

Privacy (India's DPDP Act: consent, minimum data, export and delete), safety wording (not medical advice), large text and high contrast, and tests for every feature.
