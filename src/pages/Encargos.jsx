import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Grid2 } from '../components/FormField'
import { Receipt, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { moeda } from '../utils/formatters'
import { condInquilino, condTotal, MESES, contratoAtivoNoMes } from '../utils/calculos'
import { useIsMobile } from '../hooks/useIsMobile'

const EMPTY = { taxaCond:'', agua:'', luz:'', benfeitorias:'' }

export default function Encargos() {
  const { state, dispatch } = useApp()
  const isMobile = useIsMobile()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [imovelAlvo, setImovelAlvo] = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const n = v => parseFloat(v) || 0

  const imoveisAtivos = state.imoveis.filter(im =>
    state.contratos.find(c => c.imovelId === im.id && contratoAtivoNoMes(c, mes, ano))
  )

  function openAdd(im) { setImovelAlvo(im); setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(enc, im) {
    setImovelAlvo(im)
    setForm({ taxaCond:String(enc.taxaCond||''), agua:String(enc.agua||''), luz:String(enc.luz||''), benfeitorias:String(enc.benfeitorias||'') })
    setEditing(enc.id)
    setModal(true)
  }

  function save() {
    const payload = { imovelId:imovelAlvo.id, mes, ano, taxaCond:n(form.taxaCond), agua:n(form.agua), luz:n(form.luz), benfeitorias:n(form.benfeitorias) }
    if (editing) dispatch({ type:'UPDATE_ENCARGO', payload:{ ...payload, id:editing } })
    else         dispatch({ type:'ADD_ENCARGO',    payload })
    setModal(false)
  }

  function del(id) {
    if (!window.confirm('Excluir este lançamento?')) return
    dispatch({ type:'DELETE_ENCARGO', payload:id })
  }

  const totalCondInq = imoveisAtivos.reduce((s, im) => {
    const enc = state.encargos.find(e => e.imovelId === im.id && e.mes === mes && e.ano === ano)
    return s + condInquilino(enc)
  }, 0)

  const totalBenf = imoveisAtivos.reduce((s, im) => {
    const enc = state.encargos.find(e => e.imovelId === im.id && e.mes === mes && e.ano === ano)
    return s + (enc?.benfeitorias || 0)
  }, 0)

  const prev = { taxaCond:n(form.taxaCond), agua:n(form.agua), luz:n(form.luz), benfeitorias:n(form.benfeitorias) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Encargos</h1>
          <p className="page-subtitle">Lançamentos mensais de condomínio</p>
        </div>
        <div className="page-header-actions">
          <select className="field-input" style={{ width: isMobile ? undefined : 130 }} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="field-input" style={{ width: isMobile ? undefined : 90 }} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[ano-1,ano,ano+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Totais */}
      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="stat-card">
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Cond. Cobrado dos Inquilinos</div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--primary)', fontFamily:"'Playfair Display'" }}>{moeda(totalCondInq)}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Taxa + Água + Luz</div>
        </div>
        <div className="stat-card" style={{ borderLeft:'3px solid var(--warning)' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Benfeitorias (Proprietários)</div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--warning)', fontFamily:"'Playfair Display'" }}>{moeda(totalBenf)}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Resp. dos proprietários</div>
        </div>
      </div>

      {imoveisAtivos.length === 0 ? (
        <div className="card">
          <div className="empty-state"><Receipt size={40}/><p>Nenhum contrato ativo neste mês</p></div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {imoveisAtivos.map(im => {
            const enc = state.encargos.find(e => e.imovelId === im.id && e.mes === mes && e.ano === ano)
            const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
            const hasEnc = !!enc
            return (
              <div key={im.id} className="card" style={{ padding:'16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: hasEnc ? 12 : 0 }}>
                  <div>
                    <div style={{ fontWeight:700 }}>{im.nomeCondominio || im.endereco.split(',')[0]}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{im.endereco.split(',')[0]}</div>
                    {prop && <div style={{ fontSize:11, color:'var(--text-muted)' }}>Prop: {prop.nome}</div>}
                  </div>
                  <div>
                    {hasEnc ? (
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => openEdit(enc, im)}><Pencil size={15}/></button>
                        <button className="btn-icon danger" onClick={() => del(enc.id)}><Trash2 size={15}/></button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => openAdd(im)}>
                        <Plus size={13}/> Lançar
                      </button>
                    )}
                  </div>
                </div>

                {hasEnc && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                    {[
                      { label:'Taxa Cond.', value:moeda(enc.taxaCond), color:'var(--text)' },
                      { label:'Água', value:moeda(enc.agua), color:'var(--text)' },
                      { label:'Luz', value:moeda(enc.luz), color:'var(--text)' },
                      { label:'Benfeitorias', value:moeda(enc.benfeitorias), color:'var(--warning)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ background:'var(--bg)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:3 }}>{label}</div>
                        <div style={{ fontWeight:700, fontSize:13, color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {hasEnc && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)', fontSize:13 }}>
                    <span>
                      <strong style={{ color:'#2d9e6b' }}>{moeda(condInquilino(enc))}</strong>
                      <span style={{ color:'var(--text-muted)', fontSize:12 }}> inquilino paga</span>
                    </span>
                    <span>
                      <strong>{moeda(condTotal(enc))}</strong>
                      <span style={{ color:'var(--text-muted)', fontSize:12 }}> total</span>
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="warning-box" style={{ marginTop:16 }}>
        <AlertCircle size={16} style={{ marginTop:1, flexShrink:0 }} />
        <div>
          <strong>Regra:</strong> Benfeitorias são responsabilidade do proprietário e não são cobradas do inquilino.
        </div>
      </div>

      {modal && imovelAlvo && (
        <Modal
          title={`${editing?'Editar':'Lançar'} — ${imovelAlvo.nomeCondominio||imovelAlvo.endereco.split(',')[0]}`}
          onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}
        >
          <div style={{ marginBottom:14, fontSize:13, color:'var(--text-muted)' }}>
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

          {(n(form.taxaCond)+n(form.agua)+n(form.luz)+n(form.benfeitorias)) > 0 && (
            <div style={{ background:'#f8f6f2', borderRadius:8, padding:14, marginTop:4, fontSize:13 }}>
              <div style={{ fontWeight:700, marginBottom:8, color:'var(--primary)' }}>Resumo</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span>Inquilino paga</span>
                <strong style={{ color:'#2d9e6b' }}>{moeda(condInquilino(prev))}</strong>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span>Benfeitorias (proprietário)</span>
                <strong style={{ color:'var(--warning)' }}>{moeda(n(form.benfeitorias))}</strong>
              </div>
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:6, display:'flex', justifyContent:'space-between' }}>
                <span>Total do condomínio</span>
                <strong>{moeda(condTotal(prev))}</strong>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
