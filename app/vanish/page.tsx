"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatTimeShort, formatDurationShort, formatDateDisplay } from "@/lib/dateUtils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react"

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
    esValida: boolean
    analisis: { 
      esperaba: string
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

interface CleaningSession {
  sessionId: string
  startTime: Date
  endTime: Date
  operations: LimpiezaCompleta[]
  duration: number
  roomCount: number
  successRate: number
}

// KSV (Key Stats for Vanish) - 30-day averages
interface KSVStats {
  avgSessionDuration: number // average duration in minutes
  avgTimePerRoom: number     // average time per room in minutes
  avgSuccessRate: number     // success percentage
}

type SortField = 'startTime' | 'duration' | 'roomCount' | 'successRate'
type SortDirection = 'asc' | 'desc'

function VanishPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [limpiezas, setLimpiezas] = useState<LimpiezaCompleta[]>([])
  const [sessions, setSessions] = useState<CleaningSession[]>([])
  const [ksvStats, setKsvStats] = useState<KSVStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('startTime')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  // Session detail view state
  const selectedSessionId = searchParams.get('session')
  const selectedSession = sessions.find(s => s.sessionId === selectedSessionId)

  // Fetch cleaning data
  useEffect(() => {
    const fetchLimpiezas = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/cleanings')
        if (!response.ok) {
          throw new Error('Error al cargar las limpiezas')
        }
        const data = await response.json()
        
        const cleaningData = Array.isArray(data) ? data : (data.data || [])
        
        if (!Array.isArray(cleaningData)) {
          throw new Error('Formato de datos inválido')
        }
        
        // Convert English field names to Spanish for UI and string dates back to Date objects
        const formattedData = cleaningData.map(cleaning => ({
          ...cleaning,
          habitacion: cleaning.room,
          tipo: cleaning.type,
          horaInicio: new Date(cleaning.startTime),
          horaFin: cleaning.endTime ? new Date(cleaning.endTime) : new Date(),
          pasos: cleaning.steps?.map((step: any) => ({
            ...step,
            horaInicio: step.startTime ? new Date(step.startTime) : null,
            horaCompletado: step.completedTime ? new Date(step.completedTime) : null,
            tiempoTranscurrido: step.elapsedTime,
            foto: step.photo,
            validacionIA: step.validationAI ? {
              esValida: step.validationAI.isValid,
              analisis: {
                esperaba: step.validationAI.analysis.expected,
                encontro: step.validationAI.analysis.found
              }
            } : undefined,
            corregido: step.corrected,
            ignorado: step.ignored,
            tipoFoto: step.photoType,
            fallado: step.failed,
            fotoFalla: step.failurePhoto
          })) || [],
          sesionId: cleaning.sessionId,
          completa: cleaning.complete,
          razon: cleaning.reason,
          fallado: cleaning.failed,
          fotoFalla: cleaning.failurePhoto
        }))
        
        setLimpiezas(formattedData)
        
        // Process sessions and calculate stats
        const processedSessions = processCleaningSessions(formattedData)
        setSessions(processedSessions)
        
        const ksvData = calculateKSVStats(processedSessions)
        setKsvStats(ksvData)
        
      } catch (err) {
        console.error('Error fetching limpiezas:', err)
        setError('Error al cargar los datos de limpieza: ' + (err instanceof Error ? err.message : 'Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchLimpiezas()
  }, [])

  // Process cleaning operations into sessions (1+ hour break = new session)
  const processCleaningSessions = (operations: LimpiezaCompleta[]): CleaningSession[] => {
    if (!operations.length) return []
    
    // Sort operations by start time
    const sortedOperations = [...operations].sort((a, b) => 
      new Date(a.horaInicio).getTime() - new Date(b.horaInicio).getTime()
    )
    
    const sessions: CleaningSession[] = []
    let currentSession: LimpiezaCompleta[] = []
    let currentSessionId = ''
    
    sortedOperations.forEach(operation => {
      if (currentSession.length === 0) {
        // Start new session
        currentSession = [operation]
        currentSessionId = operation.sesionId || `session-${operation.id}`
      } else {
        // Check if this operation belongs to current session (< 1 hour break)
        const lastOperation = currentSession[currentSession.length - 1]
        const timeDiff = new Date(operation.horaInicio).getTime() - new Date(lastOperation.horaFin).getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)
        
        if (hoursDiff < 1 && operation.sesionId === currentSessionId) {
          // Same session
          currentSession.push(operation)
        } else {
          // New session - save current and start new
          if (currentSession.length > 0) {
            sessions.push(createSessionFromOperations(currentSession, currentSessionId))
          }
          currentSession = [operation]
          currentSessionId = operation.sesionId || `session-${operation.id}`
        }
      }
    })
    
    // Add final session
    if (currentSession.length > 0) {
      sessions.push(createSessionFromOperations(currentSession, currentSessionId))
    }
    
    return sessions
  }

  const createSessionFromOperations = (operations: LimpiezaCompleta[], sessionId: string): CleaningSession => {
    const startTime = new Date(Math.min(...operations.map(op => new Date(op.horaInicio).getTime())))
    const endTime = new Date(Math.max(...operations.map(op => new Date(op.horaFin).getTime())))
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // in minutes
    
    const failedOps = operations.filter(op => op.fallado || !op.completa).length
    const successRate = operations.length > 0 ? ((operations.length - failedOps) / operations.length) * 100 : 100
    
    return {
      sessionId,
      startTime,
      endTime,
      operations,
      duration,
      roomCount: operations.length,
      successRate
    }
  }

  // Calculate KSV (Key Stats for Vanish) - 30-day averages
  const calculateKSVStats = (sessions: CleaningSession[]): KSVStats => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentSessions = sessions.filter(session => 
      new Date(session.startTime) >= thirtyDaysAgo
    )
    
    if (recentSessions.length === 0) {
      return { avgSessionDuration: 0, avgTimePerRoom: 0, avgSuccessRate: 100 }
    }
    
    const totalDuration = recentSessions.reduce((sum, session) => sum + session.duration, 0)
    const totalRooms = recentSessions.reduce((sum, session) => sum + session.roomCount, 0)
    const totalSuccessRate = recentSessions.reduce((sum, session) => sum + session.successRate, 0)
    
    return {
      avgSessionDuration: totalDuration / recentSessions.length,
      avgTimePerRoom: totalRooms > 0 ? totalDuration / totalRooms : 0,
      avgSuccessRate: totalSuccessRate / recentSessions.length
    }
  }

  // Sorting functionality
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortedSessions = () => {
    return [...sessions].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'startTime':
          comparison = new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'roomCount':
          comparison = a.roomCount - b.roomCount
          break
        case 'successRate':
          comparison = a.successRate - b.successRate
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1 text-blue-600" />
      : <ChevronDown className="w-4 h-4 ml-1 text-blue-600" />
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Calculate KSR (Key Stats for Room/space)
  const calculateKSRStats = (operation: LimpiezaCompleta) => {
    const totalSteps = operation.pasos.length
    const completedSteps = operation.pasos.filter(p => p.horaCompletado).length
    const failedSteps = operation.pasos.filter(p => p.fallado).length
    
    // Calculate completion percentage
    const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    
    // Calculate success rate (100% - % of failed operations)
    const successRate = totalSteps > 0 ? ((totalSteps - failedSteps) / totalSteps) * 100 : 100
    
    // Calculate duration
    const startTime = new Date(operation.horaInicio)
    const endTime = new Date(operation.horaFin)
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60) // in minutes
    
    return {
      startTime,
      duration,
      completionRate,
      successRate,
      totalSteps,
      completedSteps,
      failedSteps
    }
  }

  // Handle failure marking
  const handleMarkFailure = async (operationId: number, photoFile?: File) => {
    try {
      // TODO: Implement failure marking API call
      console.log('Marking failure for operation:', operationId, photoFile)
      // Refresh data after marking failure
      window.location.reload()
    } catch (error) {
      console.error('Error marking failure:', error)
    }
  }

  // Navigate back to sessions list
  const navigateToSessionsList = () => {
    router.push('/vanish')
  }

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show session detail view if a session is selected
  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              onClick={navigateToSessionsList}
              className="mr-4"
            >
              ← Volver
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Detalles de Sesión - {formatDateDisplay(selectedSession.startTime)}
            </h1>
          </div>
          
          {/* KSC Stats - Key Stats for Cleaning Session */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Hora de Inicio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  {formatTimeShort(selectedSession.startTime)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Duración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {formatDuration(selectedSession.duration)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Habitaciones Limpiadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-purple-600">
                  {selectedSession.roomCount}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tasa de Éxito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${
                  selectedSession.successRate >= 95 ? 'text-green-600' :
                  selectedSession.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedSession.successRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KSR Stats - Room/Space Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles por Habitación</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Habitación</th>
                      <th className="text-left p-3 font-medium text-gray-700">Hora de Inicio</th>
                      <th className="text-left p-3 font-medium text-gray-700">Duración</th>
                      <th className="text-left p-3 font-medium text-gray-700">Progreso</th>
                      <th className="text-left p-3 font-medium text-gray-700">Tasa de Éxito</th>
                      <th className="text-left p-3 font-medium text-gray-700">Fotos</th>
                      <th className="text-left p-3 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSession.operations.map((operation, index) => {
                      const ksrStats = calculateKSRStats(operation)
                      const photosUploaded = operation.pasos.filter(p => p.foto).length
                      
                      return (
                        <tr 
                          key={operation.id || index}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-medium">{operation.habitacion}</div>
                            <div className="text-sm text-gray-500">{operation.tipo}</div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {formatTimeShort(ksrStats.startTime)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {formatDuration(ksrStats.duration)}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {ksrStats.completedSteps}/{ksrStats.totalSteps}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ksrStats.completionRate.toFixed(1)}% completado
                            </div>
                          </td>
                          <td className="p-3">
                            <div className={`font-medium ${
                              ksrStats.successRate >= 95 ? 'text-green-600' :
                              ksrStats.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {ksrStats.successRate.toFixed(1)}%
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {photosUploaded} fotos
                            </div>
                            {photosUploaded > 0 && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-blue-600 p-0 h-auto"
                                onClick={() => {
                                  // TODO: Show photos modal
                                  console.log('Show photos for operation:', operation.id)
                                }}
                              >
                                Ver fotos
                              </Button>
                            )}
                          </td>
                          <td className="p-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleMarkFailure(operation.id)}
                            >
                              Marcar Falla
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show sessions list view (default)
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Estadísticas de Limpieza</h1>
        
        {/* KSV Stats - 30-day averages */}
        {ksvStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Duración Promedio de Sesión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(ksvStats.avgSessionDuration)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tiempo Promedio por Habitación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatDuration(ksvStats.avgTimePerRoom)}
                </div>
                <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tasa de Éxito Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {ksvStats.avgSuccessRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
            <p>Debug: {limpiezas.length} operaciones cargadas, {sessions.length} sesiones procesadas</p>
          </div>
        )}

        {/* Sessions Table */}
        {sessions.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sesiones de Limpieza</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th 
                        className="text-left p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('startTime')}
                      >
                        <div className="flex items-center">
                          Hora de Inicio
                          {getSortIcon('startTime')}
                        </div>
                      </th>
                      <th 
                        className="text-left p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('duration')}
                      >
                        <div className="flex items-center">
                          Duración
                          {getSortIcon('duration')}
                        </div>
                      </th>
                      <th 
                        className="text-left p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('roomCount')}
                      >
                        <div className="flex items-center">
                          Habitaciones
                          {getSortIcon('roomCount')}
                        </div>
                      </th>
                      <th 
                        className="text-left p-3 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('successRate')}
                      >
                        <div className="flex items-center">
                          Tasa de Éxito
                          {getSortIcon('successRate')}
                        </div>
                      </th>
                      <th className="text-left p-3 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedSessions().map((session, index) => (
                      <tr 
                        key={session.sessionId || index}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {formatDateDisplay(session.startTime)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatTimeShort(session.endTime)} fin
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {formatDuration(session.duration)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {session.roomCount}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.operations.map(op => op.habitacion).join(', ')}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className={`font-medium ${
                            session.successRate >= 95 ? 'text-green-600' :
                            session.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {session.successRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Navigate to session details
                              router.push(`/vanish?session=${session.sessionId}`)
                            }}
                          >
                            Ver Detalles
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">Aún no se han registrado sesiones de limpieza.</p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Ir a crear sesión de limpieza
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
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