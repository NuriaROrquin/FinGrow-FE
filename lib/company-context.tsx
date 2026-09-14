"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Departamento {
  id: string
  nombre: string
  descripcion: string
  cantidadEmpleados: number
  responsable: string
  fechaCreacion: string
  estado: "activo" | "inactivo"
}

export interface Empleado {
  id: string
  nombre: string
  email: string
  telefono: string
  departamento: string
  fechaAlta: string
  estado: "activo" | "inactivo"
}

interface CompanyContextType {
  // Departamentos
  departamentos: Departamento[]
  addDepartamento: (departamento: Omit<Departamento, "id" | "fechaCreacion" | "cantidadEmpleados">) => void
  updateDepartamento: (id: string, departamento: Partial<Departamento>) => void
  deleteDepartamento: (id: string) => boolean
  toggleDepartamentoEstado: (id: string) => void
  getDepartamentoById: (id: string) => Departamento | undefined

  // Empleados
  empleados: Empleado[]
  addEmpleado: (empleado: Omit<Empleado, "id" | "fechaAlta">) => void
  updateEmpleado: (id: string, empleado: Partial<Empleado>) => void
  deleteEmpleado: (id: string) => void
  toggleEmpleadoEstado: (id: string) => void
  getEmpleadoById: (id: string) => Empleado | undefined
  getEmpleadosByDepartamento: (departamento: string) => Empleado[]
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const INITIAL_DEPARTAMENTOS: Departamento[] = [
  {
    id: "1",
    nombre: "Ventas",
    descripcion: "Departamento de ventas y atención al cliente",
    cantidadEmpleados: 1,
    responsable: "María González",
    fechaCreacion: "2023-01-15",
    estado: "activo",
  },
  {
    id: "2",
    nombre: "Marketing",
    descripcion: "Departamento de marketing y comunicación",
    cantidadEmpleados: 1,
    responsable: "Carlos Rodríguez",
    fechaCreacion: "2023-02-20",
    estado: "activo",
  },
  {
    id: "3",
    nombre: "IT",
    descripcion: "Departamento de tecnología e infraestructura",
    cantidadEmpleados: 1,
    responsable: "Ana Martínez",
    fechaCreacion: "2023-03-10",
    estado: "activo",
  },
  {
    id: "4",
    nombre: "Recursos Humanos",
    descripcion: "Departamento de gestión de personal",
    cantidadEmpleados: 1,
    responsable: "Juan Pérez",
    fechaCreacion: "2023-01-05",
    estado: "activo",
  },
  {
    id: "5",
    nombre: "Finanzas",
    descripcion: "Departamento de contabilidad y finanzas",
    cantidadEmpleados: 0,
    responsable: "Laura Fernández",
    fechaCreacion: "2023-01-20",
    estado: "activo",
  },
  {
    id: "6",
    nombre: "Operaciones",
    descripcion: "Departamento de operaciones y logística",
    cantidadEmpleados: 0,
    responsable: "Pedro Sánchez",
    fechaCreacion: "2023-04-05",
    estado: "activo",
  },
  {
    id: "7",
    nombre: "Atención al Cliente",
    descripcion: "Departamento de soporte y atención al cliente",
    cantidadEmpleados: 0,
    responsable: "Lucía Torres",
    fechaCreacion: "2023-05-12",
    estado: "activo",
  },
  {
    id: "8",
    nombre: "Logística",
    descripcion: "Departamento de logística y distribución",
    cantidadEmpleados: 0,
    responsable: "Roberto Díaz",
    fechaCreacion: "2023-06-18",
    estado: "activo",
  },
]

const INITIAL_EMPLEADOS: Empleado[] = [
  {
    id: "1",
    nombre: "Juan Pérez",
    email: "juan.perez@empresa.com",
    telefono: "+54 9 11 1234-5678",
    departamento: "Ventas",
    fechaAlta: "2024-01-15",
    estado: "activo",
  },
  {
    id: "2",
    nombre: "María González",
    email: "maria.gonzalez@empresa.com",
    telefono: "+54 9 11 2345-6789",
    departamento: "Marketing",
    fechaAlta: "2024-02-20",
    estado: "activo",
  },
  {
    id: "3",
    nombre: "Carlos Rodríguez",
    email: "carlos.rodriguez@empresa.com",
    telefono: "+54 9 11 3456-7890",
    departamento: "IT",
    fechaAlta: "2024-03-10",
    estado: "activo",
  },
  {
    id: "4",
    nombre: "Ana Martínez",
    email: "ana.martinez@empresa.com",
    telefono: "+54 9 11 4567-8901",
    departamento: "Recursos Humanos",
    fechaAlta: "2023-12-05",
    estado: "inactivo",
  },
]

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const storedDepartamentos = localStorage.getItem("fingrow-departamentos")
    const storedEmpleados = localStorage.getItem("fingrow-empleados")

    if (storedDepartamentos) {
      setDepartamentos(JSON.parse(storedDepartamentos))
    } else {
      setDepartamentos(INITIAL_DEPARTAMENTOS)
    }

    if (storedEmpleados) {
      setEmpleados(JSON.parse(storedEmpleados))
    } else {
      setEmpleados(INITIAL_EMPLEADOS)
    }

    setIsLoaded(true)
  }, [])

  // Guardar departamentos en localStorage cuando cambien
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("fingrow-departamentos", JSON.stringify(departamentos))
    }
  }, [departamentos, isLoaded])

  // Guardar empleados en localStorage cuando cambien
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("fingrow-empleados", JSON.stringify(empleados))
    }
  }, [departamentos, empleados, isLoaded])

  // Función auxiliar para actualizar el contador de empleados de un departamento
  const updateDepartamentoCantidadEmpleados = (departamentoNombre: string) => {
    const cantidad = empleados.filter((emp) => emp.departamento === departamentoNombre).length
    setDepartamentos((prev) =>
      prev.map((dept) => (dept.nombre === departamentoNombre ? { ...dept, cantidadEmpleados: cantidad } : dept)),
    )
  }

  // Funciones para departamentos
  const addDepartamento = (departamento: Omit<Departamento, "id" | "fechaCreacion" | "cantidadEmpleados">) => {
    const newId = String(Math.max(0, ...departamentos.map((d) => Number.parseInt(d.id))) + 1)
    const nuevoDepartamento: Departamento = {
      ...departamento,
      id: newId,
      fechaCreacion: new Date().toISOString().split("T")[0],
      cantidadEmpleados: 0,
      estado: "activo",
    }
    setDepartamentos((prev) => [...prev, nuevoDepartamento])
  }

  const updateDepartamento = (id: string, departamento: Partial<Departamento>) => {
    setDepartamentos((prev) => prev.map((dept) => (dept.id === id ? { ...dept, ...departamento } : dept)))

    // Si se cambió el nombre del departamento, actualizar los empleados
    if (departamento.nombre) {
      const oldDept = departamentos.find((d) => d.id === id)
      if (oldDept && oldDept.nombre !== departamento.nombre) {
        setEmpleados((prev) =>
          prev.map((emp) => (emp.departamento === oldDept.nombre ? { ...emp, departamento: departamento.nombre! } : emp)),
        )
      }
    }
  }

  const deleteDepartamento = (id: string): boolean => {
    const dept = departamentos.find((d) => d.id === id)
    if (dept && dept.cantidadEmpleados > 0) {
      return false // No se puede eliminar si tiene empleados
    }
    setDepartamentos((prev) => prev.filter((dept) => dept.id !== id))
    return true
  }

  const toggleDepartamentoEstado = (id: string) => {
    setDepartamentos((prev) =>
      prev.map((dept) => (dept.id === id ? { ...dept, estado: dept.estado === "activo" ? "inactivo" : "activo" } : dept)),
    )
  }

  const getDepartamentoById = (id: string) => {
    return departamentos.find((dept) => dept.id === id)
  }

  // Funciones para empleados
  const addEmpleado = (empleado: Omit<Empleado, "id" | "fechaAlta">) => {
    const newId = String(Math.max(0, ...empleados.map((e) => Number.parseInt(e.id))) + 1)
    const nuevoEmpleado: Empleado = {
      ...empleado,
      id: newId,
      fechaAlta: new Date().toISOString().split("T")[0],
      estado: "activo",
    }
    setEmpleados((prev) => [...prev, nuevoEmpleado])
    updateDepartamentoCantidadEmpleados(empleado.departamento)
  }

  const updateEmpleado = (id: string, empleado: Partial<Empleado>) => {
    const oldEmpleado = empleados.find((e) => e.id === id)
    const oldDepartamento = oldEmpleado?.departamento

    setEmpleados((prev) => prev.map((emp) => (emp.id === id ? { ...emp, ...empleado } : emp)))

    // Actualizar contadores si cambió el departamento
    if (empleado.departamento && oldDepartamento && empleado.departamento !== oldDepartamento) {
      updateDepartamentoCantidadEmpleados(oldDepartamento)
      updateDepartamentoCantidadEmpleados(empleado.departamento)
    }
  }

  const deleteEmpleado = (id: string) => {
    const empleado = empleados.find((e) => e.id === id)
    setEmpleados((prev) => prev.filter((emp) => emp.id !== id))
    if (empleado) {
      updateDepartamentoCantidadEmpleados(empleado.departamento)
    }
  }

  const toggleEmpleadoEstado = (id: string) => {
    setEmpleados((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, estado: emp.estado === "activo" ? "inactivo" : "activo" } : emp)),
    )
  }

  const getEmpleadoById = (id: string) => {
    return empleados.find((emp) => emp.id === id)
  }

  const getEmpleadosByDepartamento = (departamento: string) => {
    return empleados.filter((emp) => emp.departamento === departamento)
  }

  // Actualizar contadores cuando cambien los empleados
  useEffect(() => {
    if (isLoaded) {
      departamentos.forEach((dept) => {
        const cantidad = empleados.filter((emp) => emp.departamento === dept.nombre).length
        if (dept.cantidadEmpleados !== cantidad) {
          setDepartamentos((prev) =>
            prev.map((d) => (d.nombre === dept.nombre ? { ...d, cantidadEmpleados: cantidad } : d)),
          )
        }
      })
    }
  }, [departamentos, empleados, isLoaded])

  const value: CompanyContextType = {
    departamentos,
    addDepartamento,
    updateDepartamento,
    deleteDepartamento,
    toggleDepartamentoEstado,
    getDepartamentoById,
    empleados,
    addEmpleado,
    updateEmpleado,
    deleteEmpleado,
    toggleEmpleadoEstado,
    getEmpleadoById,
    getEmpleadosByDepartamento,
  }

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error("useCompany debe ser usado dentro de un CompanyProvider")
  }
  return context
}

