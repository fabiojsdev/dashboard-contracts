import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, UserRound, Building2,
  FileText, Receipt, CreditCard, ArrowRightLeft,
  AlertTriangle, Menu, X, Building
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',     label: 'Dashboard',       icon: LayoutDashboard },
  { section: 'Cadastros' },
  { to: '/proprietarios', label: 'Proprietários',   icon: UserRound },
  { to: '/inquilinos',    label: 'Inquilinos',       icon: Users },
  { to: '/imoveis',       label: 'Imóveis',          icon: Building2 },
  { to: '/contratos',     label: 'Contratos',        icon: FileText },
  { section: 'Financeiro' },
  { to: '/encargos',      label: 'Encargos (Cond.)', icon: Receipt },
  { to: '/pagamentos',    label: 'Pagamentos',       icon: CreditCard },
  { to: '/repasses',      label: 'Repasses',         icon: ArrowRightLeft },
  { to: '/inadimplencia', label: 'Inadimplência',    icon: AlertTriangle },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Overlay mobile */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        background: 'var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 45,
        transform: open ? 'translateX(0)' : undefined,
        transition: 'transform 0.25s',
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Building size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
              AdminImóveis
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>Gestão Imobiliária</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {NAV.map((item, i) => {
            if (item.section) {
              return (
                <div key={i} style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)',
                  padding: '14px 10px 6px'
                }}>
                  {item.section}
                </div>
              )
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
                  marginBottom: 2,
                  transition: 'all 0.15s',
                })}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer sidebar */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11
        }}>
          v1.0 · Dados salvos localmente
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 'var(--sidebar-w)', flex: 1, minWidth: 0 }}>
        {/* Top bar mobile */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(240, 237, 232, 0.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button className="btn-icon" onClick={() => setOpen(!open)} style={{ display: 'none' }}>
            <Menu size={20} />
          </button>
          <PageTitle />
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Content */}
        <main style={{ padding: '28px 32px', maxWidth: 1200 }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function PageTitle() {
  const location = useLocation()
  const item = NAV.find(n => n.to === location.pathname)
  if (!item) return null
  const Icon = item.icon
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
      {Icon && <Icon size={16} />}
      <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
    </div>
  )
}
