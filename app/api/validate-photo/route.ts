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

Responde SOLO con un JSON en el siguiente formato:
{
  "esValido": true/false,
  "analisis": {
    "esperaba": "Falta: [elemento específico faltante]",
    "encontro": "[instrucción breve y específica de qué hacer]"
  }
}

IMPORTANTE: 
- Si falta algo, en "esperaba" pon SOLO lo que falta (ej: "Falta: manta polar en mesita")
- En "encontro" da una instrucción MUY BREVE de qué hacer (ej: "Colocá la manta en la mesita")
- Máximo 5-7 palabras por campo
- Sé específico sobre QUÉ falta o está mal

Si la foto muestra correctamente TODO lo solicitado, esValido debe ser true.`
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