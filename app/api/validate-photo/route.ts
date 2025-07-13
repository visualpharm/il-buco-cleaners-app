import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const descripcion = formData.get('descripcion') as string
    const titulo = formData.get('titulo') as string

    if (!file || !descripcion || !titulo) {
      return NextResponse.json(
        { error: 'Falta archivo, descripción o título' },
        { status: 400 }
      )
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Eres un inspector de limpieza profesional. Analiza esta foto para verificar si cumple con el siguiente requisito de limpieza:

Título: ${titulo}
Descripción esperada: ${descripcion}

PRIMERO verifica si la imagen es relevante:
- Si es una captura de pantalla, página web, o algo completamente no relacionado, indica que es una foto incorrecta
- Solo analiza elementos faltantes si la foto muestra el contexto correcto (habitación, cocina, etc.)

Responde SOLO con un JSON en el siguiente formato:
{
  "esValido": true/false,
  "analisis": {
    "esperaba": "[qué esperabas ver]",
    "encontro": "[instrucción de qué hacer]"
  }
}

REGLAS:
1. Si la imagen NO es relevante (ej: captura de pantalla, página web, foto de otra cosa):
   - esperaba: "Foto incorrecta: no es ${titulo.toLowerCase()}"
   - encontro: "Sacá foto de ${titulo.toLowerCase()}"

2. Si la imagen ES relevante pero faltan elementos:
   - esperaba: "Falta: [elemento específico]"
   - encontro: "[acción específica a tomar]"

3. Si todo está correcto: esValido = true

Máximo 5-7 palabras por campo. Sé específico y claro.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No se recibió respuesta de OpenAI')
    }

    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanContent = content
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      }
      
      const result = JSON.parse(cleanContent)
      return NextResponse.json(result)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', content)
      // Return a default validation if parsing fails
      return NextResponse.json({
        esValido: false,
        analisis: {
          esperaba: descripcion,
          encontro: "No se pudo analizar la imagen correctamente"
        }
      })
    }

  } catch (error) {
    console.error('Error validating photo:', error)
    return NextResponse.json(
      { 
        error: 'Error al validar la foto',
        esValido: false,
        analisis: {
          esperaba: "Falta: verificación de la imagen",
          encontro: "Intenta con otra foto más clara"
        }
      },
      { status: 500 }
    )
  }
}