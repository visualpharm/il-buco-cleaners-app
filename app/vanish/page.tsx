"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { formatTimeShort, formatDateDisplay } from "@/lib/dateUtils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, ArrowUpDown, Camera, X, ChevronLeft, ChevronRight } from "lucide-react"

// Loading component for Suspense fallback
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
    </div>
  )
}

// Step definitions - copied from main page.tsx
const CHECKLIST_HABITACIONES = [
  { id: 1, categoria: "Inspección inicial", texto: "Entramos: Tocar la puerta, Entrar y verificar si hubo check-out" },
  { id: 2, categoria: "Revisión para lavar", texto: "Revisar si hace falta lavar: Fundas decorativas de almohadas, Funda de futón, Mantas, pie de cama, Cortinas" },
  { id: 3, categoria: "Limpieza", texto: "Aspirar: Colchón, Piso, Alfombras pequeñas" },
  { id: 4, categoria: "Limpieza", texto: "Limpiar muebles: Mesitas de luz (adentro y afuera), Mesa, Sillas, Repisa" },
  { id: 5, categoria: "Limpieza", texto: "Limpiar ventanas, ventanales y espejos" },
  { id: 6, categoria: "Limpieza", texto: "Tender la cama: Colocar la sábana, Poner las fundas de almohada, Alinear bien la funda del acolchado, Colocar el pie de cama con arrugas, Dejar la manta polar en la mesita de luz" },
  { id: 7, categoria: "Limpieza", texto: "Limpiar baño: Inodoro, Bidet, Ducha, Cortina/vidrio, Lavatorio, Azulejos, Piso, Espejo" },
  { id: 8, categoria: "Limpieza", texto: "Limpiar cocina: Mesada, Bacha, Canillas, Heladera (adentro y afuera), Microondas (adentro y afuera), Horno, Anafe, Azulejos, Alacenas (adentro y afuera), Cesto de basura, Secar todo" },
  { id: 9, categoria: "Verificación", texto: "Verificar productos de limpieza: 1 Detergente para platos, 1 Esponja, 1 Secador, 1 Papel higiénico de repuesto, 1 Jabón en pan, 1 Shampoo, 1 Acondicionador" },
  { id: 10, categoria: "Verificación", texto: "Verificar elementos de cocina: 2 Platos, 2 Platos hondos, 2 Tazas de café, 2 Vasos, 1 Olla, 1 Sartén, 1 Pava, 1 Botella térmica" },
  { id: 11, categoria: "Verificación", texto: "Verificar cubiertos: 2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina" },
  { id: 12, categoria: "Verificación", texto: "Verificar ropa de cama: 1 Sábana, 2 Fundas de almohada, 1 Funda de acolchado, 1 Manta polar, 1 Pie de cama" },
  { id: 13, categoria: "Verificación", texto: "Verificar toallas: 2 Toallas de cuerpo, 2 Toallones, 2 Toallas de mano" },
  { id: 14, categoria: "Verificación", texto: "Revisar elementos de bienvenida: Café, Azúcar, Endulzante, Té, Agua, Yerba, Galletitas" },
  { id: 15, categoria: "Verificación", texto: "Revisar y reponer papel higiénico" },
  { id: 16, categoria: "Verificación", texto: "Verificar que todo funcione: Luces, Aire acondicionado, Calefactor, TV, Heladera, Microondas, Ducha (agua fría y caliente), WiFi" },
  { id: 17, categoria: "Manejo de basura", texto: "Manejo de basura: Tirar la basura de todos los tachos, Poner 1 bolsa nueva, Dejar 2 bolsas de repuesto" },
  { id: 18, categoria: "Finalización", texto: "Verificar que esté todo en orden: Luces apagadas, Ventanas cerradas, Puerta trabada" }
]

const CHECKLIST_PARRILLA = [
  { id: 1, categoria: "Verificación", texto: "Verificar la parrilla: La rejilla tiene que estar limpia, Tirar cenizas, Pasar un trapo por la mesa y la bacha, Todas las sillas deben estar alrededor de la mesa, Barrer el piso si es necesario" }
]

const CHECKLIST_ESCALERA = [
  { id: 1, categoria: "Limpieza", texto: "Barrer escalones" },
  { id: 2, categoria: "Paquetes", texto: "Paquetes: Chequear si quedaron nuevos paquetes de Mercado Libre, Si hay paquetes, abrir y tratar de distribuir" },
  { id: 3, categoria: "Falta algo", texto: "Falta algo: Escribir a Ivan o su asistente las cosas que faltan, Ofrecer de comprar los items faltantes si es posible" }
]

// Helper function to get the right checklist based on room type
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

// Helper function to get step title
const getStepTitle = (stepId: number, roomType?: string): string => {
  const checklist = obtenerChecklist(roomType || "")
  const step = checklist.find(s => s.id === stepId)
  if (!step) return `Paso ${stepId}`
  
  // Crop title at the colon if it exists
  const colonIndex = step.texto.indexOf(':')
  return colonIndex !== -1 ? step.texto.substring(0, colonIndex) : step.texto
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
  id: string
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
  
  // Operation detail view state
  const selectedOperationId = searchParams.get('operation')
  const selectedOperation = selectedSession?.operations.find(op => op.id === selectedOperationId)
  
  // Failure marking state
  const [markingFailure, setMarkingFailure] = useState<string | null>(null)
  
  // Photo gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

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


  // Toggle failure state
  const toggleFailureState = async (operation: LimpiezaCompleta) => {
    try {
      setMarkingFailure(operation.id)
      
      const currentlyFailed = operation.fallado
      const newFailedState = !currentlyFailed
      
      let fotoFalla = operation.fotoFalla // Keep existing photo
      
      // If clearing failure, remove photo
      if (!newFailedState) {
        fotoFalla = undefined
      }
      
      await markFailure(operation.id, newFailedState, fotoFalla || undefined)
    } catch (error) {
      console.error('Error toggling failure state:', error)
      setMarkingFailure(null)
    }
  }

  // Remove failure photo
  const removeFailurePhoto = async (operationId: string) => {
    try {
      setMarkingFailure(operationId)
      await markFailure(operationId, true, undefined) // Keep failed state but remove photo
    } catch (error) {
      console.error('Error removing photo:', error)
      alert('Error al eliminar la foto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  // Handle photo upload for failed operations
  const uploadFailurePhoto = async (operationId: string) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          setMarkingFailure(operationId)

          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
          })

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            // Store the FULL URL as returned by the backend
            const photoUrl: string = uploadData.url
            await markFailure(operationId, true, photoUrl)
          } else {
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Error desconocido' }))
            throw new Error(errorData.error || 'Error al subir la foto')
          }
        } catch (error) {
          console.error('Error uploading photo:', error)
          alert('Error al subir la foto: ' + (error instanceof Error ? error.message : 'Error desconocido'))
          setMarkingFailure(null)
        }
      }
    }
    input.click()
  }

  // Helper function to format photo URL correctly
  // Helper to get the correct URL for a photo, supporting SSR/CSR and env
  const getPhotoUrl = (photo: string): string => {
    if (!photo) return ''
    // If it's already a full URL (starts with http/https), use as is
    if (photo.startsWith('http://') || photo.startsWith('https://')) {
      return photo
    }
    // For SSR/CSR consistency, try to use NGINX_BASE_URL if available
    // @ts-ignore: process.env is available in Node/SSR, but not in browser
    const NGINX_BASE_URL = typeof process !== 'undefined' && process.env && process.env.NGINX_BASE_URL
      ? process.env.NGINX_BASE_URL
      : (typeof window !== 'undefined' && (window as any).NGINX_BASE_URL)
      ? (window as any).NGINX_BASE_URL
      : undefined
    if (NGINX_BASE_URL) {
      return `${NGINX_BASE_URL}/uploads/${photo.replace(/^\/uploads\//, '')}`
    }
    // Fallback: relative path (may not work if not proxied)
    return `/uploads/${photo.replace(/^\/uploads\//, '')}`
  }

  // Mark operation or step as failed
  const markFailure = async (operationId: string, failed: boolean, photoUrl?: string) => {
    try {
      const response = await fetch('/api/vanish', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationId,
          failed,
          photoUrl
        })
      })

      if (!response.ok) {
        throw new Error('Error al marcar falla')
      }

      // Refresh data
      const fetchResponse = await fetch('/api/cleanings')
      if (fetchResponse.ok) {
        const data = await fetchResponse.json()
        const cleaningData = Array.isArray(data) ? data : (data.data || [])
        
        // Convert and update data
        const formattedData = cleaningData.map((cleaning: any) => ({
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
        const processedSessions = processCleaningSessions(formattedData)
        setSessions(processedSessions)
        const ksvData = calculateKSVStats(processedSessions)
        setKsvStats(ksvData)
      }
    } catch (error) {
      console.error('Error marking failure:', error)
      throw error
    } finally {
      setMarkingFailure(null)
    }
  }

  // Toggle step failure state
  const toggleStepFailure = async (operationId: string, stepId: number, failed: boolean) => {
    try {
      setMarkingFailure(`step-${stepId}`)
      
      const response = await fetch('/api/vanish/step', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operationId,
          stepId,
          failed
        })
      })

      if (!response.ok) {
        throw new Error('Error al marcar falla del paso')
      }

      // Refresh data
      const fetchResponse = await fetch('/api/cleanings')
      if (fetchResponse.ok) {
        const data = await fetchResponse.json()
        const cleaningData = Array.isArray(data) ? data : (data.data || [])
        
        // Convert and update data
        const formattedData = cleaningData.map((cleaning: any) => ({
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
        const processedSessions = processCleaningSessions(formattedData)
        setSessions(processedSessions)
        const ksvData = calculateKSVStats(processedSessions)
        setKsvStats(ksvData)
      }
    } catch (error) {
      console.error('Error toggling step failure:', error)
      alert('Error al marcar falla del paso')
    } finally {
      setMarkingFailure(null)
    }
  }

  // Navigation helper
  const navigateToSessionsList = () => {
    router.push('/vanish')
  }

  // Gallery functions
  const openGallery = (photos: string[], startIndex: number = 0) => {
    setGalleryPhotos(photos)
    setCurrentPhotoIndex(startIndex)
    setGalleryOpen(true)
  }

  const closeGallery = () => {
    setGalleryOpen(false)
    setGalleryPhotos([])
    setCurrentPhotoIndex(0)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % galleryPhotos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!galleryOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeGallery()
          break
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          nextPhoto()
          break
        case 'ArrowLeft':
          prevPhoto()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [galleryOpen, galleryPhotos.length])

  // Helper functions to get photos
  const getOperationPhotos = (operation: LimpiezaCompleta): string[] => {
    const photos: string[] = []
    
    // Add step photos
    operation.pasos.forEach(paso => {
      if (paso.foto) photos.push(paso.foto)
      if (paso.fotoFalla) photos.push(paso.fotoFalla)
    })
    
    // Add operation failure photo
    if (operation.fotoFalla) photos.push(operation.fotoFalla)
    
    return photos
  }

  const getOperationCleanerPhotos = (operation: LimpiezaCompleta): string[] => {
    // Only return cleaner photos (not failure photos) for thumbnail display
    return operation.pasos
      .filter(paso => paso.foto)
      .map(paso => paso.foto!)
  }

  const getSessionPhotos = (session: CleaningSession): string[] => {
    const photos: string[] = []
    session.operations.forEach(op => {
      photos.push(...getOperationPhotos(op))
    })
    return photos
  }

  const getSessionCleanerPhotos = (session: CleaningSession): string[] => {
    const photos: string[] = []
    session.operations.forEach(op => {
      photos.push(...getOperationCleanerPhotos(op))
    })
    return photos
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

  // Show operation detail view if an operation is selected
  if (selectedOperation && selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/vanish?session=${selectedSessionId}`)}
              className="mr-4"
            >
              ← Volver a Sesión
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Operaciones en {selectedOperation.habitacion} - 
              <a 
                href={`/vanish?session=${selectedSessionId}`}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
                onClick={(e) => {
                  e.preventDefault()
                  router.push(`/vanish?session=${selectedSessionId}`)
                }}
              >
                {formatDateDisplay(selectedSession.startTime)}
              </a>
            </h1>
          </div>
          
          {/* Operation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Habitación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  {selectedOperation.habitacion}
                </div>
                <p className="text-xs text-gray-500 mt-1">{selectedOperation.tipo}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Duración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">
                  {formatDuration(calculateKSRStats(selectedOperation).duration)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pasos Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-purple-600">
                  {calculateKSRStats(selectedOperation).completedSteps}/{calculateKSRStats(selectedOperation).totalSteps}
                </div>
                <p className="text-xs text-gray-500 mt-1">{calculateKSRStats(selectedOperation).completionRate.toFixed(1)}% completado</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tasa de Éxito</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${
                  calculateKSRStats(selectedOperation).successRate >= 95 ? 'text-green-600' :
                  calculateKSRStats(selectedOperation).successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {calculateKSRStats(selectedOperation).successRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operation Steps Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pasos Realizados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">Paso</th>
                      <th className="text-left p-3 font-medium text-gray-700">Hora</th>
                      <th className="text-left p-3 font-medium text-gray-700">Duración</th>
                      <th className="text-left p-3 font-medium text-gray-700">Estado</th>
                      <th className="text-left p-3 font-medium text-gray-700">Foto</th>
                      <th className="text-left p-3 font-medium text-gray-700">Falla</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOperation.pasos.map((paso, index) => (
                      <tr 
                        key={paso.id || index}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-medium">{getStepTitle(paso.id, selectedOperation.tipo)}</div>
                          <div className="text-sm text-gray-500">Paso {paso.id}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {paso.horaInicio ? formatTimeShort(new Date(paso.horaInicio)) : '-'}
                          </div>
                          {paso.horaCompletado && (
                            <div className="text-sm text-gray-500">
                              Fin: {formatTimeShort(new Date(paso.horaCompletado))}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {paso.tiempoTranscurrido ? formatDuration(paso.tiempoTranscurrido / 60) : '-'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className={`font-medium ${
                            paso.horaCompletado ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            {paso.horaCompletado ? 'Completado' : 'Pendiente'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {paso.foto && (
                              <img
                                src={getPhotoUrl(paso.foto)}
                                alt="Foto del paso"
                                className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                                onClick={() => openGallery(paso.foto ? [paso.foto] : [], 0)}
                              />
                            )}
                            {paso.fotoFalla && (
                              <img
                                src={getPhotoUrl(paso.fotoFalla)}
                                alt="Foto de falla"
                                className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-red-200"
                                onClick={() => openGallery(paso.fotoFalla ? [paso.fotoFalla] : [], 0)}
                              />
                            )}
                            {!paso.foto && !paso.fotoFalla && (
                              <span className="text-gray-400 text-sm">Sin fotos</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <Button 
                            variant="outline"
                            size="sm"
                            className={
                              markingFailure === `step-${paso.id}`
                                ? "bg-gray-800 text-white border-gray-800"
                                : paso.fallado 
                                  ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700"
                                  : "text-black border-black hover:bg-gray-100"
                            }
                            onClick={() => toggleStepFailure(selectedOperation.id, paso.id, !paso.fallado)}
                            disabled={markingFailure === `step-${paso.id}`}
                          >
                            Falla
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
              Detalles de Sesión - 
              <a 
                href="/vanish"
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1"
                onClick={(e) => {
                  e.preventDefault()
                  navigateToSessionsList()
                }}
              >
                {formatDateDisplay(selectedSession.startTime)}
              </a>
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
                      
                      return (
                        <tr 
                          key={operation.id || index}
                          className="border-b hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-medium">
                              <a 
                                href={`/vanish?session=${selectedSession.sessionId}&operation=${operation.id}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  router.push(`/vanish?session=${selectedSession.sessionId}&operation=${operation.id}`)
                                }}
                              >
                                {operation.habitacion}
                              </a>
                            </div>
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
                            <div className="flex flex-wrap gap-1">
                              {getOperationCleanerPhotos(operation).map((photo, photoIndex) => (
                                <img
                                  key={photoIndex}
                                  src={getPhotoUrl(photo)}
                                  alt={`Foto ${photoIndex + 1}`}
                                  className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                                  onClick={() => openGallery(getOperationPhotos(operation), getOperationPhotos(operation).indexOf(photo))}
                                />
                              ))}
                              {getOperationCleanerPhotos(operation).length === 0 && (
                                <span className="text-gray-400 text-sm">Sin fotos</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                className={
                                  markingFailure === operation.id
                                    ? "bg-gray-800 text-white border-gray-800" // Pressed/inverted state
                                    : operation.fallado 
                                      ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" // Failed state
                                      : "text-black border-black hover:bg-gray-100" // Normal state
                                }
                                onClick={() => toggleFailureState(operation)}
                                disabled={markingFailure === operation.id}
                              >
                                Falla
                              </Button>
                              
                              {operation.fallado && (
                                operation.fotoFalla ? (
                                  // Show photo preview with remove button
                                  <div className="flex items-center gap-1">
                                    <img
                                      src={getPhotoUrl(operation.fotoFalla)}
                                      alt="Foto de falla"
                                      className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-red-200"
                                      onClick={() => openGallery([operation.fotoFalla!], 0)}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-600 hover:bg-red-50 p-1 h-6 w-6"
                                      onClick={() => removeFailurePhoto(operation.id)}
                                      disabled={markingFailure === operation.id}
                                      title="Eliminar foto"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  // Show camera button when no photo
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                    onClick={() => uploadFailurePhoto(operation.id)}
                                    disabled={markingFailure === operation.id}
                                    title="Subir foto"
                                  >
                                    <Camera className="w-4 h-4" />
                                  </Button>
                                )
                              )}
                            </div>
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

        {/* Failure Statistics Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Estadísticas de Fallas (Últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
              
              // Filter operations from last 30 days
              const recentOperations = limpiezas.filter(operation => 
                new Date(operation.horaInicio) >= thirtyDaysAgo
              )
              
              // Calculate failure stats by operation type and room
              const operationFailures = new Map<string, { count: number, photos: string[] }>()
              const roomFailures = new Map<string, { count: number, photos: string[] }>()
              
              recentOperations.forEach(operation => {
                const hasFailed = operation.fallado || operation.pasos.some(paso => paso.fallado)
                
                if (hasFailed) {
                  const operationType = operation.tipo || 'habitacion'
                  const roomName = operation.habitacion
                  
                  // Collect failure photos from operation and steps
                  const failurePhotos: string[] = []
                  if (operation.fotoFalla) failurePhotos.push(operation.fotoFalla)
                  operation.pasos.forEach(paso => {
                    if (paso.fallado && paso.fotoFalla) failurePhotos.push(paso.fotoFalla)
                  })
                  
                  // Update operation type failures
                  if (!operationFailures.has(operationType)) {
                    operationFailures.set(operationType, { count: 0, photos: [] })
                  }
                  const opData = operationFailures.get(operationType)!
                  opData.count++
                  opData.photos.push(...failurePhotos)
                  
                  // Update room failures
                  if (!roomFailures.has(roomName)) {
                    roomFailures.set(roomName, { count: 0, photos: [] })
                  }
                  const roomData = roomFailures.get(roomName)!
                  roomData.count++
                  roomData.photos.push(...failurePhotos)
                }
              })
              
              // Sort by failure count (descending)
              const sortedOperations = Array.from(operationFailures.entries())
                .sort((a, b) => b[1].count - a[1].count)
              const sortedRooms = Array.from(roomFailures.entries())
                .sort((a, b) => b[1].count - a[1].count)
              
              if (sortedOperations.length === 0 && sortedRooms.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    No se registraron fallas en los últimos 30 días
                  </div>
                )
              }
              
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Failing Operations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Operaciones con Más Fallas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium text-gray-700">Tipo</th>
                            <th className="text-left p-3 font-medium text-gray-700">Fallas</th>
                            <th className="text-left p-3 font-medium text-gray-700">Fotos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedOperations.map(([operationType, data]) => (
                            <tr key={operationType} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium capitalize">{operationType}</td>
                              <td className="p-3">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                  {data.count}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  {data.photos.slice(-3).map((photo, index) => (
                                    <img
                                      key={index}
                                      src={getPhotoUrl(photo)}
                                      alt={`Falla ${index + 1}`}
                                      className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-red-200"
                                      onClick={() => openGallery(data.photos, data.photos.indexOf(photo))}
                                    />
                                  ))}
                                  {data.photos.length > 3 && (
                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-xs text-red-600 cursor-pointer hover:bg-red-200"
                                         onClick={() => openGallery(data.photos, 3)}>
                                      +{data.photos.length - 3}
                                    </div>
                                  )}
                                  {data.photos.length === 0 && (
                                    <span className="text-gray-400 text-sm">Sin fotos</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Failing Rooms */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Habitaciones con Más Fallas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-medium text-gray-700">Habitación</th>
                            <th className="text-left p-3 font-medium text-gray-700">Fallas</th>
                            <th className="text-left p-3 font-medium text-gray-700">Fotos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedRooms.map(([roomName, data]) => (
                            <tr key={roomName} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{roomName}</td>
                              <td className="p-3">
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                                  {data.count}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  {data.photos.slice(-3).map((photo, index) => (
                                    <img
                                      key={index}
                                      src={getPhotoUrl(photo)}
                                      alt={`Falla ${index + 1}`}
                                      className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-red-200"
                                      onClick={() => openGallery(data.photos, data.photos.indexOf(photo))}
                                    />
                                  ))}
                                  {data.photos.length > 3 && (
                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center text-xs text-red-600 cursor-pointer hover:bg-red-200"
                                         onClick={() => openGallery(data.photos, 3)}>
                                      +{data.photos.length - 3}
                                    </div>
                                  )}
                                  {data.photos.length === 0 && (
                                    <span className="text-gray-400 text-sm">Sin fotos</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

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
                      <th className="text-left p-3 font-medium text-gray-700">Fotos</th>
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
                            <a 
                              href={`/vanish?session=${session.sessionId}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault()
                                router.push(`/vanish?session=${session.sessionId}`)
                              }}
                            >
                              {formatDateDisplay(session.startTime)}
                            </a>
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
                          <div className="flex flex-wrap gap-1">
                            {getSessionCleanerPhotos(session).slice(0, 6).map((photo, photoIndex) => (
                              <img
                                key={photoIndex}
                                src={getPhotoUrl(photo)}
                                alt={`Foto ${photoIndex + 1}`}
                                className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity border border-gray-200"
                                onClick={() => openGallery(getSessionPhotos(session), getSessionPhotos(session).indexOf(photo))}
                              />
                            ))}
                            {getSessionCleanerPhotos(session).length > 6 && (
                              <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs cursor-pointer hover:bg-gray-300"
                                   onClick={() => openGallery(getSessionPhotos(session), 6)}>
                                +{getSessionCleanerPhotos(session).length - 6}
                              </div>
                            )}
                            {getSessionCleanerPhotos(session).length === 0 && (
                              <span className="text-gray-400 text-sm">Sin fotos</span>
                            )}
                          </div>
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

        {/* Photo Gallery Modal */}
        {galleryOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 z-10"
                onClick={closeGallery}
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Previous button */}
              {galleryPhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={prevPhoto}
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
              )}

              {/* Current photo */}
              <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center">
                <img
                  src={getPhotoUrl(galleryPhotos[currentPhotoIndex])}
                  alt={`Foto ${currentPhotoIndex + 1} de ${galleryPhotos.length}`}
                  className="max-w-full max-h-full object-contain"
                  style={{ imageRendering: 'auto' }}
                />
              </div>

              {/* Next button */}
              {galleryPhotos.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 text-white hover:bg-white hover:bg-opacity-20"
                  onClick={nextPhoto}
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              )}

              {/* Photo counter */}
              {galleryPhotos.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                  {currentPhotoIndex + 1} de {galleryPhotos.length}
                </div>
              )}

              {/* Instructions */}
              <div className="absolute bottom-4 right-4 text-white text-sm opacity-70">
                Usa ← → o Espacio para navegar • Esc para cerrar
              </div>
            </div>
          </div>
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