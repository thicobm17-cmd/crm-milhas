import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatMilhas(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value) + ' milhas'
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function calcROI(economia: number, fee: number): number {
  if (fee === 0) return 0
  return ((economia - fee) / fee) * 100
}

export function progressColor(percent: number): string {
  if (percent >= 100) return 'bg-green-500'
  if (percent >= 60) return 'bg-blue-500'
  if (percent >= 30) return 'bg-yellow-500'
  return 'bg-red-400'
}
