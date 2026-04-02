'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react'

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: Blob) => void
  onCancel: () => void
  aspectRatio?: number
  circularCrop?: boolean
}

export function ImageCropper({ 
  image, 
  onCropComplete, 
  onCancel, 
  aspectRatio = 4 / 5,
  circularCrop = false
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop)
  }

  const onZoomChange = (zoom: number) => {
    setZoom(zoom)
  }

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  const handleConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
      onCropComplete(croppedBlob)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col">
      <div className="flex justify-between items-center p-6 text-white">
        <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full transition-all">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-sm font-black uppercase tracking-[0.2em]">Bild anpassen</h2>
        <button 
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
        >
          <Check className="w-4 h-4" />
          Speichern
        </button>
      </div>

      <div className="flex-1 relative">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          cropShape={circularCrop ? 'round' : 'rect'}
          showGrid={!circularCrop}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div className="p-10 bg-black/40 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-xs mx-auto flex items-center gap-6">
          <ZoomOut className="w-5 h-5 text-white/40" />
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white"
          />
          <ZoomIn className="w-5 h-5 text-white/40" />
        </div>
      </div>
    </div>
  )
}
