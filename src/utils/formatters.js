/** Formata valor como moeda BRL */
export function moeda(valor) {
  if (valor === null || valor === undefined || isNaN(valor)) return 'R$ –'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor))
}

/** Formata data ISO para DD/MM/AAAA */
export function dataFmt(dateStr) {
  if (!dateStr) return '–'
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

/** Formata telefone */
export function telFmt(tel) {
  if (!tel) return '–'
  return tel
}

/** Formata CPF */
export function cpfFmt(cpf) {
  if (!cpf) return '–'
  return cpf
}

/** Abreviação de nome (primeiro + último) */
export function nomeAbrev(nome) {
  if (!nome) return ''
  const partes = nome.trim().split(' ')
  if (partes.length <= 2) return nome
  return `${partes[0]} ${partes[partes.length - 1]}`
}
