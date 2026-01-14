'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Clock, Flame, TrendingUp, Zap, Activity, ExternalLink, Newspaper, Languages, Globe } from 'lucide-react'
import { NewsArticle } from '@/types/news'
import { useState } from 'react'

interface NewsCardProps {
  article: NewsArticle
  lang?: 'en' | 'vi'
}

// Impact badge helper
const getImpactBadge = (importance: number) => {
  if (importance >= 80) return { label: 'Critical', color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25', icon: Flame, barColor: 'bg-red-500' }
  if (importance >= 60) return { label: 'High', color: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25', icon: TrendingUp, barColor: 'bg-orange-500' }
  if (importance >= 40) return { label: 'Medium', color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/25', icon: Activity, barColor: 'bg-yellow-500' }
  return { label: 'Low', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25', icon: Activity, barColor: 'bg-emerald-500' }
}

// Trending badge helper
const getTrendingBadge = (views: number) => {
  if (views >= 800) return { label: 'Viral', color: 'text-red-600 dark:text-red-400' }
  if (views >= 500) return { label: 'Hot', color: 'text-orange-600 dark:text-orange-400' }
  if (views >= 300) return { label: 'Trending', color: 'text-yellow-600 dark:text-yellow-400' }
  if (views >= 150) return { label: 'Rising', color: 'text-emerald-600 dark:text-emerald-400' }
  return null
}

// Language strings
const STRINGS = {
  en: {
    impactLabel: 'Impact',
    viewsLabel: 'Views',
    scoreLabel: 'Score',
    readButton: 'Read article',
    translateButton: 'Translate',
  },
  vi: {
    impactLabel: 'Mức độ',
    viewsLabel: 'Lượt xem',
    scoreLabel: 'Điểm',
    readButton: 'Đọc bài viết',
    translateButton: 'Dịch',
  },
} as const

// Common languages for translation
const TRANSLATE_LANGS = {
  en: { code: 'vi', label: 'Tiếng Việt' },
  vi: { code: 'en', label: 'English' },
}

export function NewsCard({ article, lang = 'en' }: NewsCardProps) {
  const [showTranslateMenu, setShowTranslateMenu] = useState(false)
  const impact = getImpactBadge(article.importance)
  const trending = getTrendingBadge(article.views)
  const t = STRINGS[lang]

  // Get Google Translate URL
  const getTranslateUrl = (targetLang: string) => {
    return `https://translate.google.com/translate?sl=${lang}&tl=${targetLang}&u=${encodeURIComponent(article.url)}`
  }

  return (
    <Card className="group overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-muted">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
            <div className="flex flex-col items-center gap-3">
              <Newspaper className="h-12 w-12 text-primary/30" strokeWidth={1.5} />
              <span className="text-xs font-medium text-muted-foreground/70">{article.source}</span>
            </div>
          </div>
        )}
      </div>

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
              {t.impactLabel}
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
            <span className="text-[10px] text-muted-foreground">{t.viewsLabel}</span>
            <span className="text-xs font-semibold text-foreground">{article.views.toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-muted-foreground">{t.scoreLabel}</span>
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
            {article.relativeDate}
          </div>
          {article.author && (
            <span className="truncate max-w-[100px] font-medium text-foreground/70">{article.author}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Translate Button */}
          <Popover open={showTranslateMenu} onOpenChange={setShowTranslateMenu}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs border-primary/30 text-primary hover:bg-primary/10"
              >
                <Languages className="h-3 w-3" />
                <span className="hidden sm:inline">{t.translateButton}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end" side="top">
              <div className="space-y-0.5">
                <a
                  href={getTranslateUrl(TRANSLATE_LANGS[lang].code)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {TRANSLATE_LANGS[lang].label}
                </a>
                <a
                  href={getTranslateUrl('fr')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Français
                </a>
                <a
                  href={getTranslateUrl('es')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Español
                </a>
                <a
                  href={getTranslateUrl('de')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Deutsch
                </a>
                <a
                  href={getTranslateUrl('ja')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  日本語
                </a>
                <a
                  href={getTranslateUrl('zh')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs hover:bg-muted transition-colors text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  中文
                </a>
              </div>
            </PopoverContent>
          </Popover>

          {/* Read Article Button */}
          <Button
            asChild
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all h-8 text-xs"
            size="sm"
          >
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="hidden sm:inline">{t.readButton}</span>
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
