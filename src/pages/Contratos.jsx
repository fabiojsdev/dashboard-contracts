import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Select, Grid2, Textarea } from '../components/FormField'
import { FileText, Plus, Pencil, Trash2, Info } from 'lucide-react'
import { diaVencimento } from '../utils/calculos'
import { moeda, dataFmt } from '../utils/formatters'
import { useIsMobile } from '../hooks/useIsMobile'

const EMPTY = { imovelId:'', inquilinoId:'', dataAssinatura:'', valorAluguel:'', status:'ativo', obs:'' }

export default function Contratos() {
  const { state, dispatch } = useApp()
  const isMobile = useIsMobile()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function openAdd() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(c) { setForm({ ...c, valorAluguel:String(c.valorAluguel) }); setEditing(c.id); setModal(true) }

  function save() {
    if (!form.imovelId) return alert('Selecione um imóvel')
    if (!form.inquilinoId) return alert('Selecione um inquilino')
    if (!form.dataAssinatura) return alert('Data de assinatura é obrigatória')
    if (!form.valorAluguel || isNaN(Number(form.valorAluguel))) return alert('Informe o valor do aluguel')
    const payload = { ...form, valorAluguel: parseFloat(form.valorAluguel) }
    if (editing) dispatch({ type:'UPDATE_CONTRATO', payload:{ ...payload, id:editing } })
    else         dispatch({ type:'ADD_CONTRATO',    payload })
    setModal(false)
  }

  function del(id) {
    const hasPag = state.pagamentos.some(p => p.contratoId === id)
    if (hasPag && !window.confirm('Este contrato possui pagamentos. Excluir mesmo assim?')) return
    dispatch({ type:'DELETE_CONTRATO', payload:id })
    setConfirmDel(null)
  }

  function imoveisDisponiveis() {
    return state.imoveis.filter(im =>
      !state.contratos.find(c => c.imovelId === im.id && c.status === 'ativo' && c.id !== editing)
    )
  }

  const diaVenc = form.dataAssinatura ? diaVencimento(form.dataAssinatura) : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">{state.contratos.filter(c=>c.status==='ativo').length} ativo(s)</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openAdd}
            disabled={state.imoveis.length === 0 || state.inquilinos.length === 0}>
            <Plus size={15}/> {isMobile ? 'Novo' : 'Novo Contrato'}
          </button>
        </div>
      </div>

      {(state.imoveis.length === 0 || state.inquilinos.length === 0) && (
        <div className="warning-box" style={{ marginBottom:16 }}>
          ⚠ Cadastre imóveis e inquilinos antes de criar contratos.
        </div>
      )}

      {state.contratos.length === 0 ? (
        <div className="card">
          <div className="empty-state"><FileText size={40}/><p>Nenhum contrato cadastrado</p></div>
        </div>
      ) : isMobile ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {state.contratos.map(c => {
            const imovel = state.imoveis.find(i => i.id === c.imovelId)
            const inquilino = state.inquilinos.find(i => i.id === c.inquilinoId)
            const dia = diaVencimento(c.dataAssinatura)
            const taxa = c.valorAluguel * 0.06
            return (
              <div key={c.id} className="card" style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{inquilino?.nome ?? '–'}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>
                      {imovel?.endereco?.split(',')[0] ?? '–'}
                    </div>
                    <div style={{ display:'flex', gap:16, marginTop:8, flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>Aluguel</div>
                        <div style={{ fontWeight:700, color:'var(--primary)' }}>{moeda(c.valorAluguel)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>Vence</div>
                        <div style={{ fontWeight:700 }}>Dia {dia}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em' }}>Taxa (6%)</div>
                        <div style={{ fontWeight:600, color:'var(--accent)' }}>{moeda(taxa)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop:8 }}>
                      {c.status === 'ativo'
                        ? <span className="badge badge-success">Ativo</span>
                        : <span className="badge badge-gray">Encerrado</span>
                      }
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={16}/></button>
                    <button className="btn-icon danger" onClick={() => setConfirmDel(c)}><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Imóvel</th><th>Inquilino</th><th>Assinatura</th><th>Vence dia</th><th>Aluguel</th><th>Taxa (6%)</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {state.contratos.map(c => {
                const imovel = state.imoveis.find(i => i.id === c.imovelId)
                const inquilino = state.inquilinos.find(i => i.id === c.inquilinoId)
                const dia = diaVencimento(c.dataAssinatura)
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight:500 }}>{imovel?.endereco?.split(',')[0] ?? '–'}</div>
                      {imovel?.nomeCondominio && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{imovel.nomeCondominio}</div>}
                    </td>
                    <td style={{ fontWeight:500 }}>{inquilino?.nome ?? '–'}</td>
                    <td>{dataFmt(c.dataAssinatura)}</td>
                    <td>
                      <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:'50%', background:'var(--info-bg)', color:'var(--primary)', fontWeight:700 }}>
                        {dia}
                      </div>
                    </td>
                    <td style={{ fontWeight:700, color:'var(--primary)' }}>{moeda(c.valorAluguel)}</td>
                    <td style={{ color:'var(--accent)', fontWeight:600 }}>{moeda(c.valorAluguel*0.06)}</td>
                    <td>{c.status==='ativo' ? <span className="badge badge-success">Ativo</span> : <span className="badge badge-gray">Encerrado</span>}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={15}/></button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(c)}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <Modal title={editing ? 'Editar Contrato' : 'Novo Contrato'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <Select label="Imóvel *" value={form.imovelId} onChange={set('imovelId')}>
            <option value="">Selecione o imóvel…</option>
            {imoveisDisponiveis().map(im => {
              const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
              return <option key={im.id} value={im.id}>{im.endereco} {prop?`(${prop.nome})`:''}</option>
            })}
          </Select>
          <Select label="Inquilino *" value={form.inquilinoId} onChange={set('inquilinoId')}>
            <option value="">Selecione o inquilino…</option>
            {state.inquilinos.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
          </Select>
          <Grid2>
            <Input label="Data de assinatura *" type="date" value={form.dataAssinatura} onChange={set('dataAssinatura')} />
            <Input label="Valor do aluguel (R$) *" type="number" step="0.01" min="0" value={form.valorAluguel} onChange={set('valorAluguel')} placeholder="2500.00" />
          </Grid2>
          {diaVenc && (
            <div className="info-box">
              <Info size={15} color="var(--primary)" style={{ marginTop:1, flexShrink:0 }} />
              <div>
                <strong>Vencimento: dia {diaVenc}</strong>
                <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:2 }}>
                  O aluguel vence sempre no dia {diaVenc} de cada mês.
                </div>
              </div>
            </div>
          )}
          {form.valorAluguel && !isNaN(Number(form.valorAluguel)) && (
            <div style={{ background:'#f0faf6', border:'1px solid #b8e6d0', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13 }}>
              <strong>Taxa de administração (6%):</strong> {moeda(Number(form.valorAluguel)*0.06)}/mês
            </div>
          )}
          <Grid2>
            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
            </Select>
          </Grid2>
          <Textarea label="Observações" value={form.obs} onChange={set('obs')} placeholder="Observações…" />
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => del(confirmDel.id)}>Excluir</button></>}>
          <p>Excluir este contrato?</p>
        </Modal>
      )}
    </div>
  )
}
