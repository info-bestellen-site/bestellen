import { fal } from '@fal-ai/client'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'Missing FAL_KEY' }, { status: 500 })
  }

  try {
    const { name, description, style = 'modern' } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
    }

    // Style-specific prompt components
    const stylePrompts: Record<string, string> = {
      imbiss: "Paper plate, cardboard box, street food stall background, casual natural lighting, realistic presentation, plastic cutlery.",
      fine_dining: "Elegant white porcelain, white tablecloth, moody luxury lighting, wine glass bokeh, minimalist high-end plating.",
      rustic: "Wooden table, cast iron pan, warm cozy evening light, traditional presentation, rustic kitchen background.",
      modern: "Clean minimalist setting, bright natural light, top-down or 45-degree angle, sharp focus, contemporary ceramic plate.",
      fast_food: "Plastic tray, wrapper paper, colorful vibrant lighting, commercial fast-food aesthetic, clean and appetizing."
    }

    const stylePrefix = stylePrompts[style] || stylePrompts.modern

    // Professional culinary prompt engineering
    const prompt = `Professional food photography of "${name}". 
    ${description ? `Description: ${description}.` : ''} 
    ${stylePrefix}
    Shot on a 50mm lens, shallow depth of field,
    vibrant colors, sharp focus on the food, soft bokeh background, 
    appetizing presentation, extremely detailed 8k photography.`

    const result = await fal.subscribe('fal-ai/flux-1/schnell', {
      input: {
        prompt: prompt,
        image_size: 'square_hd',
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg'
      },
      logs: false,
      onQueueUpdate: (update) => {
        console.log('fal.ai Queue Update:', update.status)
      }
    })

    const imageUrl = (result.data as any).images[0].url
    
    return NextResponse.json({ imageUrl })
  } catch (error: any) {
    console.error('AI Image Generation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
