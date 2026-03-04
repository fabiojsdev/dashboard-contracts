import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Grid2, SectionTitle } from '../components/FormField'
import { UserRound, Plus, Pencil, Trash2 } from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const EMPTY = { nome:'', cpf:'', rg:'', telefone:'', email:'', banco:'', agencia:'', conta:'', pix:'' }

export default function Proprietarios() {
  const { state, dispatch } = useApp()
  const isMobile = useIsMobile()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [search, setSearch] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function openAdd() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(p) { setForm(p); setEditing(p.id); setModal(true) }

  function save() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    if (editing) dispatch({ type:'UPDATE_PROPRIETARIO', payload:{ ...form, id:editing } })
    else         dispatch({ type:'ADD_PROPRIETARIO',    payload:form })
    setModal(false)
  }

  function del(id) {
    if (state.imoveis.some(i => i.proprietarioId === id))
      return alert('Não é possível excluir: possui imóveis cadastrados.')
    dispatch({ type:'DELETE_PROPRIETARIO', payload:id })
    setConfirmDel(null)
  }

  const list = state.proprietarios.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) || (p.cpf||'').includes(search)
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proprietários</h1>
          <p className="page-subtitle">{state.proprietarios.length} cadastrado(s)</p>
        </div>
        <div className="page-header-actions">
          <input className="field-input search-bar" placeholder="Buscar…" value={search}
            onChange={e => setSearch(e.target.value)} style={{ width: isMobile ? undefined : 200 }} />
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15}/> {isMobile ? 'Novo' : 'Novo Proprietário'}
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <UserRound size={40}/><p>Nenhum proprietário cadastrado</p>
            <span>Toque em "Novo" para começar</span>
          </div>
        </div>
      ) : isMobile ? (
        // ── Mobile: Cards ──────────────────────────────────────────────
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {list.map(p => {
            const qtd = state.imoveis.filter(i => i.proprietarioId === p.id).length
            return (
              <div key={p.id} className="card" style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15 }}>{p.nome}</div>
                    {p.telefone && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{p.telefone}</div>}
                    {p.pix && <div style={{ fontSize:12, color:'var(--text-muted)' }}>PIX: {p.pix}</div>}
                    <div style={{ marginTop:6 }}>
                      <span className={`badge ${qtd > 0 ? 'badge-info' : 'badge-gray'}`}>{qtd} imóvel(is)</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={16}/></button>
                    <button className="btn-icon danger" onClick={() => setConfirmDel(p)}><Trash2 size={16}/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // ── Desktop: Tabela ────────────────────────────────────────────
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th>Imóveis</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => {
                const qtd = state.imoveis.filter(i => i.proprietarioId === p.id).length
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight:600 }}>{p.nome}</div>
                      {p.pix && <div style={{ fontSize:11, color:'var(--text-muted)' }}>PIX: {p.pix}</div>}
                    </td>
                    <td>{p.cpf||'–'}</td><td>{p.telefone||'–'}</td><td>{p.email||'–'}</td>
                    <td><span className={`badge ${qtd>0?'badge-info':'badge-gray'}`}>{qtd} imóvel(is)</span></td>
                    <td>
                      <div style={{ display:'flex', gap:4 }}>
                        <button className="btn-icon" onClick={() => openEdit(p)}><Pencil size={15}/></button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(p)}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <Modal title={editing ? 'Editar Proprietário' : 'Novo Proprietário'} onClose={() => setModal(false)}
          footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={save}>Salvar</button></>}>
          <Input label="Nome completo *" value={form.nome} onChange={set('nome')} placeholder="Maria Silva" />
          <Grid2>
            <Input label="CPF" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
            <Input label="RG" value={form.rg} onChange={set('rg')} placeholder="00.000.000-0" />
          </Grid2>
          <Grid2>
            <Input label="Telefone" value={form.telefone} onChange={set('telefone')} placeholder="(11) 9xxxx-xxxx" />
            <Input label="E-mail" value={form.email} onChange={set('email')} type="email" />
          </Grid2>
          <SectionTitle>Dados Bancários</SectionTitle>
          <Grid2>
            <Input label="Banco" value={form.banco} onChange={set('banco')} placeholder="Ex: Itaú" />
            <Input label="Agência" value={form.agencia} onChange={set('agencia')} placeholder="0000" />
          </Grid2>
          <Grid2>
            <Input label="Conta" value={form.conta} onChange={set('conta')} placeholder="00000-0" />
            <Input label="Chave PIX" value={form.pix} onChange={set('pix')} placeholder="CPF, e-mail, tel…" />
          </Grid2>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Confirmar exclusão" onClose={() => setConfirmDel(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => del(confirmDel.id)}>Excluir</button></>}>
          <p>Excluir <strong>{confirmDel.nome}</strong>? Esta ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  )
}
