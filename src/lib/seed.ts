import type {
  ContaPlataforma,
  Cor,
  Devolucao,
  Empresa,
  Modelo,
  Motivo,
  Peca,
  Plataforma,
  Tamanho,
} from "./types";

const id = (p: string, n: number) => `${p}-${String(n).padStart(3, "0")}`;

export const seedEmpresas: Empresa[] = [
  { id: id("emp", 1), nome: "Costa Ltda", cnpj: "12.345.678/0001-90" },
  { id: id("emp", 2), nome: "Rezende Ltda", cnpj: "23.456.789/0001-01" },
  { id: id("emp", 3), nome: "CR Ltda", cnpj: "34.567.890/0001-12" },
];

export const seedPlataformas: Plataforma[] = [
  { id: id("plt", 1), nome: "Shopee" },
  { id: id("plt", 2), nome: "Shein" },
  { id: id("plt", 3), nome: "TikTok Shop" },
  { id: id("plt", 4), nome: "Mercado Livre" },
  { id: id("plt", 5), nome: "Amazon" },
];

export const seedContas: ContaPlataforma[] = [
  // Costa: Shopee, Shein, TikTok
  { id: id("cnt", 1), empresaId: "emp-001", plataformaId: "plt-001" },
  { id: id("cnt", 2), empresaId: "emp-001", plataformaId: "plt-002" },
  { id: id("cnt", 3), empresaId: "emp-001", plataformaId: "plt-003" },
  // Rezende: Shein, TikTok, Mercado Livre
  { id: id("cnt", 4), empresaId: "emp-002", plataformaId: "plt-002" },
  { id: id("cnt", 5), empresaId: "emp-002", plataformaId: "plt-003" },
  { id: id("cnt", 6), empresaId: "emp-002", plataformaId: "plt-004" },
  // CR: Shopee
  { id: id("cnt", 7), empresaId: "emp-003", plataformaId: "plt-001" },
];

export const seedModelos: Modelo[] = [
  { id: id("mod", 1), nome: "Modelo A" },
  { id: id("mod", 2), nome: "Modelo B" },
  { id: id("mod", 3), nome: "Modelo C" },
  { id: id("mod", 4), nome: "Modelo Pro X" },
];

export const seedPecas: Peca[] = [
  { id: id("pec", 1), nome: "Carcaça" },
  { id: id("pec", 2), nome: "Lente" },
  { id: id("pec", 3), nome: "Bateria" },
  { id: id("pec", 4), nome: "Visor" },
  { id: id("pec", 5), nome: "Conector" },
  { id: id("pec", 6), nome: "Kit completo" },
];

export const seedCores: Cor[] = [
  { id: id("cor", 1), nome: "Preto" },
  { id: id("cor", 2), nome: "Branco" },
  { id: id("cor", 3), nome: "Azul" },
  { id: id("cor", 4), nome: "Vermelho" },
  { id: id("cor", 5), nome: "Cinza" },
];

export const seedTamanhos: Tamanho[] = [
  { id: id("tam", 1), nome: "PP" },
  { id: id("tam", 2), nome: "P" },
  { id: id("tam", 3), nome: "M" },
  { id: id("tam", 4), nome: "G" },
  { id: id("tam", 5), nome: "GG" },
  { id: id("tam", 6), nome: "Único" },
];

export const seedMotivos: Motivo[] = [
  { id: id("mot", 1), nome: "Produto com defeito" },
  { id: id("mot", 2), nome: "Não corresponde ao anúncio" },
  { id: id("mot", 3), nome: "Arrependimento de compra" },
  { id: id("mot", 4), nome: "Produto errado enviado" },
  { id: id("mot", 5), nome: "Problema na entrega" },
  { id: id("mot", 6), nome: "Outro" },
];

// Devoluções de exemplo distribuídas nos últimos 30 dias
const today = new Date();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const competencia = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const seedDevolucoes: Devolucao[] = [
  // Hoje
  {
    id: "dev-001", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-001", plataformaId: "plt-001",
    pedidoId: "SHP-991023", devolucaoId: "DEV-00823",
    modeloId: "mod-001", pecaId: "pec-001", cor: "Preto", tamanho: "M",
    motivoId: "mot-001", quantidade: 1, valor: 89.9, status: "resolved",
  },
  {
    id: "dev-002", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-001", plataformaId: "plt-002",
    pedidoId: "SHEIN-77AA", devolucaoId: "DEV-00824",
    modeloId: "mod-002", pecaId: "pec-002", cor: "Branco", tamanho: "P",
    motivoId: "mot-003", quantidade: 1, valor: 142.0, status: "dispute",
  },
  {
    id: "dev-003", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-002", plataformaId: "plt-004",
    pedidoId: "MLB-334556", devolucaoId: "DEV-00825",
    modeloId: "mod-003", pecaId: "pec-003", cor: "Azul", tamanho: "G",
    motivoId: "mot-002", quantidade: 1, valor: 210.0, status: "loss",
  },
  {
    id: "dev-004", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-003", plataformaId: "plt-001",
    pedidoId: "SHP-771122", devolucaoId: "DEV-00826",
    modeloId: "mod-001", pecaId: "pec-004", cor: "Cinza", tamanho: "GG",
    motivoId: "mot-001", quantidade: 2, valor: 67.5, status: "dispute",
  },
  // Ontem
  {
    id: "dev-005", createdAt: daysAgo(1), competencia: competencia(1),
    empresaId: "emp-001", plataformaId: "plt-003",
    pedidoId: "TT-441288", devolucaoId: "DEV-00811",
    modeloId: "mod-002", pecaId: "pec-005", cor: "Preto", tamanho: "M",
    motivoId: "mot-004", quantidade: 1, valor: 178.0, status: "resolved",
    valorRecuperado: 178.0,
  },
  // Últimos 7 dias - várias
  ...Array.from({ length: 18 }, (_, i): Devolucao => {
    const dia = 2 + (i % 25);
    const empresas = ["emp-001", "emp-002", "emp-003"] as const;
    const empresa = empresas[i % 3];
    const plataformasDe: Record<string, string[]> = {
      "emp-001": ["plt-001", "plt-002", "plt-003"],
      "emp-002": ["plt-002", "plt-003", "plt-004"],
      "emp-003": ["plt-001"],
    };
    const plats = plataformasDe[empresa];
    const plataforma = plats[i % plats.length];
    const statusOpts: Devolucao["status"][] = ["resolved", "resolved", "resolved", "dispute", "loss"];
    const status = statusOpts[i % statusOpts.length];
    const valor = 60 + ((i * 37) % 280);
    return {
      id: `dev-1${String(i).padStart(2, "0")}`,
      createdAt: daysAgo(dia),
      competencia: competencia(dia),
      empresaId: empresa,
      plataformaId: plataforma,
      pedidoId: `ORD-${10000 + i * 17}`,
      devolucaoId: `DEV-007${String(i).padStart(2, "0")}`,
      modeloId: `mod-00${(i % 4) + 1}`,
      pecaId: `pec-00${(i % 6) + 1}`,
      cor: ["Preto", "Branco", "Azul", "Cinza"][i % 4],
      tamanho: ["P", "M", "G", "GG"][i % 4],
      motivoId: `mot-00${(i % 5) + 1}`,
      quantidade: 1 + (i % 2),
      valor,
      status,
      valorRecuperado: status === "resolved" ? valor : undefined,
    };
  }),
];
