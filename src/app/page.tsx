'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ExternalLink, RefreshCw, Clock, TrendingUp, Flame, Zap, AlertTriangle, ArrowUpRight, Info, HelpCircle } from 'lucide-react'
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

const CATEGORIES = [
  { id: 'all', label: 'All News' },
  { id: 'technology', label: 'Technology' },
  { id: 'business', label: 'Business' },
  { id: 'science', label: 'Science' },
  { id: 'health', label: 'Health' },
  { id: 'sports', label: 'Sports' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'politics', label: 'Politics' },
]

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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

  // GDELT-inspired insights calculation
  const getSentimentIndicator = (importance: number, views: number) => {
    // Simulate sentiment based on GDELT's AvgTone (-10 to +10)
    // Using importance as proxy: high importance = more significant/negative news
    const sentimentScore = (importance / 100) * 20 - 10 // Scale: -10 to +10

    if (sentimentScore > 5) {
      return { level: 'very-positive', label: 'Very Positive', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm', icon: TrendingUp }
    } else if (sentimentScore > 2) {
      return { level: 'positive', label: 'Positive', color: 'bg-sky-50 text-sky-700 border-sky-200 shadow-sm', icon: ArrowUpRight }
    } else if (sentimentScore > -2) {
      return { level: 'neutral', label: 'Neutral', color: 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm', icon: AlertTriangle }
    } else if (sentimentScore > -5) {
      return { level: 'negative', label: 'Negative', color: 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm', icon: Zap }
    } else {
      return { level: 'very-negative', label: 'Major', color: 'bg-red-50 text-red-700 border-red-200 shadow-sm', icon: Flame }
    }
  }

  const getTrendingLevel = (views: number) => {
    // Based on GDELT's NumMentions - how many sources are talking about this
    if (views > 800) return { level: 'viral', label: 'Viral', color: 'text-red-600 font-semibold' }
    if (views > 500) return { level: 'hot', label: 'Hot', color: 'text-orange-600 font-semibold' }
    if (views > 300) return { level: 'trending', label: 'Trending', color: 'text-violet-600 font-semibold' }
    if (views > 150) return { level: 'rising', label: 'Rising', color: 'text-blue-600 font-semibold' }
    return { level: 'normal', label: '', color: 'text-slate-500 font-medium' }
  }

  const getImpactScore = (importance: number, views: number) => {
    // Based on GDELT's GoldsteinScale (-10 to +10) - impact level
    const rawScore = (importance * 0.5) + (views / 200)
    const normalizedScore = Math.max(0, Math.min(100, rawScore))

    if (normalizedScore > 75) return { level: 'critical', label: 'Critical', color: 'bg-red-600 text-red-50 border-red-400 shadow-md', icon: Flame }
    if (normalizedScore > 50) return { level: 'high', label: 'High', color: 'bg-orange-600 text-orange-50 border-orange-400 shadow-md', icon: Zap }
    if (normalizedScore > 25) return { level: 'medium', label: 'Medium', color: 'bg-yellow-600 text-yellow-50 border-yellow-400 shadow-md', icon: ArrowUpRight }
    return { level: 'low', label: 'Low', color: 'bg-emerald-600 text-emerald-50 border-emerald-400 shadow-md', icon: TrendingUp }
  }

  const InsightBadge = ({ children, color, icon: Icon, label }: { children: React.ReactNode, color: string, icon: Icon, label: string }) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${color} shadow-sm`}>
      <icon className="h-3.5 w-3.5 shrink-0" />
      <span className="text-xs font-semibold tracking-wide">{label || children}</span>
    </div>
  )

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(article => article.category.toLowerCase() === selectedCategory.toLowerCase())

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark: from-slate-950 dark:to-slate-900">
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Help Button */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-3">
              {/* Main Title - Clean Flat Design */}
              <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                Pulse
              </h1>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50">Understanding Insights</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">Trending:</span>
                          {' '}How widely discussed (viral → normal)
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">Impact:</span>
                          {' '}Overall significance score (critical → low)
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">Views:</span>
                          {' '}Article view count
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-slate-50">Score:</span>
                          {' '}Calculated importance (0-100)
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              variant="outline"
              size="lg"
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Updating...' : 'Refresh'}
            </Button>
          </div>

          {lastUpdated && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
              <Clock className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="mb-6 w-full overflow-x-auto bg-white dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-sm">
            {CATEGORIES.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="whitespace-nowrap data-[state=active]:bg-slate-900 dark:data-[state=active]:bg-slate-50 data-[state=active]:text-slate-50 dark:data-[state=active]:text-slate-900 shadow-sm"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <Card className="border-dashed border-slate-300 dark:border-slate-700">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="h-12 w-12 text-slate-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    No articles found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    No news articles available for this category right now.
                  </p>
                  <Button onClick={handleRefresh} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <Card
                    key={article.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl"
                  >
                    {article.imageUrl && (
                      <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 shadow-sm">
                            {article.source}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400">
                            {article.category}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const sentiment = getSentimentIndicator(article.importance, article.views)
                            const trending = getTrendingLevel(article.views)
                            const impact = getImpactScore(article.importance, article.views)
                            return (
                              <>
                                <InsightBadge
                                  color={sentiment.color}
                                  icon={sentiment.icon}
                                  label={sentiment.label}
                                />
                                <InsightBadge
                                  color={trending.color}
                                  icon={TrendingUp}
                                  label={trending.label}
                                />
                                <InsightBadge
                                  color={impact.color}
                                  icon={impact.icon}
                                  label={impact.label}
                                />
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50 line-clamp-2 leading-snug">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Visual Impact Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                          <span>Impact Score</span>
                          <span>{article.importance.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.min(100, article.importance)}%`,
                              backgroundColor: article.importance > 75
                                ? '#dc2626'  // red
                                : article.importance > 50
                                ? '#f97316'  // orange
                                : article.importance > 25
                                ? '#eab308'  // yellow
                                : '#84cc16',  // green
                            }}
                          />
                        </div>
                      </div>

                      {/* Quick Stats Section */}
                      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Views</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-300">{article.views.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Score</span>
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-300">{article.importance.toFixed(1)}</span>
                        </div>
                      </div>

                      {article.description && (
                        <CardDescription className="line-clamp-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {article.description}
                        </CardDescription>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 pt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(article.publishedAt)}
                        </div>
                        {article.author && (
                          <span className="truncate max-w-[140px] font-medium text-slate-700 dark:text-slate-300">{article.author}</span>
                        )}
                      </div>

                      <Button
                        asChild
                        className="w-full shadow-sm hover:shadow-md transition-shadow"
                        variant="default"
                      >
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Read Article
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p className="font-medium text-slate-900 dark:text-slate-50">© 2025 Puse - Real-Time Insights Platform</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Powered by GDELT-inspired analytics • Built with Next.js & shadcn/ui</p>
        </div>
      </footer>
    </div>
  )
}
