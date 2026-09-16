const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const money = (value) => brl.format(value)

// "a partir de R$ 320" vs "R$ 165"
export const priceLabel = (product) => (product.from ? `a partir de ${money(product.price)}` : money(product.price))

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export const formatDateBR = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

// Hoje em data LOCAL, no formato do input[type=date]. Com toISOString a data
// sairia em UTC: depois das 21h em Brasilia o "hoje" ja seria amanha, e o
// seletor passaria a bloquear o dia de hoje.
export const hojeISO = () => {
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export const daysUntil = (iso) => {
  if (!iso) return null
  const target = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.round((target - today) / 86_400_000)
}
