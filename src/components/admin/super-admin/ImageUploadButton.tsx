'use client'

import React, { useState, useRef } from 'react'
import { Upload, Loader2, ImageIcon, Trash2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ImageCropper } from '@/components/ui/ImageCropper'

interface ImageUploadButtonProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string | null
  bucket?: string
  folder?: string
  className?: string
  label?: string
}

export function ImageUploadButton({
  onUploadComplete,
  currentImageUrl,
  bucket = 'product-images', // Force-recompile-v5 (Targeting product-images)
  folder = 'templates',
  className = '',
  label = 'Bild hochladen'
}: ImageUploadButtonProps) {
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true)
    setImageToCrop(null)
    setSuccess(false)

    try {
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`
      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      console.info('🚀 Image published at:', publicUrl)
      onUploadComplete(publicUrl)
      setSuccess(true)

      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload fehlgeschlagen. Bitte erneut versuchen.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-4">
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed transition-all ${
            isUploading 
              ? 'bg-slate-50 border-slate-200 cursor-not-allowed' 
              : success
                ? 'bg-success/5 border-success/20 text-success'
                : 'bg-slate-50 border-slate-200 hover:border-primary/30 hover:bg-white text-slate-500 hover:text-primary'
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest">
            {isUploading ? 'Wird hochgeladen...' : success ? 'Hochgeladen' : label}
          </span>
        </button>

        {currentImageUrl && (
          <div className="relative group w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <img src={currentImageUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </div>

      {imageToCrop && (
        <ImageCropper 
          image={imageToCrop}
          aspectRatio={3/2}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
        />
      )}
    </div>
  )
}
