# SpikeCheck

See how much each everyday Indian meal spikes your blood sugar, and rank your meals against each other, using your own glucometer readings.

> For personal tracking, not medical advice.

## Job to be done

> When I've just eaten an everyday Indian meal and checked my blood sugar, I want to see how much that meal spiked me and how my meals rank against each other, so I can choose what to eat from my own data instead of guessing.

**User:** an adult in India with type 2 diabetes who owns a glucometer and eats home-cooked Indian food.

### The 3 tests the MVP must pass

1. I enter my before-meal reading and snap a photo of my meal, and **within 15 seconds** see the dish names and portions, which I can confirm or edit.
2. I enter my after-meal reading and see **the spike for that meal (after − before)**, plus **a ranking of all my logged meals by spike**, each with **one swap suggestion**.
3. If the photo isn't food or can't be recognised, I see **a clear error message and no made-up dishes**.

**Out of scope:** CGM integration, doctor dashboard, regional language support, accounts, cloud database.

## Current workflow → future workflow

| | Today (without SpikeCheck) | With SpikeCheck |
|---|---|---|
| Before eating | Prick finger, read the number, maybe write it in a notebook | Type the number into the app |
| The meal | Rely on memory ("I think it was 2 rotis and dal") | Snap a photo; AI lists dishes and portions; you fix anything wrong |
| After eating | Prick finger again; mentally subtract, if at all | Type the number; the app shows the spike straight away |
| Comparing meals | Flip through notebook pages, guess which meal was worse | One list of every meal, ranked from highest to lowest spike |
| Deciding what to eat next | Generic advice ("eat less rice") | One specific swap for *your* meal, next to *your* measured spike |

## Architecture: Input → AI → Logic → Action → Output

One Next.js page moves through four stages. Two server routes call Claude, so the API key never reaches the phone.

| Stage | Input | AI | Logic (plain code) | Action | Output |
|---|---|---|---|---|---|
| **1. Before reading** | Glucometer number (mg/dL) | none | Whole number, 20–600 | Kept with the meal being logged | "Take photo" button |
| **2. Photo** (Tests 1, 3) | One meal photo | **#1 Recognise meal** (Claude Sonnet 5.5, image → fixed JSON) | Shrink the photo to 1024 px in the browser; reject non-images or files over 5 MB; 12 s time limit; return dishes **only** if the AI says `ok` with at least one dish | Show dishes to check, or an error (nothing saved yet) | Editable dishes labelled "AI's guess, please check", unsure ones highlighted, a "Recognised in X s" timer. **Or** a clear error with "Try another photo" / "Type dishes yourself" |
| **3. Confirm** (Test 1) | Your edits: rename, change portion, delete, add | none | At least one dish; no blank names | Save the meal as "waiting for after-reading" in browser storage | "Check your sugar about 2 hours after you started eating" |
| **4. After reading** (Test 2) | Glucometer number | **#2 One swap** (Claude Haiku 5.5, text → one sentence) | Same 20–600 check; **spike = after − before**; sort all meals highest spike first | Save the finished meal and its swap | "+60 mg/dL (measured)" plus the ranked list, each meal with an "AI suggestion" swap |

### Files

| File | What it does |
|---|---|
| `app/page.tsx` | The one screen: all four stages |
| `components/DishEditor.tsx` | Editable dish list (rename, portion, delete, add, "not sure" highlight) |
| `components/MealRanking.tsx` | Ranked list with spikes, swaps and Retry |
| `lib/meals.ts` | Reading check, spike maths, ranking, saving to browser storage |
| `lib/resizeImage.ts` | Shrinks the photo before upload |
| `app/api/analyze-meal/route.ts` | AI call #1 plus the safety net |
| `app/api/swap/route.ts` | AI call #2 |

## Where AI is used, and why

| Step | AI or plain code | Why |
|---|---|---|
| Recognise dishes and portions from a photo | **AI** | No simple rule can turn a photo into "rajma, 1 katori". Home food varies endlessly in dishes and plating. |
| One swap suggestion | **AI** | A lookup table ("white rice → half rice") covers about 20 common dishes but fails on combinations like bhindi + bajra roti + chaas. |
| Reading checks, spike maths, ranking, saving, photo shrinking, the safety net, every screen | **Plain code** | These have exact right answers. AI would only add cost, delay and the chance of being wrong. |

## What stays human

- **Measuring blood sugar.** You type both readings from your own glucometer. The app never estimates blood sugar.
- **When to measure.** The app suggests about 2 hours after eating but doesn't enforce it.
- **Checking the meal.** Every dish and portion is editable, and nothing is saved until you tap "Looks right". You can skip the AI and type dishes yourself.
- **Deciding what to eat.** The swap is a suggestion, labelled as one.

## Why these tools

| Tool | Why |
|---|---|
| **Next.js** | One project holds both the screen and the small server routes that keep the API key secret. Deploys to Vercel in one step. |
| **Claude Sonnet 5.5** (photo) | Strong at reading images, and fast enough for the 15-second limit at low effort. |
| **Claude Haiku 5.5** (swap) | One short sentence is a tiny task; Haiku is the fastest and cheapest. |
| **Structured output (Zod schema)** | Claude must answer in a fixed shape (`status` + `dishes`), so the code never has to interpret free text. |
| **Browser storage (localStorage)** | No accounts, no database to set up. The catch: history lives on one phone or browser. |

## Failure cases

| What goes wrong | What you see |
|---|---|
| Reading empty, not a number, or outside 20–600 | The button stays disabled, with a hint |
| Photo the browser can't open (corrupt file, or HEIC on desktop Chrome) | "Couldn't open this photo. Try a JPG or take a new one." |
| Not an image, or over 5 MB | "Please upload a photo of your meal." and no dishes |
| Not food | "This doesn't look like food. Please take a photo of your meal." and no dishes |
| Too blurry or dark to tell | "We couldn't recognise this meal…" and no dishes |
| No internet, timeout, or the AI is busy | A "try again" message and no dishes |
| API key missing or wrong | "The app isn't set up yet (missing API key)." |
| AI gets a dish or portion wrong | Every dish is editable and labelled as a guess; unsure dishes are highlighted |
| AI misses a dish | "+ Add dish" |
| AI calls real food "not food" | "Type dishes yourself instead" |
| Swap request fails | "Swap unavailable" with a Retry button. The meal and spike are still saved |
| After-reading is lower than before | Not an error: shown as, for example, −10 and ranked at the bottom |
| Saved data is broken | The app starts fresh and says so |

**The safety net for Test 3 is plain code, not a prompt.** The server returns dishes only when Claude answers `status: "ok"` with at least one dish. Every other path returns an empty list, so a made-up dish can't reach the screen even if the AI misbehaves.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer and a Claude API key from [console.anthropic.com](https://console.anthropic.com/settings/keys).

1. Get the code and install it:
   ```bash
   git clone https://github.com/bhadarsingh-star/spikecheck.git
   cd spikecheck
   npm install
   ```
2. Create a file called `.env.local` in the project folder containing this one line, with your real key after the `=`:
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```
   `.env.local` is listed in `.gitignore`, so your key is never committed.
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 and enter a before-meal reading such as `110`.

To deploy, import the repo into [Vercel](https://vercel.com) and add `ANTHROPIC_API_KEY` under Settings → Environment Variables.

## Status

- **Checked:** the app builds; spike maths and ranking are correct (110 → 170 gives +60, 108 → 135 gives +27, ranked in that order); history survives a page reload; with no API key, a photo shows a clear error and no dishes.
- **Not yet checked with real photos and a real API key:** recognition speed (Test 1), swap suggestions (Test 2), and the "not food" message for a non-food photo (Test 3).
- **Known gaps:** no way to delete a logged meal; history stays in one browser; HEIC photos don't open in desktop Chrome.
