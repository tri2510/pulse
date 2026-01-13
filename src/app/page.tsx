'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ExternalLink, RefreshCw, Clock, TrendingUp, Flame, Zap, AlertTriangle, ArrowUpRight, HelpCircle, Newspaper, Activity } from 'lucide-react'
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
        label: 'Medium',
        bg: 'bg-gradient-to-r from-yellow-500/20 to-lime-600/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-500/30',
        icon: ArrowUpRight,
        barColor: 'bg-gradient-to-r from-yellow-500 to-lime-600',
      }
    }
    return {
      label: 'Low',
      bg: 'bg-gradient-to-r from-emerald-500/20 to-teal-600/20',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      icon: TrendingUp,
      barColor: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    }
  }

  const getTrendingBadge = (views: number) => {
    if (views > 800) return { label: 'Viral', color: 'text-red-600 dark:text-red-400' }
    if (views > 500) return { label: 'Hot', color: 'text-orange-600 dark:text-orange-400' }
    if (views > 300) return { label: 'Trending', color: 'text-violet-600 dark:text-violet-400' }
    if (views > 150) return { label: 'Rising', color: 'text-blue-600 dark:text-blue-400' }
    return null
  }

  const ImpactBadge = ({ label, bg, text, border, icon: Icon }: any) => (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${bg} ${text} ${border} border shadow-sm`}>
      <Icon className="h-3 w-3.5" />
      <span className="text-xs font-semibold tracking-wide">{label}</span>
    </div>
  )

  const filteredArticles = selectedCategory === 'all'
    ? articles
    : articles.filter(article => article.category.toLowerCase() === selectedCategory.toLowerCase())

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <main className="relative flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              {/* Logo/Title with gradient */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-20 blur-xl rounded-full" />
                  <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                    <Newspaper className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                    Pulse
                  </h1>
                  <p className="text-sm text-muted-foreground font-medium">Real-time news intelligence</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-muted">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" side="bottom" align="end">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Understanding Insights</h3>
                      <p className="text-xs text-muted-foreground">How we analyze news impact</p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Critical Impact:</span>
                          <p className="text-xs text-muted-foreground">Major breaking news with high significance</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">High Impact:</span>
                          <p className="text-xs text-muted-foreground">Important developing stories</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Medium Impact:</span>
                          <p className="text-xs text-muted-foreground">Noteworthy articles</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">Low Impact:</span>
                          <p className="text-xs text-muted-foreground">General interest stories</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleRefresh}
                disabled={refreshing || loading}
                size="default"
                className="h-10 px-4 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {lastUpdated && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="mb-8 w-full overflow-x-auto h-auto p-1 bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="relative whitespace-nowrap px-4 py-2.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden border border-border/50">
                    <Skeleton className="h-48 w-full" />
                    <CardHeader>
                      <Skeleton className="h-4 w-3/4 mb-2" />
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
              <Card className="border-dashed border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />
                    <Newspaper className="relative h-16 w-16 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No articles found
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    No news articles available for this category right now. Try refreshing or selecting a different category.
                  </p>
                  <Button onClick={handleRefresh} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => {
                  const impact = getImpactBadge(article.importance)
                  const trending = getTrendingBadge(article.views)

                  return (
                    <Card
                      key={article.id}
                      className="group overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                    >
                      {/* Image Section */}
                      {article.imageUrl && (
                        <div className="relative h-52 overflow-hidden bg-muted">
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

                      <CardHeader className="pb-4">
                        {/* Badges Row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="secondary" className="text-xs font-medium bg-muted/80 text-foreground border border-border/50">
                            {article.source}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium border-border/50 text-muted-foreground capitalize">
                            {article.category}
                          </Badge>
                          {trending && (
                            <Badge className={`text-xs font-bold bg-transparent ${trending.color} border-0`}>
                              {trending.label}
                            </Badge>
                          )}
                        </div>

                        {/* Title */}
                        <CardTitle className="text-lg font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Impact Score Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <impact.icon className="h-3.5 w-3.5" />
                              Impact Score
                            </span>
                            <span className="font-semibold text-foreground">{article.importance.toFixed(0)}</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full rounded-full ${impact.barColor} transition-all duration-700 ease-out`}
                              style={{ width: `${Math.min(100, article.importance)}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/50">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Views</span>
                            <span className="text-sm font-semibold text-foreground">{article.views.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-muted-foreground">Score</span>
                            <span className="text-sm font-semibold text-foreground">{article.importance.toFixed(0)}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {article.description && (
                          <CardDescription className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                            {article.description}
                          </CardDescription>
                        )}

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDate(article.publishedAt)}
                          </div>
                          {article.author && (
                            <span className="truncate max-w-[120px] font-medium text-foreground/80">{article.author}</span>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                          size="default"
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
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative mt-auto border-t border-border/50 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Pulse</p>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time news intelligence powered by GDELT-inspired analytics
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
