import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Proprietarios from './pages/Proprietarios'
import Inquilinos from './pages/Inquilinos'
import Imoveis from './pages/Imoveis'
import Contratos from './pages/Contratos'
import Encargos from './pages/Encargos'
import Pagamentos from './pages/Pagamentos'
import Repasses from './pages/Repasses'
import Inadimplencia from './pages/Inadimplencia'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"      element={<Dashboard />} />
        <Route path="/proprietarios"  element={<Proprietarios />} />
        <Route path="/inquilinos"     element={<Inquilinos />} />
        <Route path="/imoveis"        element={<Imoveis />} />
        <Route path="/contratos"      element={<Contratos />} />
        <Route path="/encargos"       element={<Encargos />} />
        <Route path="/pagamentos"     element={<Pagamentos />} />
        <Route path="/repasses"       element={<Repasses />} />
        <Route path="/inadimplencia"  element={<Inadimplencia />} />
      </Routes>
    </Layout>
  )
}
