"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Camera, AlertTriangle, Pause } from "lucide-react"
import Image from "next/image"

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

const TIPOS_FOTOS = [
  {
    id: "cama",
    titulo: "Cama completa",
    descripcion:
      "Cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz",
  },
  {
    id: "cubiertos",
    titulo: "Cubiertos completos",
    descripcion: "2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina",
  },
  {
    id: "basura",
    titulo: "Cesto de basura",
    descripcion: "Cesto vacío con bolsa nueva y 2 bolsas de repuesto",
  },
  {
    id: "cafetera",
    titulo: "Interior de cafetera",
    descripcion: "Interior de cafetera vacía y limpia",
  },
]

const CHECKLIST_HABITACIONES = [
  { id: 1, categoria: "Inspección inicial", texto: "Tocar la puerta" },
  { id: 2, categoria: "Inspección inicial", texto: "Entrar y verificar si hubo check-out" },
  {
    id: 3,
    categoria: "Revisión para lavar",
    texto: "Revisar si hace falta lavar: cortinas, fundas decorativas, funda de futón, mantas o plaids",
  },
  {
    id: 4,
    categoria: "Revisión para lavar",
    texto: "Si hubo huéspedes: sábanas, fundas de almohadas, funda del edredón, toallas",
  },
  {
    id: 5,
    categoria: "Revisión para lavar",
    texto: "Separar blancos y colores y poner a lavar (se puede juntar con otras habitaciones)",
  },
  {
    id: 7,
    categoria: "Tender la cama",
    texto:
      "Colocar la sábana, Poner las fundas de almohada, Alinear bien la funda del acolchado, Colocar el pie de cama con arrugas, Dejar la manta polar en la mesita de luz",
  },
  { id: 8, categoria: "Baño", texto: "1 toalla grande + 1 de mano por huésped" },
  { id: 9, categoria: "Baño", texto: "Papel higiénico: 1 usado + 1 nuevo" },
  {
    id: 10,
    categoria: "Baño",
    texto:
      "Botellas: jabón líquido en bacha, jabón líquido en ducha, shampoo (revisar que no estén con menos de la mitad)",
  },
  { id: 11, categoria: "Baño", texto: "Limpiar: ducha, bacha, inodoro, espejo, mampara" },
  {
    id: 12,
    categoria: "Cocina y utensilios",
    texto: "Verificar cubiertos: 2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina",
  },
  {
    id: 13,
    categoria: "Cocina y utensilios",
    texto: "Verificar vajilla: 2 platos grandes, 2 platos hondos, 2 platos postre, 2 vasos, 2 tazas",
  },
  { id: 14, categoria: "Cocina y utensilios", texto: "Verificar utensilios de cocina: 1 olla o sartén, 1 espátula" },
  {
    id: 15,
    categoria: "Cocina y utensilios",
    texto: "Condimentos: 3 bolsitas de sal, 3 de azúcar, 3 de edulcorante en frascos (uno por tipo)",
  },
  { id: 16, categoria: "Cocina y utensilios", texto: "Cafetera: revisar que esté vacía adentro" },
  { id: 17, categoria: "Limpieza general", texto: "Limpiar vidrios si están marcados" },
  { id: 18, categoria: "Limpieza general", texto: "Limpiar mesas, mesitas, estantes" },
  { id: 19, categoria: "Limpieza general", texto: "Revisar y limpiar horno, microondas, heladera por dentro" },
  { id: 20, categoria: "Limpieza general", texto: "Aspirar y trapear piso" },
  { id: 21, categoria: "Basura y cierre", texto: "Tirar la basura de todos los tachos" },
  { id: 22, categoria: "Basura y cierre", texto: "Poner 1 bolsa nueva y dejar 2 bolsas de repuesto en el fondo" },
  { id: 23, categoria: "Basura y cierre", texto: "Apagar luces y aire" },
  { id: 24, categoria: "Basura y cierre", texto: "Cerrar ventanas y puertas" },
].map((item, index) => ({ ...item, id: index + 1 }))

const CHECKLIST_PARRILLA = [
  { id: 1, categoria: "Inspección", texto: "Revisar estado general de la parrilla" },
  { id: 2, categoria: "Limpieza", texto: "Limpiar parrilla si está sucia" },
  { id: 3, categoria: "Limpieza", texto: "Limpiar mesa y superficies" },
  { id: 4, categoria: "Limpieza", texto: "Barrer y limpiar el piso" },
  { id: 5, categoria: "Basura", texto: "Tirar basura y poner bolsa nueva" },
  { id: 6, categoria: "Cierre", texto: "Verificar que todo esté en orden" },
]

const CHECKLIST_ESCALERA = [
  { id: 1, categoria: "Limpieza", texto: "Aspirar escalones" },
  { id: 2, categoria: "Limpieza", texto: "Limpiar barandas" },
  { id: 3, categoria: "Limpieza", texto: "Limpiar hall común" },
  { id: 4, categoria: "Limpieza", texto: "Trapear pisos" },
  { id: 5, categoria: "Basura", texto: "Tirar basura si hay" },
]

const obtenerChecklist = (tipo: string) => {
  switch (tipo) {
    case "parrilla":
      return CHECKLIST_PARRILLA
    case "escalera":
      return CHECKLIST_ESCALERA
    default:
      return CHECKLIST_HABITACIONES
  }
}

export default function VanishPage() {
  const [limpiezas, setLimpiezas] = useState<LimpiezaCompleta[]>([])
  const [limpiezaSeleccionada, setLimpiezaSeleccionada] = useState<LimpiezaCompleta | null>(null)

  useEffect(() => {
    const limpiezasGuardadas = JSON.parse(localStorage.getItem("limpiezas") || "[]")
    // Convertir strings de fecha a objetos Date
    const limpiezasConFechas = limpiezasGuardadas.map((limpieza: any) => ({
      ...limpieza,
      horaInicio: new Date(limpieza.horaInicio),
      horaFin: new Date(limpieza.horaFin),
      pasos: limpieza.pasos.map((paso: any) => ({
        ...paso,
        horaInicio: new Date(paso.horaInicio),
        horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado) : undefined,
      })),
    }))

    // Ordenar por fecha más reciente primero
    limpiezasConFechas.sort((a, b) => b.horaInicio.getTime() - a.horaInicio.getTime())
    setLimpiezas(limpiezasConFechas)
  }, [])

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
      correcciones,
      pasosIncompletos,
      pasosCompletados,
      totalPasos: checklistCompleto.length,
      porcentajeCompletado: Math.round((pasosCompletados / checklistCompleto.length) * 100),
    }
  }

  const limpiarDatos = () => {
    if (confirm("¿Estás seguro de que quieres borrar todos los datos de limpieza?")) {
      localStorage.removeItem("limpiezas")
      setLimpiezas([])
      setLimpiezaSeleccionada(null)
    }
  }

  if (limpiezaSeleccionada) {
    const resumen = calcularResumen(limpiezaSeleccionada)
    const checklistCompleto = obtenerChecklist(limpiezaSeleccionada.tipo || "habitacion")

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => setLimpiezaSeleccionada(null)}>
              ← Volver a reportes
            </Button>
            <div className="text-right">
              <h1 className="text-2xl font-bold">{limpiezaSeleccionada.habitacion}</h1>
              <p className="text-gray-600">
                {limpiezaSeleccionada.horaInicio.toLocaleDateString()} -{" "}
                {limpiezaSeleccionada.horaInicio.toLocaleTimeString()}
              </p>
              {!limpiezaSeleccionada.completa && (
                <Badge variant="destructive" className="mt-1">
                  Incompleta - {limpiezaSeleccionada.razon}
                </Badge>
              )}
            </div>
          </div>

          {/* Resumen */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumen de Limpieza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{resumen.tiempoTotal}</div>
                  <div className="text-sm text-gray-600">Tiempo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{resumen.porcentajeCompletado}%</div>
                  <div className="text-sm text-gray-600">Completado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{resumen.correcciones}</div>
                  <div className="text-sm text-gray-600">Correcciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{resumen.pasosIncompletos}</div>
                  <div className="text-sm text-gray-600">Faltantes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pasos detallados */}
          <div className="space-y-4">
            {checklistCompleto.map((step, index) => {
              const pasoData = limpiezaSeleccionada.pasos.find((p) => p.id === step.id)

              return (
                <Card key={step.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{step.categoria}</Badge>
                        {pasoData?.horaCompletado ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : pasoData ? (
                          <Pause className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">Paso {index + 1}</div>
                    </div>
                    <CardTitle className="text-lg">
                      {step.texto.includes(":") && step.texto.split(":")[1].includes(",") ? (
                        <div>
                          <div className="mb-2">{step.texto.split(":")[0]}:</div>
                          <ul className="list-disc list-inside space-y-1 text-base font-normal">
                            {step.texto
                              .split(":")[1]
                              .split(",")
                              .map((item, index) => (
                                <li key={index} className="text-gray-700">
                                  {item.trim()}
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : (
                        step.texto
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pasoData ? (
                      <div className="space-y-3">
                        {/* Tiempos */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Inicio:</span> {pasoData.horaInicio.toLocaleTimeString()}
                          </div>
                          {pasoData.horaCompletado && (
                            <div>
                              <span className="font-medium">Completado:</span>{" "}
                              {pasoData.horaCompletado.toLocaleTimeString()}
                            </div>
                          )}
                        </div>

                        {pasoData.tiempoTranscurrido && (
                          <div className="text-sm">
                            <span className="font-medium">Tiempo empleado:</span>{" "}
                            {formatearTiempo(pasoData.tiempoTranscurrido)}
                            {pasoData.tiempoTranscurrido > 3600000 && (
                              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-600">
                                Pausa larga detectada
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Foto y validación IA */}
                        {pasoData.foto && (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Camera className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Foto:{" "}
                                {pasoData.tipoFoto
                                  ? TIPOS_FOTOS.find((t) => t.id === pasoData.tipoFoto)?.titulo || "Foto requerida"
                                  : "Foto requerida"}
                              </span>
                            </div>

                            <Image
                              src={pasoData.foto || "/placeholder.svg"}
                              alt="Foto del paso"
                              width={200}
                              height={150}
                              className="rounded-lg border"
                            />

                            {pasoData.validacionIA && (
                              <div
                                className={`p-3 rounded-lg ${pasoData.validacionIA.esValida ? "bg-green-100" : "bg-red-100"}`}
                              >
                                <div className="flex items-start">
                                  {pasoData.validacionIA.esValida ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                  )}
                                  <div className="flex-1">
                                    <div
                                      className={`text-sm ${pasoData.validacionIA.esValida ? "text-green-800" : "text-red-800"}`}
                                    >
                                      <div className="font-medium mb-2">Análisis de IA:</div>
                                      <div className="mb-1">
                                        <strong>Esperaba ver:</strong> {pasoData.validacionIA.analisis.esperaba}
                                      </div>
                                      <div>
                                        <strong>Encontré:</strong> {pasoData.validacionIA.analisis.encontro}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {(pasoData.corregido || pasoData.ignorado) && (
                              <div className="flex space-x-2">
                                {pasoData.corregido && (
                                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    Corregido manualmente
                                  </Badge>
                                )}
                                {pasoData.ignorado && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                                    Ignorado por el usuario
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {!pasoData.horaCompletado && (
                          <div className="text-yellow-600 text-sm italic">⏸️ Paso iniciado pero no completado</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">⚠️ Paso no iniciado</div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
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
              🧹 Abrir Checklist de Limpiador
            </Button>
            <Button variant="destructive" onClick={limpiarDatos}>
              Limpiar Datos
            </Button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{limpiezas.length}</div>
              <div className="text-sm text-gray-600">Total Limpiezas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {limpiezas.filter((l) => l.completa !== false).length}
              </div>
              <div className="text-sm text-gray-600">Completas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {limpiezas.filter((l) => l.completa === false).length}
              </div>
              <div className="text-sm text-gray-600">Incompletas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(limpiezas.map((l) => l.habitacion)).size}
              </div>
              <div className="text-sm text-gray-600">Habitaciones</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de limpiezas */}
        <Card>
          <CardHeader>
            <CardTitle>Limpiezas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {limpiezas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No hay limpiezas registradas aún</div>
            ) : (
              <div className="space-y-4">
                {limpiezas.map((limpieza) => {
                  const resumen = calcularResumen(limpieza)

                  return (
                    <div
                      key={limpieza.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setLimpiezaSeleccionada(limpieza)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{limpieza.habitacion}</h3>
                            {limpieza.completa === false && <Badge variant="destructive">Incompleta</Badge>}
                          </div>
                          <p className="text-gray-600 text-sm">
                            {limpieza.horaInicio.toLocaleDateString()} - {limpieza.horaInicio.toLocaleTimeString()} a{" "}
                            {limpieza.horaFin.toLocaleTimeString()}
                          </p>
                          {limpieza.razon && <p className="text-orange-600 text-xs mt-1">{limpieza.razon}</p>}
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-600">{resumen.tiempoTotal}</div>
                            <div className="text-gray-500">Duración</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-600">{resumen.porcentajeCompletado}%</div>
                            <div className="text-gray-500">Completado</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-600">{resumen.correcciones}</div>
                            <div className="text-gray-500">Correcciones</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-red-600">{resumen.pasosIncompletos}</div>
                            <div className="text-gray-500">Faltantes</div>
                          </div>
                        </div>
                      </div>

                      {/* Indicadores de estado */}
                      <div className="flex space-x-2 mt-3">
                        {limpieza.completa !== false && resumen.pasosIncompletos === 0 && (
                          <Badge className="bg-green-100 text-green-800">Completa</Badge>
                        )}
                        {resumen.correcciones > 0 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {resumen.correcciones} correcciones
                          </Badge>
                        )}
                        {resumen.pasosIncompletos > 0 && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {resumen.pasosIncompletos} pasos faltantes
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
