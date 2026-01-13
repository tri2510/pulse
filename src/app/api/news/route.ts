import { NextRequest, NextResponse } from 'next/server'
import Parser from 'rss-parser'

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ['media:content', 'media'],
      ['enclosure', 'enclosure'],
    ]
  }
})

// Sample fallback data in case RSS feeds fail
const SAMPLE_ARTICLES = [
  {
    id: 'sample-1',
    title: 'AI Revolution: How Machine Learning is Transforming Industries',
    description: 'Artificial intelligence continues to reshape sectors from healthcare to finance, with new breakthroughs announced daily.',
    url: 'https://example.com/ai-revolution',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'Tech Daily',
    category: 'technology',
    author: 'Jane Smith',
    importance: 85,
    views: 1247,
  },
  {
    id: 'sample-2',
    title: 'Global Markets Rally as Economic Indicators Show Growth',
    description: 'Stock markets worldwide reached new highs as latest economic data suggests continued global expansion.',
    url: 'https://example.com/markets-rally',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: 'Financial Times',
    category: 'business',
    author: 'Mark Johnson',
    importance: 78,
    views: 892,
  },
  {
    id: 'sample-3',
    title: 'Breakthrough in Quantum Computing Opens New Possibilities',
    description: 'Scientists achieve major milestone in quantum computing, bringing practical applications closer than ever.',
    url: 'https://example.com/quantum-breakthrough',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    source: 'Science News',
    category: 'science',
    author: 'Dr. Sarah Chen',
    importance: 92,
    views: 1534,
  },
  {
    id: 'sample-4',
    title: 'New Health Guidelines Released for Preventive Care',
    description: 'Health officials update recommendations for preventive screenings and wellness checkups.',
    url: 'https://example.com/health-guidelines',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: 'Health Watch',
    category: 'health',
    author: 'Dr. Michael Brown',
    importance: 71,
    views: 645,
  },
  {
    id: 'sample-5',
    title: 'Championship Finals Set After Dramatic Semifinals',
    description: 'In stunning upsets, underdogs advance to face defending champions in what promises to be an epic finale.',
    url: 'https://example.com/championship-finals',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    source: 'Sports Central',
    category: 'sports',
    author: 'Tom Davis',
    importance: 88,
    views: 2134,
  },
  {
    id: 'sample-6',
    title: 'Blockbuster Film Breaks Opening Weekend Records',
    description: 'The highly anticipated sequel exceeds expectations with unprecedented global box office performance.',
    url: 'https://example.com/blockbuster-records',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    source: 'Entertainment Weekly',
    category: 'entertainment',
    author: 'Lisa Wang',
    importance: 75,
    views: 1876,
  },
]

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
    console.log(`[RSS] Attempting to fetch: ${url}`)

    // First try to fetch the XML content directly
    const response = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      },
    })

    if (!response.ok) {
      console.log(`[RSS] Failed to fetch ${url}: ${response.status}`)
      return []
    }

    const xml = await response.text()
    console.log(`[RSS] Fetched ${xml.length} bytes from ${url}`)

    // Parse the XML
    const feed = await parser.parseString(xml)

    const items = feed.items || []
    console.log(`[RSS] Parsed ${items.length} items from ${url}`)

    return items.slice(0, 15).map((item: any, index: number) => {
      const publishedAt = new Date(item.pubDate || item.isoDate || Date.now())
      const description = (item.contentSnippet || item.content || '').toString().slice(0, 500)
      const contentLength = description.length
      const link = item.link || item.guid || ''

      // Create a unique ID using URL + category + index to avoid collisions
      const uniqueId = `${category}-${link}-${index}`

      return {
        id: Buffer.from(uniqueId).toString('base64'),
        title: item.title || 'Untitled',
        description: description,
        url: link,
        imageUrl: item.enclosure?.url || null,
        publishedAt: publishedAt.toISOString(),
        source: getSourceName(link),
        category: category,
        author: item.creator || item.author || null,
        importance: calculateImportance(publishedAt, contentLength, getSourceName(link)),
        views: Math.floor(Math.random() * 900) + 100,
      }
    })
  } catch (error: any) {
    console.log(`[RSS] Error fetching ${url}: ${error?.message || error}`)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'

    console.log(`[API] Fetching news for category: ${category}`)

    let allArticles: any[] = []

    const categoriesToFetch = category === 'all'
      ? Object.keys(RSS_SOURCES)
      : [category]

    // Fetch from RSS feeds in parallel with Promise.allSettled
    const fetchPromises: Promise<any[]>[] = []

    for (const cat of categoriesToFetch) {
      const feeds = RSS_SOURCES[cat as keyof typeof RSS_SOURCES] || []

      for (const feedUrl of feeds) {
        fetchPromises.push(fetchRSSFeed(feedUrl, cat))
      }
    }

    const results = await Promise.allSettled(fetchPromises)

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allArticles = allArticles.concat(result.value)
      }
    }

    console.log(`[API] Fetched ${allArticles.length} total articles`)

    // If no articles from RSS, use sample data
    if (allArticles.length === 0) {
      console.log('[API] No articles from RSS, using sample data')
      allArticles = SAMPLE_ARTICLES.filter(a =>
        category === 'all' || a.category === category
      )
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

    console.log(`[API] Returning ${articles.length} articles`)

    return NextResponse.json({
      articles,
      cached: false,
      count: articles.length,
      source: allArticles === SAMPLE_ARTICLES ? 'sample' : 'rss',
    })
  } catch (error) {
    console.error('[API] Error in news API:', error)

    // Return sample data on error
    return NextResponse.json({
      articles: SAMPLE_ARTICLES,
      cached: false,
      count: SAMPLE_ARTICLES.length,
      source: 'fallback',
      error: 'Using fallback data',
    })
  }
}
