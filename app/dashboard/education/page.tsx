"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArticlesCatalog } from "@/components/education/articles-catalog"
import { CoursesCatalog } from "@/components/education/courses-catalog"
import { LearningProgressOverview } from "@/components/education/learning-progress-overview"
import { AchievementsList } from "@/components/achievements/achievements-list"
import { useAchievements } from "@/components/achievements/use-achievements"
import { Skeleton } from "@/components/ui/skeleton"
import { useMessages } from "@/lib/i18n"

export default function EducationPage() {
  const t = useMessages()
  const searchParams = useSearchParams()
  const { achievements, loadFailed, retry } = useAchievements()
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'courses')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">{t.education.title}</h1>
        <p className="text-muted-foreground mt-1">{t.education.subtitle}</p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <LearningProgressOverview />

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t.achievements.label}</CardDescription>
            <CardTitle className="text-2xl">
              {achievements === null ? (
                loadFailed ? "—" : <Skeleton className="h-8 w-16" />
              ) : (
                achievements.filter((a) => a.achievedAt !== null).length
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {achievements === null ? "" : t.achievements.earnedOf(achievements.length)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">{t.education.tabCourses}</TabsTrigger>
          <TabsTrigger value="articles">{t.education.tabArticles}</TabsTrigger>
          <TabsTrigger value="achievements">{t.achievements.label}</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <CoursesCatalog />
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-4">
          <ArticlesCatalog />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <AchievementsList achievements={achievements} loadFailed={loadFailed} onRetry={retry} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
