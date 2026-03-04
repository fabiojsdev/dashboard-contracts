import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { moeda, dataFmt } from '../utils/formatters'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { diaVencimento, contratoAtivoNoMes, MESES, totalInquilino, condInquilino } from '../utils/calculos'
import { useNavigate } from 'react-router-dom'

export default function Inadimplencia() {
  const { state } = useApp()
  const navigate = useNavigate()
  const now = new Date()

  // Busca todos os meses dos últimos 6 meses
  const mesesVerificar = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    mesesVerificar.push({ mes: d.getMonth() + 1, ano: d.getFullYear() })
  }

  // Coleta inadimplências
  const inadimplentes = []
  state.contratos
    .filter(c => c.status === 'ativo')
    .forEach(c => {
      mesesVerificar.forEach(({ mes, ano }) => {
        if (!contratoAtivoNoMes(c, mes, ano)) return
        const pg = state.pagamentos.find(p => p.contratoId === c.id && p.mes === mes && p.ano === ano)
        if (pg?.status === 'pago') return

        const dia = diaVencimento(c.dataAssinatura)
        const venc = new Date(ano, mes - 1, dia)
        if (venc >= now) return // ainda não venceu

        const inquilino = state.inquilinos.find(i => i.id === c.inquilinoId)
        const imovel = state.imoveis.find(i => i.id === c.imovelId)
        const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
        const totalInq = totalInquilino(c.valorAluguel, enc)
        const diasAtraso = Math.floor((now - venc) / (1000 * 60 * 60 * 24))

        inadimplentes.push({
          c, mes, ano, inquilino, imovel, enc, totalInq, diasAtraso, venc,
          status: pg?.status || 'atrasado',
        })
      })
    })

  // Ordena por dias em atraso (maior primeiro)
  inadimplentes.sort((a, b) => b.diasAtraso - a.diasAtraso)

  const totalEmAtraso = inadimplentes.reduce((s, i) => s + i.totalInq, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inadimplência</h1>
          <p className="page-subtitle">Pagamentos em atraso dos últimos 6 meses</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/pagamentos')}>
          Ir para Pagamentos
        </button>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Ocorrências em Atraso</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)', fontFamily: "'Playfair Display'" }}>{inadimplentes.length}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--warning)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Valor Total em Atraso</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--warning)', fontFamily: "'Playfair Display'" }}>{moeda(totalEmAtraso)}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #5b6dc8' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Inquilinos Inadimplentes</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#5b6dc8', fontFamily: "'Playfair Display'" }}>
            {new Set(inadimplentes.map(i => i.c.inquilinoId)).size}
          </div>
        </div>
      </div>

      {inadimplentes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.6 }} />
            <p style={{ color: 'var(--success)' }}>Tudo em dia! 🎉</p>
            <span>Nenhum pagamento em atraso nos últimos 6 meses</span>
          </div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Inquilino</th>
                <th>Imóvel</th>
                <th>Mês Ref.</th>
                <th>Vencimento</th>
                <th>Dias em Atraso</th>
                <th>Aluguel</th>
                <th>Total Devido</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {inadimplentes.map((item, idx) => (
                <tr key={idx} style={{ background: item.diasAtraso > 30 ? 'rgba(192,57,43,0.03)' : undefined }}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{item.inquilino?.nome ?? '–'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.inquilino?.telefone}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{item.imovel?.endereco?.split(',')[0] ?? '–'}</td>
                  <td><span className="badge badge-gray">{MESES[item.mes]}/{item.ano}</span></td>
                  <td style={{ fontSize: 12 }}>{dataFmt(item.venc.toISOString().slice(0,10))}</td>
                  <td>
                    <span className={`badge ${item.diasAtraso > 30 ? 'badge-danger' : 'badge-warning'}`}>
                      <AlertTriangle size={10} style={{ marginRight: 3 }} />
                      {item.diasAtraso} dias
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{moeda(item.c.valorAluguel)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 15 }}>{moeda(item.totalInq)}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => navigate('/pagamentos')}
                    >
                      Registrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orientação */}
      {inadimplentes.length > 0 && (
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'var(--warning-bg)', borderRadius: 8,
          border: '1px solid #f0d090',
          fontSize: 13, color: '#7a5800'
        }}>
          <strong>💡 Dica:</strong> Para registrar o pagamento de um contrato em atraso, acesse a página de{' '}
          <button
            onClick={() => navigate('/pagamentos')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 700, textDecoration: 'underline', fontSize: 13 }}
          >
            Pagamentos
          </button>
          , selecione o mês correspondente e clique em "Pago".
        </div>
      )}
    </div>
  )
}
