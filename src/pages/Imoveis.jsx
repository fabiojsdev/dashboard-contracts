import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Select, Grid2, Grid3 } from '../components/FormField'
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react'

const TIPOS = ['apartamento', 'casa', 'comercial', 'sala', 'galpão', 'outro']
const EMPTY = {
  endereco: '', complemento: '', bairro: '', cidade: 'São Paulo', estado: 'SP',
  tipo: 'apartamento', proprietarioId: '',
  nomeCondominio: '', diaVencCond: ''
}

export default function Imoveis() {
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
    if (!form.endereco.trim()) return alert('Endereço é obrigatório')
    if (!form.proprietarioId) return alert('Selecione um proprietário')
    if (editing) {
      dispatch({ type: 'UPDATE_IMOVEL', payload: { ...form, id: editing } })
    } else {
      dispatch({ type: 'ADD_IMOVEL', payload: form })
    }
    setModal(false)
  }

  function del(id) {
    const hasContrato = state.contratos.some(c => c.imovelId === id)
    if (hasContrato) return alert('Não é possível excluir: este imóvel possui contratos vinculados.')
    dispatch({ type: 'DELETE_IMOVEL', payload: id })
    setConfirmDel(null)
  }

  const list = state.imoveis.filter(i =>
    i.endereco.toLowerCase().includes(search.toLowerCase()) ||
    (i.bairro || '').toLowerCase().includes(search.toLowerCase())
  )

  const TIPO_BADGE = {
    apartamento: 'badge-info',
    casa: 'badge-success',
    comercial: 'badge-warning',
    sala: 'badge-gray',
    'galpão': 'badge-gray',
    outro: 'badge-gray',
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Imóveis</h1>
          <p className="page-subtitle">{state.imoveis.length} imóvel(is) cadastrado(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field-input"
            placeholder="Buscar por endereço ou bairro…"
            style={{ width: 240 }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {state.proprietarios.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--warning)', alignSelf: 'center' }}>
              ⚠ Cadastre um proprietário primeiro
            </span>
          )}
          <button className="btn btn-primary" onClick={openAdd} disabled={state.proprietarios.length === 0}>
            <Plus size={15} /> Novo Imóvel
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 size={40} />
            <p>Nenhum imóvel cadastrado</p>
            <span>Cadastre um proprietário primeiro, depois adicione os imóveis</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Endereço</th>
                <th>Tipo</th>
                <th>Proprietário</th>
                <th>Condomínio</th>
                <th>Venc. Cond.</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(im => {
                const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
                const contrato = state.contratos.find(c => c.imovelId === im.id && c.status === 'ativo')
                return (
                  <tr key={im.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{im.endereco}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {[im.bairro, im.cidade, im.estado].filter(Boolean).join(', ')}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${TIPO_BADGE[im.tipo] || 'badge-gray'}`}>
                        {im.tipo}
                      </span>
                    </td>
                    <td>{prop?.nome ?? <span className="text-danger">Não encontrado</span>}</td>
                    <td>{im.nomeCondominio || <span className="text-muted">–</span>}</td>
                    <td style={{ fontWeight: 600 }}>
                      {im.diaVencCond ? `Dia ${im.diaVencCond}` : '–'}
                    </td>
                    <td>
                      {contrato
                        ? <span className="badge badge-success">Locado</span>
                        : <span className="badge badge-gray">Disponível</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(im)}><Pencil size={15} /></button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(im)}><Trash2 size={15} /></button>
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
          title={editing ? 'Editar Imóvel' : 'Novo Imóvel'}
          onClose={() => setModal(false)}
          size="lg"
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </>
          }
        >
          <Input label="Endereço completo *" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, apartamento…" />
          <Grid2>
            <Input label="Bairro" value={form.bairro} onChange={set('bairro')} placeholder="Bairro" />
            <Input label="Cidade" value={form.cidade} onChange={set('cidade')} placeholder="São Paulo" />
          </Grid2>
          <Grid2>
            <Input label="Estado" value={form.estado} onChange={set('estado')} placeholder="SP" />
            <Select label="Tipo de imóvel" value={form.tipo} onChange={set('tipo')}>
              {TIPOS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </Select>
          </Grid2>
          <Select label="Proprietário *" value={form.proprietarioId} onChange={set('proprietarioId')}>
            <option value="">Selecione…</option>
            {state.proprietarios.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </Select>

          <div className="form-section-title">Condomínio</div>
          <Grid3>
            <Input label="Nome do condomínio" value={form.nomeCondominio} onChange={set('nomeCondominio')} placeholder="Cond. Vitória Régia" />
            <Input label="Dia de vencimento" value={form.diaVencCond} onChange={set('diaVencCond')} type="number" min="1" max="31" placeholder="Ex: 5" />
          </Grid3>
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
          <p>Excluir o imóvel <strong>{confirmDel.endereco}</strong>?</p>
        </Modal>
      )}
    </div>
  )
}
