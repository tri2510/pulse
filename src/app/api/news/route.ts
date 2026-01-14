import { NextRequest, NextResponse } from 'next/server'

// GDELT GKG API endpoint
const GDELT_GKG_API = 'https://api.gdeltproject.org/api/v2/doc/doc'

// Category to GDELT keyword mapping
const CATEGORY_KEYWORDS: Record<string, string> = {
  technology: 'technology',
  business: 'business economy finance',
  science: 'science research',
  health: 'health medical',
  sports: 'sports',
  entertainment: 'entertainment movies music',
  politics: 'politics election government',
  all: 'news',
}

async function fetchFromGDELT(category: string): Promise<any[]> {
  try {
    // Use a general query to get recent articles
    const keyword = CATEGORY_KEYWORDS[category] || 'news'
    const params = new URLSearchParams({
      mode: 'artlist',
      format: 'json',
      maxrecords: '250',
      query: `sourcelang:English ${keyword}`,
      sort: 'HybridRel'
    })

    const url = `${GDELT_GKG_API}?${params.toString()}`
    console.log(`[GDELT] Fetching: ${url}`)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.log(`[GDELT] Failed: ${response.status}`)
      return []
    }

    const text = await response.text()

    // Check if response is JSON (GDELT sometimes returns error text)
    if (!text.trim().startsWith('{')) {
      console.log(`[GDELT] Response is not JSON: ${text.slice(0, 100)}`)
      return []
    }

    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.log(`[GDELT] Failed to parse JSON: ${text.slice(0, 100)}`)
      return []
    }

    const articles = data.articles || []

    console.log(`[GDELT] Got ${articles.length} articles`)

    return articles.map((item: any, index: number) => {
      // Parse GDELT date format: YYYYMMDDTHHmmssZ
      let publishedAt = new Date()
      if (item.seendate) {
        try {
          // GDELT returns dates like "20251228T101500Z"
          const dateStr = item.seendate.replace('T', ' ').replace('Z', '')
          const year = dateStr.slice(0, 4)
          const month = dateStr.slice(4, 6)
          const day = dateStr.slice(6, 8)
          const hour = dateStr.slice(9, 11)
          const minute = dateStr.slice(11, 13)
          const second = dateStr.slice(13, 15)
          publishedAt = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`)
        } catch {
          publishedAt = new Date()
        }
      }

      // Calculate importance based on GDELT metrics
      let importance = 50
      if (item.tone) importance += (item.tone + 10) * 0.5
      if (item.goldsteinscale) importance += Math.abs(item.goldsteinscale) * 5
      importance = Math.round(Math.min(100, Math.max(0, importance)))

      return {
        id: `${category}-${index}-${item.url || index}`,
        title: item.title || 'Untitled',
        description: item.seenqty ? `${item.seenqty} mentions across global media` : null,
        url: item.url || '#',
        imageUrl: item.socialimage || null,
        publishedAt: publishedAt.toISOString(),
        source: item.domain || 'Unknown',
        category: category,
        author: null,
        importance,
        views: item.seenqty ? Math.min(item.seenqty * 10, 2000) : Math.floor(Math.random() * 900) + 100,
      }
    })
  } catch (error: any) {
    console.log(`[GDELT] Error: ${error?.message || error}`)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'

    console.log(`[API] Fetching GDELT news - category: ${category}`)

    // Fetch from GDELT
    const articles = await fetchFromGDELT(category)

    // Sort by importance
    articles.sort((a, b) => b.importance - a.importance)

    // Remove duplicates by URL
    const seen = new Set<string>()
    const uniqueArticles = articles.filter(article => {
      if (seen.has(article.url)) return false
      seen.add(article.url)
      return true
    })

    const resultArticles = uniqueArticles.slice(0, 100)

    console.log(`[API] Returning ${resultArticles.length} articles`)

    return NextResponse.json({
      articles: resultArticles,
      cached: false,
      count: resultArticles.length,
      source: 'gdelt',
    })
  } catch (error) {
    console.error('[API] Error:', error)

    return NextResponse.json({
      articles: [],
      cached: false,
      count: 0,
      source: 'error',
      error: 'Failed to fetch articles',
    })
  }
}
