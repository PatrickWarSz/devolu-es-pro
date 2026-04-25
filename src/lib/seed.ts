import type {
  ContaPlataforma,
  Cor,
  Devolucao,
  DevolucaoItem,
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
  { id: id("cnt", 1), empresaId: "emp-001", plataformaId: "plt-001" },
  { id: id("cnt", 2), empresaId: "emp-001", plataformaId: "plt-002" },
  { id: id("cnt", 3), empresaId: "emp-001", plataformaId: "plt-003" },
  { id: id("cnt", 4), empresaId: "emp-002", plataformaId: "plt-002" },
  { id: id("cnt", 5), empresaId: "emp-002", plataformaId: "plt-003" },
  { id: id("cnt", 6), empresaId: "emp-002", plataformaId: "plt-004" },
  { id: id("cnt", 7), empresaId: "emp-003", plataformaId: "plt-001" },
];

export const seedModelos: Modelo[] = [
  { id: id("mod", 1), nome: "Calça Legging" },
  { id: id("mod", 2), nome: "Short Esportivo" },
  { id: id("mod", 3), nome: "Top Cropped" },
  { id: id("mod", 4), nome: "Conjunto Fitness" },
];

export const seedPecas: Peca[] = [
  { id: id("pec", 1), nome: "Peça única" },
  { id: id("pec", 2), nome: "Tecido" },
  { id: id("pec", 3), nome: "Costura" },
  { id: id("pec", 4), nome: "Estampa" },
  { id: id("pec", 5), nome: "Elástico" },
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

/** Cria um item de devolução. `valor` é o TOTAL do item (já considerando a quantidade). */
const item = (
  n: number,
  modeloId: string,
  pecaId: string,
  cor: string,
  tamanho: string,
  quantidade: number,
  valorTotal: number,
): DevolucaoItem => ({
  id: id("itm", n),
  modeloId,
  pecaId,
  cor,
  tamanho,
  quantidade,
  valor: valorTotal,
});

export const seedDevolucoes: Devolucao[] = [
  // Hoje — exemplo MULTI-ITEM (calça + short no mesmo pedido)
  {
    id: "dev-001", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-001", plataformaId: "plt-001",
    pedidoId: "SHP-991023", devolucaoId: "DEV-00823",
    motivoId: "mot-001", status: "resolved",
    valorRecuperado: 89.9 + 65.0,
    itens: [
      item(1, "mod-001", "pec-002", "Preto", "M", 1, 89.9),
      item(2, "mod-002", "pec-003", "Preto", "M", 1, 65.0),
    ],
  },
  // Hoje — multi-item: mesmo modelo em cores diferentes
  {
    id: "dev-002", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-001", plataformaId: "plt-002",
    pedidoId: "SHEIN-77AA", devolucaoId: "DEV-00824",
    motivoId: "mot-003", status: "dispute",
    itens: [
      item(3, "mod-002", "pec-002", "Branco", "P", 1, 142.0),
      item(4, "mod-002", "pec-002", "Azul", "P", 1, 142.0),
    ],
  },
  {
    id: "dev-003", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-002", plataformaId: "plt-004",
    pedidoId: "MLB-334556", devolucaoId: "DEV-00825",
    motivoId: "mot-002", status: "loss",
    itens: [item(5, "mod-003", "pec-004", "Azul", "G", 1, 210.0)],
  },
  {
    id: "dev-004", createdAt: daysAgo(0), competencia: competencia(0),
    empresaId: "emp-003", plataformaId: "plt-001",
    pedidoId: "SHP-771122", devolucaoId: "DEV-00826",
    motivoId: "mot-001", status: "dispute",
    itens: [item(6, "mod-001", "pec-005", "Cinza", "GG", 2, 67.5)],
  },
  // Ontem
  {
    id: "dev-005", createdAt: daysAgo(1), competencia: competencia(1),
    empresaId: "emp-001", plataformaId: "plt-003",
    pedidoId: "TT-441288", devolucaoId: "DEV-00811",
    motivoId: "mot-004", status: "resolved",
    valorRecuperado: 178.0,
    itens: [item(7, "mod-002", "pec-001", "Preto", "M", 1, 178.0)],
  },
  // Últimos dias — diversos
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
    const qtd = 1 + (i % 2);
    // Alguns recebem 2 itens para simular pedidos compostos
    const multi = i % 4 === 0;
    const itens: DevolucaoItem[] = [
      item(100 + i * 2, `mod-00${(i % 4) + 1}`, `pec-00${(i % 6) + 1}`,
           ["Preto", "Branco", "Azul", "Cinza"][i % 4],
           ["P", "M", "G", "GG"][i % 4], qtd, valor),
    ];
    if (multi) {
      itens.push(
        item(100 + i * 2 + 1, `mod-00${((i + 1) % 4) + 1}`, `pec-00${((i + 2) % 6) + 1}`,
             ["Preto", "Branco", "Azul", "Cinza"][(i + 1) % 4],
             ["P", "M", "G", "GG"][(i + 1) % 4], 1, valor * 0.6),
      );
    }
    const total = itens.reduce((s, it) => s + it.valor * it.quantidade, 0);
    return {
      id: `dev-1${String(i).padStart(2, "0")}`,
      createdAt: daysAgo(dia),
      competencia: competencia(dia),
      empresaId: empresa,
      plataformaId: plataforma,
      pedidoId: `ORD-${10000 + i * 17}`,
      devolucaoId: `DEV-007${String(i).padStart(2, "0")}`,
      motivoId: `mot-00${(i % 5) + 1}`,
      status,
      valorRecuperado: status === "resolved" ? total : undefined,
      itens,
    };
  }),
];
