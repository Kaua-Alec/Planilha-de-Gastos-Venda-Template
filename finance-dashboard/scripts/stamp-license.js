#!/usr/bin/env node
// =============================================================
// Finance Dashboard — Script de Watermark por Comprador
// =============================================================
// USO:
//   node scripts/stamp-license.js "Nome do Comprador" "email@comprador.com" "ID-DO-PEDIDO"
//
// EXEMPLO:
//   node scripts/stamp-license.js "João Silva" "joao@email.com" "KW-00123"
//
// Este script injeta os dados do comprador no código antes de zipar.
// Execute SEMPRE antes de enviar o produto para um novo comprador.
// =============================================================

const fs = require("fs")
const path = require("path")

// --- Ler argumentos ---
const [, , ownerName, ownerEmail, orderId] = process.argv

if (!ownerName || !ownerEmail || !orderId) {
    console.error("\n❌ Uso incorreto. Exemplo:")
    console.error('   node scripts/stamp-license.js "Nome Completo" "email@exemplo.com" "KW-00001"\n')
    process.exit(1)
}

const issuedAt = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
})

// --- Conteúdo do arquivo de licença ---
const licenseContent = `// =============================================================
// FINANCE DASHBOARD — Informações de Licença
// Este arquivo é gerado automaticamente pelo autor antes da entrega.
// Redistribuição proibida. Lei nº 9.610/1998.
// =============================================================

export const LICENSE = {
  product: "Finance Dashboard",
  version: "1.0.0",
  owner: "${ownerName}",
  email: "${ownerEmail}",
  orderId: "${orderId}",
  issuedAt: "${issuedAt}",
  terms: "Uso pessoal. Revenda e redistribuição são terminantemente proibidas.",
}
`

// --- Escrever lib/license.ts ---
const licenseFile = path.join(__dirname, "..", "lib", "license.ts")
fs.writeFileSync(licenseFile, licenseContent, "utf8")
console.log(`\n✅ Licença registrada em lib/license.ts`)

// --- Registrar no log de entregas ---
const logFile = path.join(__dirname, "delivery-log.txt")
const logEntry = `[${issuedAt}] Pedido: ${orderId} | Comprador: ${ownerName} | E-mail: ${ownerEmail}\n`
fs.appendFileSync(logFile, logEntry, "utf8")
console.log(`📋 Entrega registrada em scripts/delivery-log.txt`)

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Dados do comprador injetados:
   Nome:     ${ownerName}
   E-mail:   ${ownerEmail}
   Pedido:   ${orderId}
   Data:     ${issuedAt}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Agora você pode zipar o projeto e enviar ao comprador.
   Lembre-se de EXCLUIR a pasta node_modules/ e .next/ do ZIP.
`)
