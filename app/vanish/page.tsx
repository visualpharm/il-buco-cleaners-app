"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatTimeShort, formatDurationShort, formatDateDisplay, formatDateForUrl } from "@/lib/dateUtils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle, XCircle, AlertTriangle, Pause } from "lucide-react"
import Image from "next/image"

// Loading component for Suspense fallback
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
}

// Define types
interface StepData {
  id: number
  horaInicio: Date
  horaCompletado?: Date
  tiempoTranscurrido?: number
  foto?: string
  validacionIA?: { 
    esValida: boolean; 
    analisis: { 
      esperaba: string; 
      encontro: string 
    } 
  }
  corregido?: boolean
  ignorado?: boolean
  tipoFoto?: string
  fallado?: boolean
  fotoFalla?: string
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

// Constants
const TIPOS_FOTOS = [
  {
    id: "cama",
    titulo: "Cama completa",
    descripcion: "Cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz",
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

// Main component that uses useSearchParams
function VanishPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [limpiezas, setLimpiezas] = useState<LimpiezaCompleta[]>([])
  const [limpiezaSeleccionada, setLimpiezaSeleccionada] = useState<LimpiezaCompleta | null>(null)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<{fecha: Date, operaciones: LimpiezaCompleta[]} | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to navigate with URL params
  const navigateToDate = (fecha: Date, operaciones: LimpiezaCompleta[]) => {
    const dateString = formatDateForUrl(fecha)
    router.push(`/vanish?date=${dateString}`)
    setFechaSeleccionada({ fecha, operaciones })
  }

  const navigateToRoom = (fecha: Date, limpieza: LimpiezaCompleta) => {
    const dateString = formatDateForUrl(fecha)
    const url = `/vanish?date=${dateString}&room=${encodeURIComponent(limpieza.habitacion)}&operation=${limpieza.id}`
    router.push(url)
    setLimpiezaSeleccionada(limpieza)
  }

  const navigateToHome = () => {
    router.push('/vanish')
    setFechaSeleccionada(null)
    setLimpiezaSeleccionada(null)
  }

  // Handle URL parameters on load and when they change
  useEffect(() => {
    const dateParam = searchParams.get('date')
    const roomParam = searchParams.get('room')
    const operationParam = searchParams.get('operation')
    
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
        
        // If room and operation are specified, select the specific operation
        if (roomParam && operationParam) {
          const operacion = grupo.operaciones.find(
            op => op.habitacion === roomParam && op.id === parseInt(operationParam)
          )
          if (operacion) {
            setLimpiezaSeleccionada(operacion)
          }
        }
      }
    }
  }, [searchParams, limpiezas])

  // Fetch cleaning data
  useEffect(() => {
    const fetchLimpiezas = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/limpiezas')
        if (!response.ok) {
          throw new Error('Error al cargar las limpiezas')
        }
        const data = await response.json()
        
        // Handle both array response and object with data property
        const limpiezasData = Array.isArray(data) ? data : (data.data || []);
        
        // Ensure we have valid data
        if (!Array.isArray(limpiezasData)) {
          throw new Error('Formato de datos inválido')
        }
        
        // Convert string dates back to Date objects
        const formattedData = limpiezasData.map(limpieza => ({
          ...limpieza,
          horaInicio: new Date(limpieza.horaInicio),
          horaFin: limpieza.horaFin ? new Date(limpieza.horaFin) : new Date(),
          pasos: limpieza.pasos?.map((paso: any) => ({
            ...paso,
            horaInicio: paso.horaInicio ? new Date(paso.horaInicio) : null,
            horaCompletado: paso.horaCompletado ? new Date(paso.horaCompletado) : null
          })) || []
        }));
        
        setLimpiezas(formattedData);
      } catch (err) {
        console.error('Error fetching limpiezas:', err)
        setError('Error al cargar los datos de limpieza: ' + (err instanceof Error ? err.message : 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchLimpiezas()
  }, [])

  // Group cleanings by date for the table
  const agruparPorFecha = () => {
    const grupos: {fecha: Date, operaciones: LimpiezaCompleta[]}[] = []
    
    limpiezas.forEach(limpieza => {
      const fecha = new Date(limpieza.horaInicio)
      fecha.setHours(0, 0, 0, 0)
      
      const grupoExistente = grupos.find(g => g.fecha.getTime() === fecha.getTime())
      
      if (grupoExistente) {
        grupoExistente.operaciones.push(limpieza)
      } else {
        grupos.push({
          fecha,
          operaciones: [limpieza]
        })
      }
    })
    
    // Sort groups by date (newest first)
    return grupos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
  }

  // Format duration in a verbose way (e.g., "2 horas y 30 minutos")
  const formatDurationVerbose = (ms: number) => {
    if (!ms) return "0 minutos"
    const seconds = Math.floor(ms / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    const parts = []
    if (hours > 0) parts.push(`${hours} hora${hours > 1 ? 's' : ''}`)
    if (minutes > 0) parts.push(`${minutes} minuto${minutes > 1 ? 's' : ''}`)
    
    return parts.join(' y ') || '0 minutos'
  }

  // Statistics calculations
  const calcularEstadisticasGenerales = () => {
    if (!limpiezas.length) return null;

    const limpiezasCompletas = limpiezas.filter(l => l.completa);
    const totalOperaciones = limpiezas.length;
    const operacionesExitosas = limpiezasCompletas.length;
    const tasaExito = totalOperaciones > 0 ? (operacionesExitosas / totalOperaciones) * 100 : 0;

    const fechaInicio = new Date(Math.min(...limpiezas.map(l => new Date(l.horaInicio).getTime())));
    const fechaActual = new Date();
    const diasTranscurridos = Math.max(1, Math.ceil((fechaActual.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24)));
    const frecuenciaSemanal = (totalOperaciones / diasTranscurridos) * 7;

    const duraciones = limpiezasCompletas
      .map(l => l.pasos.reduce((total, paso) => total + (paso.tiempoTranscurrido || 0), 0))
      .filter(d => d > 0);
    const tiempoPromedio = duraciones.length > 0 ? duraciones.reduce((a, b) => a + b, 0) / duraciones.length : 0;

    return {
      frecuenciaSemanal,
      tiempoPromedio,
      tasaExito
    };
  };

  const calcularEstadisticasFecha = (operaciones: LimpiezaCompleta[]) => {
    const operacionesCompletas = operaciones.filter(op => op.completa);
    const totalTiempo = operacionesCompletas.reduce((total, op) => 
      total + op.pasos.reduce((sum, paso) => sum + (paso.tiempoTranscurrido || 0), 0), 0
    );
    
    const tasaExito = operaciones.length > 0 ? (operacionesCompletas.length / operaciones.length) * 100 : 0;
    
    const habitacionLenta = operacionesCompletas.reduce((lenta, op) => {
      const tiempoOp = op.pasos.reduce((sum, paso) => sum + (paso.tiempoTranscurrido || 0), 0);
      const tiempoLenta = lenta ? lenta.pasos.reduce((sum, paso) => sum + (paso.tiempoTranscurrido || 0), 0) : 0;
      return tiempoOp > tiempoLenta ? op : lenta;
    }, null as LimpiezaCompleta | null);

    return {
      totalTiempo,
      tasaExito,
      habitacionLenta
    };
  };

  const calcularEstadisticasOperacion = (operacion: LimpiezaCompleta) => {
    const tiempoTotal = operacion.pasos.reduce((total, paso) => total + (paso.tiempoTranscurrido || 0), 0);
    const pasosCompletados = operacion.pasos.filter(paso => paso.horaCompletado).length;
    const totalPasos = operacion.pasos.length;
    const tasaExito = totalPasos > 0 ? (pasosCompletados / totalPasos) * 100 : 0;
    
    const operacionLarga = operacion.pasos.reduce((larga, paso) => {
      const tiempoPaso = paso.tiempoTranscurrido || 0;
      const tiempoLarga = larga?.tiempoTranscurrido || 0;
      return tiempoPaso > tiempoLarga ? paso : larga;
    }, null as StepData | null);

    return {
      tiempoTotal,
      tasaExito,
      operacionLarga
    };
  };

  const mostrarMensajeFalla = async (operacionId: number, fallado: boolean, fotoFalla?: string) => {
    try {
      const response = await fetch('/api/vanish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operacionId, fallado, fotoFalla })
      });
      
      if (response.ok) {
        const updatedData = limpiezas.map(l => 
          l.id === operacionId ? { ...l, fallado, fotoFalla } : l
        );
        setLimpiezas(updatedData);
      }
    } catch (error) {
      console.error('Error updating operation:', error);
    }
  };

  const mostrarMensajeFallaPaso = async (operacionId: number, stepId: number, stepFallado: boolean, stepFotoFalla?: string) => {
    try {
      const response = await fetch('/api/vanish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operacionId, stepId, stepFallado, stepFotoFalla })
      });
      
      if (response.ok) {
        const updatedData = limpiezas.map(l => 
          l.id === operacionId ? {
            ...l,
            pasos: l.pasos.map(p => 
              p.id === stepId ? { ...p, fallado: stepFallado, fotoFalla: stepFotoFalla } : p
            )
          } : l
        );
        setLimpiezas(updatedData);
        if (limpiezaSeleccionada?.id === operacionId) {
          setLimpiezaSeleccionada(updatedData.find(l => l.id === operacionId) || null);
        }
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  const handlePhotoUpload = (file: File, isOperation: boolean, operacionId: number, stepId?: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (isOperation) {
        mostrarMensajeFalla(operacionId, true, result);
      } else if (stepId !== undefined) {
        mostrarMensajeFallaPaso(operacionId, stepId, true, result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Render loading state
  if (isLoading) {
    return <Loading />
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center p-4">
          <p className="text-xl font-bold mb-2">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Render main content
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Control de Limpieza</h1>
      
      {fechaSeleccionada ? (
        <div>
          <button 
            onClick={navigateToHome}
            className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ← Volver
          </button>
          
          <h2 className="text-xl font-semibold mb-4">
            {formatDateDisplay(fechaSeleccionada.fecha)}
          </h2>
          
          <div className="space-y-4">
            {fechaSeleccionada.operaciones.map((op) => (
              <Card key={`${op.id}-${op.habitacion}`}>
                <CardHeader>
                  <CardTitle>{op.habitacion}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Inicio: {formatTimeShort(new Date(op.horaInicio))}</p>
                    <p>Fin: {formatTimeShort(new Date(op.horaFin))}</p>
                    <p>Duración: {formatDurationShort(op.pasos[0]?.tiempoTranscurrido || 0)}</p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        variant="outline"
                        onClick={() => navigateToRoom(fechaSeleccionada.fecha, op)}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Seleccione una fecha</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agruparPorFecha().map((grupo) => (
              <Card 
                key={grupo.fecha.toISOString()}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => navigateToDate(grupo.fecha, grupo.operaciones)}
              >
                <CardHeader>
                  <CardTitle>{formatDateDisplay(grupo.fecha)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{grupo.operaciones.length} operaciones</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Wrapper component that provides Suspense boundary
export default function VanishPage() {
  return (
    <Suspense fallback={<Loading />}>
      <VanishPageContent />
    </Suspense>
  )
}
