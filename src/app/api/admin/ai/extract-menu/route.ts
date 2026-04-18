import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

const SYSTEM_PROMPT = `
You are a expert menu digitization specialist. Your task is to extract all categories and products from a photo or PDF of a restaurant menu.

RULES:
1. Extract ALL categories (e.g., "Sushi", "Drinks", "Desserts").
2. Extract ALL products for each category with their:
   - Name
   - Price (as a number, e.g. 12.50)
   - Description (if available)
3. If a product has variants or modifiers mentioned (e.g. "with extra cheese +1.00"), capture them if possible in a simplified way or just as part of the description.
4. Return ONLY valid JSON in the format provided below. Do not include any markdown formatting or explanations.

JSON FORMAT:
{
  "categories": [
    {
      "id": "temp-cat-1",
      "name": "Kategorie Name",
      "products": [
        {
          "name": "Produkt Name",
          "price": 9.90,
          "description": "Beschreibung..."
        }
      ]
    }
  ]
}
`

export async function POST(req: Request) {
  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Missing GOOGLE_API_KEY' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      },
      SYSTEM_PROMPT
    ])

    const response = await result.response
    const text = response.text()

    // Clean up response text if Gemini adds markdown code blocks
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()

    try {
      const data = JSON.parse(cleanJson)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error('JSON Parse Error:', text)
      return NextResponse.json({ error: 'Failed to parse AI response as JSON', raw: text }, { status: 500 })
    }
  } catch (error: any) {
    console.error('AI Extraction Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
