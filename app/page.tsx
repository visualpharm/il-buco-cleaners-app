"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Camera, CheckCircle, XCircle, ArrowLeft, Check } from "lucide-react"

// SVG Icon Components from Icons8
const BedIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className={className}>
    <path fill="#9C27B0" d="M44,23c0,1.657-1.343,3-3,3H7c-1.657,0-3-1.343-3-3V9c0-1.657,1.343-3,3-3h34c1.657,0,3,1.343,3,3V23z"/>
    <path fill="#F3E5F5" d="M40 21v-7.353c0-.256-.11-.497-.303-.664C39.465 12.78 37.563 11 32.531 11s-6.996 1.78-7.229 1.983C25.11 13.15 25 13.392 25 13.647V19L40 21zM8 21v-7.353c0-.256.11-.497.303-.664C8.535 12.78 10.438 11 15.469 11s6.996 1.78 7.229 1.983C22.89 13.15 23 13.392 23 13.647V19L8 21z"/>
    <path fill="#FF9800" d="M46,42h-6v-2.237C40,38.52,39.56,38,38.315,38H9.685C8.44,38,8,38.52,8,39.763V42H2V31h44V42z"/>
    <path fill="#E1BEE7" d="M46,33H2v-1c0-10.992,3.252-14.895,21.526-14.895C40.959,17.105,46,20.446,46,32V33z"/>
    <path fill="#EF6C00" d="M2 32H46V34H2z"/>
  </svg>
)

const SofaIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className={className}>
    <path fill="#FF9800" d="M6 36H10V39H6zM38 36H42V39H38z"/>
    <path fill="#CE93D8" d="M4 17H44V37H4z"/>
    <path fill="#9C27B0" d="M39,13c0-1.657-1.343-3-3-3H12c-1.656,0-3,1.343-3,3v12h30V13z"/>
    <path fill="#E1BEE7" d="M39,28H9v-4c0-1.104,0.896-2,2-2h26c1.104,0,2,0.896,2,2V28z"/>
  </svg>
)

const FlameIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className={className}>
    <path fill="#DD2C00" d="M39,28c0,8.395-6.606,15-15.001,15S9,36.395,9,28S22.479,12.6,20.959,5C24,5,39,15.841,39,28z"/>
    <path fill="#FF5722" d="M33,32c0-7.599-9-15-9-15c0,6.08-9,8.921-9,15c0,5.036,3.963,9,9,9S33,37.036,33,32z"/>
    <path fill="#FFC107" d="M18.999,35.406C19,32,24,30.051,24,27c0,0,4.999,3.832,4.999,8.406c0,2.525-2.237,4.574-5,4.574S18.998,37.932,18.999,35.406z"/>
  </svg>
)

const StairsIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className={className}>
    <path fill="#FFC107" d="M41 42L6 42 6 7 13 7 13 14 20 14 20 21 27 21 27 28 34 28 34 35 41 35 41 42 41 42z"/>
  </svg>
)

const HABITACIONES = [
  // Planta Baja - Blue
  {
    nombre: "Garden Room",
    piso: "Planta Baja",
    icono: BedIcon,
    color: "bg-blue-100 hover:bg-blue-200",
    tipo: "habitacion",
  },
  {
    nombre: "Living",
    piso: "Planta Baja",
    icono: SofaIcon,
    color: "bg-blue-100 hover:bg-blue-200",
    tipo: "living",
  },
  // 1er Piso - Orange
  {
    nombre: "Suite Esquinera",
    piso: "1er Piso",
    icono: BedIcon,
    color: "bg-orange-100 hover:bg-orange-200",
    tipo: "habitacion",
  },
  {
    nombre: "Suite con Terraza",
    piso: "1er Piso",
    icono: BedIcon,
    color: "bg-orange-100 hover:bg-orange-200",
    tipo: "habitacion",
  },
  // 2do Piso - Pink
  {
    nombre: "Penthouse",
    piso: "2do Piso",
    icono: BedIcon,
    color: "bg-pink-100",
    tipo: "habitacion",
  },
  {
    nombre: "Parrilla",
    piso: "2do Piso",
    icono: FlameIcon,
    color: "bg-pink-100 hover:bg-pink-200",
    tipo: "parrilla",
  },
  // Escalera - Dark gray
  {
    nombre: "Escalera",
    piso: "Común",
    icono: StairsIcon,
    color: "bg-gray-600 hover:bg-gray-700 text-white",
    tipo: "escalera",
  },
]

// Tipos de fotos que se pueden pedir
const TIPOS_FOTOS = [
  {
    id: "cama",
    titulo: "Cama completa",
    descripcion:
      "Mostrá la cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz",
    validacionIA:
      "cama bien hecha con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar visible en mesita de luz",
    pasoRelacionado: 6, // ID del paso de tender la cama
  },
  {
    id: "cubiertos",
    titulo: "Cubiertos completos",
    descripcion: "Mostrá todos los cubiertos: 2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina",
    validacionIA: "2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas y 1 cuchillo de cocina limpios",
    pasoRelacionado: 11,
  },
  {
    id: "basura",
    titulo: "Cesto de basura",
    descripcion: "Mostrá el cesto de basura vacío con bolsa nueva puesta y 2 bolsas de repuesto en el fondo",
    validacionIA: "cesto vacío con bolsa nueva instalada y 2 bolsas de repuesto visibles en el fondo",
    pasoRelacionado: 20, // ID del paso de basura
  },
]

// Checklist para habitaciones normales
const CHECKLIST_HABITACIONES = [
  { id: 1, categoria: "Inspección inicial", texto: "Entramos: Tocar la puerta, Entrar y verificar si hubo check-out" },
  {
    id: 2,
    categoria: "Revisión para lavar",
    texto:
      "Revisar si hace falta lavar: Fundas decorativas de almohadas, Funda de futón, Mantas, Pie de cama, Cortinas",
  },
  {
    id: 3,
    categoria: "Revisión para lavar",
    texto: "Si hubo huéspedes, lavar: Sábanas, Fundas de almohadas, Funda del edredón, Toallas",
  },
  {
    id: 4,
    categoria: "Dormitorio",
    texto: "Lavar blanquería: Separar blancos y colores, Poner a lavar, Se puede juntar con otras habitaciones",
  },
  {
    id: 6,
    categoria: "Dormitorio",
    texto:
      "Tender la cama: Colocar la sábana, Poner las fundas de almohada, Alinear bien la funda del acolchado, Colocar el pie de cama con arrugas, Dejar la manta polar en la mesita de luz",
  },
  {
    id: 7,
    categoria: "Baño",
    texto: "Limpieza de baño: Ducha, Bacha, Inodoro, Espejo, Mampara",
  },
  {
    id: 8,
    categoria: "Baño",
    texto:
      "Reposición de baño: Toallas - 2 grandes y 2 de mano, Papel higiénico - 1 en uso + 1 de repuesto, Botellas - jabón en bacha y ducha; shampoo (revisar niveles)",
  },
  {
    id: 11,
    categoria: "Cocina y utensilios",
    texto: "Verificar cubiertos: 2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina",
  },
  {
    id: 12,
    categoria: "Cocina y utensilios",
    texto: "Verificar vajilla: 2 platos grandes, 2 platos hondos, 2 platos postre, 2 vasos, 2 tazas",
  },
  {
    id: 13,
    categoria: "Cocina y utensilios",
    texto: "Verificar utensilios de cocina: 1 olla, 1 sartén, 1 espátula",
  },
  {
    id: 14,
    categoria: "Cocina y utensilios",
    texto: "Verificar condimentos: 5 bolsitas de sal, 5 bolsitas de azúcar, 5 bolsitas de edulcorante",
  },
  {
    id: 15,
    categoria: "Cocina y utensilios",
    texto: `Revisar cafetera: Verificar que esté vacía por dentro, Café - hay al menos mitad de bolsa, Filtros - hay al menos mitad de caja`,
  },
  {
    id: 16,
    categoria: "Limpieza general",
    texto: `Limpieza completa:
 Limpiar vidrios si están marcados,
 Limpiar mesas\\, mesitas y estantes,
 Revisar y limpiar horno\\, microondas y heladera,
 Aspirar y trapear pisos
`,
  },

  {
    id: 17,
    categoria: "Basura y cierre",
    texto: `Manejo de basura:
 Tirar la basura de todos los tachos,
 Poner 1 bolsa nueva,
 Dejar 2 bolsas de repuesto`,
  },

  {
    id: 18,
    categoria: "Basura y cierre",
    texto: `Cierre de la habitación:
 Apagar aire acondicionado,
 Cerrar ventanas,
 Apagar luces,
 Cerrar puertas`,
  },
]

// Checklist simplificado para parrilla
const CHECKLIST_PARRILLA = [
  {
    id: 1,
    categoria: "Verificación",
    texto:
      "Verificar la parrilla: La rejilla tiene que estar limpia, Tirar cenizas, Pasar un trapo por la mesa y la bacha, Todas las sillas deben estar alrededor de la mesa, Barrer el piso si es necesario",
  },
]

// Checklist para escalera/hall
const CHECKLIST_ESCALERA = [
  { id: 1, categoria: "Limpieza", texto: "Barrer escalones" },
  { id: 2, categoria: "Paquetes", texto: "Paquetes: Chequear si quedaron nuevos paquetes de Mercado Libre, Si hay paquetes\\, abrir y tratar de distribuir" },
  { id: 3, categoria: "Falta algo", texto: "Falta algo: Escribir a Ivan o su asistente las cosas que faltan, Ofrecer de comprar los items faltantes si es posible" },
]

// Simulación de validación IA con análisis detallado
interface ValidacionIA {
  esValida: boolean;
  ignorado?: boolean;
  analisis: {
    esperaba: string;
    encontro: string;
  };
}

const validarFotoConIA = async (
  file: File,
  validacion: string,
  tipoFoto: any,
): Promise<ValidacionIA> => {
  // Simulación de delay de IA
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // 60% de probabilidad de estar correcto
  if (Math.random() > 0.4) {
    return {
      esValida: true,
      analisis: {
        esperaba: "Foto validada correctamente",
        encontro: "",
      },
    };
  } else {
    return {
      esValida: false,
      analisis: {
        esperaba: "La IA dice que el lugar no está en condiciones, ¿es así?",
        encontro: "",
      },
      ignorado: false,
    };
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

type Habitacion = (typeof HABITACIONES)[number]

export default function LimpiezaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL-based state
  const roomFromUrl = searchParams.get('room')
  const stepFromUrl = parseInt(searchParams.get('step') || '0')
  const photoRequired = searchParams.get('photo') === 'required'
  const validatingPhoto = searchParams.get('validating') === 'true'
  const awaitingCorrection = searchParams.get('correction') === 'true'
  const sessionId = searchParams.get('session')
  
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<Habitacion | null>(
    roomFromUrl ? HABITACIONES.find(h => h.nombre.toLowerCase().replace(/\s+/g, '-') === roomFromUrl) || null : null
  )
  const [pasoActual, setPasoActual] = useState<number>(stepFromUrl)
  const [datosLimpieza, setDatosLimpieza] = useState<StepData[]>([])
  const [horaInicioLimpieza, setHoraInicioLimpieza] = useState<Date | null>(null)
  const [validandoFoto, setValidandoFoto] = useState<boolean>(validatingPhoto)
  const [esperandoCorreccion, setEsperandoCorreccion] = useState<boolean>(awaitingCorrection)
  const [sesionActual, setSesionActual] = useState<SesionLimpieza | null>(null)
  const [fotoRequerida, setFotoRequerida] = useState<any>(null)
  const [cleaningStats, setCleaningStats] = useState({
    lastCleaned: null as Date | null,
    spacesCleaned: 0,
    totalTimeMinutes: 0,
    loading: true
  });

  // Helper function to convert room name to URL slug
  const roomToSlug = (habitacion: Habitacion): string => {
    return habitacion.nombre.toLowerCase().replace(/\s+/g, '-')
  }

  // Helper function to update URL parameters
  const updateURL = (params: { [key: string]: string | number | boolean | null }) => {
    const url = new URL(window.location.href)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === false || value === '' || value === 0) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, String(value))
      }
    })
    
    router.push(url.pathname + url.search)
  }

  // Format minutes to HHh MMm
  const formatDuration = (minutes: number) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Restore state from URL on component mount and URL changes
  useEffect(() => {
    // If we have URL parameters, restore the cleaning state
    if (roomFromUrl && habitacionSeleccionada && stepFromUrl > 0) {
      // Initialize session if we have a session ID
      if (sessionId) {
        const existingSession = localStorage.getItem('sesionLimpieza')
        if (existingSession) {
          const parsed = JSON.parse(existingSession)
          if (parsed.id === sessionId) {
            setSesionActual(parsed)
          }
        }
      }
      
      // Initialize cleaning data for the current step
      if (datosLimpieza.length === 0) {
        const checklist = obtenerChecklist(habitacionSeleccionada.tipo)
        const newData: StepData[] = []
        
        // Create data for all steps up to current step
        for (let i = 0; i <= stepFromUrl; i++) {
          newData.push({
            id: checklist[i].id,
            horaInicio: new Date(), // Would ideally come from database
            horaCompletado: i < stepFromUrl ? new Date() : undefined
          })
        }
        
        setDatosLimpieza(newData)
        setHoraInicioLimpieza(new Date())
      }
    }
  }, [roomFromUrl, stepFromUrl, habitacionSeleccionada, sessionId])

  // Save a completed cleaning session
  const saveCompletedSession = async (roomName: string, durationMinutes: number, stepsCompleted: number, totalSteps: number) => {
    try {
      await fetch('/api/cleaning-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          startTime: new Date(Date.now() - (durationMinutes * 60 * 1000)).toISOString(),
          endTime: new Date().toISOString(),
          stepsCompleted,
          totalSteps,
          durationMinutes
        })
      });
      
      // Refresh stats
      const statsResponse = await fetch('/api/cleaning-stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setCleaningStats({
          lastCleaned: data.lastCleaned ? new Date(data.lastCleaned) : null,
          spacesCleaned: data.totalSpaces || 0,
          totalTimeMinutes: data.totalTimeMinutes || 0,
          loading: false
        });
      }
    } catch (error) {
      console.error('Failed to save cleaning session:', error);
    }
  };
  
  // Load cleaning stats
  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/cleaning-stats');
        if (response.ok) {
          const data = await response.json();
          setCleaningStats({
            lastCleaned: data.lastCleaned ? new Date(data.lastCleaned) : null,
            spacesCleaned: data.totalSpaces || 0,
            totalTimeMinutes: data.totalTimeMinutes || 0,
            loading: false
          });
        }
      } catch (error) {
        console.error('Failed to load cleaning stats:', error);
        setCleaningStats(prev => ({ ...prev, loading: false }));
      }
    }

    loadStats();
  }, []);

  // Obtener checklist según tipo de habitación
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

  const CHECKLIST_STEPS = habitacionSeleccionada ? obtenerChecklist(habitacionSeleccionada.tipo) : []

  // Inicializar sesión si no existe
  const inicializarSesion = () => {
    if (!sesionActual) {
      // Seleccionar solo 1 foto por sesión (promedio una por habitación)
      const numFotos = 1
      const fotosDisponibles = [...TIPOS_FOTOS]
      const fotosSeleccionadas = []

      for (let i = 0; i < numFotos; i++) {
        const indiceAleatorio = Math.floor(Math.random() * fotosDisponibles.length)
        fotosSeleccionadas.push(fotosDisponibles[indiceAleatorio].id)
        fotosDisponibles.splice(indiceAleatorio, 1)
      }

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
    
    // Update URL with room and step parameters
    updateURL({
      room: roomToSlug(habitacion),
      step: 0,
      session: sesion.id
    })

    // Actualizar habitaciones limpiadas en la sesión
    if (sesion && !sesion.habitacionesLimpiadas.includes(habitacion.nombre)) {
      setSesionActual({
        ...sesion,
        habitacionesLimpiadas: [...sesion.habitacionesLimpiadas, habitacion.nombre],
      })
    }

    // Inicializar primer paso
    const checklist = obtenerChecklist(habitacion.tipo)
    const nuevoDato: StepData = {
      id: checklist[0].id,
      horaInicio: new Date(),
    }
    setDatosLimpieza([nuevoDato])
  }

  const verificarSiFotoRequerida = (pasoId: number) => {
    if (!sesionActual || habitacionSeleccionada?.tipo !== "habitacion") return null

    // Buscar si este paso requiere una foto que esté seleccionada para la sesión
    const tipoFoto = TIPOS_FOTOS.find(
      (tipo) =>
        tipo.pasoRelacionado === pasoId &&
        sesionActual.fotosSeleccionadas.includes(tipo.id) &&
        !sesionActual.fotosPedidas.includes(tipo.id),
    )

    return tipoFoto || null
  }

  // Helper to upload images to the server
  async function uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        let errorMsg = `HTTP error! status: ${res.status}`
        try {
          const errorData = await res.json()
          errorMsg = errorData?.error || errorMsg
          if (errorData?.details) errorMsg += ` (${errorData.details})`
        } catch (e) {
          // If we can't parse the error, just use the status text
          errorMsg = res.statusText || errorMsg
        }
        throw new Error(errorMsg)
      }

      const data = await res.json()
      if (!data?.url) {
        throw new Error("No URL returned from upload")
      }
      return data.url
    } catch (error) {
      console.error("Upload failed:", error)
      throw new Error(error instanceof Error ? error.message : "Failed to upload image")
    }
  }

  const completarPaso = async (foto?: File) => {
    const step = CHECKLIST_STEPS[pasoActual];
    const ahora = new Date();
    const tipoFotoRequerida = verificarSiFotoRequerida(step.id);

    let validacion = undefined;
    let tipoFoto = undefined;
    let fotoUrl = undefined;

    if (foto && tipoFotoRequerida) {
      setValidandoFoto(true);
      try {
        // Upload image to disk and get URL
        fotoUrl = await uploadImage(foto);
        validacion = await validarFotoConIA(foto, tipoFotoRequerida.validacionIA, tipoFotoRequerida);
        tipoFoto = tipoFotoRequerida.id;

        // Marcar foto como pedida
        if (sesionActual) {
          setSesionActual({
            ...sesionActual,
            fotosPedidas: [...sesionActual.fotosPedidas, tipoFotoRequerida.id],
          });
        }

        // If validation failed and user didn't ignore, don't proceed
        if (!validacion.esValida && !validacion.ignorado) {
          setEsperandoCorreccion(true);
          return;
        }
      } finally {
        setValidandoFoto(false);
      }
    }


    // Update step data
    setDatosLimpieza(prev => {
      const updated = {
        ...prev,
        [step.id]: {
          ...prev[step.id],
          completado: true,
          horaInicio: prev[step.id]?.horaInicio || ahora,
          horaCompletado: ahora,
          foto: fotoUrl,
          validacionIA: validacion,
          tipoFoto: tipoFoto,
          corregido: validacion?.ignorado || false,
          ignorado: validacion?.ignorado || false
        }
      };
      
      // Check if this was the last step
    const allSteps = Object.keys(updated);
    if (allSteps.length === CHECKLIST_STEPS.length) {
      if (!habitacionSeleccionada) {
        console.error('No se ha seleccionado una habitación');
        return updated;
      }
      
      const startTime = Object.values(updated).reduce((earliest: Date | null, step: any) => {
        return (step.horaInicio && (!earliest || step.horaInicio < earliest)) ? step.horaInicio : earliest;
      }, null as Date | null);
      
      const endTime = new Date();
      const durationMinutes = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : 0;
      
      saveCompletedSession(
        habitacionSeleccionada.nombre,
        durationMinutes,
        allSteps.length,
        CHECKLIST_STEPS.length
      );
    }  
      
      return updated;
    });

    // Move to next step or complete
    if (pasoActual < CHECKLIST_STEPS.length - 1) {
      setPasoActual(pasoActual + 1);
    } else {
      setPasoActual(CHECKLIST_STEPS.length);
    }

    const tiempoTranscurrido = pasoActual > 0 ? ahora.getTime() - datosLimpieza[pasoActual].horaInicio.getTime() : 0

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
    datosActualizados[pasoActual] = {
      ...datosActualizados[pasoActual],
      horaCompletado: ahora,
      tiempoTranscurrido,
      foto: fotoUrl || (foto ? URL.createObjectURL(foto) : undefined), // Use uploaded URL if available
      validacionIA: validacion,
      tipoFoto,
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
      const nextStep = pasoActual + 1
      setPasoActual(nextStep)
      
      // Update URL with new step
      if (habitacionSeleccionada) {
        updateURL({
          room: roomToSlug(habitacionSeleccionada),
          step: nextStep,
          session: sesionActual?.id || null
        })
      }
    } else {
      // Limpieza completada
      await guardarLimpiezaCompleta(datosActualizados)
      
      // Clear URL parameters when room is completed
      updateURL({
        room: null,
        step: null,
        session: sesionActual?.id || null
      })
    }
  }

  const confirmarCorreccion = () => {
    setEsperandoCorreccion(false);
    const datosActualizados = [...datosLimpieza];
    
    // Update URL to remove correction state
    if (habitacionSeleccionada) {
      updateURL({
        room: roomToSlug(habitacionSeleccionada),
        step: pasoActual,
        session: sesionActual?.id || null,
        correction: null
      })
    }
    
    if (datosActualizados[pasoActual]) {
      datosActualizados[pasoActual] = {
        ...datosActualizados[pasoActual],
        corregido: true,
      };
      setDatosLimpieza(datosActualizados);
      setFotoRequerida(null);
      completarPaso();
    } else {
      console.error('Paso actual no encontrado en datosLimpieza');
    }
  };

  const ignorarCorreccion = () => {
    setEsperandoCorreccion(false);
    const datosActualizados = [...datosLimpieza];
    
    if (datosActualizados[pasoActual]) {
      datosActualizados[pasoActual] = {
        ...datosActualizados[pasoActual],
        ignorado: true,
      };
      setDatosLimpieza(datosActualizados);
      setFotoRequerida(null);
      completarPaso();
    } else {
      console.error('Paso actual no encontrado en datosLimpieza');
    }
  }

  const guardarLimpiezaIncompleta = async (datos: StepData[]) => {
    if (!habitacionSeleccionada) {
      console.error('No se ha seleccionado una habitación');
      return;
    }

    const limpiezaIncompleta = {
      id: Date.now().toString(),
      habitacion: habitacionSeleccionada.nombre,
      tipo: habitacionSeleccionada.tipo,
      horaInicio: horaInicioLimpieza || new Date(),
      horaFin: new Date(),
      pasos: datos,
      sesionId: sesionActual?.id,
      completa: false,
      razon: "Pausa larga detectada (más de 1 hora)",
    };

    try {
      // Save to MongoDB
      await fetch('/api/checklist-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limpiezaIncompleta)
      });

      // Also save to localStorage as backup
      const limpiezasGuardadas = JSON.parse(localStorage.getItem("limpiezas") || "[]");
      limpiezasGuardadas.push(limpiezaIncompleta);
      localStorage.setItem("limpiezas", JSON.stringify(limpiezasGuardadas));
    } catch (error) {
      console.error('Error al guardar limpieza incompleta:', error);
    }
  }

  const guardarLimpiezaCompleta = async (datos: StepData[]) => {
    if (!habitacionSeleccionada) {
      console.error('No se ha seleccionado una habitación');
      return;
    }

    const limpiezaCompleta = {
      id: Date.now().toString(),
      habitacion: habitacionSeleccionada.nombre,
      tipo: habitacionSeleccionada.tipo,
      horaInicio: horaInicioLimpieza || new Date(),
      horaFin: new Date(),
      pasos: datos,
      sesionId: sesionActual?.id,
      completa: true,
    };

    try {
      // Save to MongoDB
      await fetch('/api/checklist-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limpiezaCompleta)
      });

      // Also save to localStorage as backup
      const limpiezasGuardadas = JSON.parse(localStorage.getItem("limpiezas") || "[]");
      limpiezasGuardadas.push(limpiezaCompleta);
      localStorage.setItem("limpiezas", JSON.stringify(limpiezasGuardadas));
    } catch (error) {
      console.error('Error al guardar limpieza completa:', error);
    }

    // Resetear para nueva limpieza
    setHabitacionSeleccionada(null);
    setPasoActual(0);
    setDatosLimpieza([]);
    setHoraInicioLimpieza(null);
    setFotoRequerida(null);
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
  const stepActual = CHECKLIST_STEPS[pasoActual]
  const tipoFotoRequerida = verificarSiFotoRequerida(stepActual?.id)
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
                      const yaLimpiada = sesionActual?.habitacionesLimpiadas.includes(habitacion.nombre)
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
                              <IconoHabitacion className="w-6 h-6" />
``                              {yaLimpiada && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </div>
                            <div className="text-sm font-medium leading-tight">{habitacion.nombre}</div>
                          </div>

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
            <p className="text-gray-600 mb-6">{habitacionSeleccionada!.nombre} ha sido limpiada correctamente</p>
            <Button onClick={() => {
              setHabitacionSeleccionada(null)
              // Return to room selection
              updateURL({
                room: null,
                step: null,
                session: sesionActual?.id || null
              })
            }} className="w-full">
              Continuar con otra habitación
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate last cleaning day and stats
  const today = new Date();
  const lastCleaningDay = new Date(today);
  lastCleaningDay.setDate(today.getDate() - 1); // Default to yesterday
  
  // Format date as "Today", "Yesterday", or day name
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    const today = new Date();
    const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto min-h-[480px] flex flex-col">
        
        {/* Navigation */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (pasoActual > 0) {
                const prevStep = pasoActual - 1
                setPasoActual(prevStep);
                // Update URL for previous step
                if (habitacionSeleccionada) {
                  updateURL({
                    room: roomToSlug(habitacionSeleccionada),
                    step: prevStep,
                    session: sesionActual?.id || null
                  })
                }
              } else {
                setHabitacionSeleccionada(null);
                // Go back to room selection
                updateURL({
                  room: null,
                  step: null,
                  session: sesionActual?.id || null
                })
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="font-bold text-lg">{habitacionSeleccionada!.nombre}</h1>
            <p className="text-sm text-gray-600">
              Paso {pasoActual + 1} de {CHECKLIST_STEPS.length} • {habitacionSeleccionada!.piso}
            </p>
          </div>
        </div>

        {/* Progreso */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((pasoActual + 1) / CHECKLIST_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content container that grows to fill space */}
        <div className="flex-1 flex flex-col">
          {/* Paso actual */}
          <Card className="border-0 shadow-lg flex-1 flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{stepActual.categoria}</Badge>
              </div>
              <CardTitle className="text-lg">
                {stepActual.texto.includes(":") && stepActual.texto.split(":")[1].includes(",") ? (
                  <div>
                    <div className="mb-2">{stepActual.texto.split(":")[0]}:</div>
                    <ul className="list-disc list-inside space-y-1 text-base font-normal">
                      {(() => {
                        const afterColon = stepActual.texto.split(":")[1]

                        // Remove newlines and extra spaces
                        const normalized = afterColon.replace(/\n/g, " ").replace(/\s+/g, " ")

                        // Replace \, and \: with placeholders
                        // This allows for escaped commas and colons to be handled correctly in splitting and rendering
                        const replaced = normalized.replace(/\\,/g, "<<<COMMA>>>").replace(/\\:/g, "<<<COLON>>>")

                        // Split on commas (not escaped)
                        const splitArr = replaced.split(",")

                        // Replace placeholders with original characters, trim, and filter out empty items
                        const finalArr = splitArr
                          .map((item) =>
                            item
                              .replace(/<<<COMMA>>>/g, ",")
                              .replace(/<<<COLON>>>/g, ":")
                              .trim(),
                          )
                          .filter((item) => item.length > 0)

                        return finalArr.map((item, index) => (
                          <li key={index} className="text-gray-700">
                            {item}
                          </li>
                        ))
                      })()}
                    </ul>
                  </div>
                ) : (
                  (() => {
                    let raw = stepActual.texto
                    raw = raw.replace(/\\:/g, ":").replace(/\\,/g, ",")
                    return raw
                  })()
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              {tipoFotoRequerida && (
                <div className="space-y-3">
                  <label className="block">
                    <div className="border-2 border-dashed border-yellow-400 rounded-lg p-6 text-center cursor-pointer hover:border-yellow-500 transition-colors bg-yellow-50">
                      <Camera className="w-8 h-8 mx-auto mb-3 text-yellow-600" />
                      <h4 className="font-medium text-yellow-800 mb-2">{tipoFotoRequerida.titulo}</h4>
                      <p className="text-sm text-yellow-700 mb-3">{tipoFotoRequerida.descripcion}</p>
                      <p className="text-sm text-yellow-800 font-medium">Toca para tomar la foto requerida</p>
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
                        <div className="font-medium">{validacionActual.analisis.esperaba}</div>
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
                          <div className="font-medium mb-3">{validacionActual?.analisis.esperaba}</div>
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
                <div className="mt-auto">
                  <div className="flex gap-2">
                    <Button onClick={() => completarPaso()} className="flex-1 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Completar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => completarPaso()} 
                      className="px-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Pasar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
