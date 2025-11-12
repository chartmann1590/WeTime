'use client'
import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'left' | 'right' | 'top' | 'bottom'
}

export function Sheet({ open, onOpenChange, children, side = 'bottom' }: SheetProps) {
  if (!open) return null

  const sideClasses = {
    bottom: 'bottom-0 left-0 right-0 top-auto rounded-t-2xl',
    top: 'top-0 left-0 right-0 bottom-auto rounded-b-2xl',
    left: 'left-0 top-0 bottom-0 right-auto rounded-r-2xl',
    right: 'right-0 top-0 bottom-0 left-auto rounded-l-2xl',
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed z-50 bg-background shadow-lg',
          sideClasses[side],
          side === 'bottom' || side === 'top' ? 'max-h-[90vh] overflow-y-auto' : 'max-w-[90vw] overflow-x-auto'
        )}
      >
        {children}
      </div>
    </>
  )
}

export function SheetHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between p-4 border-b', className)}>
      {children}
    </div>
  )
}

export function SheetTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold', className)}>{children}</h2>
}

export function SheetClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="rounded-md p-1 hover:bg-accent"
      aria-label="Close"
    >
      <X className="h-5 w-5" />
    </button>
  )
}

export function SheetContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>
}

