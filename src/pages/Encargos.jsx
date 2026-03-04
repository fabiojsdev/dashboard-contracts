import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Grid2, Grid3 } from '../components/FormField'
import { Receipt, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { moeda } from '../utils/formatters'
import { condInquilino, condTotal, MESES, contratoAtivoNoMes } from '../utils/calculos'

const EMPTY_ENC = { taxaCond: '', agua: '', luz: '', benfeitorias: '' }

export default function Encargos() {
  const { state, dispatch } = useApp()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_ENC)
  const [editing, setEditing] = useState(null)   // encargo id
  const [imovelAlvo, setImovelAlvo] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const n = (v) => parseFloat(v) || 0

  // Imóveis com contratos ativos no mês
  const imoveisAtivos = state.imoveis.filter(im => {
    const contrato = state.contratos.find(c => c.imovelId === im.id && contratoAtivoNoMes(c, mes, ano))
    return !!contrato
  })

  function openAdd(im) {
    setImovelAlvo(im)
    setForm(EMPTY_ENC)
    setEditing(null)
    setModal(true)
  }

  function openEdit(enc, im) {
    setImovelAlvo(im)
    setForm({
      taxaCond: String(enc.taxaCond || ''),
      agua: String(enc.agua || ''),
      luz: String(enc.luz || ''),
      benfeitorias: String(enc.benfeitorias || ''),
    })
    setEditing(enc.id)
    setModal(true)
  }

  function save() {
    const payload = {
      imovelId: imovelAlvo.id,
      mes, ano,
      taxaCond: n(form.taxaCond),
      agua: n(form.agua),
      luz: n(form.luz),
      benfeitorias: n(form.benfeitorias),
    }
    if (editing) {
      dispatch({ type: 'UPDATE_ENCARGO', payload: { ...payload, id: editing } })
    } else {
      dispatch({ type: 'ADD_ENCARGO', payload })
    }
    setModal(false)
  }

  function del(id) {
    if (!window.confirm('Excluir este lançamento de condomínio?')) return
    dispatch({ type: 'DELETE_ENCARGO', payload: id })
  }

  // Totais do mês
  const totalCondInquilinos = imoveisAtivos.reduce((s, im) => {
    const enc = state.encargos.find(e => e.imovelId === im.id && e.mes === mes && e.ano === ano)
    return s + condInquilino(enc)
  }, 0)

  const totalBenfeitorias = imoveisAtivos.reduce((s, im) => {
    const enc = state.encargos.find(e => e.imovelId === im.id && e.mes === mes && e.ano === ano)
    return s + (enc?.benfeitorias || 0)
  }, 0)

  const preview = {
    taxaCond: n(form.taxaCond),
    agua: n(form.agua),
    luz: n(form.luz),
    benfeitorias: n(form.benfeitorias),
  }
  const prevInquilino = condInquilino(preview)
  const prevTotal = condTotal(preview)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Encargos de Condomínio</h1>
          <p className="page-subtitle">Lançamentos mensais por imóvel</p>
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

      {/* Totais do mês */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Total Cond. Cobrado dos Inquilinos
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary)', fontFamily: "'Playfair Display'" }}>
            {moeda(totalCondInquilinos)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Taxa + Água + Luz (sem benfeitorias)
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Total Benfeitorias (Proprietários)
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--warning)', fontFamily: "'Playfair Display'" }}>
            {moeda(totalBenfeitorias)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Responsabilidade dos proprietários
          </div>
        </div>
      </div>

      {imoveisAtivos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Receipt size={40} />
            <p>Nenhum contrato ativo neste mês</p>
            <span>Cadastre contratos para lançar encargos</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Imóvel / Condomínio</th>
                <th>Taxa Cond.</th>
                <th>Água</th>
                <th>Luz</th>
                <th>Benfeitorias</th>
                <th>Total Inquilino</th>
                <th>Total Geral</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {imoveisAtivos.map(im => {
                const enc = state.encargos.find(e => e.imovelId === im.id && e.mes === mes && e.ano === ano)
                const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
                const hasEnc = !!enc
                return (
                  <tr key={im.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{im.nomeCondominio || im.endereco.split(',')[0]}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{im.endereco.split(',')[0]}</div>
                      {prop && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Prop: {prop.nome}</div>}
                    </td>
                    <td>{hasEnc ? moeda(enc.taxaCond) : <span style={{ color: 'var(--border)', fontStyle: 'italic' }}>–</span>}</td>
                    <td>{hasEnc ? moeda(enc.agua) : '–'}</td>
                    <td>{hasEnc ? moeda(enc.luz) : '–'}</td>
                    <td>
                      {hasEnc ? (
                        enc.benfeitorias > 0
                          ? <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{moeda(enc.benfeitorias)}</span>
                          : <span className="text-muted">R$ 0,00</span>
                      ) : '–'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#2d9e6b' }}>
                      {hasEnc ? moeda(condInquilino(enc)) : '–'}
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {hasEnc ? moeda(condTotal(enc)) : '–'}
                    </td>
                    <td>
                      {hasEnc ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn-icon" onClick={() => openEdit(enc, im)}><Pencil size={15} /></button>
                          <button className="btn-icon danger" onClick={() => del(enc.id)}><Trash2 size={15} /></button>
                        </div>
                      ) : (
                        <button className="btn btn-primary btn-sm" onClick={() => openAdd(im)}>
                          <Plus size={13} /> Lançar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Nota de rodapé */}
      <div style={{
        marginTop: 16, padding: '12px 16px',
        background: 'var(--warning-bg)', borderRadius: 8,
        border: '1px solid #f0d090',
        display: 'flex', gap: 10, fontSize: 13, color: '#7a5800', alignItems: 'flex-start'
      }}>
        <AlertCircle size={16} style={{ marginTop: 1, flexShrink: 0 }} />
        <div>
          <strong>Regra de benfeitorias:</strong> O inquilino paga apenas taxa condominial, água e luz comuns.
          Benfeitorias são responsabilidade exclusiva do proprietário e são descontadas do repasse.
        </div>
      </div>

      {/* Modal */}
      {modal && imovelAlvo && (
        <Modal
          title={`${editing ? 'Editar' : 'Lançar'} Condomínio — ${imovelAlvo.nomeCondominio || imovelAlvo.endereco.split(',')[0]}`}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </>
          }
        >
          <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            Referente a: <strong>{MESES[mes]} / {ano}</strong>
          </div>

          <Grid2>
            <Input label="Taxa Condominial (R$)" type="number" step="0.01" min="0" value={form.taxaCond} onChange={set('taxaCond')} placeholder="0,00" />
            <Input label="Água (R$)" type="number" step="0.01" min="0" value={form.agua} onChange={set('agua')} placeholder="0,00" />
          </Grid2>
          <Grid2>
            <Input label="Luz (R$)" type="number" step="0.01" min="0" value={form.luz} onChange={set('luz')} placeholder="0,00" />
            <Input label="Benfeitorias (R$) — proprietário" type="number" step="0.01" min="0" value={form.benfeitorias} onChange={set('benfeitorias')} placeholder="0,00" />
          </Grid2>

          {/* Preview */}
          {(n(form.taxaCond) + n(form.agua) + n(form.luz) + n(form.benfeitorias)) > 0 && (
            <div style={{ background: '#f8f6f2', borderRadius: 8, padding: 14, marginTop: 4, fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>Resumo</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Total cobrado do inquilino</span>
                <strong style={{ color: '#2d9e6b' }}>{moeda(prevInquilino)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Benfeitorias (proprietário)</span>
                <strong style={{ color: 'var(--warning)' }}>{moeda(n(form.benfeitorias))}</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                <span>Total geral do condomínio</span>
                <strong>{moeda(prevTotal)}</strong>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
