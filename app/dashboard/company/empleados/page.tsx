"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Search, Edit, Trash2, Mail, User, Phone } from "lucide-react"
import { useCompany } from "@/lib/company-context"
import { formatDate } from "@/lib/format"

export default function EmpleadosPage() {
  const {
    empleados,
    addEmpleado,
    updateEmpleado,
    deleteEmpleado,
    toggleEmpleadoEstado,
    departamentos,
  } = useCompany()

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    departamento: "",
  })

  // Obtener solo departamentos activos para el select
  const departamentosActivos = departamentos.filter((d) => d.estado === "activo")

  const filteredEmpleados = empleados.filter(
    (emp) =>
      emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.departamento.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddEmpleado = () => {
    if (!formData.nombre || !formData.email || !formData.departamento) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }
    addEmpleado({
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      departamento: formData.departamento,
      estado: "activo",
    })
    setFormData({ nombre: "", email: "", telefono: "", departamento: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditEmpleado = () => {
    if (!selectedEmpleadoId) return
    if (!formData.nombre || !formData.email || !formData.departamento) {
      alert("Por favor completa todos los campos obligatorios")
      return
    }
    updateEmpleado(selectedEmpleadoId, {
      nombre: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      departamento: formData.departamento,
    })
    setFormData({ nombre: "", email: "", telefono: "", departamento: "" })
    setSelectedEmpleadoId(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteEmpleado = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
      deleteEmpleado(id)
    }
  }

  const openEditDialog = (empleadoId: string) => {
    const empleado = empleados.find((e) => e.id === empleadoId)
    if (!empleado) return
    setSelectedEmpleadoId(empleadoId)
    setFormData({
      nombre: empleado.nombre,
      email: empleado.email,
      telefono: empleado.telefono,
      departamento: empleado.departamento,
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Empleados</h1>
        <p className="text-muted-foreground mt-1">
          Administra los empleados que tienen acceso al beneficio de bienestar financiero
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Empleados</CardDescription>
            <CardTitle className="text-3xl">{empleados.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empleados Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {empleados.filter((e) => e.estado === "activo").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Empleados Inactivos</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {empleados.filter((e) => e.estado === "inactivo").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Agregar Empleado
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                  <DialogDescription>Completa los datos del empleado para darle acceso al beneficio</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-nombre">Nombre Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="add-nombre"
                        placeholder="Juan Pérez"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">Correo Electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="add-email"
                        type="email"
                        placeholder="juan.perez@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-telefono">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="add-telefono"
                        placeholder="+54 9 11 1234-5678"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-departamento">Departamento</Label>
                    <Select
                      value={formData.departamento}
                      onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                    >
                      <SelectTrigger id="add-departamento">
                        <SelectValue placeholder="Selecciona un departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {departamentosActivos.map((dept) => (
                          <SelectItem key={dept.id} value={dept.nombre}>
                            {dept.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddEmpleado}>Agregar Empleado</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empleados</CardTitle>
          <CardDescription>
            {filteredEmpleados.length} empleado{filteredEmpleados.length !== 1 ? "s" : ""} encontrado
            {filteredEmpleados.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Fecha Alta</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpleados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron empleados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmpleados.map((empleado) => (
                    <TableRow key={empleado.id}>
                      <TableCell className="font-medium">{empleado.nombre}</TableCell>
                      <TableCell>{empleado.email}</TableCell>
                      <TableCell>{empleado.telefono}</TableCell>
                      <TableCell>{empleado.departamento}</TableCell>
                      <TableCell>{formatDate(empleado.fechaAlta)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={empleado.estado === "activo" ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleEmpleadoEstado(empleado.id)}
                        >
                          {empleado.estado === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(empleado.id)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEmpleado(empleado.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Empleado</DialogTitle>
            <DialogDescription>Modifica los datos del empleado</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-nombre"
                  placeholder="Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="juan.perez@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-telefono"
                  placeholder="+54 9 11 1234-5678"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-departamento">Departamento</Label>
              <Select
                value={formData.departamento}
                onValueChange={(value) => setFormData({ ...formData, departamento: value })}
              >
                <SelectTrigger id="edit-departamento">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentosActivos.map((dept) => (
                    <SelectItem key={dept.id} value={dept.nombre}>
                      {dept.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditEmpleado}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
