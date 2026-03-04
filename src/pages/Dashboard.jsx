import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { moeda, dataFmt } from '../utils/formatters'
import {
  contratoAtivoNoMes, diaVencimento, condInquilino,
  calcTaxaAdm, calcRepasse, MESES, mesAnoLabel, totalInquilino
} from '../utils/calculos'
import {
  AlertTriangle, TrendingUp, Users, FileText,
  CheckCircle, Clock, XCircle, Database, ArrowRight
} from 'lucide-react'

const BADGE = {
  pago: <span className="badge badge-success">✓ Pago</span>,
  pendente: <span className="badge badge-warning">⏳ Pendente</span>,
  atrasado: <span className="badge badge-danger">⚠ Atrasado</span>,
}

export default function Dashboard() {
  const { state, loadDemo } = useApp()
  const navigate = useNavigate()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  const contratosAtivos = state.contratos.filter(c =>
    contratoAtivoNoMes(c, mes, ano)
  )

  const totalAluguel = contratosAtivos.reduce((s, c) => s + c.valorAluguel, 0)
  const totalTaxa = totalAluguel * 0.06

  // Pagamentos do mês
  const pagamentosMes = contratosAtivos.map(contrato => {
    const pg = state.pagamentos.find(p => p.contratoId === contrato.id && p.mes === mes && p.ano === ano)
    const imovel = state.imoveis.find(i => i.id === contrato.imovelId)
    const inquilino = state.inquilinos.find(i => i.id === contrato.inquilinoId)
    const encargo = state.encargos.find(e => e.imovelId === contrato.imovelId && e.mes === mes && e.ano === ano)
    const dia = diaVencimento(contrato.dataAssinatura)
    const hoje = new Date()
    const venc = new Date(ano, mes - 1, dia)
    const status = pg?.status === 'pago' ? 'pago' : (venc < hoje ? 'atrasado' : 'pendente')
    return { contrato, pg, imovel, inquilino, encargo, status, dia }
  })

  const pagos = pagamentosMes.filter(p => p.status === 'pago').length
  const atrasados = pagamentosMes.filter(p => p.status === 'atrasado').length
  const pendentes = pagamentosMes.filter(p => p.status === 'pendente').length

  const totalRepasse = contratosAtivos.reduce((s, c) => {
    const encargo = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
    return s + calcRepasse(c.valorAluguel, encargo)
  }, 0)

  const hasData = state.contratos.length > 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do mês selecionado</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            className="field-input"
            style={{ width: 130 }}
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
          >
            {MESES.slice(1).map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            className="field-input"
            style={{ width: 90 }}
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
          >
            {[ano - 1, ano, ano + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Demo banner */}
      {!hasData && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%)',
          borderRadius: 12, padding: '20px 24px', marginBottom: 24,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
              👋 Bem-vinda ao AdminImóveis!
            </div>
            <div style={{ opacity: 0.8, fontSize: 13 }}>
              Comece cadastrando proprietários, inquilinos e imóveis — ou carregue dados de exemplo para explorar o sistema.
            </div>
          </div>
          <button className="btn btn-accent" onClick={loadDemo} style={{ flexShrink: 0 }}>
            <Database size={15} /> Carregar dados de exemplo
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Contratos Ativos"
          value={contratosAtivos.length}
          icon={<FileText size={20} />}
          color="var(--primary)"
          sub={`de ${state.contratos.length} total`}
        />
        <StatCard
          label="Aluguel Bruto"
          value={moeda(totalAluguel)}
          icon={<TrendingUp size={20} />}
          color="#2d9e6b"
          sub={mesAnoLabel(mes, ano)}
        />
        <StatCard
          label="Taxa de Adm (6%)"
          value={moeda(totalTaxa)}
          icon={<CheckCircle size={20} />}
          color="var(--accent)"
          sub="receita da administradora"
        />
        <StatCard
          label="Total a Repassar"
          value={moeda(totalRepasse)}
          icon={<Users size={20} />}
          color="#5b6dc8"
          sub="estimado aos proprietários"
        />
      </div>

      {/* Status de pagamentos */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, color: 'var(--primary)' }}>
              Pagamentos — {mesAnoLabel(mes, ano)}
            </h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/pagamentos')}>
              Ver tudo <ArrowRight size={13} />
            </button>
          </div>

          {pagamentosMes.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <FileText size={36} />
                <p>Nenhum contrato ativo neste mês</p>
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Inquilino</th>
                    <th>Imóvel</th>
                    <th>Vence dia</th>
                    <th>Aluguel</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosMes.map(({ contrato, inquilino, imovel, status, dia }) => (
                    <tr key={contrato.id}>
                      <td style={{ fontWeight: 500 }}>{inquilino?.nome ?? '–'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {imovel?.endereco?.split(',')[0] ?? '–'}
                      </td>
                      <td style={{ fontWeight: 600 }}>Dia {dia}</td>
                      <td style={{ fontWeight: 600 }}>{moeda(contrato.valorAluguel)}</td>
                      <td>{BADGE[status]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo lateral */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontSize: 16, color: 'var(--primary)', marginBottom: 0 }}>Resumo do Mês</h2>

          <SummaryRow icon={<CheckCircle size={16} color="var(--success)" />} label="Pagamentos recebidos" value={pagos} badge="badge-success" />
          <SummaryRow icon={<Clock size={16} color="var(--warning)" />} label="Aguardando pagamento" value={pendentes} badge="badge-warning" />
          <SummaryRow icon={<XCircle size={16} color="var(--danger)" />} label="Em atraso" value={atrasados} badge="badge-danger" />

          {atrasados > 0 && (
            <button
              className="btn btn-danger"
              style={{ marginTop: 4 }}
              onClick={() => navigate('/inadimplencia')}
            >
              <AlertTriangle size={15} /> Ver inadimplência
            </button>
          )}

          <div style={{ marginTop: 8, padding: 16, background: 'var(--info-bg)', borderRadius: 10, border: '1px solid #c5d7ea' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 10 }}>
              Lançar encargos
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
              Lembre-se de registrar os valores de condomínio deste mês para calcular corretamente os repasses.
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{ color, opacity: 0.7 }}>{icon}</div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginBottom: 4, fontFamily: "'Playfair Display', serif" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  )
}

function SummaryRow({ icon, label, value, badge }) {
  return (
    <div className="stat-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {icon}
      <span style={{ flex: 1, fontSize: 13 }}>{label}</span>
      <span className={`badge ${badge}`} style={{ fontSize: 14, padding: '2px 10px' }}>{value}</span>
    </div>
  )
}
