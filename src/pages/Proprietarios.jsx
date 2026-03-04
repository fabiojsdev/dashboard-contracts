import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Grid2, SectionTitle } from '../components/FormField'
import { UserRound, Plus, Pencil, Trash2 } from 'lucide-react'
import { dataFmt } from '../utils/formatters'

const EMPTY = {
  nome: '', cpf: '', rg: '', telefone: '', email: '',
  banco: '', agencia: '', conta: '', pix: '',
}

export default function Proprietarios() {
  const { state, dispatch } = useApp()
  const [modal, setModal] = useState(null) // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [search, setSearch] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function openAdd() { setForm(EMPTY); setEditing(null); setModal('form') }
  function openEdit(p) { setForm(p); setEditing(p.id); setModal('form') }

  function save() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    if (editing) {
      dispatch({ type: 'UPDATE_PROPRIETARIO', payload: { ...form, id: editing } })
    } else {
      dispatch({ type: 'ADD_PROPRIETARIO', payload: form })
    }
    setModal(null)
  }

  function del(id) {
    // Verifica imóveis vinculados
    const hasImoveis = state.imoveis.some(i => i.proprietarioId === id)
    if (hasImoveis) return alert('Não é possível excluir: este proprietário possui imóveis cadastrados.')
    dispatch({ type: 'DELETE_PROPRIETARIO', payload: id })
    setConfirmDel(null)
  }

  const list = state.proprietarios.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf || '').includes(search)
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Proprietários</h1>
          <p className="page-subtitle">{state.proprietarios.length} proprietário(s) cadastrado(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field-input"
            placeholder="Buscar por nome ou CPF…"
            style={{ width: 220 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Novo Proprietário
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <UserRound size={40} />
            <p>Nenhum proprietário cadastrado</p>
            <span>Clique em "Novo Proprietário" para começar</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Imóveis</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => {
                const qtdImoveis = state.imoveis.filter(i => i.proprietarioId === p.id).length
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.nome}</div>
                      {p.pix && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PIX: {p.pix}</div>}
                    </td>
                    <td>{p.cpf || '–'}</td>
                    <td>{p.telefone || '–'}</td>
                    <td>{p.email || '–'}</td>
                    <td>
                      <span className={`badge ${qtdImoveis > 0 ? 'badge-info' : 'badge-gray'}`}>
                        {qtdImoveis} imóvel(is)
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(p)} title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(p)} title="Excluir">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal form */}
      {modal === 'form' && (
        <Modal
          title={editing ? 'Editar Proprietário' : 'Novo Proprietário'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </>
          }
        >
          <Grid2>
            <Input label="Nome completo *" value={form.nome} onChange={set('nome')} placeholder="Maria Silva" className="span-2" />
          </Grid2>
          <Grid2>
            <Input label="CPF" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
            <Input label="RG" value={form.rg} onChange={set('rg')} placeholder="00.000.000-0" />
          </Grid2>
          <Grid2>
            <Input label="Telefone" value={form.telefone} onChange={set('telefone')} placeholder="(11) 9xxxx-xxxx" />
            <Input label="E-mail" value={form.email} onChange={set('email')} type="email" placeholder="email@exemplo.com" />
          </Grid2>

          <SectionTitle>Dados Bancários</SectionTitle>
          <Grid2>
            <Input label="Banco" value={form.banco} onChange={set('banco')} placeholder="Ex: Itaú" />
            <Input label="Agência" value={form.agencia} onChange={set('agencia')} placeholder="0000" />
          </Grid2>
          <Grid2>
            <Input label="Conta" value={form.conta} onChange={set('conta')} placeholder="00000-0" />
            <Input label="Chave PIX" value={form.pix} onChange={set('pix')} placeholder="CPF, e-mail, telefone…" />
          </Grid2>
        </Modal>
      )}

      {/* Confirm delete */}
      {confirmDel && (
        <Modal
          title="Confirmar exclusão"
          onClose={() => setConfirmDel(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => del(confirmDel.id)}>Excluir</button>
            </>
          }
        >
          <p>Tem certeza que deseja excluir <strong>{confirmDel.nome}</strong>?</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
            Esta ação não pode ser desfeita.
          </p>
        </Modal>
      )}
    </div>
  )
}
