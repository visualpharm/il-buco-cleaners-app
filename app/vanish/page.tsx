"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  fallado?: boolean
  fotoFalla?: string
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
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [limpiezas, setLimpiezas] = useState<LimpiezaCompleta[]>([])
  const [limpiezaSeleccionada, setLimpiezaSeleccionada] = useState<LimpiezaCompleta | null>(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<{fecha: Date, operaciones: LimpiezaCompleta[]} | null>(null)

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to navigate with URL params
  const navigateToDate = (fecha: Date, operaciones: LimpiezaCompleta[]) => {
    const dateString = fecha.toISOString().split('T')[0] // YYYY-MM-DD format
    router.push(`/vanish?date=${dateString}`)
    setFechaSeleccionada({ fecha, operaciones })
  }

  const navigateToHome = () => {
    router.push('/vanish')
    setFechaSeleccionada(null)
    setLimpiezaSeleccionada(null)
  }

  // Handle URL parameters on load and when they change
  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && limpiezas.length > 0) {
      const selectedDate = new Date(dateParam + 'T00:00:00')
      const gruposPorFecha = agruparPorFecha()
      const grupo = gruposPorFecha.find(g => 
        g.fecha.toDateString() === selectedDate.toDateString()
      )
      if (grupo) {
        setFechaSeleccionada({
          fecha: grupo.fecha,
          operaciones: grupo.operaciones
        })
      }
    }
  }, [searchParams, limpiezas])

  useEffect(() => {
    const fetchLimpiezas = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/vanish');
        if (!response.ok) {
          throw new Error('Failed to fetch cleaning sessions');
        }
        const data = await response.json();
        
        // Parse ISO date strings back to Date objects
        const parsedData = data.map((limpieza: any) => ({
          ...limpieza,
          horaInicio: new Date(limpieza.horaInicio),
          horaFin: new Date(limpieza.horaFin),
          pasos: limpieza.pasos.map((paso: any) => ({
            ...paso,
            horaInicio: new Date(paso.horaInicio),
            horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado) : undefined,
          }))
        }));
        
        setLimpiezas(parsedData);
      } catch (err) {
        console.error('Error fetching cleaning sessions:', err);
        setError('Failed to load cleaning sessions. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimpiezas();
  }, [])

  const formatearTiempo = (ms: number) => {
    const minutos = Math.floor(ms / 60000)
    const segundos = Math.floor((ms % 60000) / 1000)
    return `${minutos}m ${segundos}s`
  }

  const formatDuration = (ms: number) => {
    const minutos = Math.floor(ms / 60000)
    const segundos = Math.floor((ms % 60000) / 1000)
    return `${minutos}:${segundos.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const isSameDay = (d1: Date, d2: Date) => 
      d1.getDate() === d2.getDate() && 
      d1.getMonth() === d2.getMonth() && 
      d1.getFullYear() === d2.getFullYear()
    
    const timeStr = date.toTimeString().slice(0, 5) // HH:MM format
    
    if (isSameDay(date, today)) {
      return `Today ${timeStr}`
    } else if (isSameDay(date, yesterday)) {
      return `Yesterday ${timeStr}`
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${timeStr}`
    }
  }

  const isWeirdDuration = (ms: number) => {
    return ms < 10000 || ms > 600000 // Less than 10 seconds or more than 10 minutes
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

  // Group cleaning operations into sessions (max 1 hour gap between operations)
  const agruparEnSesiones = (limpiezas: LimpiezaCompleta[]) => {
    if (limpiezas.length === 0) return []
    
    const sortedLimpiezas = [...limpiezas].sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime())
    const sesiones: LimpiezaCompleta[][] = []
    let sesionActual: LimpiezaCompleta[] = [sortedLimpiezas[0]]
    
    for (let i = 1; i < sortedLimpiezas.length; i++) {
      const anterior = sortedLimpiezas[i - 1]
      const actual = sortedLimpiezas[i]
      const diferencia = actual.horaInicio.getTime() - anterior.horaFin.getTime()
      
      // If gap is more than 1 hour (3600000 ms), start new session
      if (diferencia > 3600000) {
        sesiones.push(sesionActual)
        sesionActual = [actual]
      } else {
        sesionActual.push(actual)
      }
    }
    
    sesiones.push(sesionActual)
    return sesiones
  }

  const calcularEstadisticas30Dias = () => {
    const hace30Dias = new Date()
    hace30Dias.setDate(hace30Dias.getDate() - 30)
    
    const limpiezasRecientes = limpiezas.filter(l => l.horaInicio >= hace30Dias)
    
    if (limpiezasRecientes.length === 0) {
      return {
        totalLimpiezas: 0,
        tiempoTotalSesiones: "0:00",
        tiempoPromedioOperacion: "0 min",
        habitacionesUnicas: 0
      }
    }
    
    // Group by day to calculate session times
    const sesiones = agruparEnSesiones(limpiezasRecientes)
    const tiempoTotalSesiones = sesiones.reduce((total, sesion) => {
      const inicio = sesion[0].horaInicio.getTime()
      const fin = sesion[sesion.length - 1].horaFin.getTime()
      return total + (fin - inicio)
    }, 0)
    
    const horas = Math.floor(tiempoTotalSesiones / 3600000)
    const minutos = Math.floor((tiempoTotalSesiones % 3600000) / 60000)
    const tiempoTotalSesionesStr = `${horas}:${minutos.toString().padStart(2, '0')}`
    
    // Average time per operation (excluding escalera)
    const operacionesHabitacion = limpiezasRecientes.filter(l => {
      const tipo = l.tipo || 'habitacion'
      return tipo !== 'escalera'
    })
    
    const operacionesParaPromedio = operacionesHabitacion.length > 0 ? operacionesHabitacion : limpiezasRecientes
    
    if (operacionesParaPromedio.length > 0) {
      const tiempoTotalOperaciones = operacionesParaPromedio.reduce((total, l) => 
        total + (l.horaFin.getTime() - l.horaInicio.getTime()), 0
      )
      const tiempoPromedio = tiempoTotalOperaciones / operacionesParaPromedio.length
      const minutosPromedio = Math.round(tiempoPromedio / 60000)
      var tiempoPromedioOperacion = `${minutosPromedio} min`
    } else {
      var tiempoPromedioOperacion = "0 min"
    }
    
    const habitacionesUnicas = new Set(limpiezasRecientes.map(l => l.habitacion)).size
    
    return {
      totalLimpiezas: limpiezasRecientes.length,
      tiempoTotalSesiones: tiempoTotalSesionesStr,
      tiempoPromedioOperacion,
      habitacionesUnicas
    }
  }

  // Group cleanings by date for the new table
  const agruparPorFecha = () => {
    const grupos: { [fecha: string]: LimpiezaCompleta[] } = {}
    
    limpiezas.forEach(limpieza => {
      const fecha = limpieza.horaInicio.toDateString()
      if (!grupos[fecha]) {
        grupos[fecha] = []
      }
      grupos[fecha].push(limpieza)
    })
    
    return Object.entries(grupos)
      .map(([fecha, operaciones]) => ({
        fecha: new Date(fecha),
        operaciones: operaciones.sort((a, b) => a.horaInicio.getTime() - b.horaInicio.getTime())
      }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }

  // Get all unique room names for table columns
  const obtenerHabitacionesUnicas = () => {
    return Array.from(new Set(limpiezas.map(l => l.habitacion))).sort()
  }

  const handleToggleFallado = async (operacionId: number, fallado: boolean) => {
    try {
      const response = await fetch('/api/vanish', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operacionId,
          fallado,
          fotoFalla: !fallado ? null : undefined // Clear photo when marking as complete
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update operation status');
      }

      // Update local state
      setLimpiezas(prev => prev.map(limpieza => 
        limpieza.id === operacionId 
          ? { ...limpieza, fallado, ...(fallado ? {} : { fotoFalla: undefined }) }
          : limpieza
      ));

      if (fechaSeleccionada) {
        setFechaSeleccionada(prev => prev ? {
          ...prev,
          operaciones: prev.operaciones.map(op => 
            op.id === operacionId 
              ? { ...op, fallado, ...(fallado ? {} : { fotoFalla: undefined }) }
              : op
          )
        } : null);
      }
    } catch (err) {
      console.error('Error updating operation status:', err);
      alert('Failed to update operation status. Please try again.');
    }
  };

  const handleFallaPhoto = async (operacionId: number, file: File | undefined) => {
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('operacionId', operacionId.toString());
      formData.append('type', 'falla');

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload failure photo');
      }

      const { url } = await response.json();

      // Update the operation with the photo URL
      await fetch('/api/vanish', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operacionId,
          fotoFalla: url
        }),
      });

      // Update local state
      setLimpiezas(prev => prev.map(limpieza => 
        limpieza.id === operacionId 
          ? { ...limpieza, fotoFalla: url }
          : limpieza
      ));

      if (fechaSeleccionada) {
        setFechaSeleccionada(prev => prev ? {
          ...prev,
          operaciones: prev.operaciones.map(op => 
            op.id === operacionId 
              ? { ...op, fotoFalla: url }
              : op
          )
        } : null);
      }
    } catch (err) {
      console.error('Error uploading failure photo:', err);
      alert('Failed to upload failure photo. Please try again.');
    }
  };

  const limpiarDatos = async () => {
    if (confirm("¿Estás seguro de que quieres borrar todos los datos de limpieza?")) {
      try {
        const response = await fetch('/api/vanish', {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete cleaning sessions');
        }
        
        setLimpiezas([]);
        setLimpiezaSeleccionada(null);
      } catch (err) {
        console.error('Error deleting cleaning sessions:', err);
        alert('Failed to delete cleaning sessions. Please try again.');
      }
    }
  }

  if (fechaSeleccionada) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={navigateToHome}>
              ← Back to Summary
            </Button>
            <div className="text-right">
              <h1 className="text-2xl font-bold">
                Operations for {formatDate(fechaSeleccionada.fecha)}
              </h1>
              <p className="text-gray-600">
                {fechaSeleccionada.operaciones.length} operations completed
              </p>
            </div>
          </div>

          {/* Operations Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Room</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Started</th>
                      <th className="text-left p-3 font-medium">Finished</th>
                      <th className="text-left p-3 font-medium">Duration</th>
                      <th className="text-left p-3 font-medium">Photos</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fechaSeleccionada.operaciones.map((limpieza) => (
                      <tr key={limpieza.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{limpieza.habitacion}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className="capitalize">{limpieza.tipo}</Badge>
                        </td>
                        <td className="p-3 font-mono text-sm">{limpieza.horaInicio.toLocaleTimeString()}</td>
                        <td className="p-3 font-mono text-sm">{limpieza.horaFin.toLocaleTimeString()}</td>
                        <td className="p-3 font-mono text-sm">{formatDuration(limpieza.horaFin.getTime() - limpieza.horaInicio.getTime())}</td>
                        <td className="p-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{limpieza.pasos.filter(p => p.foto).length}</span>
                            {limpieza.pasos.filter(p => p.foto).length > 0 && (
                              <div className="flex space-x-1 ml-2">
                                {limpieza.pasos.filter(p => p.foto).slice(0, 3).map((paso, idx) => (
                                  <img
                                    key={idx}
                                    src={paso.foto}
                                    alt="Step photo"
                                    width="24"
                                    height="24"
                                    className="object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                    style={{width: '24px', height: '24px'}}
                                    onClick={() => window.open(paso.foto, '_blank')}
                                  />
                                ))}
                                {limpieza.pasos.filter(p => p.foto).length > 3 && (
                                  <span className="text-xs text-gray-500">+{limpieza.pasos.filter(p => p.foto).length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            {limpieza.completa === false ? (
                              <Badge variant="destructive">Incomplete</Badge>
                            ) : limpieza.fallado ? (
                              <div className="flex items-center space-x-2">
                                <Badge variant="destructive">Con Fallas</Badge>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  onChange={(e) => handleFallaPhoto(limpieza.id, e.target.files?.[0])}
                                  className="hidden"
                                  id={`falla-photo-${limpieza.id}`}
                                />
                                <label
                                  htmlFor={`falla-photo-${limpieza.id}`}
                                  className="cursor-pointer p-1 rounded border hover:bg-gray-50"
                                  title="Take photo of failure"
                                >
                                  <Camera className="w-4 h-4 text-gray-600" />
                                </label>
                                {limpieza.fotoFalla && (
                                  <img
                                    src={limpieza.fotoFalla}
                                    alt="Failure photo"
                                    width="20"
                                    height="20"
                                    className="object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                    style={{width: '20px', height: '20px'}}
                                    onClick={() => window.open(limpieza.fotoFalla, '_blank')}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Badge className="bg-green-100 text-green-800">Completo</Badge>
                                <button
                                  onClick={() => handleToggleFallado(limpieza.id, true)}
                                  className="text-xs text-red-600 hover:text-red-800 underline"
                                  title="Mark as failed"
                                >
                                  Marcar falla
                                </button>
                              </div>
                            )}
                            {limpieza.fallado && (
                              <button
                                onClick={() => handleToggleFallado(limpieza.id, false)}
                                className="text-xs text-green-600 hover:text-green-800 underline"
                                title="Mark as complete"
                              >
                                Marcar completo
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLimpiezaSeleccionada(limpieza)}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (limpiezaSeleccionada) {
    const resumen = calcularResumen(limpiezaSeleccionada)
    const checklistCompleto = obtenerChecklist(limpiezaSeleccionada.tipo || "habitacion")

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => {
              setLimpiezaSeleccionada(null)
              if (fechaSeleccionada) {
                // Return to date view if we came from there - URL will be preserved
                return
              } else {
                // Navigate to home if no date was selected
                navigateToHome()
              }
            }}>
              ← {fechaSeleccionada ? 'Back to Date View' : 'Volver a reportes'}
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

  const estadisticas30Dias = calcularEstadisticas30Dias()

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-end">
          <Button
            onClick={() => window.open("/", "_blank")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            🧹 Limpiador
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{estadisticas30Dias.totalLimpiezas}</div>
              <div className="text-sm text-gray-600">Total Operations (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {estadisticas30Dias.tiempoTotalSesiones}
              </div>
              <div className="text-sm text-gray-600">Total Session Time (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {estadisticas30Dias.tiempoPromedioOperacion}
              </div>
              <div className="text-sm text-gray-600">Avg per Room (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {estadisticas30Dias.habitacionesUnicas}
              </div>
              <div className="text-sm text-gray-600">Unique Rooms (30d)</div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Cleaning Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Cleaning Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {limpiezas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No cleaning operations recorded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-left p-3 font-medium">Total Time</th>
                      <th className="text-left p-3 font-medium">Avg per Room</th>
                      <th className="text-left p-3 font-medium">Fallas</th>
                      {obtenerHabitacionesUnicas().map(habitacion => (
                        <th key={habitacion} className="text-center p-2 font-medium text-xs" style={{minWidth: '60px'}}>
                          {habitacion.length > 8 ? `${habitacion.substring(0, 8)}...` : habitacion}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {agruparPorFecha().map((grupo) => {
                      const totalTime = grupo.operaciones.reduce((total, op) => 
                        total + (op.horaFin.getTime() - op.horaInicio.getTime()), 0
                      )
                      const avgTime = totalTime / grupo.operaciones.length
                      const avgMinutes = Math.round(avgTime / 60000)
                      const fallasCount = grupo.operaciones.filter(op => op.fallado).length
                      
                      return (
                        <tr key={grupo.fecha.toDateString()} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <button
                              className="text-blue-600 hover:text-blue-800 underline font-medium"
                              onClick={() => navigateToDate(grupo.fecha, grupo.operaciones)}
                            >
                              {formatDate(grupo.fecha)}
                            </button>
                          </td>
                          <td className="p-3 font-mono text-sm">
                            {formatDuration(totalTime)}
                          </td>
                          <td className="p-3 text-sm">
                            {avgMinutes} min
                          </td>
                          <td className="p-3 text-sm">
                            {fallasCount > 0 ? (
                              <span className="text-red-600 font-medium">{fallasCount}</span>
                            ) : (
                              <span className="text-green-600">0</span>
                            )}
                          </td>
                          {obtenerHabitacionesUnicas().map(habitacion => {
                            const operacion = grupo.operaciones.find(op => op.habitacion === habitacion)
                            return (
                              <td key={habitacion} className="p-2 text-center">
                                {operacion ? (
                                  <div className="flex items-center justify-center">
                                    {operacion.pasos.find(p => p.foto) ? (
                                      <img
                                        src={operacion.pasos.find(p => p.foto)?.foto}
                                        alt={`${habitacion} photo`}
                                        width="20"
                                        height="20"
                                        className="object-cover rounded border cursor-pointer hover:scale-110 transition-transform"
                                        style={{width: '20px', height: '20px'}}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(operacion.pasos.find(p => p.foto)?.foto, '_blank')
                                        }}
                                      />
                                    ) : (
                                      <span className="text-green-600 text-lg">✓</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
