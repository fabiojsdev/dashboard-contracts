import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Textarea, Grid2 } from '../components/FormField'
import { CreditCard, CheckCircle, Clock, AlertTriangle, Plus, Pencil } from 'lucide-react'
import { moeda, dataFmt } from '../utils/formatters'
import {
  diaVencimento, condInquilino, calcTaxaAdm,
  calcRepasse, totalInquilino, MESES, contratoAtivoNoMes, today
} from '../utils/calculos'

export default function Pagamentos() {
  const { state, dispatch } = useApp()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ dataPagamento: today(), obs: '' })
  const [alvoContrato, setAlvoContrato] = useState(null)
  const [editing, setEditing] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const contratosAtivos = state.contratos.filter(c => contratoAtivoNoMes(c, mes, ano))

  function getPag(contratoId) {
    return state.pagamentos.find(p => p.contratoId === contratoId && p.mes === mes && p.ano === ano)
  }

  function getStatus(contrato) {
    const pg = getPag(contrato.id)
    if (pg?.status === 'pago') return 'pago'
    const dia = diaVencimento(contrato.dataAssinatura)
    const venc = new Date(ano, mes - 1, dia)
    return venc < new Date() ? 'atrasado' : 'pendente'
  }

  function openMarcarPago(contrato) {
    const pg = getPag(contrato.id)
    setAlvoContrato(contrato)
    setEditing(pg?.id || null)
    setForm({ dataPagamento: pg?.dataPagamento || today(), obs: pg?.obs || '' })
    setModal(true)
  }

  function salvarPagamento() {
    const payload = {
      contratoId: alvoContrato.id,
      mes, ano,
      status: 'pago',
      dataPagamento: form.dataPagamento,
      obs: form.obs,
    }
    if (editing) {
      dispatch({ type: 'UPDATE_PAGAMENTO', payload: { ...payload, id: editing } })
    } else {
      dispatch({ type: 'ADD_PAGAMENTO', payload })
    }
    setModal(false)
  }

  function marcarPendente(contratoId) {
    const pg = getPag(contratoId)
    if (pg) {
      dispatch({ type: 'UPDATE_PAGAMENTO', payload: { ...pg, status: 'pendente', dataPagamento: null } })
    }
  }

  function marcarAtrasado(contratoId) {
    const pg = getPag(contratoId)
    if (pg) {
      dispatch({ type: 'UPDATE_PAGAMENTO', payload: { ...pg, status: 'atrasado', dataPagamento: null } })
    } else {
      dispatch({ type: 'ADD_PAGAMENTO', payload: { contratoId, mes, ano, status: 'atrasado', dataPagamento: null, obs: '' } })
    }
  }

  // Totais
  const totalBruto = contratosAtivos.reduce((s, c) => s + c.valorAluguel, 0)
  const totalTaxa = totalBruto * 0.06
  const totalRepasse = contratosAtivos.reduce((s, c) => {
    const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
    return s + calcRepasse(c.valorAluguel, enc)
  }, 0)
  const totalRecebido = contratosAtivos
    .filter(c => getPag(c.id)?.status === 'pago')
    .reduce((s, c) => {
      const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
      return s + totalInquilino(c.valorAluguel, enc)
    }, 0)

  const BADGE = {
    pago:     <span className="badge badge-success"><CheckCircle size={10} style={{marginRight:3}}/> Pago</span>,
    pendente: <span className="badge badge-warning"><Clock size={10} style={{marginRight:3}}/> Pendente</span>,
    atrasado: <span className="badge badge-danger"><AlertTriangle size={10} style={{marginRight:3}}/> Atrasado</span>,
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pagamentos</h1>
          <p className="page-subtitle">Controle mensal de recebimentos</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="field-input" style={{ width: 130 }} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="field-input" style={{ width: 90 }} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[ano-1, ano, ano+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Totais */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Recebido', value: moeda(totalRecebido), color: '#2d9e6b' },
          { label: 'Aluguel Bruto Total', value: moeda(totalBruto), color: 'var(--primary)' },
          { label: 'Taxa Adm (6%)', value: moeda(totalTaxa), color: 'var(--accent)' },
          { label: 'Total Repasses', value: moeda(totalRepasse), color: '#5b6dc8' },
        ].map(c => (
          <div key={c.label} className="stat-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.color, fontFamily: "'Playfair Display'" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {contratosAtivos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CreditCard size={40} />
            <p>Nenhum contrato ativo neste mês</p>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Imóvel</th>
                <th>Vence dia</th>
                <th>Aluguel</th>
                <th>Cond. (inq.)</th>
                <th>Total Inquilino</th>
                <th>Taxa Adm</th>
                <th>Repasse Prop.</th>
                <th>Pgto Realizado</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {contratosAtivos.map(c => {
                const inquilino = state.inquilinos.find(i => i.id === c.inquilinoId)
                const imovel = state.imoveis.find(i => i.id === c.imovelId)
                const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
                const pg = getPag(c.id)
                const status = pg?.status || getStatus(c)
                const dia = diaVencimento(c.dataAssinatura)
                const condInq = condInquilino(enc)
                const taxa = calcTaxaAdm(c.valorAluguel)
                const repasse = calcRepasse(c.valorAluguel, enc)
                const totalInq = totalInquilino(c.valorAluguel, enc)

                return (
                  <tr key={c.id} style={{ background: status === 'atrasado' ? 'rgba(192,57,43,0.03)' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{inquilino?.nome ?? '–'}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {imovel?.endereco?.split(',')[0] ?? '–'}
                    </td>
                    <td style={{ fontWeight: 700 }}>Dia {dia}</td>
                    <td style={{ fontWeight: 700 }}>{moeda(c.valorAluguel)}</td>
                    <td>
                      {enc
                        ? <span title={`Taxa: ${moeda(enc.taxaCond)} + Água: ${moeda(enc.agua)} + Luz: ${moeda(enc.luz)}`}>{moeda(condInq)}</span>
                        : <span className="badge badge-warning" style={{ fontSize: 10 }}>Sem encargo</span>
                      }
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{moeda(totalInq)}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{moeda(taxa)}</td>
                    <td style={{ fontWeight: 700, color: '#2d9e6b' }}>{moeda(repasse)}</td>
                    <td style={{ fontSize: 12 }}>
                      {pg?.dataPagamento ? dataFmt(pg.dataPagamento) : <span className="text-muted">–</span>}
                    </td>
                    <td>{BADGE[status] || BADGE.pendente}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {status !== 'pago' ? (
                          <button className="btn btn-primary btn-sm" onClick={() => openMarcarPago(c)}>
                            <CheckCircle size={12} /> Pago
                          </button>
                        ) : (
                          <>
                            <button className="btn-icon" onClick={() => openMarcarPago(c)} title="Editar pagamento">
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => marcarPendente(c.id)}>
                              Reverter
                            </button>
                          </>
                        )}
                        {status === 'pendente' && (
                          <button className="btn btn-danger btn-sm" onClick={() => marcarAtrasado(c.id)}>
                            Atrasado
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal marcar pago */}
      {modal && alvoContrato && (
        <Modal
          title="Registrar Pagamento"
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarPagamento}>
                <CheckCircle size={14} /> Confirmar Pagamento
              </button>
            </>
          }
        >
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--info-bg)', borderRadius: 8, fontSize: 13 }}>
            <strong>{state.inquilinos.find(i => i.id === alvoContrato.inquilinoId)?.nome}</strong>
            {' · '}{MESES[mes]}/{ano}
            {' · '}{moeda(alvoContrato.valorAluguel)} (aluguel)
          </div>
          <Grid2>
            <Input
              label="Data do pagamento"
              type="date"
              value={form.dataPagamento}
              onChange={set('dataPagamento')}
            />
          </Grid2>
          <Textarea label="Observações" value={form.obs} onChange={set('obs')} placeholder="Ex: Pago via PIX, comprovante recebido…" />
        </Modal>
      )}
    </div>
  )
}
