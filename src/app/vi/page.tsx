'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Newspaper, RefreshCw } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { NewsCard } from '@/components/news-card'
import { NewsArticle } from '@/types/news'

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

  const fetchNews = async (showToast = false) => {
    if (showToast) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/news?category=${selectedCategory}&lang=vi`)
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
  }, [selectedCategory])

  const handleRefresh = () => {
    fetchNews(true)
  }

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

        {/* Results Count */}
        <div className="mb-4 text-xs text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{articles.length}</span> bài viết
        </div>

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
        ) : articles.length === 0 ? (
          <Card className="border-dashed border-border/50 bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Không có bài viết nào</h3>
              <p className="text-muted-foreground text-sm">Không tìm thấy tin tức cho danh mục này.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article) => (
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
