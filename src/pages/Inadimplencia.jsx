import { useApp } from '../context/AppContext'
import { moeda, dataFmt } from '../utils/formatters'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { diaVencimento, contratoAtivoNoMes, MESES, totalInquilino } from '../utils/calculos'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Inadimplencia() {
  const { state } = useApp()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const now = new Date()

  const mesesVerificar = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    mesesVerificar.push({ mes: d.getMonth() + 1, ano: d.getFullYear() })
  }

  const inadimplentes = []
  state.contratos.filter(c => c.status === 'ativo').forEach(c => {
    mesesVerificar.forEach(({ mes, ano }) => {
      if (!contratoAtivoNoMes(c, mes, ano)) return
      const pg = state.pagamentos.find(p => p.contratoId === c.id && p.mes === mes && p.ano === ano)
      if (pg?.status === 'pago') return
      const dia = diaVencimento(c.dataAssinatura)
      const venc = new Date(ano, mes - 1, dia)
      if (venc >= now) return
      const inquilino = state.inquilinos.find(i => i.id === c.inquilinoId)
      const imovel = state.imoveis.find(i => i.id === c.imovelId)
      const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
      const totalInq = totalInquilino(c.valorAluguel, enc)
      const diasAtraso = Math.floor((now - venc) / (1000 * 60 * 60 * 24))
      inadimplentes.push({ c, mes, ano, inquilino, imovel, totalInq, diasAtraso, venc })
    })
  })

  inadimplentes.sort((a, b) => b.diasAtraso - a.diasAtraso)

  const totalEmAtraso = inadimplentes.reduce((s, i) => s + i.totalInq, 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inadimplência</h1>
          <p className="page-subtitle">Últimos 6 meses</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/pagamentos')}>
          Registrar Pagamentos
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:20 }}>
        <div className="stat-card" style={{ borderLeft:'3px solid var(--danger)' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Em Atraso</div>
          <div style={{ fontSize:26, fontWeight:700, color:'var(--danger)', fontFamily:"'Playfair Display'" }}>{inadimplentes.length}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>ocorrências</div>
        </div>
        <div className="stat-card" style={{ borderLeft:'3px solid var(--warning)' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Valor Total</div>
          <div style={{ fontSize:isMobile?18:22, fontWeight:700, color:'var(--warning)', fontFamily:"'Playfair Display'" }}>{moeda(totalEmAtraso)}</div>
        </div>
        <div className="stat-card" style={{ borderLeft:'3px solid #5b6dc8' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Inquilinos</div>
          <div style={{ fontSize:26, fontWeight:700, color:'#5b6dc8', fontFamily:"'Playfair Display'" }}>
            {new Set(inadimplentes.map(i => i.c.inquilinoId)).size}
          </div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>inadimplentes</div>
        </div>
        <div className="stat-card" style={{ background:'var(--success-bg)', borderLeft:'3px solid var(--success)' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--success)', textTransform:'uppercase', marginBottom:8 }}>Em dia</div>
          <div style={{ fontSize:26, fontWeight:700, color:'var(--success)', fontFamily:"'Playfair Display'" }}>
            {state.contratos.filter(c=>c.status==='ativo').length - new Set(inadimplentes.map(i=>i.c.id)).size}
          </div>
          <div style={{ fontSize:11, color:'var(--success)', opacity:.7 }}>contratos</div>
        </div>
      </div>

      {inadimplentes.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <CheckCircle size={48} color="var(--success)" style={{ opacity:.6 }}/>
            <p style={{ color:'var(--success)' }}>Tudo em dia! 🎉</p>
            <span>Nenhum pagamento em atraso nos últimos 6 meses</span>
          </div>
        </div>
      ) : isMobile ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {inadimplentes.map((item, idx) => (
            <div key={idx} className="card" style={{ padding:'14px 16px', borderLeft: item.diasAtraso > 30 ? '3px solid var(--danger)' : '3px solid var(--warning)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{item.inquilino?.nome ?? '–'}</div>
                  {item.inquilino?.telefone && (
                    <a href={`tel:${item.inquilino.telefone}`} style={{ fontSize:12, color:'var(--primary)', textDecoration:'none' }}>
                      📞 {item.inquilino.telefone}
                    </a>
                  )}
                </div>
                <span className={`badge ${item.diasAtraso > 30 ? 'badge-danger' : 'badge-warning'}`}>
                  {item.diasAtraso}d atraso
                </span>
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>
                {item.imovel?.endereco?.split(',')[0]} · {MESES[item.mes]}/{item.ano}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>Total devido</div>
                  <div style={{ fontWeight:800, color:'var(--danger)', fontSize:16 }}>{moeda(item.totalInq)}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/pagamentos')}>
                  Registrar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Inquilino</th><th>Imóvel</th><th>Mês Ref.</th><th>Vencimento</th><th>Dias em Atraso</th><th>Aluguel</th><th>Total Devido</th><th>Ação</th></tr>
            </thead>
            <tbody>
              {inadimplentes.map((item, idx) => (
                <tr key={idx} style={{ background: item.diasAtraso > 30 ? 'rgba(192,57,43,0.03)' : undefined }}>
                  <td>
                    <div style={{ fontWeight:700 }}>{item.inquilino?.nome ?? '–'}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.inquilino?.telefone}</div>
                  </td>
                  <td style={{ fontSize:12 }}>{item.imovel?.endereco?.split(',')[0] ?? '–'}</td>
                  <td><span className="badge badge-gray">{MESES[item.mes]}/{item.ano}</span></td>
                  <td style={{ fontSize:12 }}>{dataFmt(item.venc.toISOString().slice(0,10))}</td>
                  <td>
                    <span className={`badge ${item.diasAtraso > 30 ? 'badge-danger' : 'badge-warning'}`}>
                      <AlertTriangle size={10} style={{ marginRight:3 }}/>{item.diasAtraso} dias
                    </span>
                  </td>
                  <td style={{ fontWeight:600 }}>{moeda(item.c.valorAluguel)}</td>
                  <td style={{ fontWeight:800, color:'var(--danger)', fontSize:14 }}>{moeda(item.totalInq)}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate('/pagamentos')}>Registrar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {inadimplentes.length > 0 && (
        <div className="warning-box" style={{ marginTop:16 }}>
          <AlertTriangle size={16} style={{ marginTop:1, flexShrink:0 }}/>
          <div>
            Para registrar um pagamento em atraso, acesse <strong>Pagamentos</strong>, selecione o mês correto e clique em "Pago".
          </div>
        </div>
      )}
    </div>
  )
}
