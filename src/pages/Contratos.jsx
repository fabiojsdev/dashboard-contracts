import { useState } from 'react'
import { useApp } from '../context/AppContext'
import Modal from '../components/Modal'
import { Input, Select, Grid2, Textarea } from '../components/FormField'
import { FileText, Plus, Pencil, Trash2, Info } from 'lucide-react'
import { diaVencimento } from '../utils/calculos'
import { moeda, dataFmt } from '../utils/formatters'

const EMPTY = {
  imovelId: '', inquilinoId: '',
  dataAssinatura: '', valorAluguel: '',
  status: 'ativo', obs: ''
}

export default function Contratos() {
  const { state, dispatch } = useApp()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function openAdd() { setForm(EMPTY); setEditing(null); setModal(true) }
  function openEdit(c) { setForm({ ...c, valorAluguel: String(c.valorAluguel) }); setEditing(c.id); setModal(true) }

  function save() {
    if (!form.imovelId) return alert('Selecione um imóvel')
    if (!form.inquilinoId) return alert('Selecione um inquilino')
    if (!form.dataAssinatura) return alert('Data de assinatura é obrigatória')
    if (!form.valorAluguel || isNaN(Number(form.valorAluguel))) return alert('Informe o valor do aluguel')

    const payload = { ...form, valorAluguel: parseFloat(form.valorAluguel) }

    if (editing) {
      dispatch({ type: 'UPDATE_CONTRATO', payload: { ...payload, id: editing } })
    } else {
      dispatch({ type: 'ADD_CONTRATO', payload })
    }
    setModal(false)
  }

  function del(id) {
    const hasPag = state.pagamentos.some(p => p.contratoId === id)
    if (hasPag) {
      if (!window.confirm('Este contrato possui pagamentos registrados. Excluir mesmo assim?')) return
    }
    dispatch({ type: 'DELETE_CONTRATO', payload: id })
    setConfirmDel(null)
  }

  // Imóveis disponíveis (sem contrato ativo, exceto o que está sendo editado)
  function imoveisDisponiveis() {
    return state.imoveis.filter(im => {
      const contratoAtivo = state.contratos.find(c =>
        c.imovelId === im.id && c.status === 'ativo' && c.id !== editing
      )
      return !contratoAtivo
    })
  }

  const diaVenc = form.dataAssinatura ? diaVencimento(form.dataAssinatura) : null

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contratos</h1>
          <p className="page-subtitle">{state.contratos.filter(c => c.status === 'ativo').length} contrato(s) ativo(s)</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(state.imoveis.length === 0 || state.inquilinos.length === 0) && (
            <span style={{ fontSize: 12, color: 'var(--warning)', alignSelf: 'center' }}>
              ⚠ Cadastre imóveis e inquilinos primeiro
            </span>
          )}
          <button
            className="btn btn-primary"
            onClick={openAdd}
            disabled={state.imoveis.length === 0 || state.inquilinos.length === 0}
          >
            <Plus size={15} /> Novo Contrato
          </button>
        </div>
      </div>

      {state.contratos.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={40} />
            <p>Nenhum contrato cadastrado</p>
            <span>Adicione imóveis e inquilinos antes de criar contratos</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Imóvel</th>
                <th>Inquilino</th>
                <th>Assinatura</th>
                <th>Dia Venc.</th>
                <th>Aluguel</th>
                <th>Taxa Adm (6%)</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {state.contratos.map(c => {
                const imovel = state.imoveis.find(i => i.id === c.imovelId)
                const inquilino = state.inquilinos.find(i => i.id === c.inquilinoId)
                const dia = diaVencimento(c.dataAssinatura)
                const taxa = c.valorAluguel * 0.06
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {imovel?.endereco?.split(',')[0] ?? <span className="text-danger">Imóvel não encontrado</span>}
                      </div>
                      {imovel?.nomeCondominio && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{imovel.nomeCondominio}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {inquilino?.nome ?? <span className="text-danger">Não encontrado</span>}
                    </td>
                    <td>{dataFmt(c.dataAssinatura)}</td>
                    <td>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--info-bg)', color: 'var(--primary)',
                        fontWeight: 700, fontSize: 14
                      }}>
                        {dia}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{moeda(c.valorAluguel)}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{moeda(taxa)}</td>
                    <td>
                      {c.status === 'ativo'
                        ? <span className="badge badge-success">Ativo</span>
                        : <span className="badge badge-gray">Encerrado</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEdit(c)}><Pencil size={15} /></button>
                        <button className="btn-icon danger" onClick={() => setConfirmDel(c)}><Trash2 size={15} /></button>
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
          title={editing ? 'Editar Contrato' : 'Novo Contrato'}
          onClose={() => setModal(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Salvar</button>
            </>
          }
        >
          <Select label="Imóvel *" value={form.imovelId} onChange={set('imovelId')}>
            <option value="">Selecione o imóvel…</option>
            {imoveisDisponiveis().map(im => {
              const prop = state.proprietarios.find(p => p.id === im.proprietarioId)
              return (
                <option key={im.id} value={im.id}>
                  {im.endereco} {prop ? `(${prop.nome})` : ''}
                </option>
              )
            })}
          </Select>

          <Select label="Inquilino *" value={form.inquilinoId} onChange={set('inquilinoId')}>
            <option value="">Selecione o inquilino…</option>
            {state.inquilinos.map(i => (
              <option key={i.id} value={i.id}>{i.nome}</option>
            ))}
          </Select>

          <Grid2>
            <Input
              label="Data de assinatura *"
              type="date"
              value={form.dataAssinatura}
              onChange={set('dataAssinatura')}
            />
            <Input
              label="Valor do aluguel (R$) *"
              type="number"
              step="0.01"
              min="0"
              value={form.valorAluguel}
              onChange={set('valorAluguel')}
              placeholder="2500.00"
            />
          </Grid2>

          {/* Preview do dia de vencimento */}
          {diaVenc && (
            <div style={{
              background: 'var(--info-bg)', border: '1px solid #c5d7ea',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13
            }}>
              <Info size={15} color="var(--primary)" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <strong>Dia de vencimento: {diaVenc}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                  O primeiro aluguel vencerá 30 dias após a assinatura. Os seguintes vencem sempre no dia {diaVenc} de cada mês.
                </div>
              </div>
            </div>
          )}

          {form.valorAluguel && !isNaN(Number(form.valorAluguel)) && (
            <div style={{
              background: '#f0faf6', border: '1px solid #b8e6d0',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13
            }}>
              <strong>Taxa de administração (6%):</strong>{' '}
              {moeda(Number(form.valorAluguel) * 0.06)}/mês
            </div>
          )}

          <Grid2>
            <Select label="Status" value={form.status} onChange={set('status')}>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
            </Select>
          </Grid2>
          <Textarea label="Observações" value={form.obs} onChange={set('obs')} placeholder="Observações sobre o contrato…" />
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
          <p>Excluir contrato de <strong>{state.inquilinos.find(i => i.id === confirmDel.inquilinoId)?.nome}</strong>?</p>
        </Modal>
      )}
    </div>
  )
}
