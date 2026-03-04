import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Grid2 } from '../components/FormField'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'

const EMPTY = { nome: '', cpf: '', rg: '', telefone: '', email: '' }

export default function Inquilinos() {
  const { state, dispatch } = useApp()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [search, setSearch] = useState('')

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function openAdd() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(i) { setForm(i); setEditing(i.id); setModal(true) }

  function save() {
    if (!form.nome.trim()) return alert('Nome é obrigatório')
    if (editing) {
      dispatch({ type: 'UPDATE_INQUILINO', payload: { ...form, id: editing } })
    } else {
      dispatch({ type: 'ADD_INQUILINO', payload: form })
    }
    setModal(false)
  }

  function del(id) {
    const hasContrato = state.contratos.some(c => c.inquilinoId === id)
    if (hasContrato) return alert('Não é possível excluir: este inquilino possui contratos vinculados.')
    dispatch({ type: 'DELETE_INQUILINO', payload: id })
    setConfirmDel(null)
  }

  const list = state.inquilinos.filter(i =>
    i.nome.toLowerCase().includes(search.toLowerCase()) ||
    (i.cpf || '').includes(search)
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inquilinos</h1>
          <p className="page-subtitle">{state.inquilinos.length} inquilino(s) cadastrado(s)</p>
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
            <Plus size={15} /> Novo Inquilino
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users size={40} />
            <p>Nenhum inquilino cadastrado</p>
            <span>Clique em "Novo Inquilino" para começar</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>RG</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Contratos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(inq => {
                const contratos = state.contratos.filter(c => c.inquilinoId === inq.id)
                const ativo = contratos.find(c => c.status === 'ativo')
                return (
                  <tr key={inq.id}>
                    <td><div style={{ fontWeight: 600 }}>{inq.nome}</div></td>
                    <td>{inq.cpf || '–'}</td>
                    <td>{inq.rg || '–'}</td>
                    <td>{inq.telefone || '–'}</td>
                    <td>{inq.email || '–'}</td>
                    <td>
                      {ativo
                        ? <span className="badge badge-success">Contrato ativo</span>
                        : contratos.length > 0
                          ? <span className="badge badge-gray">Encerrado</span>
                          : <span className="badge badge-gray">Sem contrato</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(inq)}><Pencil size={15} /></button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(inq)}><Trash2 size={15} /></button>
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
        <Modal
          title={editing ? 'Editar Inquilino' : 'Novo Inquilino'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </>
          }
        >
          <Input label="Nome completo *" value={form.nome} onChange={set('nome')} placeholder="Nome do inquilino" />
          <Grid2>
            <Input label="CPF" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
            <Input label="RG" value={form.rg} onChange={set('rg')} placeholder="00.000.000-0" />
          </Grid2>
          <Grid2>
            <Input label="Telefone / WhatsApp" value={form.telefone} onChange={set('telefone')} placeholder="(11) 9xxxx-xxxx" />
            <Input label="E-mail" value={form.email} onChange={set('email')} type="email" placeholder="email@exemplo.com" />
          </Grid2>
        </Modal>
      )}

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
          <p>Excluir <strong>{confirmDel.nome}</strong>?</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Esta ação não pode ser desfeita.</p>
        </Modal>
      )}
    </div>
  )
}
