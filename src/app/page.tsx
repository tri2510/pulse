'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ExternalLink, RefreshCw, Clock, TrendingUp, Flame, Zap, ArrowUpRight, HelpCircle, Newspaper, Activity, SlidersHorizontal, X, ChevronDown, Filter, Eye } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface NewsArticle {
  id: string
  title: string
  description: string | null
  url: string
  imageUrl: string | null
  source: string
  category: string
  author: string | null
  publishedAt: string
  importance: number
  views: number
}

type SortOption = 'impact-desc' | 'impact-asc' | 'views-desc' | 'views-asc' | 'date-desc' | 'date-asc' | 'source-asc'
type ImpactLevel = 'all' | 'critical' | 'high' | 'medium' | 'low'
type TrendingLevel = 'all' | 'viral' | 'hot' | 'trending' | 'rising'
type TimeRange = 'all' | 'today' | '24h' | 'week' | 'month'

interface FilterState {
  impactLevel: ImpactLevel
  trendingLevel: TrendingLevel
  timeRange: TimeRange
  minViews: number
  sources: string[]
}

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

const SORT_OPTIONS = [
  { value: 'impact-desc', label: 'Impact (High to Low)', icon: Flame },
  { value: 'impact-asc', label: 'Impact (Low to High)', icon: TrendingUp },
  { value: 'views-desc', label: 'Most Viewed', icon: Eye },
  { value: 'views-asc', label: 'Least Viewed', icon: Eye },
  { value: 'date-desc', label: 'Newest First', icon: Clock },
  { value: 'date-asc', label: 'Oldest First', icon: Clock },
  { value: 'source-asc', label: 'Source (A-Z)', icon: Newspaper },
] as const

const IMPACT_LEVELS = [
  { value: 'all', label: 'All Levels', color: 'bg-muted' },
  { value: 'critical', label: 'Critical Only', color: 'bg-red-500/20 text-red-700 dark:text-red-400' },
  { value: 'high', label: 'High & Critical', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400' },
  { value: 'medium', label: 'Medium+', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' },
  { value: 'low', label: 'Low+', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' },
] as const

const TRENDING_LEVELS = [
  { value: 'all', label: 'All' },
  { value: 'viral', label: 'Viral Only', minViews: 800 },
  { value: 'hot', label: 'Hot+', minViews: 500 },
  { value: 'trending', label: 'Trending+', minViews: 300 },
  { value: 'rising', label: 'Rising+', minViews: 150 },
] as const

const TIME_RANGES = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today', hours: 24 },
  { value: '24h', label: 'Last 24 Hours', hours: 24 },
  { value: 'week', label: 'This Week', hours: 168 },
  { value: 'month', label: 'This Month', hours: 720 },
] as const

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Filter and sort state
  const [sortBy, setSortBy] = useState<SortOption>('impact-desc')
  const [filters, setFilters] = useState<FilterState>({
    impactLevel: 'all',
    trendingLevel: 'all',
    timeRange: 'all',
    minViews: 0,
    sources: [],
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const fetchNews = async (showRefreshToast = true, forceRefresh = false) => {
    if (showRefreshToast) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const refreshParam = forceRefresh ? '&refresh=true' : ''
      const response = await fetch(`/api/news?category=${selectedCategory}${refreshParam}`)
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
  }, [selectedCategory])

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

  const getImpactBadge = (importance: number) => {
    if (importance > 75) {
      return {
        level: 'critical',
        label: 'Critical',
        bg: 'bg-gradient-to-r from-red-500/20 to-rose-600/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-500/30',
        icon: Flame,
        barColor: 'bg-gradient-to-r from-red-500 to-rose-600',
      }
    }
    if (importance > 50) {
      return {
        level: 'high',
        label: 'High',
        bg: 'bg-gradient-to-r from-orange-500/20 to-amber-600/20',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-500/30',
        icon: Zap,
        barColor: 'bg-gradient-to-r from-orange-500 to-amber-600',
      }
    }
    if (importance > 25) {
      return {
        level: 'medium',
        label: 'Medium',
        bg: 'bg-gradient-to-r from-yellow-500/20 to-lime-600/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500/30',
        icon: ArrowUpRight,
        barColor: 'bg-gradient-to-r from-yellow-500 to-lime-600',
      }
    }
    return {
      level: 'low',
      label: 'Low',
      bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-600/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      icon: TrendingUp,
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    }
  }

  const getTrendingBadge = (views: number) => {
    if (views > 800) return { level: 'viral', label: 'Viral', color: 'text-red-600 dark:text-red-400' }
    if (views > 500) return { level: 'hot', label: 'Hot', color: 'text-orange-600 dark:text-orange-400' }
    if (views > 300) return { level: 'trending', label: 'Trending', color: 'text-violet-600 dark:text-violet-400' }
    if (views > 150) return { level: 'rising', label: 'Rising', color: 'text-blue-600 dark:text-blue-400' }
    return null
  }

  // Get available sources from articles
  const availableSources = useMemo(() => {
    const sources = new Set(articles.map(a => a.source))
    return Array.from(sources).sort()
  }, [articles])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.impactLevel !== 'all') count++
    if (filters.trendingLevel !== 'all') count++
    if (filters.timeRange !== 'all') count++
    if (filters.minViews > 0) count++
    if (filters.sources.length > 0) count++
    return count
  }, [filters])

  // Reset filters
  const resetFilters = () => {
    setFilters({
      impactLevel: 'all',
      trendingLevel: 'all',
      timeRange: 'all',
      minViews: 0,
      sources: [],
    })
    setSortBy('impact-desc')
  }

  // Apply filters and sorting
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

    // Apply sorting - use toSorted to avoid mutating the array
    const sorted = filtered.toSorted((a, b) => {
      switch (sortBy) {
        case 'impact-desc':
          return b.importance - a.importance
        case 'impact-asc':
          return a.importance - b.importance
        case 'views-desc':
          return b.views - a.views
        case 'views-asc':
          return a.views - b.views
        case 'date-desc':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        case 'date-asc':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        case 'source-asc':
          return a.source.localeCompare(b.source)
        default:
          return 0
      }
    })

    return sorted
  }, [articles, selectedCategory, filters, sortBy])

  const ImpactBadge = ({ label, bg, text, border, icon: Icon }: any) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${bg} ${text} ${border} border shadow-sm`}>
      <Icon className="h-3 w-3.5" />
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <main className="relative flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              {/* Logo/Title with gradient */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-20 blur-xl rounded-full" />
                  <div className="relative w-11 h-11 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Newspaper className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                    Pulse
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">Real-time news intelligence</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                className="h-9 px-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md hover:shadow-lg transition-all text-sm"
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
          <TabsList className="mb-6 w-full overflow-x-auto h-auto p-1 bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="relative whitespace-nowrap px-3 py-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm"
                >
                  <Icon className="h-3.5 w-3.5 mr-1.5" />
                  {category.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            {/* Filter and Sort Bar */}
            {!loading && articles.length > 0 && (
              <div className="mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Sort Dropdown */}
                  <Popover open={showSort} onOpenChange={setShowSort}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {SORT_OPTIONS.find(s => s.value === sortBy)?.label.split(' ')[0]}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-52 p-1.5" align="start">
                      <div className="space-y-0.5">
                        {SORT_OPTIONS.map((option) => {
                          const Icon = option.icon
                          return (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value)
                                setShowSort(false)
                              }}
                              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors text-left ${
                                sortBy === option.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Filter Button */}
                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs relative"
                      >
                        <Filter className="h-3.5 w-3.5" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge className="h-4 px-1 text-[10px] min-w-[16px] flex items-center justify-center bg-primary text-primary-foreground">
                            {activeFilterCount}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start" side="bottom">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Filters</h3>
                          {activeFilterCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={resetFilters}
                              className="h-7 text-xs text-muted-foreground hover:text-foreground"
                            >
                              Reset all
                            </Button>
                          )}
                        </div>

                        {/* Impact Level Filter */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Impact Level</label>
                          <div className="flex flex-wrap gap-1.5">
                            {IMPACT_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setFilters(f => ({ ...f, impactLevel: level.value }))}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  filters.impactLevel === level.value
                                    ? level.color + ' ring-1 ring-ring'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Trending Filter */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Trending Status</label>
                          <div className="flex flex-wrap gap-1.5">
                            {TRENDING_LEVELS.map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setFilters(f => ({ ...f, trendingLevel: level.value }))}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  filters.trendingLevel === level.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Time Range Filter */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Time Range</label>
                          <div className="flex flex-wrap gap-1.5">
                            {TIME_RANGES.map((range) => (
                              <button
                                key={range.value}
                                onClick={() => setFilters(f => ({ ...f, timeRange: range.value }))}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  filters.timeRange === range.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                              >
                                {range.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Source Filter */}
                        {availableSources.length > 0 && (
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Sources</label>
                            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                              {availableSources.map((source) => (
                                <button
                                  key={source}
                                  onClick={() => {
                                    setFilters(f => ({
                                      ...f,
                                      sources: f.sources.includes(source)
                                        ? f.sources.filter(s => s !== source)
                                        : [...f.sources, source]
                                    }))
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    filters.sources.includes(source)
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                  }`}
                                >
                                  {source}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Apply Button */}
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => setShowFilters(false)}
                        >
                          Show Results ({processedArticles.length})
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Active Filters Display */}
                  {activeFilterCount > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {filters.impactLevel !== 'all' && (
                        <Badge variant="secondary" className="h-6 gap-1 text-xs">
                          Impact: {IMPACT_LEVELS.find(l => l.value === filters.impactLevel)?.label}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-foreground"
                            onClick={() => setFilters(f => ({ ...f, impactLevel: 'all' }))}
                          />
                        </Badge>
                      )}
                      {filters.trendingLevel !== 'all' && (
                        <Badge variant="secondary" className="h-6 gap-1 text-xs">
                          {TRENDING_LEVELS.find(l => l.value === filters.trendingLevel)?.label}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-foreground"
                            onClick={() => setFilters(f => ({ ...f, trendingLevel: 'all' }))}
                          />
                        </Badge>
                      )}
                      {filters.timeRange !== 'all' && (
                        <Badge variant="secondary" className="h-6 gap-1 text-xs">
                          {TIME_RANGES.find(r => r.value === filters.timeRange)?.label}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-foreground"
                            onClick={() => setFilters(f => ({ ...f, timeRange: 'all' }))}
                          />
                        </Badge>
                      )}
                      {filters.sources.length > 0 && (
                        <Badge variant="secondary" className="h-6 gap-1 text-xs">
                          {filters.sources.length} source{filters.sources.length > 1 ? 's' : ''}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-foreground"
                            onClick={() => setFilters(f => ({ ...f, sources: [] }))}
                          />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Results Count */}
                <div className="text-xs text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{processedArticles.length}</span> of {articles.length} articles
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border border-border/50">
                    <Skeleton className="h-44 w-full" />
                    <CardHeader className="pb-3">
                      <Skeleton className="h-3.5 w-3/4 mb-1.5" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full mb-1.5" />
                      <Skeleton className="h-3 w-full mb-1.5" />
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
                    {activeFilterCount > 0
                      ? 'Try adjusting your filters or reset them to see more articles.'
                      : 'No articles available for this category right now.'}
                  </p>
                  <div className="flex gap-2">
                    {activeFilterCount > 0 && (
                      <Button onClick={resetFilters} variant="outline" size="sm" className="gap-2">
                        <X className="h-3.5 w-3.5" />
                        Clear Filters
                      </Button>
                    )}
                    <Button onClick={handleRefresh} size="sm" variant="outline" className="gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {processedArticles.map((article) => {
                  const impact = getImpactBadge(article.importance)
                  const trending = getTrendingBadge(article.views)

                  return (
                    <Card
                      key={article.id}
                      className="group overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                    >
                      {/* Image Section */}
                      {article.imageUrl && (
                        <div className="relative h-48 overflow-hidden bg-muted">
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                        </div>
                      )}

                      <CardHeader className="pb-3 px-4">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                          <Badge variant="secondary" className="text-[10px] font-medium bg-muted/80 text-foreground border border-border/50 h-5">
                            {article.source}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-medium border-border/50 text-muted-foreground capitalize h-5">
                            {article.category}
                          </Badge>
                          {trending && (
                            <Badge className={`text-[10px] font-bold bg-transparent ${trending.color} border-0 h-5`}>
                              {trending.label}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <CardTitle className="text-base font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3.5 px-4 pb-4">
                        {/* Impact Score Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <impact.icon className="h-3 w-3" />
                              Impact
                            </span>
                            <span className="font-semibold text-foreground">{article.importance.toFixed(0)}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${impact.barColor} transition-all duration-700 ease-out`}
                              style={{ width: `${Math.min(100, article.importance)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-2.5 py-2.5 border-y border-border/50">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground">Views</span>
                            <span className="text-xs font-semibold text-foreground">{article.views.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-muted-foreground">Score</span>
                            <span className="text-xs font-semibold text-foreground">{article.importance.toFixed(0)}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {article.description && (
                          <CardDescription className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                            {article.description}
                          </CardDescription>
                        )}

                        {/* Meta */}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(article.publishedAt)}
                          </div>
                          {article.author && (
                            <span className="truncate max-w-[100px] font-medium text-foreground/70">{article.author}</span>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md hover:shadow-lg transition-all h-8 text-xs"
                          size="sm"
                        >
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Read Article
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
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
