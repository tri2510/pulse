'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Newspaper, RefreshCw, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { NewsCard } from '@/components/news-card'
import { FilterAndSortBar, ApiSortOption, ClientSortOption, FilterState } from '@/components/filter-sort-bar'
import { NewsArticle } from '@/types/news'
import { getImpactBadge } from '@/lib/news-utils'

const CATEGORIES = [
  { id: 'all', label: 'Tất cả', icon: Newspaper },
  { id: 'technology', label: 'Công nghệ', icon: Newspaper },
  { id: 'business', label: 'Kinh doanh', icon: Newspaper },
  { id: 'science', label: 'Khoa học', icon: Newspaper },
  { id: 'health', label: 'Sức khỏe', icon: Newspaper },
  { id: 'sports', label: 'Thể thao', icon: Newspaper },
] as const

export default function VietnameseNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Filter and sort state
  const [apiSort, setApiSort] = useState<ApiSortOption>('relevance')
  const [clientSort, setClientSort] = useState<ClientSortOption>('none')
  const [filters, setFilters] = useState<FilterState>({
    impactLevel: 'all',
    trendingLevel: 'all',
    timeRange: 'all',
    minViews: 0,
    sources: [],
  })

  const fetchNews = async (showToast = false) => {
    if (showToast) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/news?category=${selectedCategory}&lang=vi&sort=${apiSort}`)
      if (!response.ok) throw new Error('Failed to fetch news')

      const data = await response.json()
      setArticles(data.articles || [])

      if (showToast) {
        toast({
          title: 'Đã cập nhật',
          description: 'Tin tức mới đã được tải',
        })
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải tin tức. Vui lòng thử lại.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNews(false)
  }, [selectedCategory, apiSort])

  // Apply filters and client-side sorting
  const processedArticles = useMemo(() => {
    let filtered = selectedCategory === 'all'
      ? [...articles]
      : articles.filter(article => article.category.toLowerCase() === selectedCategory.toLowerCase())

    // Apply impact level filter
    if (filters.impactLevel !== 'all') {
      filtered = filtered.filter(article => {
        const impact = getImpactBadge(article.importance)
        if (filters.impactLevel === 'critical') return impact.level === 'critical'
        if (filters.impactLevel === 'high') return impact.level === 'critical' || impact.level === 'high'
        if (filters.impactLevel === 'medium') return impact.level === 'critical' || impact.level === 'high' || impact.level === 'medium'
        if (filters.impactLevel === 'low') return true
        return true
      })
    }

    // Apply trending level filter
    if (filters.trendingLevel !== 'all') {
      const trendingConfig = { viral: 800, hot: 500, trending: 300, rising: 150 }
      if (filters.trendingLevel !== 'all') {
        const minViews = trendingConfig[filters.trendingLevel as keyof typeof trendingConfig]
        if (minViews) {
          filtered = filtered.filter(article => article.views >= minViews)
        }
      }
    }

    // Apply time range filter
    if (filters.timeRange !== 'all') {
      const hoursMap = { today: 24, '24h': 24, week: 168, month: 720 }
      const hours = hoursMap[filters.timeRange as keyof typeof hoursMap]
      if (hours) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000)
        filtered = filtered.filter(article => new Date(article.publishedAt).getTime() > cutoff)
      }
    }

    // Apply source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter(article => filters.sources.includes(article.source))
    }

    // Apply client-side sorting
    if (clientSort === 'none') {
      return filtered
    }

    return [...filtered].sort((a, b) => {
      switch (clientSort) {
        case 'impact-desc':
          return b.importance - a.importance
        case 'impact-asc':
          return a.importance - b.importance
        case 'source-asc':
          return a.source.localeCompare(b.source)
        case 'source-desc':
          return b.source.localeCompare(a.source)
        default:
          return 0
      }
    })
  }, [articles, selectedCategory, filters, clientSort])

  const handleRefresh = () => {
    fetchNews(true)
  }

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      // Set initial next refresh time
      const nextRefresh = new Date(Date.now() + 30000) // 30 seconds
      setNextRefreshTime(nextRefresh)

      // Set up interval
      intervalRef.current = setInterval(() => {
        fetchNews(false) // Refresh without toast
        // Update next refresh time
        setNextRefreshTime(new Date(Date.now() + 30000))
      }, 30000) // 30 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } else {
      // Clear interval when auto-refresh is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setNextRefreshTime(null)
    }
  }, [autoRefresh, selectedCategory, apiSort])

  // Countdown timer for next refresh
  useEffect(() => {
    if (!autoRefresh || !nextRefreshTime) return

    const timer = setInterval(() => {
      setNextRefreshTime(prev => {
        if (!prev) return null
        const now = Date.now()
        if (prev.getTime() <= now) {
          return new Date(now + 30000)
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [autoRefresh, nextRefreshTime])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHrs < 1) return 'Vừa xong'
    if (diffHrs < 24) return `${diffHrs} giờ trước`
    if (diffHrs < 48) return 'Hôm qua'
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <Newspaper className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Tin Tức Tiếng Việt
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Tin tức thời sự từ GDELT</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 font-medium"
              >
                <a href="/" className="flex items-center gap-1.5">
                  🇬🇧 English
                </a>
              </Button>

              {/* Auto-refresh toggle */}
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                className={`h-9 px-3 font-medium ${autoRefresh ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
              >
                <Clock className={`h-3.5 w-3.5 mr-1.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
                {autoRefresh && nextRefreshTime ? (
                  <span className="tabular-nums">
                    {Math.max(0, Math.ceil((nextRefreshTime.getTime() - Date.now()) / 1000))}s
                  </span>
                ) : (
                  'Auto'
                )}
              </Button>

              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                size="sm"
                className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Đang tải' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card text-foreground hover:bg-muted border border-border/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {category.label}
              </button>
            )
          })}
        </div>

        {/* Filter and Sort Bar */}
        {!loading && articles.length > 0 && (
          <FilterAndSortBar
            articles={articles}
            filters={filters}
            setFilters={setFilters}
            apiSort={apiSort}
            setApiSort={setApiSort}
            clientSort={clientSort}
            setClientSort={setClientSort}
            loading={loading}
            lang="vi"
          />
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden border border-border/50">
                <Skeleton className="h-44 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : processedArticles.length === 0 ? (
          <Card className="border-dashed border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Không có bài viết nào</h3>
              <p className="text-muted-foreground text-sm">Không tìm thấy tin tức cho danh mục này.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {processedArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={{ ...article, relativeDate: formatDate(article.publishedAt) }}
                lang="vi"
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground text-sm">Pulse Vietnamese</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Tin tức tiếng Việt từ GDELT</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>© 2025</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
