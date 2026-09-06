import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

const ANIME_SYSTEM_PROMPT = `You are an anime expert chatbot and otaku guide. You MUST follow these rules:

RULE 1 — NEVER INTRODUCE YOURSELF or say "I'm MyNextAnime". The UI already greets the user. You just respond directly to their message as if you're mid-conversation. Never start with "Hi!" or "Hey!" if it's not the very beginning of the chat.

RULE 2 — RESPOND ONLY WITH A VALID JSON OBJECT. Do NOT output markdown formatting like \`\`\`json. Do not output plain text. Do not apologize outside of the JSON.
For conversation: {"type":"message","message":"your reply"}
For recommendations: {"type":"recommendations","message":"your comment about the picks","titles":["Anime Title 1","Anime Title 2"]}

RULE 3 — Be a natural, engaging otaku guide.
- Appreciate and relate to the user's inputs. If they mention an anime (even with spelling mistakes), acknowledge it, validate their taste, and build on it.
- UNKNOWN ANIME: If the user asks about an anime title you don't recognize (it might be a brand new release or indie title), DO NOT break character or format. Just politely reply inside the JSON "message" field that you might not have the latest info on that exact title, and offer to recommend similar ones based on its genre.
- Never just ask a generic question. Always react to what they said first.

RULE 4 — Triggering Recommendations:
- If they ask for recommendations (e.g. "suggest rom com animes", "isekai - show the list", "more like this"), ALWAYS use the "recommendations" type.
- When using "recommendations", the "message" should be a natural lead-in (e.g., "Since you enjoyed Solo Leveling, here are some of the most popular Isekai and adventure anime you'll love!"). 
- Do NOT include the recommended anime titles in the "message" string itself. Put them ONLY in the "titles" array (3 to 8 real, accurate titles).`

const EXTRACT_SYSTEM_PROMPT = `You are an anime recommendation engine. Based on the conversation below, extract the user's preferences and output a valid JSON array of objects representing real anime that best match.

Rules:
- Output ONLY a valid JSON array of objects. No markdown, no backticks, no explanation.
- Each object MUST have this exact structure:
  {
    "title": "Anime Title",
    "synopsis": "A short 1-2 sentence description.",
    "genres": ["Genre1", "Genre2"],
    "score": 8.5
  }
- Limit to 1-3 matches for specific requests, up to 10 for broad requests. NEVER exceed 10.
- Only recommend real, existing anime.
- If excludeTitles are provided, do NOT include any of those titles.

Example output:
[
  {
    "title": "Shigatsu wa Kimi no Uso",
    "synopsis": "A piano prodigy loses his ability to hear the piano after his mother's death, but his life changes when he meets a free-spirited violinist.",
    "genres": ["Drama", "Romance", "Music"],
    "score": 8.8
  }
]`

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Shared: verify titles via Jikan → AniList → Kitsu → Wiki fallback ───
async function verifyTitles(titles: string[]) {
  const verifiedAnime = []
  let jikanDown = false
  let anilistDown = false

  for (const title of titles) {
    let resolved = false

    // Try Jikan first (skip if already known to be down)
    if (!jikanDown) {
      try {
        const jikanRes = await fetch(
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`,
          { signal: AbortSignal.timeout(3000) }
        )
        const data = await jikanRes.json()
        if (data.status === 504 || data.error) throw new Error('Jikan Down')

        if (data.data && data.data.length > 0) {
          const anime = data.data[0]
          verifiedAnime.push({
            mal_id: anime.mal_id,
            title: anime.title,
            poster_url: anime.images?.jpg?.image_url || anime.images?.webp?.image_url,
            score: anime.score || null,
            genres: anime.genres?.map((g: { name: string }) => g.name) || [],
            synopsis: anime.synopsis || '',
            source: 'Jikan',
          })
          resolved = true
          console.log(`✓ [Jikan] ${title}`)
        }
      } catch {
        console.warn(`✗ [Jikan] ${title} failed, skipping Jikan for remaining...`)
        jikanDown = true
      }
    }

    // Fallback to AniList
    if (!resolved && !anilistDown) {
      try {
        const query = `
          query ($search: String) {
            Media(search: $search, type: ANIME) {
              id
              idMal
              title { romaji english }
              coverImage { large }
              averageScore
              genres
              description(asHtml: false)
            }
          }
        `
        const aniRes = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables: { search: title } }),
          signal: AbortSignal.timeout(4000)
        })
        const json = await aniRes.json()
        if (json.errors) {
          console.warn(`[AniList Error]:`, json.errors[0]?.message)
          throw new Error('AniList Down')
        }

        const media = json.data?.Media
        if (media) {
          verifiedAnime.push({
            mal_id: media.idMal || media.id,
            title: media.title.english || media.title.romaji || title,
            poster_url: media.coverImage?.large,
            score: media.averageScore ? media.averageScore / 10 : null,
            genres: media.genres || [],
            synopsis: media.description?.replace(/<[^>]*>?/gm, '') || '',
            source: 'AniList',
          })
          resolved = true
          console.log(`✓ [AniList] ${title}`)
        }
      } catch (err) {
        console.warn(`✗ [AniList] ${title} failed:`, err instanceof Error ? err.message : err)
        anilistDown = true
      }
    }

    // Fallback to Kitsu
    if (!resolved) {
      try {
        const kitsuRes = await fetch(`https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(title)}&include=genres`, {
          signal: AbortSignal.timeout(3000)
        })
        const kitsuData = await kitsuRes.json()

        if (kitsuData.data && kitsuData.data.length > 0) {
          const anime = kitsuData.data[0]

          // Map Kitsu genres
          let genres: string[] = []
          if (anime.relationships?.genres?.data && kitsuData.included) {
            const genreIds = anime.relationships.genres.data.map((g: { id: string }) => g.id)
            genres = kitsuData.included
              .filter((i: { type: string, id: string }) => i.type === 'genres' && genreIds.includes(i.id))
              .map((i: { attributes: { name: string } }) => i.attributes.name)
          }

          verifiedAnime.push({
            mal_id: parseInt(anime.id),
            title: anime.attributes.canonicalTitle || anime.attributes.titles?.en || title,
            poster_url: anime.attributes.posterImage?.large || anime.attributes.posterImage?.original,
            score: anime.attributes.averageRating ? (parseFloat(anime.attributes.averageRating) / 10) : null,
            genres: genres,
            synopsis: anime.attributes.synopsis || anime.attributes.description || '',
            source: 'Kitsu',
          })
          resolved = true
          console.log(`✓ [Kitsu] ${title}`)
        }
      } catch (err) {
        console.warn(`✗ [Kitsu] ${title} failed:`, err instanceof Error ? err.message : err)
      }
    }

    // ULTIMATE FALLBACK: Wikipedia for images/summary
    if (!resolved) {
      let posterUrl = null
      let wikiSynopsis = ''

      try {
        let wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title + ' (anime)')}`, { signal: AbortSignal.timeout(2000) })
        if (!wikiRes.ok) {
          wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { signal: AbortSignal.timeout(2000) })
        }
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json()
          posterUrl = wikiData.thumbnail?.source || null
          wikiSynopsis = wikiData.extract || ''
        }
      } catch {
        console.warn(`✗ [Wikipedia] Image fetch failed for ${title}`)
      }

      verifiedAnime.push({
        mal_id: Math.abs(title.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)),
        title: title,
        poster_url: posterUrl,
        score: null,
        genres: [],
        synopsis: wikiSynopsis || 'No synopsis available right now.',
        source: 'AI Fallback + Wiki',
      })
      console.log(`✓ [AI Fallback + Wiki] ${title}`)
    }

    // Delay for rate-limiting only if APIs are working
    if (!jikanDown) await delay(400)
    else if (!anilistDown) await delay(100)
  }

  return verifiedAnime
}

// ─── Parse the AI's JSON envelope response ───
function parseAIResponse(raw: string): { type: 'message' | 'recommendations'; message: string; titles?: string[] } {
  // Default fallback
  const fallback = { type: 'message' as const, message: raw }

  try {
    // Try direct parse
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.type && parsed.message) {
      return {
        type: parsed.type === 'recommendations' ? 'recommendations' : 'message',
        message: String(parsed.message),
        titles: Array.isArray(parsed.titles) ? parsed.titles.map(String) : undefined,
      }
    }
    return fallback
  } catch {
    // Try extracting JSON from surrounding text (some models wrap in markdown)
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (parsed && parsed.type && parsed.message) {
          return {
            type: parsed.type === 'recommendations' ? 'recommendations' : 'message',
            message: String(parsed.message),
            titles: Array.isArray(parsed.titles) ? parsed.titles.map(String) : undefined,
          }
        }
      } catch {
        // fall through
      }
    }
    // If all parsing fails, treat the raw text as a plain message
    return fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, excludeTitles } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    // MODE: chat — unified conversational + recommendation flow
    if (mode === 'chat') {
      // Filter out the static UI greeting — the AI didn't generate it,
      // so including it confuses the model into re-introducing itself.
      const filteredMessages = messages.filter((m: { role: string; content: string }) => {
        // Skip the hardcoded greeting message from the UI
        if (m.role === 'assistant' && m.content.includes('What anime are you into, or what are you in the mood for?')) {
          return false
        }
        return true
      })

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: ANIME_SYSTEM_PROMPT },
          ...filteredMessages,
        ],
        model: 'qwen/qwen3.8-27b',
        temperature: 0.6,
        max_tokens: 500,
      })

      const rawReply = completion.choices[0]?.message?.content || '{"type":"message","message":"What anime are you into? I\'d love to help you find something great to watch!"}'
      console.log('AI Raw Reply:', rawReply)

      const parsed = parseAIResponse(rawReply)

      // If it's a recommendation response, verify the titles
      if (parsed.type === 'recommendations' && parsed.titles && parsed.titles.length > 0) {
        const titlesToVerify = parsed.titles.slice(0, 10)
        const verifiedResults = await verifyTitles(titlesToVerify)

        // Sort by rating
        const sorted = verifiedResults.sort(
          (a, b) => (b.score ?? 0) - (a.score ?? 0)
        )

        return NextResponse.json({
          type: 'recommendations',
          reply: parsed.message,
          results: sorted,
        })
      }

      // Normal message response
      return NextResponse.json({
        type: 'message',
        reply: parsed.message,
      })
    }

    // MODE: recommend — manual button fallback (extract titles from conversation)
    if (mode === 'recommend') {
      const conversationSummary = messages
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
        .join('\n')

      const excludeNote = excludeTitles && excludeTitles.length > 0
        ? `\n\nIMPORTANT: Do NOT include any of these already-recommended titles: ${JSON.stringify(excludeTitles)}`
        : ''

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
          { role: 'user', content: conversationSummary + excludeNote },
        ],
        model: 'qwen/qwen3.8-27b',
        temperature: 0.7,
        max_tokens: 1500,
      })

      const aiResponse = completion.choices[0]?.message?.content || '[]'
      console.log('AI Raw Response:', aiResponse)

      type LLMAnime = { title?: string; synopsis?: string; genres?: string[]; score?: number }
      let aiAnimeList: LLMAnime[] = []

      // Strategy 1: Direct JSON parse
      try {
        const parsed = JSON.parse(aiResponse)
        if (Array.isArray(parsed)) {
          aiAnimeList = parsed
        } else if (parsed && typeof parsed === 'object') {
          const firstArrayValue = Object.values(parsed).find(Array.isArray) as unknown[]
          if (firstArrayValue) aiAnimeList = firstArrayValue as LLMAnime[]
        }
      } catch {
        // Strategy 2: Extract JSON array from surrounding text
        const match = aiResponse.match(/\[[\s\S]*?\]/)
        if (match) {
          try {
            aiAnimeList = JSON.parse(match[0])
          } catch {
            console.error('Failed AI Response Parsing')
          }
        }
      }

      // Filter out invalid items
      aiAnimeList = aiAnimeList.filter(a => a && typeof a.title === 'string').slice(0, 10)

      if (aiAnimeList.length === 0) {
        console.error('Could not extract any titles from:', aiResponse)
        return NextResponse.json({ error: 'Could not understand AI response. Try rephrasing your request!' }, { status: 500 })
      }

      const titles = aiAnimeList.map(a => a.title!)
      const verifiedAnime = await verifyTitles(titles)

      if (verifiedAnime.length === 0) {
        return NextResponse.json(
          { error: 'Could not generate any anime. Please try again.' },
          { status: 503 }
        )
      }

      return NextResponse.json({ results: verifiedAnime })
    }

    return NextResponse.json({ error: 'Invalid mode. Use "chat" or "recommend".' }, { status: 400 })
  } catch (error) {
    const err = error as Error
    console.error('Recommend API Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
