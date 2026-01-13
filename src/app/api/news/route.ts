import { NextRequest, NextResponse } from 'next/server'

// GDELT GKG API endpoint
const GDELT_GKG_API = 'https://api.gdeltproject.org/api/v2/doc/doc'

// Sample fallback data when GDELT fails
const SAMPLE_ARTICLES_EN = [
  {
    id: 'sample-en-1',
    title: 'AI Revolution: How Machine Learning is Transforming Industries',
    description: 'Artificial intelligence continues to reshape sectors from healthcare to finance.',
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
    id: 'sample-en-2',
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
    id: 'sample-en-3',
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
    id: 'sample-en-4',
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
    id: 'sample-en-5',
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
]

const SAMPLE_ARTICLES_VI = [
  {
    id: 'sample-vi-1',
    title: 'Cách mạng AI: Trí tuệ nhân tạo đang thay đổi ngành công nghiệp như thế nào',
    description: 'Trí tuệ nhân tạo tiếp tục định hình lại các ngành từ y tế đến tài chính, với những đột phá mới được công bố hàng ngày.',
    url: 'https://example.com/ai-cach-mang',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'Tech Daily Việt Nam',
    category: 'technology',
    author: 'Minh Anh',
    importance: 85,
    views: 1247,
  },
  {
    id: 'sample-vi-2',
    title: 'Thị trường tài chính toàn cầu tăng mạnh khi các chỉ báo kinh tế cho thấy tăng trưởng',
    description: 'Thị trường chứng khoán trên toàn thế giới đạt mức cao mới khi dữ liệu kinh tế mới nhất cho thấy sự mở rộng toàn cầu tiếp tục.',
    url: 'https://example.com/thi-truong-tang',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: 'Financial Times Việt Nam',
    category: 'business',
    author: 'Hoàng Nam',
    importance: 78,
    views: 892,
  },
  {
    id: 'sample-vi-3',
    title: 'Đột phá trong máy tính lượng tử mở ra những khả năng mới',
    description: 'Các nhà khoa học đạt cột mốc quan trọng trong máy tính lượng tử, đưa các ứng dụng thực tế đến gần hơn bao giờ hết.',
    url: 'https://example.com/luong-tu',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    source: 'Science News Việt Nam',
    category: 'science',
    author: 'Dr. Thanh Mai',
    importance: 92,
    views: 1534,
  },
  {
    id: 'sample-vi-4',
    title: 'Hướng dẫn chăm sóc sức khỏe mới được ban hành',
    description: 'Các quan chức y tế cập nhật các khuyến nghị về sàng lọc phòng ngừa và kiểm tra sức khỏe.',
    url: 'https://example.com/suc-khoe',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    source: 'Health Watch Việt Nam',
    category: 'health',
    author: 'Dr. Minh Đức',
    importance: 71,
    views: 645,
  },
  {
    id: 'sample-vi-5',
    title: 'Trận chung kết được xác định sau bán kết kịch tính',
    description: 'Trong những bất ngờ gây sốc, các đội cửa dưới đi tiếp gặp đương kim vô địch trong trận chung kết hứa hẹn sẽ cực kỳ kịch tính.',
    url: 'https://example.com/chung-ket',
    imageUrl: null,
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    source: 'Sports Central Việt Nam',
    category: 'sports',
    author: 'Tuấn Kiệt',
    importance: 88,
    views: 2134,
  },
]

// Category to GDELT theme mapping
const CATEGORY_THEMES: Record<string, string> = {
  technology: 'TECHNOLOGY_COMPUTERS_TELECOMMUNICATIONS',
  business: 'ECONOMY_MARKETS_FINANCE',
  science: 'SCIENCE_TECHNOLOGY_RESEARCH',
  health: 'HEALTH_MEDICAL_PHARMACEUTICALS',
  sports: 'SPORTS_GAME',
  entertainment: 'ARTS_CULTURE_ENTERTAINMENT',
  politics: 'POLITICS_ELECTION_CAMPAIGN',
  all: '',
}

// Language code mapping
const LANGUAGE_CODES: Record<string, string> = {
  en: 'English',
  vi: 'Vietnamese',
}

async function fetchFromGDELT(category: string, lang: string): Promise<any[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const timeRange = timestamp - 24 * 60 * 60 // Last 24 hours

    // Build GDELT API query parameters
    const params = new URLSearchParams({
      mode: 'artlist',
      format: 'json',
      maxrecords: '50',
      startdatetime: timeRange.toString(),
      enddatetime: timestamp.toString(),
      lang: lang,
      sort: 'HybridRel'
    })

    // Add category/theme filter if specified
    const theme = CATEGORY_THEMES[category]
    if (theme) {
      params.append('theme', theme)
    }

    const url = `${GDELT_GKG_API}?${params.toString()}`
    console.log(`[GDELT] Fetching: ${url}`)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.log(`[GDELT] Failed: ${response.status}`)
      return []
    }

    const data = await response.json()
    const articles = data.articles || []

    console.log(`[GDELT] Got ${articles.length} articles`)

    return articles.map((item: any, index: number) => {
      const publishedAt = item.seendate ? new Date(item.seendate * 1000) : new Date()

      // Calculate importance based on GDELT metrics
      let importance = 50
      if (item.tone) importance += (item.tone + 10) * 0.5
      if (item.goldsteinscale) importance += Math.abs(item.goldsteinscale) * 5
      importance = Math.round(Math.min(100, Math.max(0, importance)))

      return {
        id: `${lang}-${category}-${index}-${item.url || index}`,
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

function getSourceName(domain: string, lang: string): string {
  if (!domain) return 'Unknown'
  // Remove TLD and return clean name
  return domain.replace('www.', '').split('.')[0]
}

function calculateImportance(
  pubDate: Date,
  contentLength: number,
  source: string
): number {
  const hoursAgo = (Date.now() - pubDate.getTime()) / (1000 * 60 * 60)

  let score = 0
  score += Math.max(0, 50 - hoursAgo) * 1.5
  score += Math.min(contentLength / 50, 20)

  const premiumSources = ['nytimes.com', 'theverge.com', 'wsj.com', 'vnexpress.net', 'thanhnien.vn', 'tuoitre.vn']
  if (premiumSources.some(s => source.includes(s))) {
    score += 15
  }

  return Math.round(Math.min(score, 100))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'all'
    const lang = (searchParams.get('lang') || 'en') as 'en' | 'vi'

    console.log(`[API] Fetching GDELT news - category: ${category}, language: ${lang}`)

    const SAMPLE_ARTICLES = lang === 'vi' ? SAMPLE_ARTICLES_VI : SAMPLE_ARTICLES_EN

    // Fetch from GDELT
    const articles = await fetchFromGDELT(category, lang)

    // If GDELT returns no results, use sample data
    const finalArticles = articles.length > 0 ? articles : SAMPLE_ARTICLES

    // Sort by importance
    finalArticles.sort((a, b) => b.importance - a.importance)

    // Remove duplicates by URL
    const seen = new Set<string>()
    const uniqueArticles = finalArticles.filter(article => {
      if (seen.has(article.url)) return false
      seen.add(article.url)
      return true
    })

    const resultArticles = uniqueArticles.slice(0, 50)

    console.log(`[API] Returning ${resultArticles.length} articles`)

    return NextResponse.json({
      articles: resultArticles,
      cached: false,
      count: resultArticles.length,
      source: articles.length > 0 ? 'gdelt' : 'sample',
      lang,
    })
  } catch (error) {
    console.error('[API] Error:', error)

    const lang = (request.nextUrl.searchParams.get('lang') || 'en') as 'en' | 'vi'
    const SAMPLE_ARTICLES = lang === 'vi' ? SAMPLE_ARTICLES_VI : SAMPLE_ARTICLES_EN

    return NextResponse.json({
      articles: SAMPLE_ARTICLES,
      cached: false,
      count: SAMPLE_ARTICLES.length,
      source: 'fallback',
      lang,
      error: 'Using fallback data',
    })
  }
}
