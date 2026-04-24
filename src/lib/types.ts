export type ID = string;

export type ReturnStatus = "resolved" | "dispute" | "loss";

export interface Empresa {
  id: ID;
  nome: string;
  cnpj?: string;
}

export interface Plataforma {
  id: ID;
  nome: string;
}

/** Vínculo Empresa <-> Plataforma (uma empresa pode estar em várias plataformas) */
export interface ContaPlataforma {
  id: ID;
  empresaId: ID;
  plataformaId: ID;
  apelido?: string; // ex: "Loja Costa Shopee Oficial"
}

export interface Modelo {
  id: ID;
  nome: string;
}

export interface Peca {
  id: ID;
  nome: string;
}

export interface Cor {
  id: ID;
  nome: string;
}

export interface Tamanho {
  id: ID;
  nome: string;
}

export interface Motivo {
  id: ID;
  nome: string;
}

export interface Devolucao {
  id: ID;
  createdAt: string; // ISO
  competencia: string; // YYYY-MM
  empresaId: ID;
  plataformaId: ID;
  pedidoId: string;
  devolucaoId: string;
  modeloId: ID;
  pecaId: ID;
  cor: string;
  tamanho: string;
  motivoId: ID;
  quantidade: number;
  valor: number; // valor real do produto
  status: ReturnStatus;
  /** valor recuperado quando status muda para resolved após disputa */
  valorRecuperado?: number;
  notas?: string;
}
