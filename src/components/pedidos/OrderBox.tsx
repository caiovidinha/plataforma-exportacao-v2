'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2, CheckCircle2 } from 'lucide-react'
import { createOrder } from '@/lib/api'
import { formatNumber } from '@/lib/utils'

interface OrderBoxProps {
  offerId: string
  pricePerKgUsd: number
  availableQuantityKg: number
  paymentNote: string
  /** Rótulos i18n resolvidos no server component */
  labels: {
    quantityLabel: string
    estimatedTotal: string
    placeOrder: string
    ordering: string
    orderCreated: string
    orderNote: string
    maxAvailable: string
  }
}

/**
 * Painel de compra a preço fixo (sem barganha). O importador define a
 * quantidade e faz o pedido; o exportador confirma depois em /pedidos.
 */
export function OrderBox({
  offerId,
  pricePerKgUsd,
  availableQuantityKg,
  paymentNote,
  labels,
}: OrderBoxProps) {
  const router = useRouter()
  const [quantity, setQuantity] = useState<number>(Math.min(1000, availableQuantityKg))
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const total = quantity > 0 ? quantity * pricePerKgUsd : 0
  const invalid = quantity <= 0 || quantity > availableQuantityKg

  async function handleOrder() {
    if (invalid || submitting) return
    setSubmitting(true)
    try {
      const order = await createOrder({ offer_id: offerId, quantity_kg: quantity })
      setDone(true)
      setTimeout(() => router.push(`/pedidos?created=${order.id}`), 700)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Quantidade */}
      <div className="space-y-1">
        <label className="text-xs text-[#584531]/70">{labels.quantityLabel}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={availableQuantityKg}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border border-[#3e2e1e]/20 bg-white px-3 py-2 text-sm text-[#3e2e1e] focus:outline-none focus:border-[#584531]"
          />
          <span className="text-xs text-[#584531] font-medium">kg</span>
        </div>
        <p className="text-[11px] text-[#584531]/60">
          {labels.maxAvailable}: {formatNumber(availableQuantityKg)} kg
        </p>
      </div>

      {/* Total */}
      <div className="bg-[#584531]/10 border border-[#584531]/20 px-3 py-2.5">
        <p className="text-xs text-[#584531] mb-0.5">{labels.estimatedTotal}</p>
        <p className="font-display font-bold text-[#3e2e1e] text-lg">
          USD {formatNumber(+total.toFixed(2))}
        </p>
      </div>

      <button
        type="button"
        onClick={handleOrder}
        disabled={invalid || submitting || done}
        className="btn-primary w-full justify-center disabled:opacity-60"
      >
        {done ? (
          <>
            <CheckCircle2 className="w-4 h-4" /> {labels.orderCreated}
          </>
        ) : submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> {labels.ordering}
          </>
        ) : (
          <>
            <ShoppingCart className="w-4 h-4" /> {labels.placeOrder}
          </>
        )}
      </button>
      <p className="text-xs text-[#584531]/60 text-center">{labels.orderNote}</p>
      <p className="text-[11px] text-[#584531]/50 text-center">{paymentNote}</p>
    </div>
  )
}
