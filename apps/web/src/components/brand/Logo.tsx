import { cn } from '@/lib/cn'

/**
 * Marca oficial Amazon Trade. `light` = versão branca (fundos verdes/escuros); padrão = versão verde.
 * Arquivos em /public/img (logo-branca.png, logo-verde.webp). Proporção ≈ 3,1 : 1.
 */
export function Logo({ className, tone = 'brand' }: { className?: string; tone?: 'brand' | 'light'; compact?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === 'light' ? '/img/logo-branca.png' : '/img/logo-verde.webp'}
      alt="Amazon Trade"
      width={310}
      height={100}
      className={cn('h-9 w-auto select-none', className)}
      draggable={false}
    />
  )
}

/** Mantido para usos que pedem só a marca: reaproveita a mesma imagem recortada. */
export const LogoMark = Logo
