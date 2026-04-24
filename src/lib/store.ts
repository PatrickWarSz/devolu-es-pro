import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ContaPlataforma,
  Cor,
  Devolucao,
  Empresa,
  Modelo,
  Motivo,
  Peca,
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
  theme: "light" | "dark";
}

interface Actions {
  // Devoluções
  addDevolucao: (d: Omit<Devolucao, "id" | "createdAt">) => Devolucao;
  updateDevolucao: (id: string, patch: Partial<Devolucao>) => void;
  deleteDevolucao: (id: string) => void;
  setStatus: (id: string, status: ReturnStatus, valorRecuperado?: number) => void;

  // CRUD genérico para entidades simples
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
  addMotivo: (nome: string) => Motivo;
  deleteMotivo: (id: string) => void;

  setTheme: (t: "light" | "dark") => void;
  resetSeed: () => void;
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
      theme: "light",

      addDevolucao: (d) => {
        const novo: Devolucao = {
          ...d,
          id: uid("dev"),
          createdAt: new Date().toISOString(),
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
          devolucoes: s.devolucoes.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status,
                  valorRecuperado:
                    status === "resolved"
                      ? valorRecuperado ?? d.valor
                      : status === "loss"
                      ? 0
                      : d.valorRecuperado,
                }
              : d,
          ),
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
      addMotivo: (nome) => {
        const n = { id: uid("mot"), nome };
        set((s) => ({ motivos: [...s.motivos, n] }));
        return n;
      },
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
