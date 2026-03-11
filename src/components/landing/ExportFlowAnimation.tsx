'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  TreePine, PackageOpen, Truck, Warehouse,
  FileCheck, FlaskConical, Ship, Globe, DollarSign, CheckCircle2,
} from 'lucide-react'

const STEPS = [
  { icon: TreePine,      label: 'Colheita',        sub: 'Amazônia brasileira',      color: '#6d9e3f' },
  { icon: PackageOpen,   label: 'Embalagem',        sub: 'Processamento e benefício', color: '#c9a07a' },
  { icon: Truck,         label: 'Transporte',       sub: 'Origem ao terminal',        color: '#e8a83a' },
  { icon: Warehouse,     label: 'Terminal',         sub: 'Pesagem e estufagem',       color: '#ab7d52' },
  { icon: FlaskConical,  label: 'Laboratório',      sub: 'Laudo de aflatoxina',       color: '#d4891f' },
  { icon: FileCheck,     label: 'Despachante',      sub: 'Siscomex · DU-E · MAPA',   color: '#8c5e38' },
  { icon: Ship,          label: 'Embarque',         sub: 'Porto de Santos / Belém',   color: '#4a7fa5' },
  { icon: Globe,         label: 'Destino',          sub: 'Rotterdam · Hamburg · NYC', color: '#3a8a6e' },
  { icon: DollarSign,    label: 'Câmbio',           sub: 'Swift · Liquidação',        color: '#5a9e58' },
  { icon: CheckCircle2,  label: 'Concluído',        sub: 'BL · Pagamento liberado',   color: '#e8a83a' },
]

export function ExportFlowAnimation() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (!inView) return
    let i = 0
    const tick = () => {
      setActive(i)
      i++
      if (i < STEPS.length) setTimeout(tick, 800)
    }
    setTimeout(tick, 600)
  }, [inView])

  return (
    <div ref={ref} className="w-full pb-2 space-y-4">

      {/* Linha única de nós */}
      <div className="flex items-center w-full">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          const isActive = active >= i
          return (
            <div key={step.label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              {/* Node */}
              <motion.div
                className="flex flex-col items-center gap-1.5 shrink-0"
                initial={{ opacity: 0, y: 12 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                  style={{
                    borderColor: isActive ? step.color : '#dbcbba',
                    background: isActive ? `${step.color}22` : 'transparent',
                  }}
                  animate={isActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? step.color : '#c9a07a' }} />
                </motion.div>
                <span className="text-[0.5rem] font-bold text-[#584531] uppercase tracking-wide text-center leading-tight w-12">{step.label}</span>
              </motion.div>

              {/* Conector até o próximo nó */}
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-1 relative h-px bg-[#584531]/20 overflow-hidden" style={{ marginBottom: '1.1rem' }}>
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-[#e8a83a]"
                    initial={{ width: '0%' }}
                    animate={{ width: active >= i + 1 ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Barra de progresso geral */}
      <div className="h-px bg-[#584531]/15 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#6d9e3f] to-[#e8a83a] rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: active >= 0 ? `${((active + 1) / STEPS.length) * 100}%` : '0%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>

      {/* Label da etapa ativa */}
      <div className="text-center h-4">
        <AnimatePresence mode="wait">
          {active >= 0 && active < STEPS.length && (
            <motion.p
              key={active}
              className="text-[0.65rem] text-[#584531]/60 tracking-widest uppercase"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
            >
              {STEPS[active].sub}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
