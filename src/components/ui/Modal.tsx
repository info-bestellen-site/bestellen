'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-on-surface/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300"
      >
        <div className="flex items-center justify-between p-8 pb-4">
          <h2 className="text-xl font-black tracking-tight">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-8 pt-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
