import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Parser from 'rss-parser'
import ZAI from 'z-ai-web-dev-sdk'

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
  views: number,
  source: string,
  contentLength: number
): number {
  const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60)

  let score = 0

  score += Math.max(0, 10 - hoursAgo) * 10

  score += Math.log10(views + 1) * 5

  score += contentLength / 100

  const premiumSources = ['nytimes.com', 'theverge.com', 'wsj.com']
  if (premiumSources.some(s => source.includes(s))) {
    score *= 1.2
  }

  return Math.round(score * 100) / 100
}

async function fetchRSSFeed(url: string): Promise<any[]> {
  try {
    const feed = await parser.parseURL(url)
    return feed.items.slice(0, 20).map((item: any) => ({
      title: item.title || 'Untitled',
      description: item.contentSnippet || item.content || null,
      url: item.link || item.guid,
      imageUrl: item.enclosure?.url || null,
      publishedAt: new Date(item.pubDate || Date.now()),
      source: getSourceName(item.link || item.guid),
      author: item.creator || null,
      content: item.content || null,
    }))
  } catch (error) {
    console.error(`Error fetching RSS feed ${url}:`, error)
    return []
  }
}

async function fetchWebSearchNews(category: string): Promise<any[]> {
  try {
    const zai = await ZAI.create()

    const query = category === 'all'
      ? 'latest news today trending'
      : `latest ${category} news today trending`

    const results = await zai.functions.invoke('web_search', {
      query: query,
      num: 10,
    })

    if (!Array.isArray(results) || results.length === 0) {
      return []
    }

    return results.slice(0, 10).map((result: any) => ({
      title: result.name || 'Untitled',
      description: result.snippet || null,
      url: result.url || '',
      imageUrl: null,
      publishedAt: new Date(result.date || Date.now()),
      source: getSourceName(result.url || ''),
      author: null,
      content: null,
    }))
  } catch (error) {
    console.error('Error fetching web search news:', error)
    return []
  }
}

async function getCachedArticles(category: string): Promise<any[]> {
  const whereClause: any = {}

  if (category !== 'all') {
    whereClause.category = category
  }

  const hoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000)

  const cached = await db.newsArticle.findMany({
    where: {
      ...whereClause,
      fetchedAt: {
        gte: hoursAgo,
      },
    },
    orderBy: [
      { importance: 'desc' },
      { publishedAt: 'desc' },
    ],
    take: 50,
  })

  return cached
}

async function saveArticlesToDB(articles: any[]): Promise<void> {
  for (const article of articles) {
    const category = article.category || categorizeArticle(article.title, article.description || '')

    const existing = await db.newsArticle.findUnique({
      where: { url: article.url },
    })

    if (!existing) {
      await db.newsArticle.create({
        data: {
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          imageUrl: article.imageUrl,
          source: article.source,
          category: category,
          author: article.author,
          publishedAt: article.publishedAt,
          importance: 0,
          views: Math.floor(Math.random() * 1000) + 100,
        },
      })
    } else {
      const contentLength = (article.description?.length || 0) + (article.content?.length || 0)
      const importance = calculateImportance(
        existing.publishedAt,
        existing.views + 1,
        existing.source,
        contentLength
      )

      await db.newsArticle.update({
        where: { id: existing.id },
        data: {
          views: existing.views + 1,
          importance,
        },
      })
    }
  }
}

async function updateArticleImportance(): Promise<void> {
  const articles = await db.newsArticle.findMany({
    where: {
      fetchedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  })

  for (const article of articles) {
    const contentLength = (article.description?.length || 0) + (article.content?.length || 0)
    const importance = calculateImportance(
      article.publishedAt,
      article.views,
      article.source,
      contentLength
    )

    await db.newsArticle.update({
      where: { id: article.id },
      data: { importance },
    })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const forceRefresh = searchParams.get('refresh') === 'true'

    const cached = await getCachedArticles(category)

    if (cached.length > 10 && !forceRefresh) {
      await updateArticleImportance()
      return NextResponse.json({
        articles: cached,
        cached: true,
      })
    }

    let allArticles: any[] = []

    const categoriesToFetch = category === 'all'
      ? Object.keys(RSS_SOURCES)
      : [category]

    for (const cat of categoriesToFetch) {
      const feeds = RSS_SOURCES[cat as keyof typeof RSS_SOURCES] || []

      for (const feedUrl of feeds) {
        const feedArticles = await fetchRSSFeed(feedUrl)
        allArticles = allArticles.concat(feedArticles)
      }
    }

    if (allArticles.length < 20) {
      const webSearchArticles = await fetchWebSearchNews(category)
      allArticles = allArticles.concat(webSearchArticles)
    }

    allArticles = allArticles.map(article => ({
      ...article,
      category: article.category || categorizeArticle(article.title, article.description || ''),
    }))

    await saveArticlesToDB(allArticles)

    const articles = await getCachedArticles(category)

    return NextResponse.json({
      articles,
      cached: false,
    })
  } catch (error) {
    console.error('Error in news API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news', articles: [] },
      { status: 500 }
    )
  }
}
