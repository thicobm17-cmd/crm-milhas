'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export function CheckinButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function marcar() {
    setLoading(true)
    await fetch('/api/produtos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'checkin' }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button size="sm" variant="outline" onClick={marcar} disabled={loading}>
      <CheckCircle2 size={14} className="mr-1" /> {loading ? '...' : 'Realizado'}
    </Button>
  )
}
