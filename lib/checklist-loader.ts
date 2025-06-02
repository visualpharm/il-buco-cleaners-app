// Simulación de carga de YAML (en un entorno real usarías js-yaml)
// Como Next.js no soporta archivos YAML directamente, simulamos la carga

interface FotoType {
  id: string
  titulo: string
  descripcion: string
  validacion_ia: string
  paso_relacionado: number
}

interface ChecklistItem {
  id: number
  texto: string
  weight: number
}

interface ChecklistData {
  foto_types: FotoType[]
  checklists: {
    habitacion: ChecklistItem[]
    parrilla: ChecklistItem[]
    escalera: ChecklistItem[]
  }
}

// Datos del YAML convertidos a objeto JavaScript
const CHECKLIST_DATA: ChecklistData = {
  foto_types: [
    {
      id: "cama",
      titulo: "Cama completa",
      descripcion:
        "Mostrá la cama completa con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar en mesita de luz",
      validacion_ia:
        "cama bien hecha con sábana, fundas de almohada, funda del acolchado alineada, pie de cama con arrugas y manta polar visible en mesita de luz",
      paso_relacionado: 6,
    },
    {
      id: "cubiertos",
      titulo: "Cubiertos completos",
      descripcion:
        "Mostrá todos los cubiertos: 2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina",
      validacion_ia: "2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas y 1 cuchillo de cocina limpios",
      paso_relacionado: 11,
    },
    {
      id: "basura",
      titulo: "Cesto de basura",
      descripcion: "Mostrá el cesto de basura vacío con bolsa nueva puesta y 2 bolsas de repuesto en el fondo",
      validacion_ia: "cesto vacío con bolsa nueva instalada y 2 bolsas de repuesto visibles en el fondo",
      paso_relacionado: 20,
    },
    {
      id: "cafetera",
      titulo: "Interior de cafetera",
      descripcion: "Mostrá el interior de la cafetera abierta para verificar que esté completamente vacía",
      validacion_ia: "interior de cafetera completamente vacía, sin restos de café ni filtros",
      paso_relacionado: 15,
    },
  ],
  checklists: {
    habitacion: [
      { id: 1, texto: "Tocar la puerta y entrar, verificar si hubo check-out", weight: 0 },
      {
        id: 2,
        texto:
          "Textiles y ropa:\n  - Revisar si hace falta lavar cortinas, fundas decorativas, funda de futón, mantas o plaids\n  - Si hubo huéspedes: retirar sábanas, fundas de almohadas, funda del edredón y toallas\n  - Separar blancos y colores y poner a lavar (puede juntarse con otras habitaciones compatibles)",
        weight: 0,
      },
      {
        id: 6,
        texto:
          "Cama:\n  - Sábana bajera colocada\n  - Fundas de almohada puestas\n  - Funda del acolchado alineada\n  - Pie de cama colocado con arrugas\n  - Manta polar en la mesita de luz",
        weight: 8,
      },
      { id: 7, texto: "Limpiar: ducha, bacha, inodoro, espejo, mampara", weight: 0 },
      {
        id: 8,
        texto:
          "Baño - reposición:\n  - 1 toalla grande + 1 de mano por huésped\n  - Papel higiénico: 1 usado + 1 nuevo\n  - Botellas: jabón líquido en bacha, jabón líquido en ducha, shampoo (revisar que no estén con menos de la mitad)",
        weight: 0,
      },
      {
        id: 11,
        texto:
          "Inventario cocina:\n  - Cubiertos: 2 tenedores, 2 cuchillos, 2 cucharas, 2 cucharitas, 1 cuchillo de cocina\n  - Vajilla: 2 platos grandes, 2 hondos, 2 postre, 2 vasos, 2 tazas\n  - Utensilios: 1 olla o sartén, 1 espátula\n  - Condimentos: 3 bolsitas sal, 3 azúcar, 3 edulcorante (cada tipo en su frasco)",
        weight: 7,
      },
      {
        id: 15,
        texto:
          "Cocina y superficies:\n  - Revisar que la cafetera esté vacía por dentro\n  - Limpiar vidrios si están marcados\n  - Limpiar mesas, mesitas, estantes\n  - Revisar y limpiar horno, microondas, heladera por dentro\n  - Aspirar y trapear el piso",
        weight: 5,
      },
      {
        id: 20,
        texto:
          "Basura:\n  - Tirar la basura de todos los tachos\n  - Poner una bolsa nueva y dejar 2 bolsas de repuesto en el fondo",
        weight: 6,
      },
      {
        id: 21,
        texto: "Cierre final:\n  - Apagar luces y aire\n  - Cerrar ventanas y puertas",
        weight: 0,
      },
    ],
    parrilla: [
      {
        id: 1,
        texto:
          "Parrilla:\n  - La rejilla debe estar limpia\n  - Tirar cenizas\n  - Pasar un trapo por la mesa y la bacha\n  - Todas las sillas alrededor de la mesa\n  - Barrer el piso si es necesario",
        weight: 0,
      },
    ],
    escalera: [
      { id: 1, texto: "Aspirar escalones", weight: 0 },
      { id: 2, texto: "Limpiar barandas", weight: 0 },
      {
        id: 3,
        texto: "Paquetes:\n  - Chequear si quedaron paquetes de Mercado Libre\n  - Si hay paquetes, abrir y distribuir",
        weight: 0,
      },
      {
        id: 4,
        texto:
          "Faltantes:\n  - Escribir a Ivan o su asistente las cosas que faltan\n  - Ofrecer comprar los ítems faltantes si es posible",
        weight: 0,
      },
    ],
  },
}

export function getChecklistData(): ChecklistData {
  return CHECKLIST_DATA
}

export function getChecklist(tipo: string): ChecklistItem[] {
  const data = getChecklistData()
  switch (tipo) {
    case "parrilla":
      return data.checklists.parrilla
    case "escalera":
      return data.checklists.escalera
    default:
      return data.checklists.habitacion
  }
}

export function getFotoTypes(): FotoType[] {
  return getChecklistData().foto_types
}

// Función para seleccionar fotos basada en pesos
export function seleccionarFotosConPesos(tipo: string, numFotos = 1): string[] {
  const checklist = getChecklist(tipo)
  const fotoTypes = getFotoTypes()

  // Solo considerar pasos que tienen fotos asociadas y peso > 0
  const pasosConFoto = checklist.filter((paso) => {
    const tienefoto = fotoTypes.some((foto) => foto.paso_relacionado === paso.id)
    return tienefoto && paso.weight > 0
  })

  if (pasosConFoto.length === 0) return []

  // Crear array ponderado (repetir elementos según su peso)
  const arrayPonderado: string[] = []
  pasosConFoto.forEach((paso) => {
    const fotoType = fotoTypes.find((foto) => foto.paso_relacionado === paso.id)
    if (fotoType) {
      // Agregar el ID de la foto tantas veces como su peso
      for (let i = 0; i < paso.weight; i++) {
        arrayPonderado.push(fotoType.id)
      }
    }
  })

  // Seleccionar aleatoriamente del array ponderado
  const fotosSeleccionadas: string[] = []
  const arrayDisponible = [...arrayPonderado]

  for (let i = 0; i < numFotos && arrayDisponible.length > 0; i++) {
    const indiceAleatorio = Math.floor(Math.random() * arrayDisponible.length)
    const fotoSeleccionada = arrayDisponible[indiceAleatorio]

    // Evitar duplicados
    if (!fotosSeleccionadas.includes(fotoSeleccionada)) {
      fotosSeleccionadas.push(fotoSeleccionada)
    }

    // Remover todas las instancias de esta foto para evitar duplicados
    for (let j = arrayDisponible.length - 1; j >= 0; j--) {
      if (arrayDisponible[j] === fotoSeleccionada) {
        arrayDisponible.splice(j, 1)
      }
    }
  }

  return fotosSeleccionadas
}

export type { ChecklistItem, FotoType, ChecklistData }
