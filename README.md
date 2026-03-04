# 🏢 AdminImóveis — Sistema de Gerenciamento de Locações

Sistema local de gerenciamento para pequena administradora imobiliária (até ~10 contratos).

## ✅ Funcionalidades

- **Proprietários** — Cadastro completo com dados bancários e PIX
- **Inquilinos** — Cadastro com dados de contato
- **Imóveis** — Vinculado ao proprietário, com dados de condomínio
- **Contratos** — Cálculo automático do dia de vencimento do aluguel
- **Encargos** — Lançamento mensal de condomínio (taxa, água, luz, benfeitorias)
- **Pagamentos** — Controle mensal com marcação de pago/pendente/atrasado
- **Repasses** — Demonstrativo detalhado para cada proprietário
- **Inadimplência** — Visão dos últimos 6 meses com pagamentos em atraso
- **Dashboard** — Visão geral mensal com alertas

## 💡 Regras de negócio implementadas

- **Benfeitorias** → Responsabilidade do proprietário (não cobrado do inquilino)
- **Taxa de adm.** → 6% sobre o valor do aluguel mensal
- **Dia de vencimento** → Calculado automaticamente a partir da data de assinatura
- **Repasse líquido** → Aluguel − Taxa (6%) + Condomínio do inquilino − Benfeitorias

## 🚀 Como rodar

### Pré-requisitos
- Node.js 18+ instalado (https://nodejs.org)

### Instalação e execução

```bash
# 1. Acesse a pasta do projeto
cd imoveis-admin

# 2. Instale as dependências (apenas uma vez)
npm install

# 3. Inicie o sistema
npm run dev

# 4. Abra no navegador
# http://localhost:5173
```

### Dados de exemplo
Na tela do Dashboard, clique em **"Carregar dados de exemplo"** para ver o sistema funcionando
com proprietários, inquilinos, imóveis, contratos e lançamentos fictícios.

## 💾 Armazenamento
Os dados são salvos **automaticamente** no navegador (localStorage) a cada alteração.
Os dados ficam apenas no computador — não são enviados para nenhum servidor.

> Para fazer backup: abra o console do navegador (F12) e execute:
> `console.log(localStorage.getItem('imoveisAdminV1'))`
> Copie e guarde o texto para restaurar depois.

## 📁 Estrutura do projeto

```
src/
├── context/AppContext.jsx   → Estado global + localStorage
├── utils/calculos.js        → Cálculos financeiros
├── utils/formatters.js      → Formatação de moeda e datas
├── components/
│   ├── Layout.jsx           → Sidebar e navegação
│   ├── Modal.jsx            → Modal reutilizável
│   └── FormField.jsx        → Campos de formulário
└── pages/
    ├── Dashboard.jsx
    ├── Proprietarios.jsx
    ├── Inquilinos.jsx
    ├── Imoveis.jsx
    ├── Contratos.jsx
    ├── Encargos.jsx
    ├── Pagamentos.jsx
    ├── Repasses.jsx
    └── Inadimplencia.jsx
```
