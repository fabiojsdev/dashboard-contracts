import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { moeda } from '../utils/formatters'
import { ArrowRightLeft, Printer } from 'lucide-react'
import {
  calcTaxaAdm, calcRepasse, condInquilino,
  MESES, contratoAtivoNoMes, mesAnoLabel
} from '../utils/calculos'

export default function Repasses() {
  const { state } = useApp()
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())

  const contratosAtivos = state.contratos.filter(c => contratoAtivoNoMes(c, mes, ano))

  // Agrupa por proprietário
  const porProprietario = {}
  contratosAtivos.forEach(c => {
    const imovel = state.imoveis.find(i => i.id === c.imovelId)
    if (!imovel) return
    const propId = imovel.proprietarioId
    if (!porProprietario[propId]) {
      porProprietario[propId] = { contratos: [], totais: { aluguelBruto: 0, taxa: 0, aluguelLiquido: 0, condInq: 0, benfeitorias: 0, repasse: 0 } }
    }
    const enc = state.encargos.find(e => e.imovelId === c.imovelId && e.mes === mes && e.ano === ano)
    const taxa = calcTaxaAdm(c.valorAluguel)
    const aluguelLiq = c.valorAluguel - taxa
    const condInq = condInquilino(enc)
    const benfeit = enc?.benfeitorias || 0
    const repasse = calcRepasse(c.valorAluguel, enc)

    porProprietario[propId].contratos.push({ c, imovel, enc, taxa, aluguelLiq, condInq, benfeit, repasse })
    const t = porProprietario[propId].totais
    t.aluguelBruto += c.valorAluguel
    t.taxa += taxa
    t.aluguelLiquido += aluguelLiq
    t.condInq += condInq
    t.benfeitorias += benfeit
    t.repasse += repasse
  })

  const proprietarioIds = Object.keys(porProprietario)

  function printPage() {
    window.print()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Repasses aos Proprietários</h1>
          <p className="page-subtitle">Demonstrativo mensal detalhado</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="field-input" style={{ width: 130 }} value={mes} onChange={e => setMes(Number(e.target.value))}>
            {MESES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="field-input" style={{ width: 90 }} value={ano} onChange={e => setAno(Number(e.target.value))}>
            {[ano-1, ano, ano+1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={printPage}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>

      {proprietarioIds.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ArrowRightLeft size={40} />
            <p>Nenhum contrato ativo neste mês</p>
          </div>
        </div>
      ) : (
        <>
          {proprietarioIds.map(propId => {
            const prop = state.proprietarios.find(p => p.id === propId)
            const { contratos, totais } = porProprietario[propId]

            return (
              <div key={propId} className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
                {/* Header do proprietário */}
                <div style={{
                  background: 'var(--primary)', color: '#fff',
                  padding: '14px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>
                      {prop?.nome ?? 'Proprietário não encontrado'}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                      Demonstrativo de Repasse · {mesAnoLabel(mes, ano)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>Total a Repassar</div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display'" }}>
                      {moeda(totais.repasse)}
                    </div>
                  </div>
                </div>

                {/* Tabela de contratos */}
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Imóvel</th>
                        <th>Inquilino</th>
                        <th>Aluguel Bruto</th>
                        <th>Taxa Adm (-6%)</th>
                        <th>Aluguel Líquido</th>
                        <th>Cond. Inquilino (+)</th>
                        <th>Benfeitorias (−)</th>
                        <th style={{ background: '#eef3f9', color: 'var(--primary)' }}>Repasse</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratos.map(({ c, imovel, enc, taxa, aluguelLiq, condInq, benfeit, repasse }) => {
                        const inq = state.inquilinos.find(i => i.id === c.inquilinoId)
                        return (
                          <tr key={c.id}>
                            <td>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{imovel.endereco.split(',')[0]}</div>
                              {imovel.nomeCondominio && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{imovel.nomeCondominio}</div>}
                            </td>
                            <td>{inq?.nome ?? '–'}</td>
                            <td style={{ fontWeight: 600 }}>{moeda(c.valorAluguel)}</td>
                            <td style={{ color: 'var(--danger)' }}>− {moeda(taxa)}</td>
                            <td>{moeda(aluguelLiq)}</td>
                            <td style={{ color: '#2d9e6b' }}>
                              + {moeda(condInq)}
                              {!enc && <div style={{ fontSize: 10, color: 'var(--warning)' }}>⚠ sem encargo</div>}
                              {enc && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  Taxa:{moeda(enc.taxaCond)} Água:{moeda(enc.agua)} Luz:{moeda(enc.luz)}
                                </div>
                              )}
                            </td>
                            <td style={{ color: 'var(--warning)' }}>
                              {benfeit > 0 ? `− ${moeda(benfeit)}` : <span className="text-muted">–</span>}
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--primary)', background: '#f4f8fd', fontSize: 15 }}>
                              {moeda(repasse)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    {/* Totais */}
                    <tfoot>
                      <tr style={{ background: '#f8f6f2', fontWeight: 700 }}>
                        <td colSpan={2} style={{ padding: '10px 16px', fontSize: 13 }}>TOTAL</td>
                        <td style={{ padding: '10px 16px' }}>{moeda(totais.aluguelBruto)}</td>
                        <td style={{ color: 'var(--danger)', padding: '10px 16px' }}>− {moeda(totais.taxa)}</td>
                        <td style={{ padding: '10px 16px' }}>{moeda(totais.aluguelLiquido)}</td>
                        <td style={{ color: '#2d9e6b', padding: '10px 16px' }}>+ {moeda(totais.condInq)}</td>
                        <td style={{ color: 'var(--warning)', padding: '10px 16px' }}>
                          {totais.benfeitorias > 0 ? `− ${moeda(totais.benfeitorias)}` : '–'}
                        </td>
                        <td style={{
                          fontSize: 16, fontWeight: 800, color: 'var(--primary)',
                          background: '#e8f0fa', padding: '10px 16px'
                        }}>
                          {moeda(totais.repasse)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Dados bancários */}
                {prop && (prop.banco || prop.pix) && (
                  <div style={{
                    padding: '12px 20px', borderTop: '1px solid var(--border)',
                    background: '#fcfbf9',
                    display: 'flex', gap: 24, fontSize: 13
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>
                      Dados para transferência:
                    </div>
                    {prop.banco && <span><strong>{prop.banco}</strong> ag. {prop.agencia} · cc {prop.conta}</span>}
                    {prop.pix && <span>PIX: <strong>{prop.pix}</strong></span>}
                  </div>
                )}
              </div>
            )
          })}

          {/* Resumo geral */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--primary)' }}>
              Resumo Geral — {mesAnoLabel(mes, ano)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                ['Aluguel Bruto Total', Object.values(porProprietario).reduce((s, p) => s + p.totais.aluguelBruto, 0), 'var(--primary)'],
                ['Taxa de Adm. (receita)', Object.values(porProprietario).reduce((s, p) => s + p.totais.taxa, 0), 'var(--accent)'],
                ['Total Cond. dos Inquilinos', Object.values(porProprietario).reduce((s, p) => s + p.totais.condInq, 0), '#2d9e6b'],
                ['Total a Repassar', Object.values(porProprietario).reduce((s, p) => s + p.totais.repasse, 0), 'var(--primary)'],
              ].map(([label, value, color]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "'Playfair Display'" }}>
                    {moeda(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
