"use client"

import type React from "react"

import Image from "next/image"
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboardIcon,
  TrendingUpIcon,
  WalletIcon,
  PiggyBankIcon,
  GraduationCapIcon,
  SettingsIcon,
  FileTextIcon,
  BuildingIcon,
  UsersIcon,
  LogOutIcon,
  UserIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CompanyProvider } from "@/lib/company-context"
import { useEffect } from "react"

const empleadoNavigation = [
  { name: "Resumen", href: "/dashboard", icon: LayoutDashboardIcon },
  { name: "Transacciones", href: "/dashboard/transactions", icon: WalletIcon },
  { name: "Presupuestos", href: "/dashboard/budgets", icon: PiggyBankIcon },
  { name: "Inversiones", href: "/dashboard/investments", icon: TrendingUpIcon },
  { name: "Educación", href: "/dashboard/education", icon: GraduationCapIcon },
  { name: "Reportes", href: "/dashboard/reports", icon: FileTextIcon },
]

const empresaNavigation = [
  { name: "Panel Empresarial", href: "/dashboard/company", icon: BuildingIcon },
  { name: "Gestión de Departamentos", href: "/dashboard/company/departamentos", icon: BuildingIcon },
  { name: "Gestión de Empleados", href: "/dashboard/company/empleados", icon: UsersIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, userName, logout, isAuthenticated, isHydrated } = useAuth()

  // Protección de rutas según el rol
  useEffect(() => {
    if (!isHydrated) return

    if (!isAuthenticated) {
      router.replace("/")
      return
    }

    const isCompanyRoute = pathname.startsWith('/dashboard/company')
    const isEmployeeRoute = !isCompanyRoute && pathname.startsWith('/dashboard') && pathname !== '/dashboard/settings'

    if (role === 'empresa' && isEmployeeRoute) {
      // Si es empresa intentando acceder a rutas de empleado, redirigir
      router.push('/dashboard/company')
    } else if (role === 'empleado' && isCompanyRoute) {
      // Si es empleado intentando acceder a rutas de empresa, redirigir
      router.push('/dashboard')
    }
  }, [isAuthenticated, isHydrated, role, pathname, router])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isCompanyRoute = pathname.startsWith("/dashboard/company")
  const isEmployeeRoute = pathname.startsWith("/dashboard") && !isCompanyRoute && pathname !== "/dashboard/settings"
  const hasInvalidRoleRoute =
    (role === "empresa" && isEmployeeRoute) ||
    (role === "empleado" && isCompanyRoute)

  if (!isHydrated || !isAuthenticated || hasInvalidRoleRoute) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <CompanyProvider>
      <SidebarProvider defaultOpen={true}>
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Link
                    href={role === "empresa" ? "/dashboard/company" : "/dashboard"}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Image
                      src="/9.png"
                      alt="FinGrow Logo"
                      width={60}
                      height={40}
                      className="object-contain"
                      priority
                  />
                  <h1 className="text-3xl font-bold text-secondary-foreground">FinGrow</h1>
                </Link>

              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {role === "empleado" && (
                <div className="px-2 py-2">
                  <p className="px-2 text-xs font-medium text-muted-foreground mb-2">Personal</p>
                  <SidebarMenu>
                    {empleadoNavigation.map((item) => (
                        <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}

            {role === "empresa" && (
              <div className="px-2 py-2">
                <p className="px-2 text-xs font-medium text-muted-foreground mb-2">Empresa</p>
                <SidebarMenu>
                  {empresaNavigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/dashboard/settings">
                    <SettingsIcon className="size-4" />
                    <span>Configuración</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="grid grid-cols-3 h-14 items-center border-b bg-background px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
            </div>

            <div className="justify-center flex">
              <Link
                  href={role === "empresa" ? "/dashboard/company" : "/dashboard"}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity md:hidden"
              >
                <Image
                    src="/9.png"
                    alt="FinGrow Logo"
                    width={20}
                    height={10}
                    className="object-contain cursor-pointer"
                    priority
                />
                <h1 className="text-xl font-bold text-secondary-foreground">FinGrow</h1>
              </Link>
            </div>

            <div className="flex items-center justify-end gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src="/placeholder-user.jpg" alt={userName} />
                      <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium">{userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {role === "empleado" ? "Empleado" : "Empresa"}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <UserIcon className="size-4 mr-2" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="cursor-pointer">
                      <SettingsIcon className="size-4 mr-2" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                    <LogOutIcon className="size-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </CompanyProvider>
  )
}
