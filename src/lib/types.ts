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
  apelido?: string;
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

/** Item individual dentro de uma devolução. Uma devolução pode ter N itens
 *  (ex.: pedido com calça legging + short, ou mesmo modelo em cores diferentes). */
export interface DevolucaoItem {
  id: ID;
  modeloId: ID;
  pecaId: ID;
  cor: string;
  tamanho: string;
  quantidade: number;
  valor: number; // valor unitário do produto
}

/** Pré-cadastro de pedido que o cliente já postou mas ainda não chegou.
 *  Quando chega, é convertido em uma Devolucao usando seus dados. */
export interface PedidoACaminho {
  id: ID;
  createdAt: string; // ISO
  empresaId: ID;
  plataformaId: ID;
  pedidoId: string;
  /** ID da devolução na plataforma (opcional, nem sempre disponível ainda) */
  devolucaoId?: string;
  /** Motivo previsto, se o cliente já informou */
  motivoId?: ID;
  notas?: string;
  itens: DevolucaoItem[];
}

export interface Devolucao {
  id: ID;
  createdAt: string; // ISO
  competencia: string; // YYYY-MM
  empresaId: ID;
  plataformaId: ID;
  pedidoId: string;
  devolucaoId: string;
  motivoId: ID;
  status: ReturnStatus;
  /** valor total recuperado quando a disputa é ganha */
  valorRecuperado?: number;
  notas?: string;
  itens: DevolucaoItem[];
}
