<br># 💰 Finance Dashboard

> **Dashboard financeiro pessoal** desenvolvido com Next.js e Supabase. Controle suas rendas, gastos fixos e variáveis, cartão de crédito, metas e reserva de emergência — tudo em um só lugar.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Supabase](https://img.shields.io/badge/Supabase-green?logo=supabase) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwind-css)

---

## ✨ Funcionalidades

| Módulo | O que faz |
|---|---|
| 📊 **Dashboard** | Visão geral mensal com saldo, renda, despesas e gráficos de evolução |
| 💵 **Renda Mensal** | Cadastro de rendas recorrentes e avulsas por mês |
| 🏠 **Gastos Fixos** | Controle de despesas mensais fixas (aluguel, academia, streaming…) |
| 🛒 **Gastos Variáveis** | Registro de despesas do dia a dia por categoria |
| 💳 **Cartão de Crédito** | Controle de compras parceladas com cálculo de parcelas por mês |
| 🎯 **Metas** | Acompanhamento de metas financeiras com progresso e prazos |
| 🛡️ **Reserva de Emergência** | Monitoramento da sua reserva com meta configurável |
| 📈 **Relatórios** | Exportação de dados em PDF e Excel |
| 🔔 **Notificações** | Alertas de vencimento de faturas e metas atrasadas |
| 🌙 **Dark Mode** | Tema escuro moderno com alternância rápida |

---

## 🖥️ Pré-requisitos

- **Node.js** 18 ou superior
- **Conta gratuita no [Supabase](https://supabase.com)** (plano gratuito é suficiente)
- (Opcional) **Conta na [Vercel](https://vercel.com)** para deploy gratuito

---

## 🚀 Instalação em 5 Passos

### 1. Clone ou extraia o projeto

```bash
# Se baixou o ZIP, extraia e entre na pasta:
cd finance-dashboard
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. No painel do seu projeto, vá em **SQL Editor**
3. Cole todo o conteúdo do arquivo `setup.sql` (incluído no projeto) e clique em **Run**
4. Vá em **Settings → API** e copie:
   - **Project URL**
   - **anon public** key

### 4. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus dados:

```bash
cp .env.example .env.local
```

Edite o `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANONIMA
```

### 5. Rode o projeto

```bash
npm run dev
```

Acesse **http://localhost:3001** e crie sua conta! 🎉

---

## ☁️ Deploy Gratuito na Vercel

A forma mais fácil de colocar o projeto no ar é usando a Vercel:

1. Faça o upload do projeto para um repositório no GitHub (privado ou público)
2. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**
3. Importe seu repositório
4. Em **Environment Variables**, adicione as duas variáveis do `.env.local`
5. Clique em **Deploy** — pronto! ✅

---

## 📁 Estrutura do Projeto

```
finance-dashboard/
├── app/                  # Rotas e API (Next.js App Router)
│   └── api/              # Endpoints REST (incomes, expenses, goals…)
├── components/
│   ├── finance/          # Todas as telas do dashboard
│   └── ui/               # Componentes de interface (shadcn/ui)
├── hooks/
│   └── use-finance-data.ts  # Hook central de dados + CRUD
├── lib/
│   └── finance-store.ts  # Tipos, helpers e funções de cálculo
├── setup.sql             # ← Execute este no Supabase!
└── .env.example          # ← Modelo para o .env.local
```

---

## 🛠️ Tecnologias Utilizadas

- **[Next.js 16](https://nextjs.org/)** — Framework React com App Router
- **[Supabase](https://supabase.com/)** — Backend, banco PostgreSQL e autenticação
- **[TypeScript](https://www.typescriptlang.org/)** — Tipagem estática
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Estilização utilitária
- **[shadcn/ui](https://ui.shadcn.com/)** — Componentes de interface acessíveis
- **[Recharts](https://recharts.org/)** — Gráficos de dados financeiros
- **[jsPDF](https://github.com/parallax/jsPDF)** — Exportação de relatórios em PDF
- **[xlsx](https://github.com/SheetJS/sheetjs)** — Exportação em Excel

---

## ❓ Dúvidas Frequentes

**O projeto é seguro para dados financeiros reais?**
Sim. Cada usuário acessa apenas os seus próprios dados. O Supabase usa Row Level Security (RLS) no banco de dados, garantindo isolamento total entre contas.

**Preciso pagar algo para usar?**
Não. O plano gratuito do Supabase e da Vercel são suficientes para uso pessoal.

**Posso personalizar as categorias de gastos?**
Sim! Na aba **Configurações**, você pode adicionar e remover categorias tanto de gastos fixos quanto variáveis.

**Funciona no celular?**
Sim, o layout é responsivo e funciona em dispositivos móveis.

---

## 📄 Licença

Este projeto é distribuído sob uma **Licença de Uso Pessoal**. Consulte o arquivo [LICENSE.md](./LICENSE.md) para os termos completos.

**Resumo:** ✅ uso pessoal e profissional próprio · ✅ modificações para uso próprio · ❌ revenda · ❌ redistribuição · ❌ repositórios públicos
