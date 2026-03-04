import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Select, Grid2, Grid3 } from '../components/FormField'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const TIPOS = ['apartamento','casa','comercial','sala','galpão','outro']
const EMPTY = { endereco:'', bairro:'', cidade:'São Paulo', estado:'SP', tipo:'apartamento', proprietarioId:'', nomeCondominio:'', diaVencCond:'' }

export default function Imoveis() {
  const { state, dispatch } = useApp()
  const isMobile = useIsMobile()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [search, setSearch] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function openAdd() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(i) { setForm(i); setEditing(i.id); setModal(true) }

  function save() {
    if (!form.endereco.trim()) return alert('Endereço é obrigatório')
    if (!form.proprietarioId) return alert('Selecione um proprietário')
    if (editing) dispatch({ type:'UPDATE_IMOVEL', payload:{ ...form, id:editing } })
    else         dispatch({ type:'ADD_IMOVEL',    payload:form })
    setModal(false)
  }

  function del(id) {
    if (state.contratos.some(c => c.imovelId === id))
      return alert('Não é possível excluir: possui contratos vinculados.')
    dispatch({ type:'DELETE_IMOVEL', payload:id })
    setConfirmDel(null)
  }

  const list = state.imoveis.filter(i =>
    i.endereco.toLowerCase().includes(search.toLowerCase()) ||
    (i.bairro||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Imóveis</h1>
          <p className="page-subtitle">{state.imoveis.length} cadastrado(s)</p>
        </div>
        <div className="page-header-actions">
          <input className="field-input search-bar" placeholder="Buscar…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: isMobile ? undefined : 200 }} />
          <button className="btn btn-primary" onClick={openAdd} disabled={state.proprietarios.length === 0}>
            <Plus size={15}/> {isMobile ? 'Novo' : 'Novo Imóvel'}
          </button>
        </div>
      </div>

      {state.proprietarios.length === 0 && (
        <div className="warning-box" style={{ marginBottom:16 }}>
          ⚠ Cadastre um proprietário primeiro antes de adicionar imóveis.
        </div>
      )}

      {list.length === 0 ? (
        <div className="card">
          <div className="empty-state"><Building2 size={40}/><p>Nenhum imóvel cadastrado</p></div>
        </div>
      ) : isMobile ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {list.map(im => {
            const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
            const contrato = state.contratos.find(c => c.imovelId === im.id && c.status === 'ativo')
            return (
              <div key={im.id} className="card" style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, marginBottom:2 }}>{im.endereco}</div>
                    {im.bairro && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{im.bairro}, {im.cidade}</div>}
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{prop?.nome}</div>
                    {im.nomeCondominio && (
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {im.nomeCondominio} · Vence dia {im.diaVencCond}
                      </div>
                    )}
                    <div style={{ marginTop:6, display:'flex', gap:6, flexWrap:'wrap' }}>
                      <span className="badge badge-info">{im.tipo}</span>
                      {contrato
                        ? <span className="badge badge-success">Locado</span>
                        : <span className="badge badge-gray">Disponível</span>
                      }
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    <button className="btn-icon" onClick={() => openEdit(im)}><Pencil size={16}/></button>
                    <button className="btn-icon danger" onClick={() => setConfirmDel(im)}><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Endereço</th><th>Tipo</th><th>Proprietário</th><th>Condomínio</th><th>Venc.</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {list.map(im => {
                const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
                const contrato = state.contratos.find(c => c.imovelId === im.id && c.status === 'ativo')
                return (
                  <tr key={im.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{im.endereco}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{im.bairro}, {im.cidade}</div>
                    </td>
                    <td><span className="badge badge-info">{im.tipo}</span></td>
                    <td>{prop?.nome ?? '–'}</td>
                    <td>{im.nomeCondominio || '–'}</td>
                    <td style={{ fontWeight:600 }}>{im.diaVencCond ? `Dia ${im.diaVencCond}` : '–'}</td>
                    <td>{contrato ? <span className="badge badge-success">Locado</span> : <span className="badge badge-gray">Disponível</span>}</td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => openEdit(im)}><Pencil size={15}/></button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(im)}><Trash2 size={15}/></button>
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
        <Modal title={editing ? 'Editar Imóvel' : 'Novo Imóvel'} onClose={() => setModal(false)} size="lg"
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <Input label="Endereço completo *" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, apto…" />
          <Grid2>
            <Input label="Bairro" value={form.bairro} onChange={set('bairro')} />
            <Input label="Cidade" value={form.cidade} onChange={set('cidade')} />
          </Grid2>
          <Grid2>
            <Input label="Estado" value={form.estado} onChange={set('estado')} placeholder="SP" />
            <Select label="Tipo" value={form.tipo} onChange={set('tipo')}>
              {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </Select>
          </Grid2>
          <Select label="Proprietário *" value={form.proprietarioId} onChange={set('proprietarioId')}>
            <option value="">Selecione…</option>
            {state.proprietarios.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </Select>
          <div className="form-section-title">Condomínio</div>
          <Grid2>
            <Input label="Nome do condomínio" value={form.nomeCondominio} onChange={set('nomeCondominio')} placeholder="Cond. Vitória Régia" />
            <Input label="Dia de vencimento" value={form.diaVencCond} onChange={set('diaVencCond')} type="number" min="1" max="31" placeholder="Ex: 5" />
          </Grid2>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => del(confirmDel.id)}>Excluir</button></>}>
          <p>Excluir o imóvel <strong>{confirmDel.endereco}</strong>?</p>
        </Modal>
      )}
    </div>
  )
}
