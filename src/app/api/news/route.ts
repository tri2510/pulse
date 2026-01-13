import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

const parser = new Parser()

const RSS_SOURCES = {
  technology: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.macrumors.com/MacRumors-All',
  ],
  business: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',
    'https://feeds.a.dj.com/rss/RSSMarketsMain.xml',
  ],
  science: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
    'https://feeds.feedburner.com/NewScientist',
  ],
  health: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
  ],
  sports: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
    'https://www.espn.com/espn/rss/news',
  ],
  entertainment: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml',
    'https://feeds.feedburner.com/variety/headlines',
  ],
  politics: [
    'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
  ],
}

const SOURCE_NAMES: Record<string, string> = {
  'www.nytimes.com': 'New York Times',
  'www.theverge.com': 'The Verge',
  'www.macrumors.com': 'MacRumors',
  'feeds.a.dj.com': 'Wall Street Journal',
  'www.newscientist.com': 'New Scientist',
  'www.espn.com': 'ESPN',
  'feeds.feedburner.com': 'Variety',
}

function getSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return SOURCE_NAMES[hostname] || hostname.replace('www.', '').split('.')[0]
  } catch {
    return 'Unknown'
  }
}

function categorizeArticle(title: string, description: string): string {
  const content = `${title} ${description}`.toLowerCase()

  const techKeywords = ['technology', 'tech', 'software', 'hardware', 'ai', 'app', 'digital', 'cyber', 'comput', 'smartphone', 'internet']
  const businessKeywords = ['market', 'stock', 'economy', 'business', 'financial', 'trade', 'invest', 'company', 'corporate']
  const scienceKeywords = ['science', 'research', 'study', 'scientist', 'discovery', 'space', 'physics', 'biology', 'chemistry']
  const healthKeywords = ['health', 'medical', 'disease', 'covid', 'virus', 'doctor', 'hospital', 'medicine', 'drug']
  const sportsKeywords = ['sport', 'game', 'team', 'player', 'coach', 'match', 'championship', 'olympic', 'world cup']
  const entertainmentKeywords = ['movie', 'film', 'music', 'celebrity', 'actor', 'director', 'tv', 'show', 'entertainment']
  const politicsKeywords = ['politic', 'government', 'election', 'president', 'congress', 'senate', 'policy', 'law', 'vote']

  if (techKeywords.some(k => content.includes(k))) return 'technology'
  if (businessKeywords.some(k => content.includes(k))) return 'business'
  if (scienceKeywords.some(k => content.includes(k))) return 'science'
  if (healthKeywords.some(k => content.includes(k))) return 'health'
  if (sportsKeywords.some(k => content.includes(k))) return 'sports'
  if (entertainmentKeywords.some(k => content.includes(k))) return 'entertainment'
  if (politicsKeywords.some(k => content.includes(k))) return 'politics'

  return 'general'
}

function calculateImportance(
  pubDate: Date,
  contentLength: number,
  source: string
): number {
  const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60)

  let score = 0

  // Recency score (more recent = higher score)
  score += Math.max(0, 50 - hoursAgo) * 1.5

  // Content length score
  score += Math.min(contentLength / 50, 20)

  // Premium source boost
  const premiumSources = ['nytimes.com', 'theverge.com', 'wsj.com']
  if (premiumSources.some(s => source.includes(s))) {
    score += 15
  }

  return Math.round(Math.min(score, 100))
}

async function fetchRSSFeed(url: string, category: string): Promise<any[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const feed = await parser.parseURL(url, {
      timeout: 10000,
      signal: controller.signal as any,
    })
    clearTimeout(timeoutId)

    return feed.items.slice(0, 15).map((item: any) => {
      const publishedAt = new Date(item.pubDate || Date.now())
      const description = item.contentSnippet || item.content || ''
      const contentLength = description.length

      return {
        id: Buffer.from(item.link || item.guid || '').toString('base64').slice(0, 20),
        title: item.title || 'Untitled',
        description: description.slice(0, 500),
        url: item.link || item.guid || '',
        imageUrl: item.enclosure?.url || item['media:content']?.$?.url || null,
        publishedAt: publishedAt.toISOString(),
        source: getSourceName(item.link || item.guid || ''),
        category: category,
        author: item.creator || null,
        importance: calculateImportance(publishedAt, contentLength, getSourceName(item.link || '')),
        views: Math.floor(Math.random() * 900) + 100,
      }
    })
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'

    let allArticles: any[] = []

    const categoriesToFetch = category === 'all'
      ? Object.keys(RSS_SOURCES)
      : [category]

    // Fetch from RSS feeds
    for (const cat of categoriesToFetch) {
      const feeds = RSS_SOURCES[cat as keyof typeof RSS_SOURCES] || []

      for (const feedUrl of feeds) {
        const feedArticles = await fetchRSSFeed(feedUrl, cat)
        allArticles = allArticles.concat(feedArticles)
      }
    }

    // Sort by importance
    allArticles.sort((a, b) => b.importance - a.importance)

    // Remove duplicates by URL
    const seen = new Set<string>()
    const uniqueArticles = allArticles.filter(article => {
      if (seen.has(article.url)) return false
      seen.add(article.url)
      return true
    })

    // Limit to 50 articles
    const articles = uniqueArticles.slice(0, 50)

    return NextResponse.json({
      articles,
      cached: false,
      count: articles.length,
    })
  } catch (error) {
    console.error('Error in news API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news', articles: [], count: 0 },
      { status: 500 }
    )
  }
}
