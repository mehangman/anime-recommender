# MyNextAnime — Project Spec (for Antigravity)

Reference doc with every decision locked in. Paste the prompt at the bottom into Antigravity to start the build; keep this file in the repo root as `SPEC.md` so future agent tasks can reference it.

## Project facts

| | |
|---|---|
| Site/brand name | **MyNextAnime** |
| GitHub repo name | `anime-recommender` |
| Vercel project name | `mynextanime` (must match to get the URL below) |
| Live URL | `mynextanime.vercel.app` |
| License | MIT |
| Repo description | "AI-powered anime recommendation site — describe a mood or genre, get matched anime with posters, ratings, and a personal watchlist." |

## Stack (all free tier)

- **Frontend/backend**: Next.js 14, App Router
- **Auth + database**: Supabase (Postgres + built-in Auth)
- **Anime data**: Jikan API (`api.jikan.moe`, no key, ~3 req/sec)
- **AI request understanding**: Groq API (`api.groq.com`, free tier, model `llama-3.3-70b-versatile`)
- **Hosting**: Vercel free Hobby tier
- **IDE**: Google Antigravity (local)

## Environment variables

```
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
Never hardcoded. Groq key used server-side only (`/api/recommend` route) — never exposed to the browser.

## Database schema (Supabase SQL editor)

```sql
create table anime_list (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  mal_id integer not null,
  title text not null,
  poster_url text,
  score numeric,
  genres text[],
  synopsis text,
  added_at timestamp with time zone default now(),
  unique(user_id, mal_id)
);

alter table anime_list enable row level security;

create policy "Users manage their own list"
  on anime_list for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
Enable **Email** auth provider in Supabase (magic link or password).

## Feature list

1. **Auth**: Signup/login via Supabase Auth (email). Logged-out users see `/login`; logged-in users can reach `/app` and `/saved`.
2. **Search** (`/app`): Free-text box for mood/genre/liked-show description.
   - On submit → `/api/recommend` (server route): Groq returns a JSON array of 6 real anime titles → server looks each up via Jikan (`/anime?q=<title>&limit=1`), ~400ms between calls to respect rate limits → returns verified anime objects to the client.
   - Render as a card grid: poster, title, score, genres, "Show more" button that expands the synopsis inline (no page navigation).
   - Each card has an "Add to my list" button.
3. **Add to list**: Inserts a row into `anime_list` scoped to the logged-in user via Supabase RLS.
4. **Saved list** (`/saved`): Reads and displays the current user's saved rows; remove button deletes the row.
5. **States**: loading spinners for search and add actions; clear error messages for failed AI calls, failed Jikan lookups, invalid/expired auth session, and duplicate-add attempts (unique constraint).
6. **Responsive**: mobile-first, works down to ~360px width.

## Non-negotiables

- RLS must be on — never trust the client to filter by `user_id`.
- Groq key stays server-side.
- Jikan calls are paced, not fired in parallel.
- No hardcoded secrets anywhere in the committed code.

---

## Prompt to paste into Antigravity

```
Build a Next.js 14 (App Router) project called "MyNextAnime" — an anime
recommendation site. Read SPEC.md in the repo root first for the full
schema, env vars, and feature list, then implement it exactly as
described there.

Summary of what to build:
- Supabase email auth protecting /app and /saved routes.
- A search page where a user describes a mood/genre/liked show in plain
  text. Submitting calls a server route that asks Groq for 6 real anime
  titles matching the request, then verifies each one against the Jikan
  API before returning them to the client — never show an unverified
  title.
- Results render as cards (poster, title, score, genres) with a "Show
  more" toggle for the full synopsis, and an "Add to my list" button.
- Adding a title inserts a row into the anime_list Supabase table
  scoped to the logged-in user (RLS enforced, see SPEC.md for the exact
  schema and policy).
- A /saved page lists the current user's saved anime with a remove
  button.
- Handle loading and error states throughout: failed AI calls, failed
  Jikan lookups, auth errors, duplicate adds.
- Clean, modern, mobile-responsive UI.
- Use environment variables for GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY — Groq calls must happen server-side
  only. Do not hardcode any secret.
- Set up the repo with an MIT LICENSE file and the description:
  "AI-powered anime recommendation site — describe a mood or genre, get
  matched anime with posters, ratings, and a personal watchlist."

Give me a task plan before you start writing code, and check in after
the auth flow and after the search flow are working before moving on
to the saved-list feature.
```
