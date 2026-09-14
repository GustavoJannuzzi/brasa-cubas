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

// Data minima que o ateliê consegue atender, em formato de input[type=date].
export const minEventDate = (leadDays) => {
  const d = new Date()
  d.setDate(d.getDate() + leadDays)
  return d.toISOString().slice(0, 10)
}

export const daysUntil = (iso) => {
  if (!iso) return null
  const target = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  return Math.round((target - today) / 86_400_000)
}
