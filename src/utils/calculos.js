// ─── Constantes ───────────────────────────────────────────────────────────────
export const TAXA_ADM = 0.06

// ─── Contrato ─────────────────────────────────────────────────────────────────

/** Retorna o dia de vencimento do aluguel (mesmo dia da assinatura) */
export function diaVencimento(dataAssinatura) {
  if (!dataAssinatura) return null
  return parseInt(dataAssinatura.split('-')[2], 10)
}

/** Verifica se um contrato estava ativo em dado mês/ano */
export function contratoAtivoNoMes(contrato, mes, ano) {
  if (contrato.status !== 'ativo') return false
  const [aAno, aMes] = contrato.dataAssinatura.split('-').map(Number)
  // contrato começa a valer no mês seguinte à assinatura
  const inicioMes = aMes === 12 ? 1 : aMes + 1
  const inicioAno = aMes === 12 ? aAno + 1 : aAno
  const dataInicio = new Date(inicioAno, inicioMes - 1, 1)
  const dataMes = new Date(ano, mes - 1, 1)
  return dataMes >= dataInicio
}

// ─── Encargo (Condomínio) ─────────────────────────────────────────────────────

/** Valor que o INQUILINO paga de condomínio (sem benfeitorias) */
export function condInquilino(encargo) {
  if (!encargo) return 0
  return (encargo.taxaCond || 0) + (encargo.agua || 0) + (encargo.luz || 0)
}

/** Valor total do condomínio (incluindo benfeitorias) */
export function condTotal(encargo) {
  if (!encargo) return 0
  return condInquilino(encargo) + (encargo.benfeitorias || 0)
}

// ─── Pagamento / Repasse ──────────────────────────────────────────────────────

/** Taxa de administração (6% do aluguel) */
export function calcTaxaAdm(valorAluguel) {
  return valorAluguel * TAXA_ADM
}

/** Total que o INQUILINO deve pagar no mês */
export function totalInquilino(valorAluguel, encargo) {
  return valorAluguel + condInquilino(encargo)
}

/**
 * Repasse líquido ao PROPRIETÁRIO
 * = Aluguel bruto - Taxa adm + Cond pago pelo inquilino - Benfeitorias
 */
export function calcRepasse(valorAluguel, encargo) {
  const taxaAdm = calcTaxaAdm(valorAluguel)
  const condPagoInquilino = condInquilino(encargo)
  const benfeitorias = encargo ? (encargo.benfeitorias || 0) : 0
  return (valorAluguel - taxaAdm) + condPagoInquilino - benfeitorias
}

// ─── Status de pagamento ──────────────────────────────────────────────────────

/** Verifica se o vencimento já passou */
export function vencimentoPassou(contrato, mes, ano) {
  const dia = diaVencimento(contrato.dataAssinatura)
  if (!dia) return false
  const hoje = new Date()
  const venc = new Date(ano, mes - 1, dia)
  return venc < hoje
}

/** Retorna o status automático de um pagamento */
export function statusPagamento(pagamento, contrato, mes, ano) {
  if (pagamento?.status === 'pago') return 'pago'
  if (vencimentoPassou(contrato, mes, ano)) return 'atrasado'
  return 'pendente'
}

// ─── Helpers de data ──────────────────────────────────────────────────────────
export const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function mesAnoLabel(mes, ano) {
  return `${MESES[mes]} de ${ano}`
}

export function today() {
  return new Date().toISOString().slice(0, 10)
}
