"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  TrendingUpIcon,
  DollarSignIcon,
  PiggyBankIcon,
  CreditCardIcon,
  GraduationCapIcon,
  AwardIcon,
} from "lucide-react"
import {Badge} from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation"
import { ArticlesCatalog } from "@/components/education/articles-catalog"
import { CoursesCatalog } from "@/components/education/courses-catalog"

const courses = [
  {
    id: 1,
    title: "Fundamentos de Finanzas Personales",
    description: "Aprende a gestionar tu dinero, crear un presupuesto y ahorrar efectivamente",
    duration: "2 horas",
    lessons: 12,
    completed: 8,
    progress: 67,
    level: "Principiante",
    category: "Básico",
    icon: DollarSignIcon,
  },
  {
    id: 2,
    title: "Estrategias de Inversión 101",
    description: "Comprende acciones, bonos, ETFs y cómo construir un portafolio diversificado",
    duration: "3 horas",
    lessons: 15,
    completed: 3,
    progress: 20,
    level: "Intermedio",
    category: "Inversiones",
    icon: TrendingUpIcon,
  },
  {
    id: 3,
    title: "Gestión de Deudas y Crédito",
    description: "Domina el puntaje crediticio, estrategias de pago de deudas y manejo de tarjetas",
    duration: "1.5 horas",
    lessons: 8,
    completed: 8,
    progress: 100,
    level: "Principiante",
    category: "Crédito",
    icon: CreditCardIcon,
  },
  {
    id: 4,
    title: "Planificación de Jubilación",
    description: "Planifica tu futuro con estrategias de ahorro para el retiro",
    duration: "2.5 horas",
    lessons: 10,
    completed: 0,
    progress: 0,
    level: "Avanzado",
    category: "Jubilación",
    icon: PiggyBankIcon,
  },
]

const achievements = [
  {
    id: 1,
    title: "Primer Curso Completado",
    description: "Completaste tu primer curso de educación financiera",
    earned: true,
    icon: GraduationCapIcon,
  },
  {
    id: 2,
    title: "Maestro del Presupuesto",
    description: "Creaste y mantuviste un presupuesto durante 3 meses",
    earned: true,
    icon: AwardIcon,
  },
  {
    id: 3,
    title: "Inversionista Principiante",
    description: "Realizaste tu primera inversión",
    earned: false,
    icon: TrendingUpIcon,
  },
  {
    id: 4,
    title: "Campeón de Ahorros",
    description: "Alcanzaste una meta de ahorro",
    earned: true,
    icon: PiggyBankIcon,
  },
]

export default function EducationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'courses'

  const totalLessons = courses.reduce((sum, course) => sum + course.lessons, 0)
  const completedLessons = courses.reduce((sum, course) => sum + course.completed, 0)
  const overallProgress = (completedLessons / totalLessons) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-balance">Educación Financiera</h1>
        <p className="text-muted-foreground mt-1">Aprende y mejora tu educación financiera</p>
      </div>

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progreso General</CardDescription>
            <CardTitle className="text-2xl">{overallProgress.toFixed(0)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              {completedLessons} de {totalLessons} lecciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cursos Inscritos</CardDescription>
            <CardTitle className="text-2xl">{courses.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {courses.filter((c) => c.progress === 100).length} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Racha de Aprendizaje</CardDescription>
            <CardTitle className="text-2xl">7 días</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">¡Sigue así!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Logros</CardDescription>
            <CardTitle className="text-2xl">{achievements.filter((a) => a.earned).length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">de {achievements.length} obtenidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="articles">Artículos</TabsTrigger>
          <TabsTrigger value="achievements">Logros</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle>Tus Logros</CardTitle>
              <CardDescription>Hitos que has alcanzado en tu viaje financiero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border ${achievement.earned ? "bg-success/5 border-success/20" : "bg-muted/50 opacity-60"}`}
                    >
                      <div
                        className={`flex size-12 items-center justify-center rounded-full ${achievement.earned ? "bg-success/10 text-success" : "bg-muted"}`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          {achievement.earned && <CheckCircleIcon className="size-4 text-success" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
