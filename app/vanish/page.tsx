"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, Pause, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import Image from "next/image"
import { getChecklist, getFotoTypes } from "@/lib/checklist-loader"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { LimpiezaDB } from "@/lib/db"

interface StepData {
  id: number
  horaInicio: Date
  horaCompletado?: Date
  tiempoTranscurrido?: number
  foto?: string
  validacionIA?: { esValida: boolean; analisis: { esperaba: string; encontro: string } }
  corregido?: boolean
  ignorado?: boolean
  tipoFoto?: string
}

interface LimpiezaCompleta {
  id: number
  habitacion: string
  tipo?: string
  horaInicio: Date
  horaFin: Date
  pasos: StepData[]
  sesionId?: string
  completa?: boolean
  razon?: string
}

type SortField = "habitacion" | "horaInicio" | "duracion" | "completado" | "correcciones"
type SortDirection = "asc" | "desc"
type FilterType = "all" | "completas" | "incompletas"

const TIPOS_FOTOS = getFotoTypes()

const obtenerChecklist = (tipo: string) => getChecklist(tipo)

export default function VanishPage() {
  const [limpiezas, setLimpiezas] = useState<LimpiezaCompleta[]>([])
  const [limpiezaSeleccionada, setLimpiezaSeleccionada] = useState<LimpiezaCompleta | null>(null)
  const [sortField, setSortField] = useState<SortField>("horaInicio")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [filter, setFilter] = useState<FilterType>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLimpiezas()
  }, [])

  const fetchLimpiezas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/limpiezas")
      if (response.ok) {
        const limpiezasDB: LimpiezaDB[] = await response.json()
        // Convert DB format to component format
        const limpiezasConvertidas = limpiezasDB.map((limpieza) => ({
          ...limpieza,
          horaInicio: new Date(limpieza.horaInicio),
          horaFin: new Date(limpieza.horaFin),
          pasos: limpieza.pasos.map((paso) => ({
            ...paso,
            horaInicio: new Date(paso.horaInicio),
            horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado) : undefined,
          })),
        }))
        setLimpiezas(limpiezasConvertidas)
      }
    } catch (error) {
      console.error("Error fetching limpiezas:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatearTiempo = (ms: number) => {
    const minutos = Math.floor(ms / 60000)
    const segundos = Math.floor((ms % 60000) / 1000)
    return `${minutos}m ${segundos}s`
  }

  const calcularResumen = (limpieza: LimpiezaCompleta) => {
    const tiempoTotal = limpieza.horaFin.getTime() - limpieza.horaInicio.getTime()
    const correcciones = limpieza.pasos.filter(
      (p) => p.corregido || p.ignorado || (p.validacionIA && !p.validacionIA.esValida),
    ).length

    const checklistCompleto = obtenerChecklist(limpieza.tipo || "habitacion")
    const pasosCompletados = limpieza.pasos.filter((p) => p.horaCompletado).length
    const pasosIncompletos = checklistCompleto.length - pasosCompletados

    return {
      tiempoTotal: formatearTiempo(tiempoTotal),
      tiempoTotalMs: tiempoTotal,
      correcciones,
      pasosIncompletos,
      pasosCompletados,
      totalPasos: checklistCompleto.length,
      porcentajeCompletado: Math.round((pasosCompletados / checklistCompleto.length) * 100),
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const filteredAndSortedLimpiezas = useMemo(() => {
    let filtered = limpiezas

    // Apply filter
    switch (filter) {
      case "completas":
        filtered = limpiezas.filter((l) => l.completa !== false)
        break
      case "incompletas":
        filtered = limpiezas.filter((l) => l.completa === false)
        break
      default:
        filtered = limpiezas
    }

    // Apply sort
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case "habitacion":
          aValue = a.habitacion
          bValue = b.habitacion
          break
        case "horaInicio":
          aValue = a.horaInicio.getTime()
          bValue = b.horaInicio.getTime()
          break
        case "duracion":
          aValue = calcularResumen(a).tiempoTotalMs
          bValue = calcularResumen(b).tiempoTotalMs
          break
        case "completado":
          aValue = calcularResumen(a).porcentajeCompletado
          bValue = calcularResumen(b).porcentajeCompletado
          break
        case "correcciones":
          aValue = calcularResumen(a).correcciones
          bValue = calcularResumen(b).correcciones
          break
        default:
          return 0
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }, [limpiezas, filter, sortField, sortDirection])

  const estadisticas = useMemo(() => {
    return {
      total: limpiezas.length,
      completas: limpiezas.filter((l) => l.completa !== false).length,
      incompletas: limpiezas.filter((l) => l.completa === false).length,
      habitaciones: new Set(limpiezas.map((l) => l.habitacion)).size,
    }
  }, [limpiezas])

  if (limpiezaSeleccionada) {
    const resumen = calcularResumen(limpiezaSeleccionada)
    const checklistCompleto = obtenerChecklist(limpiezaSeleccionada.tipo || "habitacion")

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setLimpiezaSeleccionada(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            <div className="text-right">
              <h1 className="text-xl font-bold">{limpiezaSeleccionada.habitacion}</h1>
              <p className="text-sm text-gray-600">
                {limpiezaSeleccionada.horaInicio.toLocaleDateString()} -{" "}
                {limpiezaSeleccionada.horaInicio.toLocaleTimeString()}
              </p>
              {!limpiezaSeleccionada.completa && (
                <Badge variant="destructive" className="mt-1">
                  Incompleta
                </Badge>
              )}
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{resumen.tiempoTotal}</div>
                <div className="text-sm text-gray-600">Tiempo Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{resumen.porcentajeCompletado}%</div>
                <div className="text-sm text-gray-600">Completado</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{resumen.correcciones}</div>
                <div className="text-sm text-gray-600">Correcciones</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{resumen.pasosIncompletos}</div>
                <div className="text-sm text-gray-600">Faltantes</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de pasos */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Pasos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Operación</TableHead>
                      <TableHead className="w-24">Duración</TableHead>
                      <TableHead className="w-32">Finalizado</TableHead>
                      <TableHead className="w-20">Estado</TableHead>
                      <TableHead className="w-24">Foto</TableHead>
                      <TableHead>Análisis IA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklistCompleto.map((step, index) => {
                      const pasoData = limpiezaSeleccionada.pasos.find((p) => p.id === step.id)
                      const duracion = pasoData?.horaCompletado
                        ? pasoData.horaCompletado.getTime() - pasoData.horaInicio.getTime()
                        : 0
                      const esRapido = duracion < 10000 // menos de 10 segundos
                      const esLargo = duracion > 1200000 // más de 20 minutos

                      // Extraer solo el título principal (antes de los dos puntos o la primera línea)
                      let titulo = step.texto
                      if (titulo.includes(":")) {
                        titulo = titulo.split(":")[0]
                      } else if (titulo.includes("\n")) {
                        titulo = titulo.split("\n")[0]
                      }

                      return (
                        <TableRow key={step.id} className={!pasoData ? "opacity-50" : ""}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{titulo}</TableCell>
                          <TableCell>
                            {pasoData?.horaCompletado ? (
                              <span className={`${esRapido ? "text-red-600" : esLargo ? "text-orange-600" : ""}`}>
                                {formatearTiempo(duracion)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {pasoData?.horaCompletado ? pasoData.horaCompletado.toLocaleTimeString() : "-"}
                          </TableCell>
                          <TableCell>
                            {pasoData?.horaCompletado ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : pasoData ? (
                              <Pause className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                            )}
                          </TableCell>
                          <TableCell>
                            {pasoData?.foto ? (
                              <div className="relative h-12 w-12 rounded-md overflow-hidden border border-gray-200">
                                <Image
                                  src={pasoData.foto || "/placeholder.svg"}
                                  alt="Foto"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {pasoData?.validacionIA ? (
                              <div className="flex items-center">
                                {pasoData.validacionIA.esValida ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                                )}
                                <span className="text-xs truncate max-w-[200px]">
                                  {pasoData.validacionIA.analisis.encontro}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Il Buco - Panel de Control</h1>
            <p className="text-gray-600">Reportes de limpieza y seguimiento de habitaciones</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => window.open("/", "_blank")}
              className="bg-blue-50 hover:bg-blue-100 border-blue-300"
            >
              Limpiador
            </Button>
          </div>
        </div>

        {/* Estadísticas generales - Clickable filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card
            className={`cursor-pointer transition-colors ${filter === "all" ? "ring-2 ring-blue-500" : "hover:bg-gray-50"}`}
            onClick={() => setFilter("all")}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
              <div className="text-sm text-gray-600">Total Limpiezas</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filter === "completas" ? "ring-2 ring-green-500" : "hover:bg-gray-50"}`}
            onClick={() => setFilter("completas")}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{estadisticas.completas}</div>
              <div className="text-sm text-gray-600">Completas</div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${filter === "incompletas" ? "ring-2 ring-orange-500" : "hover:bg-gray-50"}`}
            onClick={() => setFilter("incompletas")}
          >
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{estadisticas.incompletas}</div>
              <div className="text-sm text-gray-600">Incompletas</div>
            </CardContent>
          </Card>
          <Card className="hover:bg-gray-50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{estadisticas.habitaciones}</div>
              <div className="text-sm text-gray-600">Habitaciones</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de limpiezas */}
        <Card>
          <CardHeader>
            <CardTitle>Limpiezas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            ) : filteredAndSortedLimpiezas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filter === "all" ? "No hay limpiezas registradas aún" : `No hay limpiezas ${filter}`}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("habitacion")}>
                        <div className="flex items-center space-x-1">
                          <span>Habitación</span>
                          {getSortIcon("habitacion")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("horaInicio")}>
                        <div className="flex items-center space-x-1">
                          <span>Fecha/Hora</span>
                          {getSortIcon("horaInicio")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("duracion")}>
                        <div className="flex items-center space-x-1">
                          <span>Duración</span>
                          {getSortIcon("duracion")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("completado")}>
                        <div className="flex items-center space-x-1">
                          <span>Completado</span>
                          {getSortIcon("completado")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort("correcciones")}>
                        <div className="flex items-center space-x-1">
                          <span>Correcciones</span>
                          {getSortIcon("correcciones")}
                        </div>
                      </TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedLimpiezas.map((limpieza) => {
                      const resumen = calcularResumen(limpieza)

                      return (
                        <TableRow key={limpieza.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{limpieza.habitacion}</TableCell>
                          <TableCell>
                            <div>
                              <div>{limpieza.horaInicio.toLocaleDateString()}</div>
                              <div className="text-sm text-gray-500">
                                {limpieza.horaInicio.toLocaleTimeString()} - {limpieza.horaFin.toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{resumen.tiempoTotal}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{resumen.porcentajeCompletado}%</span>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${resumen.porcentajeCompletado}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={resumen.correcciones > 0 ? "text-orange-600" : "text-green-600"}>
                              {resumen.correcciones}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              {limpieza.completa !== false && resumen.pasosIncompletos === 0 && (
                                <Badge className="bg-green-100 text-green-800">Completa</Badge>
                              )}
                              {limpieza.completa === false && <Badge variant="destructive">Incompleta</Badge>}
                              {resumen.correcciones > 0 && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  {resumen.correcciones} correcciones
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" onClick={() => setLimpiezaSeleccionada(limpieza)}>
                              Ver detalles
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
