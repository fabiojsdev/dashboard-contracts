import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { moeda } from '../utils/formatters'
import {
  contratoAtivoNoMes, diaVencimento, condInquilino,
  calcRepasse, MESES, mesAnoLabel
} from '../utils/calculos'
import {
  AlertTriangle, TrendingUp, Users, FileText,
  CheckCircle, Clock, XCircle, Database, ArrowRight
} from 'lucide-react'
import { useIsMobile } from '../hooks/useIsMobile'

const BADGE = {
  pago:     <span className="badge badge-success">✓ Pago</span>,
  pendente: <span className="badge badge-warning">⏳ Pendente</span>,
  atrasado: <span className="badge badge-danger">⚠ Atrasado</span>,
}

export default function Dashboard() {
  const { state, loadDemo } = useApp()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  const contratosAtivos = state.contratos.filter(c => contratoAtivoNoMes(c, mes, ano))
  const totalAluguel = contratosAtivos.reduce((s, c) => s + c.valorAluguel, 0)
  const totalTaxa = totalAluguel * 0.06
  const totalRepasse = contratosAtivos.reduce((s, c) => {
    const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
    return s + calcRepasse(c.valorAluguel, enc)
  }, 0)

  const pagamentosMes = contratosAtivos.map(contrato => {
    const pg = state.pagamentos.find(p => p.contratoId === contrato.id && p.mes === mes && p.ano === ano)
    const imovel = state.imoveis.find(i => i.id === contrato.imovelId)
    const inquilino = state.inquilinos.find(i => i.id === contrato.inquilinoId)
    const dia = diaVencimento(contrato.dataAssinatura)
    const venc = new Date(ano, mes - 1, dia)
    const status = pg?.status === 'pago' ? 'pago' : (venc < new Date() ? 'atrasado' : 'pendente')
    return { contrato, pg, imovel, inquilino, status, dia }
  })

  const pagos = pagamentosMes.filter(p => p.status === 'pago').length
  const atrasados = pagamentosMes.filter(p => p.status === 'atrasado').length
  const pendentes = pagamentosMes.filter(p => p.status === 'pendente').length
  const hasData = state.contratos.length > 0

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral — {mesAnoLabel(mes, ano)}</p>
        </div>
        <div className="page-header-actions">
          <select className="field-input" style={{ width: isMobile ? undefined : 130 }} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="field-input" style={{ width: isMobile ? undefined : 90 }} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[ano-1, ano, ano+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Demo Banner */}
      {!hasData && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          borderRadius: 12, padding: '20px', marginBottom: 24, color: '#fff',
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            👋 Bem-vinda ao AdminImóveis!
          </div>
          <div style={{ opacity: .8, fontSize: 13, marginBottom: 14 }}>
            Comece cadastrando proprietários, inquilinos e imóveis — ou carregue dados de exemplo para explorar o sistema.
          </div>
          <button className="btn btn-accent" onClick={loadDemo}>
            <Database size={15} /> Carregar dados de exemplo
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Contratos Ativos" value={contratosAtivos.length} icon={<FileText size={18}/>} color="var(--primary)" sub={`de ${state.contratos.length} total`} />
        <StatCard label="Aluguel Bruto" value={moeda(totalAluguel)} icon={<TrendingUp size={18}/>} color="#2d9e6b" sub={mesAnoLabel(mes, ano)} />
        <StatCard label="Taxa Adm (6%)" value={moeda(totalTaxa)} icon={<CheckCircle size={18}/>} color="var(--accent)" sub="sua receita" />
        <StatCard label="Total Repasses" value={moeda(totalRepasse)} icon={<Users size={18}/>} color="#5b6dc8" sub="estimado" />
      </div>

      {/* Main content */}
      <div className="two-col-layout">
        {/* Pagamentos */}
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontSize:16, color:'var(--primary)' }}>Pagamentos — {MESES[mes]}</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pagamentos')}>
              Ver tudo <ArrowRight size={13}/>
            </button>
          </div>

          {pagamentosMes.length === 0 ? (
            <div className="card">
              <div className="empty-state"><FileText size={36}/><p>Nenhum contrato ativo</p></div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Inquilino</th>
                    <th>Vence</th>
                    <th>Aluguel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosMes.map(({ contrato, inquilino, status, dia }) => (
                    <tr key={contrato.id}>
                      <td style={{ fontWeight:500 }}>{inquilino?.nome ?? '–'}</td>
                      <td style={{ fontWeight:600 }}>Dia {dia}</td>
                      <td style={{ fontWeight:600 }}>{moeda(contrato.valorAluguel)}</td>
                      <td>{BADGE[status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <h2 style={{ fontSize:16, color:'var(--primary)' }}>Resumo</h2>

          <SummaryRow icon={<CheckCircle size={15} color="var(--success)"/>} label="Recebidos" value={pagos} cls="badge-success" />
          <SummaryRow icon={<Clock size={15} color="var(--warning)"/>}       label="Aguardando" value={pendentes} cls="badge-warning" />
          <SummaryRow icon={<XCircle size={15} color="var(--danger)"/>}      label="Em atraso" value={atrasados} cls="badge-danger" />

          {atrasados > 0 && (
            <button className="btn btn-danger" onClick={() => navigate('/inadimplencia')}>
              <AlertTriangle size={14}/> Ver inadimplência
            </button>
          )}

          <div className="info-box" style={{ flexDirection:'column', gap:8 }}>
            <div style={{ fontWeight:700, fontSize:11, textTransform:'uppercase', letterSpacing:'.06em', color:'var(--primary)' }}>
              Lançar encargos
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>
              Registre os valores de condomínio deste mês para calcular repasses corretamente.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/encargos')}>
              Ir para Encargos
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.05em', lineHeight:1.3 }}>{label}</div>
        <div style={{ color, opacity:.7, flexShrink:0 }}>{icon}</div>
      </div>
      <div className="stat-value" style={{ fontSize:22, fontWeight:700, color, marginBottom:3, fontFamily:"'Playfair Display',serif" }}>{value}</div>
      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function SummaryRow({ icon, label, value, cls }) {
  return (
    <div className="stat-card" style={{ padding:'11px 14px', display:'flex', alignItems:'center', gap:10 }}>
      {icon}
      <span style={{ flex:1, fontSize:13 }}>{label}</span>
      <span className={`badge ${cls}`} style={{ fontSize:13, padding:'2px 10px' }}>{value}</span>
    </div>
  )
}
