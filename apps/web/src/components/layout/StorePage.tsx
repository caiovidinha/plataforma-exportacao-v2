import type { ReactNode } from 'react'

/** Conteúdo da loja do importador com ~12% de respiro lateral (banners ficam fora, de ponta a ponta). */
export const StorePage = ({ children }: { children: ReactNode }) => <div className="store-gutter py-8">{children}</div>
