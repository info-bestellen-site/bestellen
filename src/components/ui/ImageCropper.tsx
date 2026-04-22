'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { createPortal } from 'react-dom'

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
  aspectRatio = 3 / 2,
  circularCrop = false
}: ImageCropperProps) {
  const { t } = useTranslation()
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
      const img = new Image()
      img.addEventListener('load', () => resolve(img))
      img.addEventListener('error', (error) => reject(error))
      img.setAttribute('crossOrigin', 'anonymous')
      img.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob> => {
    const img = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }

    // We want the final image to EXACTLY match the target aspect ratio
    // If the pixelCrop aspect doesn't match, we add padding
    let targetWidth = pixelCrop.width
    let targetHeight = pixelCrop.height

    const currentAspect = pixelCrop.width / pixelCrop.height
    
    // If the selection is "thinner" than the target aspect ratio, we widen the canvas
    if (currentAspect < aspectRatio) {
      targetWidth = pixelCrop.height * aspectRatio
    } 
    // If the selection is "wider" than the target aspect ratio, we heighten the canvas
    else if (currentAspect > aspectRatio) {
      targetHeight = pixelCrop.width / aspectRatio
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Fill with white background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, targetWidth, targetHeight)

    // Center the image draw
    const destX = (targetWidth - pixelCrop.width) / 2
    const destY = (targetHeight - pixelCrop.height) / 2

    ctx.drawImage(
      img,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      destX,
      destY,
      pixelCrop.width,
      pixelCrop.height
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })

  const onMediaLoaded = (mediaSize: { width: number; height: number }) => {
    setImageSize(mediaSize)
  }

  // Helpers for quick zoom
  const handleFit = () => setZoom(1)
  const handleFill = () => {
    if (!imageSize.width || !imageSize.height) return
    
    // Calculate zoom needed to cover the crop area completely
    const imgAspect = imageSize.width / imageSize.height
    
    if (imgAspect > aspectRatio) {
      // Image is wider than crop area -> zoom based on height
      const zoomNeeded = (imageSize.width / aspectRatio) / imageSize.height
      setZoom(zoomNeeded)
    } else {
      // Image is taller than crop area -> zoom based on width
      const zoomNeeded = imageSize.height * aspectRatio / imageSize.width
      setZoom(zoomNeeded)
    }
  }

  const handleConfirm = async () => {
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels)
      onCropComplete(croppedBlob)
    } catch (e) {
      console.error(e)
    }
  }
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col overflow-hidden"
      style={{ zIndex: 100000 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 sm:px-8 sm:py-5 text-white border-b border-white/5 bg-black/20 shrink-0">
        <button onClick={onCancel} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-all active:scale-95">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 hidden xs:block">
          {t('crop_title')}
        </h2>
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/25"
        >
          <Check className="w-4 h-4" />
          {t('save')}
        </button>
      </div>

      {/* Main Cropper Area */}
      <div className="flex-1 relative bg-black/40">
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
          onMediaLoaded={onMediaLoaded}
          objectFit="contain"
          minZoom={0.5}
          maxZoom={3}
        />
      </div>

      {/* Footer Controls */}
      <div className="p-6 sm:p-10 bg-black/60 backdrop-blur-2xl border-t border-white/5 shrink-0">
        <div className="max-w-md mx-auto space-y-8">
          
          {/* Quick Actions */}
          <div className="flex justify-center gap-3">
            <button 
              onClick={handleFit}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                zoom === 1 ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Minimize2 className="w-3.5 h-3.5" />
              {t('crop_fit')}
            </button>
            <button 
              onClick={handleFill}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                zoom > 1.2 ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {t('crop_fill')}
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-5 sm:gap-8">
            <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="text-white/40 hover:text-white transition-colors">
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="flex-1 relative group">
              <input
                type="range"
                value={zoom}
                min={0.5}
                max={3}
                step={0.01}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary outline-none"
              />
            </div>
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="text-white/40 hover:text-white transition-colors">
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <p className="text-center text-[10px] font-bold text-white/20 uppercase tracking-widest">
            {Math.round(zoom * 100)}% Zoom
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
