'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Image from 'next/image'

interface Props {
  src: string
  alt?: string
  id?: string
  children?: ReactNode
  className?: string
  imgClassName?: string
  speed?: number
  priority?: boolean
}

export function ParallaxSection({
  src,
  alt = '',
  id,
  children,
  className = '',
  imgClassName = '',
  speed = 0.3,
  priority = false,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const imgWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    const wrap = imgWrapRef.current
    if (!el || !wrap) return

    const onScroll = () => {
      const rect = el.getBoundingClientRect()
      wrap.style.transform = `translateY(${-rect.top * speed}px)`
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return (
    <section ref={sectionRef} id={id} className={`relative overflow-hidden ${className}`}>
      <div ref={imgWrapRef} className="absolute inset-x-0 -top-[20%] -bottom-[20%]">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className={`object-cover object-center ${imgClassName}`}
        />
      </div>
      {children}
    </section>
  )
}
