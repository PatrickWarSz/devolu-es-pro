import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ContaPlataforma,
  Cor,
  Devolucao,
  DevolucaoItem,
  Empresa,
  Modelo,
  Motivo,
  Peca,
  PedidoACaminho,
  Plataforma,
  ReturnStatus,
  Tamanho,
} from "./types";
import {
  seedContas,
  seedCores,
  seedDevolucoes,
  seedEmpresas,
  seedModelos,
  seedMotivos,
  seedPecas,
  seedPlataformas,
  seedTamanhos,
} from "./seed";
import { valorTotal } from "./format";

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

interface State {
  empresas: Empresa[];
  plataformas: Plataforma[];
  contas: ContaPlataforma[];
  modelos: Modelo[];
  pecas: Peca[];
  cores: Cor[];
  tamanhos: Tamanho[];
  motivos: Motivo[];
  devolucoes: Devolucao[];
  pedidosACaminho: PedidoACaminho[];
  theme: "light" | "dark";
}

interface Actions {
  // Devoluções
  addDevolucao: (d: Omit<Devolucao, "id" | "createdAt">) => Devolucao;
  updateDevolucao: (id: string, patch: Partial<Devolucao>) => void;
  deleteDevolucao: (id: string) => void;
  setStatus: (id: string, status: ReturnStatus, valorRecuperado?: number) => void;

  // Pedidos a caminho
  addPedidoACaminho: (p: Omit<PedidoACaminho, "id" | "createdAt">) => PedidoACaminho;
  updatePedidoACaminho: (id: string, patch: Partial<PedidoACaminho>) => void;
  deletePedidoACaminho: (id: string) => void;

  // CRUD genérico
  addEmpresa: (nome: string, cnpj?: string) => Empresa;
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void;
  deleteEmpresa: (id: string) => void;

  addPlataforma: (nome: string) => Plataforma;
  updatePlataforma: (id: string, patch: Partial<Plataforma>) => void;
  deletePlataforma: (id: string) => void;

  toggleConta: (empresaId: string, plataformaId: string) => void;

  addModelo: (nome: string) => Modelo;
  deleteModelo: (id: string) => void;
  addPeca: (nome: string) => Peca;
  deletePeca: (id: string) => void;
  addCor: (nome: string) => Cor;
  deleteCor: (id: string) => void;
  addTamanho: (nome: string) => Tamanho;
  deleteTamanho: (id: string) => void;
  addMotivo: (nome: string, geraPerda?: boolean) => Motivo;
  updateMotivo: (id: string, patch: Partial<Motivo>) => void;
  deleteMotivo: (id: string) => void;

  setTheme: (t: "light" | "dark") => void;
  resetSeed: () => void;
}

/** Migra um registro v1 (campos no nível raiz) para v2 (com array `itens`). */
type LegacyDevolucao = Devolucao & {
  modeloId?: string;
  pecaId?: string;
  cor?: string;
  tamanho?: string;
  quantidade?: number;
  valor?: number;
};
function migrateDevolucao(raw: LegacyDevolucao): Devolucao {
  if (Array.isArray(raw.itens) && raw.itens.length > 0) return raw as Devolucao;
  // Registro legado: converte para 1 item
  const item: DevolucaoItem = {
    id: uid("itm"),
    modeloId: raw.modeloId ?? "",
    pecaId: raw.pecaId ?? "",
    cor: raw.cor ?? "",
    tamanho: raw.tamanho ?? "",
    quantidade: raw.quantidade ?? 1,
    valor: raw.valor ?? 0,
  };
  return {
    id: raw.id,
    createdAt: raw.createdAt,
    competencia: raw.competencia,
    empresaId: raw.empresaId,
    plataformaId: raw.plataformaId,
    pedidoId: raw.pedidoId,
    devolucaoId: raw.devolucaoId,
    motivoId: raw.motivoId,
    status: raw.status,
    valorRecuperado: raw.valorRecuperado,
    notas: raw.notas,
    itens: [item],
  };
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      empresas: seedEmpresas,
      plataformas: seedPlataformas,
      contas: seedContas,
      modelos: seedModelos,
      pecas: seedPecas,
      cores: seedCores,
      tamanhos: seedTamanhos,
      motivos: seedMotivos,
      devolucoes: seedDevolucoes,
      pedidosACaminho: [],
      theme: "light",

      addDevolucao: (d) => {
        const novo: Devolucao = {
          ...d,
          id: uid("dev"),
          createdAt: new Date().toISOString(),
          itens: d.itens.map((it) => ({ ...it, id: it.id || uid("itm") })),
        };
        set((s) => ({ devolucoes: [novo, ...s.devolucoes] }));
        return novo;
      },
      updateDevolucao: (id, patch) =>
        set((s) => ({
          devolucoes: s.devolucoes.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      deleteDevolucao: (id) =>
        set((s) => ({ devolucoes: s.devolucoes.filter((d) => d.id !== id) })),
      setStatus: (id, status, valorRecuperado) =>
        set((s) => ({
          devolucoes: s.devolucoes.map((d) => {
            if (d.id !== id) return d;
            const total = valorTotal(d);
            return {
              ...d,
              status,
              valorRecuperado:
                status === "resolved"
                  ? valorRecuperado ?? total
                  : status === "loss"
                  ? 0
                  : d.valorRecuperado,
            };
          }),
        })),

      addPedidoACaminho: (p) => {
        const novo: PedidoACaminho = {
          ...p,
          id: uid("pac"),
          createdAt: new Date().toISOString(),
          itens: p.itens.map((it) => ({ ...it, id: it.id || uid("itm") })),
        };
        set((s) => ({ pedidosACaminho: [novo, ...s.pedidosACaminho] }));
        return novo;
      },
      updatePedidoACaminho: (id, patch) =>
        set((s) => ({
          pedidosACaminho: s.pedidosACaminho.map((p) =>
            p.id === id ? { ...p, ...patch } : p,
          ),
        })),
      deletePedidoACaminho: (id) =>
        set((s) => ({
          pedidosACaminho: s.pedidosACaminho.filter((p) => p.id !== id),
        })),

      addEmpresa: (nome, cnpj) => {
        const novo: Empresa = { id: uid("emp"), nome, cnpj };
        set((s) => ({ empresas: [...s.empresas, novo] }));
        return novo;
      },
      updateEmpresa: (id, patch) =>
        set((s) => ({
          empresas: s.empresas.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      deleteEmpresa: (id) =>
        set((s) => ({
          empresas: s.empresas.filter((e) => e.id !== id),
          contas: s.contas.filter((c) => c.empresaId !== id),
        })),

      addPlataforma: (nome) => {
        const novo: Plataforma = { id: uid("plt"), nome };
        set((s) => ({ plataformas: [...s.plataformas, novo] }));
        return novo;
      },
      updatePlataforma: (id, patch) =>
        set((s) => ({
          plataformas: s.plataformas.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deletePlataforma: (id) =>
        set((s) => ({
          plataformas: s.plataformas.filter((p) => p.id !== id),
          contas: s.contas.filter((c) => c.plataformaId !== id),
        })),

      toggleConta: (empresaId, plataformaId) => {
        const existente = get().contas.find(
          (c) => c.empresaId === empresaId && c.plataformaId === plataformaId,
        );
        if (existente) {
          set((s) => ({ contas: s.contas.filter((c) => c.id !== existente.id) }));
        } else {
          set((s) => ({
            contas: [...s.contas, { id: uid("cnt"), empresaId, plataformaId }],
          }));
        }
      },

      addModelo: (nome) => {
        const n = { id: uid("mod"), nome };
        set((s) => ({ modelos: [...s.modelos, n] }));
        return n;
      },
      deleteModelo: (id) => set((s) => ({ modelos: s.modelos.filter((x) => x.id !== id) })),
      addPeca: (nome) => {
        const n = { id: uid("pec"), nome };
        set((s) => ({ pecas: [...s.pecas, n] }));
        return n;
      },
      deletePeca: (id) => set((s) => ({ pecas: s.pecas.filter((x) => x.id !== id) })),
      addCor: (nome) => {
        const n = { id: uid("cor"), nome };
        set((s) => ({ cores: [...s.cores, n] }));
        return n;
      },
      deleteCor: (id) => set((s) => ({ cores: s.cores.filter((x) => x.id !== id) })),
      addTamanho: (nome) => {
        const n = { id: uid("tam"), nome };
        set((s) => ({ tamanhos: [...s.tamanhos, n] }));
        return n;
      },
      deleteTamanho: (id) => set((s) => ({ tamanhos: s.tamanhos.filter((x) => x.id !== id) })),
      addMotivo: (nome, geraPerda) => {
        const n: Motivo = { id: uid("mot"), nome, geraPerda: geraPerda ?? true };
        set((s) => ({ motivos: [...s.motivos, n] }));
        return n;
      },
      updateMotivo: (id, patch) =>
        set((s) => ({
          motivos: s.motivos.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      deleteMotivo: (id) => set((s) => ({ motivos: s.motivos.filter((x) => x.id !== id) })),

      setTheme: (t) => set({ theme: t }),
      resetSeed: () =>
        set({
          empresas: seedEmpresas,
          plataformas: seedPlataformas,
          contas: seedContas,
          modelos: seedModelos,
          pecas: seedPecas,
          cores: seedCores,
          tamanhos: seedTamanhos,
          motivos: seedMotivos,
          devolucoes: seedDevolucoes,
        }),
    }),
    {
      name: "devolucoes-pro-v1",
      version: 3,
      migrate: (persistedState, version) => {
        const s = persistedState as Partial<State> | undefined;
        if (!s) return s as unknown as State & Actions;
        let next = s;
        if (version < 2 && Array.isArray(next.devolucoes)) {
          next = {
            ...next,
            devolucoes: (next.devolucoes as LegacyDevolucao[]).map(migrateDevolucao),
          };
        }
        if (version < 3 && Array.isArray(next.motivos)) {
          // Defaults conhecidos por nome (case-insensitive). Tudo que não casar
          // assume true (gera perda) — comportamento legado seguro.
          const defaults: Record<string, boolean> = {
            "produto com defeito": true,
            "produto errado enviado": true,
            "problema na entrega": true,
            "não corresponde ao anúncio": false,
            "nao corresponde ao anuncio": false,
            "arrependimento de compra": false,
            "outro": false,
          };
          next = {
            ...next,
            motivos: (next.motivos as Motivo[]).map((m) => {
              if (typeof m.geraPerda === "boolean") return m;
              const guess = defaults[m.nome.trim().toLowerCase()];
              return { ...m, geraPerda: guess ?? true };
            }),
          };
        }
        return next as unknown as State & Actions;
      },
    },
  ),
);

// ============== Selectors / Helpers ==============

export const selectPlataformasDeEmpresa = (empresaId: string | undefined) => {
  if (!empresaId) return [];
  const { contas, plataformas } = useStore.getState();
  const ids = contas.filter((c) => c.empresaId === empresaId).map((c) => c.plataformaId);
  return plataformas.filter((p) => ids.includes(p.id));
};

export const lookup = <T extends { id: string; nome: string }>(arr: T[], id: string) =>
  arr.find((x) => x.id === id)?.nome ?? "—";
