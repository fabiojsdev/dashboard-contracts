import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { moeda } from '../utils/formatters'
import { ArrowRightLeft, Printer } from 'lucide-react'
import { calcTaxaAdm, calcRepasse, condInquilino, MESES, contratoAtivoNoMes, mesAnoLabel } from '../utils/calculos'
import { useIsMobile } from '../hooks/useIsMobile'

export default function Repasses() {
  const { state } = useApp()
  const isMobile = useIsMobile()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  const contratosAtivos = state.contratos.filter(c => contratoAtivoNoMes(c, mes, ano))

  const porProprietario = {}
  contratosAtivos.forEach(c => {
    const imovel = state.imoveis.find(i => i.id === c.imovelId)
    if (!imovel) return
    const propId = imovel.proprietarioId
    if (!porProprietario[propId]) porProprietario[propId] = { contratos:[], totais:{ aluguelBruto:0, taxa:0, aluguelLiq:0, condInq:0, benf:0, repasse:0 } }

    const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
    const taxa = calcTaxaAdm(c.valorAluguel)
    const aluguelLiq = c.valorAluguel - taxa
    const condInq = condInquilino(enc)
    const benf = enc?.benfeitorias || 0
    const repasse = calcRepasse(c.valorAluguel, enc)

    porProprietario[propId].contratos.push({ c, imovel, enc, taxa, aluguelLiq, condInq, benf, repasse })
    const t = porProprietario[propId].totais
    t.aluguelBruto += c.valorAluguel; t.taxa += taxa; t.aluguelLiq += aluguelLiq
    t.condInq += condInq; t.benf += benf; t.repasse += repasse
  })

  const proprietarioIds = Object.keys(porProprietario)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Repasses</h1>
          <p className="page-subtitle">Demonstrativo mensal</p>
        </div>
        <div className="page-header-actions">
          <select className="field-input" style={{ width: isMobile ? undefined : 130 }} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="field-input" style={{ width: isMobile ? undefined : 90 }} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[ano-1,ano,ano+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!isMobile && (
            <button className="btn btn-ghost" onClick={() => window.print()}>
              <Printer size={15}/> Imprimir
            </button>
          )}
        </div>
      </div>

      {proprietarioIds.length === 0 ? (
        <div className="card">
          <div className="empty-state"><ArrowRightLeft size={40}/><p>Nenhum contrato ativo neste mês</p></div>
        </div>
      ) : (
        <>
          {proprietarioIds.map(propId => {
            const prop = state.proprietarios.find(p => p.id === propId)
            const { contratos, totais } = porProprietario[propId]

            return (
              <div key={propId} className="card" style={{ marginBottom:20, overflow:'hidden' }}>
                {/* Header */}
                <div style={{ background:'var(--primary)', color:'#fff', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:700 }}>{prop?.nome ?? '–'}</div>
                    <div style={{ fontSize:11, opacity:.6, marginTop:2 }}>{mesAnoLabel(mes, ano)}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, opacity:.6 }}>Total a Repassar</div>
                    <div style={{ fontSize:20, fontWeight:700, fontFamily:"'Playfair Display'" }}>{moeda(totais.repasse)}</div>
                  </div>
                </div>

                {/* Contratos */}
                {isMobile ? (
                  <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:12 }}>
                    {contratos.map(({ c, imovel, enc, taxa, aluguelLiq, condInq, benf, repasse }) => {
                      const inq = state.inquilinos.find(i => i.id === c.inquilinoId)
                      return (
                        <div key={c.id} style={{ background:'var(--bg)', borderRadius:10, padding:'12px 14px' }}>
                          <div style={{ fontWeight:700, marginBottom:4 }}>{inq?.nome ?? '–'}</div>
                          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:10 }}>{imovel.endereco.split(',')[0]}</div>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', fontSize:13 }}>
                            <CalcRow label="Aluguel bruto" value={moeda(c.valorAluguel)} />
                            <CalcRow label="Taxa adm (−6%)" value={`− ${moeda(taxa)}`} color="var(--danger)" />
                            <CalcRow label="Aluguel líquido" value={moeda(aluguelLiq)} />
                            <CalcRow label="Cond. inquilino (+)" value={`+ ${moeda(condInq)}`} color="#2d9e6b" />
                            {benf > 0 && <CalcRow label="Benfeitorias (−)" value={`− ${moeda(benf)}`} color="var(--warning)" />}
                          </div>
                          <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:700, fontSize:14 }}>
                            <span>Repasse</span>
                            <span style={{ color:'var(--primary)' }}>{moeda(repasse)}</span>
                          </div>
                          {!enc && (
                            <div style={{ marginTop:6, fontSize:11, color:'var(--warning)', fontWeight:600 }}>
                              ⚠ Encargo de condomínio não lançado
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Totais mobile */}
                    <div style={{ background:'var(--info-bg)', borderRadius:10, padding:'12px 14px', border:'1px solid #c5d7ea' }}>
                      <div style={{ fontWeight:700, color:'var(--primary)', marginBottom:8 }}>Total do Proprietário</div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 12px', fontSize:13 }}>
                        <CalcRow label="Aluguel bruto" value={moeda(totais.aluguelBruto)} />
                        <CalcRow label="Taxa adm" value={`− ${moeda(totais.taxa)}`} color="var(--danger)" />
                        <CalcRow label="Cond. inquilinos" value={`+ ${moeda(totais.condInq)}`} color="#2d9e6b" />
                        {totais.benf > 0 && <CalcRow label="Benfeitorias" value={`− ${moeda(totais.benf)}`} color="var(--warning)" />}
                      </div>
                      <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:16 }}>
                        <span>REPASSE TOTAL</span>
                        <span style={{ color:'var(--primary)' }}>{moeda(totais.repasse)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table>
                      <thead>
                        <tr><th>Imóvel</th><th>Inquilino</th><th>Aluguel Bruto</th><th>Taxa (−6%)</th><th>Aluguel Líquido</th><th>Cond. Inq. (+)</th><th>Benf. (−)</th><th style={{ background:'#eef3f9', color:'var(--primary)' }}>Repasse</th></tr>
                      </thead>
                      <tbody>
                        {contratos.map(({ c, imovel, enc, taxa, aluguelLiq, condInq, benf, repasse }) => {
                          const inq = state.inquilinos.find(i => i.id === c.inquilinoId)
                          return (
                            <tr key={c.id}>
                              <td>
                                <div style={{ fontWeight:500, fontSize:13 }}>{imovel.endereco.split(',')[0]}</div>
                                {imovel.nomeCondominio && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{imovel.nomeCondominio}</div>}
                              </td>
                              <td>{inq?.nome ?? '–'}</td>
                              <td style={{ fontWeight:600 }}>{moeda(c.valorAluguel)}</td>
                              <td style={{ color:'var(--danger)' }}>− {moeda(taxa)}</td>
                              <td>{moeda(aluguelLiq)}</td>
                              <td style={{ color:'#2d9e6b' }}>+ {moeda(condInq)}
                                {!enc && <div style={{ fontSize:10, color:'var(--warning)' }}>⚠ sem encargo</div>}
                              </td>
                              <td style={{ color:'var(--warning)' }}>{benf > 0 ? `− ${moeda(benf)}` : '–'}</td>
                              <td style={{ fontWeight:700, color:'var(--primary)', background:'#f4f8fd', fontSize:14 }}>{moeda(repasse)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background:'#f8f6f2', fontWeight:700 }}>
                          <td colSpan={2} style={{ padding:'10px 14px', fontSize:13 }}>TOTAL</td>
                          <td style={{ padding:'10px 14px' }}>{moeda(totais.aluguelBruto)}</td>
                          <td style={{ color:'var(--danger)', padding:'10px 14px' }}>− {moeda(totais.taxa)}</td>
                          <td style={{ padding:'10px 14px' }}>{moeda(totais.aluguelLiq)}</td>
                          <td style={{ color:'#2d9e6b', padding:'10px 14px' }}>+ {moeda(totais.condInq)}</td>
                          <td style={{ color:'var(--warning)', padding:'10px 14px' }}>{totais.benf > 0 ? `− ${moeda(totais.benf)}` : '–'}</td>
                          <td style={{ fontSize:15, fontWeight:800, color:'var(--primary)', background:'#e8f0fa', padding:'10px 14px' }}>{moeda(totais.repasse)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Dados bancários */}
                {prop && (prop.banco || prop.pix) && (
                  <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', background:'#fcfbf9', fontSize:13, display:'flex', gap:16, flexWrap:'wrap' }}>
                    <span style={{ color:'var(--text-muted)', fontWeight:600, fontSize:11, textTransform:'uppercase' }}>Transferência:</span>
                    {prop.banco && <span><strong>{prop.banco}</strong> ag. {prop.agencia} · cc {prop.conta}</span>}
                    {prop.pix && <span>PIX: <strong>{prop.pix}</strong></span>}
                  </div>
                )}
              </div>
            )
          })}

          {/* Resumo geral */}
          <div className="card" style={{ padding:'16px' }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12, color:'var(--primary)' }}>Resumo — {mesAnoLabel(mes, ano)}</div>
            <div className="stats-grid">
              {[
                ['Aluguel Bruto', Object.values(porProprietario).reduce((s,p)=>s+p.totais.aluguelBruto,0), 'var(--primary)'],
                ['Taxa Adm (receita)', Object.values(porProprietario).reduce((s,p)=>s+p.totais.taxa,0), 'var(--accent)'],
                ['Cond. Inquilinos', Object.values(porProprietario).reduce((s,p)=>s+p.totais.condInq,0), '#2d9e6b'],
                ['Total Repasses', Object.values(porProprietario).reduce((s,p)=>s+p.totais.repasse,0), 'var(--primary)'],
              ].map(([label, value, color]) => (
                <div key={label} className="stat-card" style={{ padding:'12px 14px' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'Playfair Display'" }}>{moeda(value)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function CalcRow({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'.04em' }}>{label}</div>
      <div style={{ fontWeight:600, color: color || 'var(--text)', fontSize:13 }}>{value}</div>
    </div>
  )
}
