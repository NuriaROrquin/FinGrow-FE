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
import { Badge } from "@/components/ui/badge"
import { Building2, Search, Edit, Trash2, Plus, Users } from "lucide-react"
import { useCompany } from "@/lib/company-context"
import { formatDate } from "@/lib/format"

export default function DepartamentosPage() {
  const {
    departamentos,
    addDepartamento,
    updateDepartamento,
    deleteDepartamento,
    toggleDepartamentoEstado,
  } = useCompany()

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    responsable: "",
  })

  const filteredDepartamentos = departamentos.filter(
    (dept) =>
      dept.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.responsable.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddDepartamento = () => {
    if (!formData.nombre || !formData.descripcion || !formData.responsable) {
      alert("Por favor completa todos los campos")
      return
    }
    addDepartamento({
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      responsable: formData.responsable,
      estado: "activo",
    })
    setFormData({ nombre: "", descripcion: "", responsable: "" })
    setIsAddDialogOpen(false)
  }

  const handleEditDepartamento = () => {
    if (!selectedDepartamentoId) return
    if (!formData.nombre || !formData.descripcion || !formData.responsable) {
      alert("Por favor completa todos los campos")
      return
    }
    updateDepartamento(selectedDepartamentoId, {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      responsable: formData.responsable,
    })
    setFormData({ nombre: "", descripcion: "", responsable: "" })
    setSelectedDepartamentoId(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteDepartamento = (id: string) => {
    const result = deleteDepartamento(id)
    if (!result) {
      alert("No se puede eliminar un departamento con empleados asignados")
      return
    }
  }

  const openEditDialog = (departamentoId: string) => {
    const departamento = departamentos.find((d) => d.id === departamentoId)
    if (!departamento) return
    setSelectedDepartamentoId(departamentoId)
    setFormData({
      nombre: departamento.nombre,
      descripcion: departamento.descripcion,
      responsable: departamento.responsable,
    })
    setIsEditDialogOpen(true)
  }

  const totalEmpleados = departamentos.reduce((sum, dept) => sum + dept.cantidadEmpleados, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Departamentos</h1>
        <p className="text-muted-foreground mt-1">Administra los departamentos de tu organización</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Departamentos</CardDescription>
            <CardTitle className="text-3xl">{departamentos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Departamentos Activos</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {departamentos.filter((d) => d.estado === "activo").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Empleados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{totalEmpleados}</CardTitle>
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
                placeholder="Buscar por nombre, descripción o responsable..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar Departamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Departamento</DialogTitle>
                  <DialogDescription>Completa los datos del departamento</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-nombre">Nombre del Departamento</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="add-nombre"
                        placeholder="Ventas, Marketing, IT, etc."
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-descripcion">Descripción</Label>
                    <Input
                      id="add-descripcion"
                      placeholder="Breve descripción del departamento"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-responsable">Responsable</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="add-responsable"
                        placeholder="Nombre del responsable"
                        value={formData.responsable}
                        onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddDepartamento}>Agregar Departamento</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Departamentos</CardTitle>
          <CardDescription>
            {filteredDepartamentos.length} departamento{filteredDepartamentos.length !== 1 ? "s" : ""} encontrado
            {filteredDepartamentos.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Empleados</TableHead>
                  <TableHead>Fecha Creación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDepartamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron departamentos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepartamentos.map((departamento) => (
                    <TableRow key={departamento.id}>
                      <TableCell className="font-medium">{departamento.nombre}</TableCell>
                      <TableCell className="max-w-xs truncate">{departamento.descripcion}</TableCell>
                      <TableCell>{departamento.responsable}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{departamento.cantidadEmpleados}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(departamento.fechaCreacion)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={departamento.estado === "activo" ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleDepartamentoEstado(departamento.id)}
                        >
                          {departamento.estado === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(departamento.id)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDepartamento(departamento.id)}
                            title="Eliminar"
                            disabled={departamento.cantidadEmpleados > 0}
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
            <DialogTitle>Editar Departamento</DialogTitle>
            <DialogDescription>Modifica los datos del departamento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre del Departamento</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-nombre"
                  placeholder="Ventas, Marketing, IT, etc."
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Input
                id="edit-descripcion"
                placeholder="Breve descripción del departamento"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-responsable">Responsable</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-responsable"
                  placeholder="Nombre del responsable"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditDepartamento}>Guardar Cambios</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
