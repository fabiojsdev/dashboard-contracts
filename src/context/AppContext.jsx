import { createContext, useContext, useReducer, useEffect } from 'react'
import { v4 as uuid } from 'uuid'

// ─── Initial State ───────────────────────────────────────────────────────────
const initialState = {
  proprietarios: [],
  inquilinos: [],
  imoveis: [],
  contratos: [],
  encargos: [],    // lançamentos mensais de condomínio por imóvel
  pagamentos: [],  // registros de pagamento mensal por contrato
}

// ─── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  const { type, payload } = action

  const addItem = (key) => ({ ...state, [key]: [...state[key], { ...payload, id: uuid() }] })
  const updateItem = (key) => ({ ...state, [key]: state[key].map(i => i.id === payload.id ? payload : i) })
  const deleteItem = (key) => ({ ...state, [key]: state[key].filter(i => i.id !== payload) })

  switch (type) {
    case 'ADD_PROPRIETARIO':    return addItem('proprietarios')
    case 'UPDATE_PROPRIETARIO': return updateItem('proprietarios')
    case 'DELETE_PROPRIETARIO': return deleteItem('proprietarios')

    case 'ADD_INQUILINO':    return addItem('inquilinos')
    case 'UPDATE_INQUILINO': return updateItem('inquilinos')
    case 'DELETE_INQUILINO': return deleteItem('inquilinos')

    case 'ADD_IMOVEL':    return addItem('imoveis')
    case 'UPDATE_IMOVEL': return updateItem('imoveis')
    case 'DELETE_IMOVEL': return deleteItem('imoveis')

    case 'ADD_CONTRATO':    return addItem('contratos')
    case 'UPDATE_CONTRATO': return updateItem('contratos')
    case 'DELETE_CONTRATO': return deleteItem('contratos')

    case 'ADD_ENCARGO':    return addItem('encargos')
    case 'UPDATE_ENCARGO': return updateItem('encargos')
    case 'DELETE_ENCARGO': return deleteItem('encargos')

    case 'ADD_PAGAMENTO':    return addItem('pagamentos')
    case 'UPDATE_PAGAMENTO': return updateItem('pagamentos')
    case 'DELETE_PAGAMENTO': return deleteItem('pagamentos')

    case 'LOAD_DEMO': return action.payload
    case 'CLEAR_ALL': return initialState

    default: return state
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    try {
      const saved = localStorage.getItem('imoveisAdminV1')
      return saved ? JSON.parse(saved) : initialState
    } catch {
      return initialState
    }
  })

  useEffect(() => {
    localStorage.setItem('imoveisAdminV1', JSON.stringify(state))
  }, [state])

  // ── Demo data loader ──────────────────────────────────────────────────────
  function loadDemo() {
    const pid1 = uuid(), pid2 = uuid()
    const iid1 = uuid(), iid2 = uuid(), iid3 = uuid()
    const imv1 = uuid(), imv2 = uuid(), imv3 = uuid()
    const c1 = uuid(), c2 = uuid(), c3 = uuid()
    const now = new Date()
    const mes = now.getMonth() + 1
    const ano = now.getFullYear()
    const mesAnterior = mes === 1 ? 12 : mes - 1
    const anoAnterior = mes === 1 ? ano - 1 : ano

    const demoData = {
      proprietarios: [
        { id: pid1, nome: 'Maria Aparecida Silva', cpf: '123.456.789-00', telefone: '(11) 98765-4321', email: 'maria@email.com', banco: 'Itaú', agencia: '1234', conta: '56789-0', pix: 'maria@email.com' },
        { id: pid2, nome: 'José Carlos Ferreira', cpf: '987.654.321-00', telefone: '(11) 91234-5678', email: 'jose@email.com', banco: 'Bradesco', agencia: '4321', conta: '98765-1', pix: '(11) 91234-5678' },
      ],
      inquilinos: [
        { id: iid1, nome: 'Ana Paula Rodrigues', cpf: '111.222.333-44', rg: '12.345.678-9', telefone: '(11) 95555-1111', email: 'ana@email.com' },
        { id: iid2, nome: 'Pedro Henrique Costa', cpf: '555.666.777-88', rg: '98.765.432-1', telefone: '(11) 96666-2222', email: 'pedro@email.com' },
        { id: iid3, nome: 'Luciana Martins', cpf: '999.000.111-22', rg: '55.444.333-2', telefone: '(11) 97777-3333', email: 'luciana@email.com' },
      ],
      imoveis: [
        { id: imv1, endereco: 'Rua das Flores, 123 - Apto 45', bairro: 'Jardim América', cidade: 'São Paulo', estado: 'SP', tipo: 'apartamento', proprietarioId: pid1, nomeCondominio: 'Cond. Vitória Régia', diaVencCond: 5 },
        { id: imv2, endereco: 'Av. Brasil, 456 - Casa', bairro: 'Centro', cidade: 'São Paulo', estado: 'SP', tipo: 'casa', proprietarioId: pid1, nomeCondominio: 'Cond. das Palmeiras', diaVencCond: 10 },
        { id: imv3, endereco: 'Rua São João, 789 - Sala 12', bairro: 'Vila Nova', cidade: 'São Paulo', estado: 'SP', tipo: 'comercial', proprietarioId: pid2, nomeCondominio: 'Ed. Empresarial Plus', diaVencCond: 8 },
      ],
      contratos: [
        { id: c1, imovelId: imv1, inquilinoId: iid1, dataAssinatura: `${ano}-01-23`, valorAluguel: 2500, status: 'ativo', obs: '' },
        { id: c2, imovelId: imv2, inquilinoId: iid2, dataAssinatura: `${ano}-01-15`, valorAluguel: 1800, status: 'ativo', obs: '' },
        { id: c3, imovelId: imv3, inquilinoId: iid3, dataAssinatura: `${anoAnterior}-11-10`, valorAluguel: 3200, status: 'ativo', obs: '' },
      ],
      encargos: [
        { id: uuid(), imovelId: imv1, mes, ano, taxaCond: 652, agua: 70, luz: 80, benfeitorias: 100 },
        { id: uuid(), imovelId: imv2, mes, ano, taxaCond: 320, agua: 45, luz: 30, benfeitorias: 0 },
        { id: uuid(), imovelId: imv3, mes, ano, taxaCond: 480, agua: 60, luz: 90, benfeitorias: 200 },
        { id: uuid(), imovelId: imv1, mes: mesAnterior, ano: anoAnterior, taxaCond: 630, agua: 65, luz: 75, benfeitorias: 100 },
      ],
      pagamentos: [
        { id: uuid(), contratoId: c1, mes, ano, dataPagamento: null, status: 'pendente', obs: '' },
        { id: uuid(), contratoId: c2, mes, ano, dataPagamento: new Date().toISOString().slice(0,10), status: 'pago', obs: '' },
        { id: uuid(), contratoId: c3, mes, ano, dataPagamento: null, status: 'atrasado', obs: 'Inquilino não respondeu' },
        { id: uuid(), contratoId: c1, mes: mesAnterior, ano: anoAnterior, dataPagamento: new Date(ano, mes-2, 25).toISOString().slice(0,10), status: 'pago', obs: '' },
        { id: uuid(), contratoId: c2, mes: mesAnterior, ano: anoAnterior, dataPagamento: new Date(ano, mes-2, 17).toISOString().slice(0,10), status: 'pago', obs: '' },
      ],
    }
    dispatch({ type: 'LOAD_DEMO', payload: demoData })
  }

  return (
    <AppContext.Provider value={{ state, dispatch, loadDemo }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
