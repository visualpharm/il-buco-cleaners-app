"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, CheckCircle, XCircle, ArrowLeft, Bed, Sofa, Flame, Check } from "lucide-react"
import Image from "next/image"
import { getChecklist, getFotoTypes, seleccionarFotosConPesos } from "@/lib/checklist-loader"

const HABITACIONES = [
  // Planta Baja - Blue
  {
    nombre: "Garden Room",
    piso: "Planta Baja",
    icono: Bed,
    color: "bg-blue-100 hover:bg-blue-200",
    tipo: "habitacion",
  },
  {
    nombre: "Living",
    piso: "Planta Baja",
    icono: Sofa,
    color: "bg-blue-100 hover:bg-blue-200",
    tipo: "living",
  },
  // 1er Piso - Orange
  {
    nombre: "Suite Esquinera",
    piso: "1er Piso",
    icono: Bed,
    color: "bg-orange-100 hover:bg-orange-200",
    tipo: "habitacion",
  },
  {
    nombre: "Suite con Terraza",
    piso: "1er Piso",
    icono: Bed,
    color: "bg-orange-100 hover:bg-orange-200",
    tipo: "habitacion",
  },
  // 2do Piso - Pink
  {
    nombre: "Penthouse",
    piso: "2do Piso",
    icono: Bed,
    color: "bg-gray-200",
    tipo: "habitacion",
    disabled: true,
  },
  {
    nombre: "Parrilla",
    piso: "2do Piso",
    icono: Flame,
    color: "bg-pink-100 hover:bg-pink-200",
    tipo: "parrilla",
  },
  // Escalera - Dark gray
  {
    nombre: "Escalera",
    piso: "Común",
    icono: "stairs", // Special case for custom icon
    color: "bg-gray-600 hover:bg-gray-700 text-white",
    tipo: "escalera",
  },
]

// Simulación de validación IA con análisis detallado
const validarFotoConIA = async (
  file: File,
  validacion: string,
  tipoFoto: any,
): Promise<{ esValida: boolean; analisis: { esperaba: string; encontro: string } }> => {
  // Simulación de delay de IA
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Simulación de respuestas de IA más específicas con análisis
  const respuestasValidas = [
    {
      esValida: true,
      analisis: {
        esperaba: validacion,
        encontro: "Todos los elementos están presentes y en orden correcto",
      },
    },
  ]

  const respuestasInvalidas = [
    {
      esValida: false,
      analisis: {
        esperaba: validacion,
        encontro: "Faltan algunos cubiertos en la imagen",
      },
    },
    {
      esValida: false,
      analisis: {
        esperaba: validacion,
        encontro: "La cama no está completamente hecha, falta estirar la frazada",
      },
    },
    {
      esValida: false,
      analisis: {
        esperaba: validacion,
        encontro: "No se ven las bolsas de repuesto en el fondo del cesto",
      },
    },
    {
      esValida: false,
      analisis: {
        esperaba: validacion,
        encontro: "Hay restos de café en el interior de la cafetera",
      },
    },
  ]

  // 60% de probabilidad de estar correcto
  if (Math.random() > 0.4) {
    return respuestasValidas[0]
  } else {
    return respuestasInvalidas[Math.floor(Math.random() * respuestasInvalidas.length)]
  }
}

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

interface SesionLimpieza {
  id: string
  horaInicio: Date
  fotosSeleccionadas: string[]
  fotosPedidas: string[]
  habitacionesLimpiadas: string[]
}

export default function LimpiezaPage() {
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<any>(null)
  const [pasoActual, setPasoActual] = useState(0)
  const [datosLimpieza, setDatosLimpieza] = useState<StepData[]>([])
  const [horaInicioLimpieza, setHoraInicioLimpieza] = useState<Date | null>(null)
  const [validandoFoto, setValidandoFoto] = useState(false)
  const [esperandoCorreccion, setEsperandoCorreccion] = useState(false)
  const [sesionActual, setSesionActual] = useState<SesionLimpieza | null>(null)
  const [fotoRequerida, setFotoRequerida] = useState(null)

  const CHECKLIST_STEPS = habitacionSeleccionada ? getChecklist(habitacionSeleccionada.tipo) : []
  const TIPOS_FOTOS = getFotoTypes()

  // Inicializar sesión si no existe
  const inicializarSesion = () => {
    if (!sesionActual) {
      // Usar la nueva función de selección con pesos
      const fotosSeleccionadas = seleccionarFotosConPesos(habitacionSeleccionada?.tipo || "habitacion", 1)

      const nuevaSesion: SesionLimpieza = {
        id: Date.now().toString(),
        horaInicio: new Date(),
        fotosSeleccionadas,
        fotosPedidas: [],
        habitacionesLimpiadas: [],
      }

      setSesionActual(nuevaSesion)
      return nuevaSesion
    }
    return sesionActual
  }

  const iniciarLimpieza = (habitacion: any) => {
    // Don't allow clicking on disabled rooms
    if (habitacion.disabled) return

    const sesion = inicializarSesion()

    setHabitacionSeleccionada(habitacion)
    setHoraInicioLimpieza(new Date())
    setPasoActual(0)

    // Actualizar habitaciones limpiadas en la sesión
    if (sesion && !sesion.habitacionesLimpiadas.includes(habitacion.nombre)) {
      setSesionActual({
        ...sesion,
        habitacionesLimpiadas: [...sesion.habitacionesLimpiadas, habitacion.nombre],
      })
    }

    // Inicializar primer paso
    const checklist = getChecklist(habitacion.tipo)
    if (checklist.length > 0) {
      const nuevoDato: StepData = {
        id: checklist[0].id,
        horaInicio: new Date(),
      }
      setDatosLimpieza([nuevoDato])
    }
  }

  const verificarSiFotoRequerida = (pasoId: number) => {
    if (!sesionActual || habitacionSeleccionada?.tipo !== "habitacion") return null

    // Buscar si este paso requiere una foto que esté seleccionada para la sesión
    const tipoFoto = TIPOS_FOTOS.find(
      (tipo) =>
        tipo.paso_relacionado === pasoId &&
        sesionActual.fotosSeleccionadas.includes(tipo.id) &&
        !sesionActual.fotosPedidas.includes(tipo.id),
    )

    return tipoFoto || null
  }

  const completarPaso = async (foto?: File) => {
    if (!CHECKLIST_STEPS || CHECKLIST_STEPS.length === 0 || pasoActual >= CHECKLIST_STEPS.length) {
      return
    }

    const step = CHECKLIST_STEPS[pasoActual]
    const ahora = new Date()
    const tipoFotoRequerida = verificarSiFotoRequerida(step.id)

    let validacion = undefined
    let tipoFoto = undefined

    if (foto && tipoFotoRequerida) {
      setValidandoFoto(true)
      validacion = await validarFotoConIA(foto, tipoFotoRequerida.validacion_ia, tipoFotoRequerida)
      tipoFoto = tipoFotoRequerida.id
      setValidandoFoto(false)

      // Marcar foto como pedida
      if (sesionActual) {
        setSesionActual({
          ...sesionActual,
          fotosPedidas: [...sesionActual.fotosPedidas, tipoFotoRequerida.id],
        })
      }

      if (!validacion.esValida) {
        setEsperandoCorreccion(true)
        return
      }
    }

    const tiempoTranscurrido =
      pasoActual > 0 && datosLimpieza[pasoActual] ? ahora.getTime() - datosLimpieza[pasoActual].horaInicio.getTime() : 0

    // Detectar si hay más de 1 hora entre pasos (crear nueva limpieza)
    const unaHoraEnMs = 60 * 60 * 1000 // 1 hora en milisegundos
    if (pasoActual > 0 && tiempoTranscurrido > unaHoraEnMs) {
      // Guardar limpieza actual como incompleta
      await guardarLimpiezaIncompleta(datosLimpieza)

      // Reiniciar nueva limpieza
      const nuevoDato: StepData = {
        id: CHECKLIST_STEPS[pasoActual].id,
        horaInicio: new Date(),
      }
      setDatosLimpieza([nuevoDato])
      setHoraInicioLimpieza(new Date())
      setPasoActual(0)
    }

    const datosActualizados = [...datosLimpieza]
    if (datosActualizados[pasoActual]) {
      datosActualizados[pasoActual] = {
        ...datosActualizados[pasoActual],
        horaCompletado: ahora,
        tiempoTranscurrido,
        foto: foto ? URL.createObjectURL(foto) : undefined,
        validacionIA: validacion,
        tipoFoto,
      }
    }

    setDatosLimpieza(datosActualizados)
    setFotoRequerida(null)

    // Avanzar al siguiente paso
    if (pasoActual < CHECKLIST_STEPS.length - 1) {
      const siguientePaso: StepData = {
        id: CHECKLIST_STEPS[pasoActual + 1].id,
        horaInicio: new Date(),
      }
      setDatosLimpieza([...datosActualizados, siguientePaso])
      setPasoActual(pasoActual + 1)
    } else {
      // Limpieza completada
      await guardarLimpiezaCompleta(datosActualizados)
    }
  }

  const confirmarCorreccion = () => {
    setEsperandoCorreccion(false)
    const datosActualizados = [...datosLimpieza]
    if (datosActualizados[pasoActual]) {
      datosActualizados[pasoActual] = {
        ...datosActualizados[pasoActual],
        corregido: true,
      }
    }
    setDatosLimpieza(datosActualizados)
    setFotoRequerida(null)
    completarPaso()
  }

  const ignorarCorreccion = () => {
    setEsperandoCorreccion(false)
    const datosActualizados = [...datosLimpieza]
    if (datosActualizados[pasoActual]) {
      datosActualizados[pasoActual] = {
        ...datosActualizados[pasoActual],
        ignorado: true,
      }
    }
    setDatosLimpieza(datosActualizados)
    setFotoRequerida(null)
    completarPaso()
  }

  const guardarLimpiezaIncompleta = async (datos: StepData[]) => {
    if (!habitacionSeleccionada || !horaInicioLimpieza) return

    const limpiezaData = {
      habitacion: habitacionSeleccionada.nombre,
      tipo: habitacionSeleccionada.tipo,
      horaInicio: horaInicioLimpieza.toISOString(),
      horaFin: new Date().toISOString(),
      pasos: datos.map((paso) => ({
        ...paso,
        horaInicio: paso.horaInicio.toISOString(),
        horaCompletado: paso.horaCompletado?.toISOString(),
      })),
      sesionId: sesionActual?.id,
      completa: false,
      razon: "Pausa larga detectada (más de 1 hora)",
    }

    try {
      await fetch("/api/limpiezas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limpiezaData),
      })
    } catch (error) {
      console.error("Error saving limpieza:", error)
    }
  }

  const guardarLimpiezaCompleta = async (datos: StepData[]) => {
    if (!habitacionSeleccionada || !horaInicioLimpieza) return

    const limpiezaData = {
      habitacion: habitacionSeleccionada.nombre,
      tipo: habitacionSeleccionada.tipo,
      horaInicio: horaInicioLimpieza.toISOString(),
      horaFin: new Date().toISOString(),
      pasos: datos.map((paso) => ({
        ...paso,
        horaInicio: paso.horaInicio.toISOString(),
        horaCompletado: paso.horaCompletado?.toISOString(),
      })),
      sesionId: sesionActual?.id,
      completa: true,
    }

    try {
      await fetch("/api/limpiezas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limpiezaData),
      })
    } catch (error) {
      console.error("Error saving limpieza:", error)
    }

    // Resetear para nueva limpieza
    setHabitacionSeleccionada(null)
    setPasoActual(0)
    setDatosLimpieza([])
    setHoraInicioLimpieza(null)
    setFotoRequerida(null)
  }

  // Agrupar habitaciones por piso
  const habitacionesPorPiso = HABITACIONES.reduce(
    (acc, habitacion) => {
      if (!acc[habitacion.piso]) {
        acc[habitacion.piso] = []
      }
      acc[habitacion.piso].push(habitacion)
      return acc
    },
    {} as Record<string, typeof HABITACIONES>,
  )

  // Verificar si se requiere foto para el paso actual
  const stepActual = CHECKLIST_STEPS && CHECKLIST_STEPS.length > 0 ? CHECKLIST_STEPS[pasoActual] : null
  const tipoFotoRequerida = stepActual ? verificarSiFotoRequerida(stepActual.id) : null
  const validacionActual = datosLimpieza[pasoActual]?.validacionIA

  if (!habitacionSeleccionada) {
    return (
      <div className="min-h-screen bg-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-blue-800">Gracias por limpiar Il Buco!</CardTitle>
              <p className="text-gray-600">Selecciona la habitación o área a limpiar</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(habitacionesPorPiso).map(([piso, habitaciones]) => (
                <div key={piso}>
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">{piso}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {habitaciones.map((habitacion) => {
                      const IconoHabitacion = habitacion.icono
                      const yaLimpiada = sesionActual?.habitacionesLimpiadas?.includes(habitacion.nombre) || false
                      const isDisabled = habitacion.disabled

                      return (
                        <Button
                          key={habitacion.nombre}
                          onClick={() => iniciarLimpieza(habitacion)}
                          disabled={isDisabled}
                          className={`h-24 p-4 text-left justify-start relative transition-all border-0 ${
                            isDisabled ? "cursor-not-allowed opacity-75" : "shadow-md"
                          } ${habitacion.color}`}
                          variant="outline"
                        >
                          <div className="flex flex-col items-start w-full">
                            <div className="flex items-center justify-between w-full mb-1">
                              {habitacion.icono === "stairs" ? (
                                <Image
                                  src="/icons/stairs-icon.png"
                                  alt="Stairs"
                                  width={24}
                                  height={24}
                                  className="w-6 h-6 filter invert"
                                />
                              ) : (
                                <IconoHabitacion className="w-6 h-6" />
                              )}
                              {yaLimpiada && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </div>
                            <div className="text-sm font-medium leading-tight">{habitacion.nombre}</div>
                          </div>

                          {/* Add central inclined labels for Penthouse */}
                          {habitacion.nombre === "Penthouse" && (
                            <>
                              <div className="absolute top-2 right-4 bg-red-500 text-white text-xs px-3 py-1 transform rotate-12 shadow-sm">
                                No limpiamos
                              </div>
                              <div className="absolute bottom-2 left-4 bg-orange-500 text-white text-xs px-3 py-1 transform -rotate-12 shadow-sm">
                                Solo sacar hongos del dormitorio
                              </div>
                            </>
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (pasoActual >= CHECKLIST_STEPS.length) {
    return (
      <div className="min-h-screen bg-green-50 p-4 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">¡Limpieza Completada!</h2>
            <p className="text-gray-600 mb-6">{habitacionSeleccionada.nombre} ha sido limpiada correctamente</p>
            <Button onClick={() => setHabitacionSeleccionada(null)} className="w-full">
              Continuar con otra habitación
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Safety check for stepActual
  if (!stepActual) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md border-0 shadow-lg">
          <CardContent className="text-center p-8">
            <p className="text-gray-600">Error: No se pudo cargar el paso actual</p>
            <Button onClick={() => setHabitacionSeleccionada(null)} className="w-full mt-4">
              Volver al menú
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (pasoActual > 0) {
                // Go to previous step
                setPasoActual(pasoActual - 1)
              } else {
                // If at first step, go back to menu
                setHabitacionSeleccionada(null)
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="font-bold text-lg">{habitacionSeleccionada.nombre}</h1>
            <p className="text-sm text-gray-600">
              Paso {pasoActual + 1} de {CHECKLIST_STEPS.length} • {habitacionSeleccionada.piso}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              guardarLimpiezaIncompleta(datosLimpieza)
              setHabitacionSeleccionada(null)
            }}
            className="text-xs"
          >
            Guardar
          </Button>
        </div>

        {/* Progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((pasoActual + 1) / CHECKLIST_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Paso actual */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between"></div>
            <CardTitle className="text-lg">
              {stepActual.texto &&
              stepActual.texto.includes(":") &&
              stepActual.texto.split(":")[1] &&
              stepActual.texto.split(":")[1].includes(",") ? (
                <div>
                  <div className="mb-2">{stepActual.texto.split(":")[0]}:</div>
                  <ul className="list-disc list-inside space-y-1 text-base font-normal">
                    {stepActual.texto
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
                <div>
                  <div className="mb-2">{stepActual.texto || "Paso sin descripción"}</div>
                  {tipoFotoRequerida && (
                    <ul className="list-disc list-inside space-y-1 text-base font-normal text-gray-600 mt-2">
                      {tipoFotoRequerida.descripcion.split(",").map((item, index) => (
                        <li key={index}>{item.trim()}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tipoFotoRequerida && (
              <div className="space-y-3">
                <label className="block">
                  <div className="border-2 border-dashed border-yellow-400 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500 transition-colors bg-yellow-50">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <p className="text-sm text-yellow-800 font-medium">
                      {tipoFotoRequerida.id === "cama" &&
                        "Toca para sacar la foto de cama completa, para que se vean las sábanas puestas"}
                      {tipoFotoRequerida.id === "cubiertos" &&
                        "Toca para sacar la foto de todos los cubiertos ordenados"}
                      {tipoFotoRequerida.id === "basura" &&
                        "Toca para sacar la foto del cesto con bolsa nueva y repuestos"}
                      {tipoFotoRequerida.id === "cafetera" &&
                        "Toca para sacar la foto del interior vacío de la cafetera"}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) completarPaso(file)
                      }}
                    />
                  </div>
                </label>
              </div>
            )}

            {validandoFoto && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Analizando foto con IA...</p>
              </div>
            )}

            {validacionActual && !esperandoCorreccion && (
              <div className={`p-4 rounded-lg border-0 ${validacionActual.esValida ? "bg-green-100" : "bg-red-100"}`}>
                <div className="flex items-start">
                  {validacionActual.esValida ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`text-sm ${validacionActual.esValida ? "text-green-800" : "text-red-800"}`}>
                      <div className="font-medium mb-2">Análisis de IA:</div>
                      <div className="mb-1">
                        <strong>Esperaba ver:</strong> {validacionActual.analisis.esperaba}
                      </div>
                      <div>
                        <strong>Encontré:</strong> {validacionActual.analisis.encontro}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {esperandoCorreccion && (
              <div className="space-y-3">
                <div className="p-4 bg-red-100 rounded-lg border-0">
                  <div className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-red-800">
                        <div className="font-medium mb-2">Análisis de IA:</div>
                        <div className="mb-1">
                          <strong>Esperaba ver:</strong> {validacionActual?.analisis.esperaba}
                        </div>
                        <div className="mb-3">
                          <strong>Encontré:</strong> {validacionActual?.analisis.encontro}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={confirmarCorreccion} className="flex-1">
                    Ya corregí, sacar otra foto
                  </Button>
                  <Button variant="outline" onClick={ignorarCorreccion} className="flex-1">
                    Todo bien, ignorar
                  </Button>
                </div>
              </div>
            )}

            {!tipoFotoRequerida && !validandoFoto && !esperandoCorreccion && (
              <Button onClick={() => completarPaso()} className="w-full flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Marcar como completado
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
