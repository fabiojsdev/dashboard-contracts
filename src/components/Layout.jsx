import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserRound, Building2,
  FileText, Receipt, CreditCard, ArrowRightLeft,
  AlertTriangle, Menu, X, Building, MoreHorizontal
} from 'lucide-react'

// Rotas principais (bottom nav no mobile)
const BOTTOM_NAV = [
  { to: '/dashboard',     label: 'Início',       icon: LayoutDashboard },
  { to: '/contratos',     label: 'Contratos',    icon: FileText },
  { to: '/pagamentos',    label: 'Pagamentos',   icon: CreditCard },
  { to: '/repasses',      label: 'Repasses',     icon: ArrowRightLeft },
  { to: '/inadimplencia', label: 'Atrasos',      icon: AlertTriangle },
]

// Todas as rotas (sidebar / drawer)
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

// Mapa título da página
const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/proprietarios': 'Proprietários',
  '/inquilinos':    'Inquilinos',
  '/imoveis':       'Imóveis',
  '/contratos':     'Contratos',
  '/encargos':      'Encargos',
  '/pagamentos':    'Pagamentos',
  '/repasses':      'Repasses',
  '/inadimplencia': 'Inadimplência',
}

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const pageTitle = PAGE_TITLES[location.pathname] || 'AdminImóveis'

  return (
    <div className="app-wrapper">
      {/* Overlay para fechar drawer */}
      <div
        className={`sidebar-overlay ${drawerOpen ? 'visible' : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Sidebar / Drawer */}
      <aside className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Building size={18} color="#fff" />
          </div>
          <div className="sidebar-logo-text">
            <div className="sidebar-logo-title">AdminImóveis</div>
            <div className="sidebar-logo-sub">Gestão Imobiliária</div>
          </div>
          {/* Fechar drawer no mobile */}
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,.1)',
              border: 'none', borderRadius: 6, padding: 5, cursor: 'pointer',
              color: 'rgba(255,255,255,.7)', display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) => {
            if (item.section) {
              return <div key={i} className="nav-section-label">{item.section}</div>
            }
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">v1.1 · Dados salvos localmente</div>
      </aside>

      {/* Área principal */}
      <div className="main-area">
        {/* Topbar */}
        <div className="topbar">
          <button
            className="btn-icon topbar-hamburger"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
            {(() => {
              const item = NAV.find(n => n.to === location.pathname)
              if (!item) return null
              const Icon = item.icon
              return (
                <>
                  {Icon && <Icon size={16} />}
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</span>
                </>
              )
            })()}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}
            className="hide-mobile">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
            })}
          </div>
        </div>

        {/* Conteúdo */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Bottom Navigation — visível apenas no mobile */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.to
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          )
        })}
        {/* Botão "Mais" para abrir o drawer */}
        <button
          className={`bottom-nav-item`}
          onClick={() => setDrawerOpen(true)}
        >
          <MoreHorizontal size={20} />
          Mais
        </button>
      </nav>
    </div>
  )
}
