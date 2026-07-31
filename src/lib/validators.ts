// Validadores e formatadores por tipo de campo. Puros (sem React), para
// serem usados tanto em máscara "as-you-type" (onChange) quanto em
// validação de submit. Reaproveita formatCNPJ/formatCPF de utils.ts.

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '')
}

// ---- CPF ----------------------------------------------------
export function isValidCPF(raw: string): boolean {
  const cpf = onlyDigits(raw)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const calc = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i)
    const mod = (sum * 10) % 11
    return mod === 10 ? 0 : mod
  }
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10])
}

// ---- CNPJ ---------------------------------------------------
export function isValidCNPJ(raw: string): boolean {
  const cnpj = onlyDigits(raw)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(cnpj[i]) * weights[i]
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13])
}

// ---- Telefone -------------------------------------------------
export function formatPhoneBR(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function isValidPhoneBR(raw: string): boolean {
  const d = onlyDigits(raw)
  return d.length === 10 || d.length === 11
}

/** Validação frouxa para números internacionais (sem máscara fixa, cada
 * país tem um formato diferente) - só garante uma quantidade razoável de dígitos. */
export function isValidPhoneIntl(raw: string): boolean {
  const d = onlyDigits(raw)
  return d.length >= 6 && d.length <= 15
}

// ---- Email ----------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim())
}

// ---- URL --------------------------------------------------------
export function isValidUrl(raw: string): boolean {
  const v = raw.trim()
  if (!v) return true // campo opcional - obrigatoriedade é decidida por quem chama
  try {
    const u = new URL(v.includes('://') ? v : `https://${v}`)
    return !!u.hostname && u.hostname.includes('.')
  } catch {
    return false
  }
}

// ---- NCM (Nomenclatura Comum do Mercosul) ----------------------
export function formatNCM(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8)
  if (d.length <= 4) return d
  if (d.length <= 6) return `${d.slice(0, 4)}.${d.slice(4)}`
  return `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`
}

export function isValidNCM(raw: string): boolean {
  return onlyDigits(raw).length === 8
}

/** Lista de NCMs separados por vírgula (campo de texto livre) - vazio é
 * válido (campo opcional); cada item precisa ter 8 dígitos. */
export function isValidNCMList(raw: string): boolean {
  const v = raw.trim()
  if (!v) return true
  return v.split(',').every((item) => isValidNCM(item))
}

// ---- Protocolo MAPA --------------------------------------------
// Padrão de processo do governo federal: NNNNN.NNNNNN/NNNN-NN
export function formatMapaProtocol(raw: string): string {
  const d = onlyDigits(raw).slice(0, 17)
  if (d.length <= 5) return d
  if (d.length <= 11) return `${d.slice(0, 5)}.${d.slice(5)}`
  if (d.length <= 15) return `${d.slice(0, 5)}.${d.slice(5, 11)}/${d.slice(11)}`
  return `${d.slice(0, 5)}.${d.slice(5, 11)}/${d.slice(11, 15)}-${d.slice(15)}`
}

export function isValidMapaProtocol(raw: string): boolean {
  return onlyDigits(raw).length === 17
}
