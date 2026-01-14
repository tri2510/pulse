'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RefreshCw, HelpCircle, Newspaper, Filter, X, ChevronDown, Flame, Zap, ArrowUpRight, TrendingUp, Activity, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { NewsCard } from '@/components/news-card'
import { FilterAndSortBar, ApiSortOption, ClientSortOption, FilterState } from '@/components/filter-sort-bar'
import { NewsArticle } from '@/types/news'
import { getImpactBadge } from '@/lib/news-utils'

const CATEGORIES = [
  { id: 'all', label: 'All News', icon: Newspaper },
  { id: 'technology', label: 'Technology', icon: Zap },
  { id: 'business', label: 'Business', icon: TrendingUp },
  { id: 'science', label: 'Science', icon: Activity },
  { id: 'health', label: 'Health', icon: Activity },
  { id: 'sports', label: 'Sports', icon: Activity },
  { id: 'entertainment', label: 'Entertainment', icon: Activity },
  { id: 'politics', label: 'Politics', icon: Activity },
]

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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

  const fetchNews = async (showRefreshToast = true, forceRefresh = false) => {
    if (showRefreshToast) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const refreshParam = forceRefresh ? '&refresh=true' : ''
      const response = await fetch(`/api/news?category=${selectedCategory}&sort=${apiSort}${refreshParam}`)
      if (!response.ok) throw new Error('Failed to fetch news')

      const data = await response.json()
      setArticles(data.articles || [])
      setLastUpdated(new Date())

      if (showRefreshToast) {
        toast({
          title: 'News updated',
          description: 'Latest articles loaded successfully',
        })
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      toast({
        title: 'Error',
        description: 'Failed to load news. Please try again.',
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

  const handleRefresh = () => {
    fetchNews(true, true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

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
        if (filters.impactLevel === 'low') return true // low+ means everything
        return true
      })
    }

    // Apply trending level filter
    if (filters.trendingLevel !== 'all') {
      const trendingConfig = TRENDING_LEVELS.find(t => t.value === filters.trendingLevel)
      if (trendingConfig) {
        filtered = filtered.filter(article => article.views >= trendingConfig.minViews)
      }
    }

    // Apply time range filter
    if (filters.timeRange !== 'all') {
      const rangeConfig = TIME_RANGES.find(t => t.value === filters.timeRange)
      if (rangeConfig && rangeConfig.hours) {
        const cutoff = Date.now() - (rangeConfig.hours * 60 * 60 * 1000)
        filtered = filtered.filter(article => new Date(article.publishedAt).getTime() > cutoff)
      }
    }

    // Apply minimum views filter
    if (filters.minViews > 0) {
      filtered = filtered.filter(article => article.views >= filters.minViews)
    }

    // Apply source filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter(article => filters.sources.includes(article.source))
    }

    // Apply client-side sorting - create a new array to avoid mutation
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

  const ImpactBadge = ({ label, bg, text, border, icon: Icon }: any) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${bg} ${text} ${border} border shadow-sm`}>
      <Icon className="h-3 w-3.5" />
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                  <Newspaper className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                    Pulse
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">Real-time news intelligence</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3 font-medium"
              >
                <a href="/vi" className="flex items-center gap-1.5">
                  🇻🇳 Tiếng Việt
                </a>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" side="bottom" align="end">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Understanding Insights</h3>
                      <p className="text-xs text-muted-foreground">How we analyze news impact</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-muted-foreground">Critical: Major breaking news</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                        <span className="text-muted-foreground">High: Important stories</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 shrink-0" />
                        <span className="text-muted-foreground">Medium: Noteworthy articles</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">Low: General interest</span>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                size="sm"
                className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all text-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating' : 'Refresh'}
              </Button>
            </div>
          </div>

          {lastUpdated && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="mb-6 w-full max-w-full overflow-x-auto overflow-y-hidden h-auto p-1 bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl scrollbar-hide snap-x snap-mandatory">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="relative whitespace-nowrap px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-xs sm:text-sm snap-start !flex-none"
                  style={{ minWidth: 'auto', flex: '0 0 auto' }}
                >
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1.5 flex-shrink-0" />
                  <span className="hidden sm:inline">{category.label}</span>
                  <span className="sm:hidden text-xs">{category.label.replace(' News', '')}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
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
                lang="en"
              />
            )}

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
              <Card className="border-dashed border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="relative mb-5">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                    <Filter className="relative h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No articles match your filters
                  </h3>
                  <p className="text-muted-foreground mb-5 max-w-md text-sm">
                    Try adjusting your filters to see more articles.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={handleRefresh} size="sm" variant="outline" className="gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedArticles.map((article) => (
                  <NewsCard
                    key={article.id}
                    article={{ ...article, relativeDate: formatDate(article.publishedAt) }}
                    lang="en"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground text-sm">Pulse</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Real-time news intelligence powered by GDELT-inspired analytics
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Built with Next.js & shadcn/ui</span>
              <span>•</span>
              <span>© 2025</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
