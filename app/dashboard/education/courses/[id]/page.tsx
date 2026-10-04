"use client"

import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, ClockIcon, BookOpenIcon } from "lucide-react"

const courses = [
  {
    id: "1",
    slug: "fundamentos-finanzas-personales",
    title: "Fundamentos de Finanzas Personales",
    description: "Aprende a gestionar tu dinero, crear un presupuesto y ahorrar efectivamente",
    duration: "2 horas",
    level: "Principiante",
    category: "Básico",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Reemplaza con videos reales
    lessons: [
      {
        id: 1,
        title: "Introducción a las finanzas personales",
        duration: "10 min",
        videoUrl: "https://www.youtube.com/embed/9sCVcWD1Svs",
      },
      {
        id: 2,
        title: "Cómo crear un presupuesto efectivo",
        duration: "15 min",
        videoUrl: "https://www.youtube.com/embed/B66NtYRkhPA",
      },
      {
        id: 3,
        title: "Estrategias de ahorro",
        duration: "12 min",
        videoUrl: "https://www.youtube.com/embed/U5wCPaNAjls",
      },
    ],
  },
  {
    id: "2",
    slug: "estrategias-de-inversion-101",
    title: "Estrategias de Inversión 101",
    description: "Comprende acciones, bonos, ETFs y cómo construir un portafolio diversificado",
    duration: "3 horas",
    level: "Intermedio",
    category: "Inversiones",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    lessons: [
      {
        id: 1,
        title: "Introducción a la inversión",
        duration: "15 min",
        videoUrl: "https://www.youtube.com/embed/I_cD2SEdWAA",
      },
      {
        id: 2,
        title: "Tipos de activos financieros",
        duration: "20 min",
        videoUrl: "https://www.youtube.com/embed/c27c0cgcNAo",
      },
      {
        id: 3,
        title: "Diversificación de portafolio",
        duration: "18 min",
        videoUrl: "https://www.youtube.com/embed/1bc5O3sJRYQ",
      },
    ],
  },
  {
    id: "3",
    slug: "gestion-de-deudas-y-credito",
    title: "Gestión de Deudas y Crédito",
    description: "Domina el puntaje crediticio, estrategias de pago de deudas y manejo de tarjetas",
    duration: "1.5 horas",
    level: "Principiante",
    category: "Crédito",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    lessons: [
      {
        id: 1,
        title: "Entendiendo el crédito",
        duration: "12 min",
        videoUrl: "https://www.youtube.com/embed/k2eKBaHu4dc",
      },
      {
        id: 2,
        title: "Mejorando tu puntaje crediticio",
        duration: "15 min",
        videoUrl: "https://www.youtube.com/embed/40cN-fJawKk",
      },
      {
        id: 3,
        title: "Estrategias para pagar deudas",
        duration: "18 min",
        videoUrl: "https://www.youtube.com/embed/JklsK3Sw8b4",
      },
    ],
  },
  {
    id: "4",
    slug: "planificacion-de-jubilacion",
    title: "Planificación de Jubilación",
    description: "Planifica tu futuro con estrategias de ahorro para el retiro",
    duration: "2.5 horas",
    level: "Avanzado",
    category: "Jubilación",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    lessons: [
      {
        id: 1,
        title: "Importancia del ahorro para el retiro",
        duration: "10 min",
        videoUrl: "https://www.youtube.com/embed/AIYHpYqP-tA",
      },
      {
        id: 2,
        title: "Cuentas de jubilación",
        duration: "20 min",
        videoUrl: "https://www.youtube.com/embed/qstxpeYzsng",
      },
      {
        id: 3,
        title: "Calculando tus necesidades de jubilación",
        duration: "15 min",
        videoUrl: "https://www.youtube.com/embed/ZdB3nv8l2GY",
      },
    ],
  },
]

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const course = courses.find((c) => c.slug === params.id || c.id === params.id)

  if (!course) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/education")}>
            <ArrowLeftIcon className="size-4" />
          </Button>
          <h1 className="text-3xl font-bold">Curso no encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/education")}>
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-1">{course.description}</p>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <Badge variant="outline">{course.level}</Badge>
            <Badge variant="secondary">{course.category}</Badge>
            <span className="flex items-center gap-1 text-muted-foreground">
              <ClockIcon className="size-3" />
              {course.duration}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <BookOpenIcon className="size-3" />
              {course.lessons.length} lecciones
            </span>
          </div>
        </div>
      </div>

      {/* Course Lessons */}
      <div className="grid gap-6">
        {course.lessons.map((lesson, index) => (
          <Card key={lesson.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Lección {index + 1}: {lesson.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    <ClockIcon className="size-3 inline mr-1" />
                    {lesson.duration}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                <iframe
                  width="100%"
                  height="100%"
                  src={lesson.videoUrl}
                  title={lesson.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Back Button at Bottom */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => router.push("/dashboard/education")}>
          <ArrowLeftIcon className="size-4" />
          Volver a Educación
        </Button>
      </div>
    </div>
  )
}

