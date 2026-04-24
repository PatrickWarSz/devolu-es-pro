import type { Devolucao, Plataforma } from "./types";
import { daysBetween } from "./format";

/**
 * Prazo médio (em dias) que cada plataforma leva para devolver o resultado de uma disputa.
 * Baseado em médias práticas de operação. Pode ser customizado por nome (case-insensitive).
 */
export const PRAZOS_POR_PLATAFORMA: Record<string, number> = {
  shopee: 5,
  mercado: 7,
  "mercado livre": 7,
  amazon: 10,
  magalu: 7,
  magazine: 7,
  "magazine luiza": 7,
  americanas: 10,
  netshoes: 10,
  shein: 7,
};

export const PRAZO_PADRAO = 7;

export function prazoDaPlataforma(nome: string | undefined): number {
  if (!nome) return PRAZO_PADRAO;
  const key = nome.toLowerCase().trim();
  if (PRAZOS_POR_PLATAFORMA[key] != null) return PRAZOS_POR_PLATAFORMA[key];
  // tenta match parcial (ex: "Shopee BR")
  for (const k of Object.keys(PRAZOS_POR_PLATAFORMA)) {
    if (key.includes(k)) return PRAZOS_POR_PLATAFORMA[k];
  }
  return PRAZO_PADRAO;
}

export type PrazoStatus = "ok" | "proximo" | "vencido" | "atrasado";

export interface PrazoInfo {
  diasAberta: number;
  prazo: number;
  diasRestantes: number; // negativo = atrasado
  status: PrazoStatus;
  label: string;
}

/** Avalia o prazo de uma devolução em disputa em relação à plataforma dela. */
export function avaliarPrazo(d: Devolucao, plataformas: Plataforma[]): PrazoInfo {
  const plat = plataformas.find((p) => p.id === d.plataformaId);
  const prazo = prazoDaPlataforma(plat?.nome);
  const diasAberta = daysBetween(d.createdAt);
  const diasRestantes = prazo - diasAberta;

  let status: PrazoStatus;
  let label: string;

  if (diasRestantes < -3) {
    status = "atrasado";
    label = `${Math.abs(diasRestantes)}d além do prazo`;
  } else if (diasRestantes < 0) {
    status = "vencido";
    label = `Prazo vencido há ${Math.abs(diasRestantes)}d`;
  } else if (diasRestantes <= 1) {
    status = "proximo";
    label = diasRestantes === 0 ? "Vence hoje" : "Vence amanhã";
  } else {
    status = "ok";
    label = `${diasRestantes}d restantes`;
  }

  return { diasAberta, prazo, diasRestantes, status, label };
}

export const prazoStatusOrder: Record<PrazoStatus, number> = {
  atrasado: 0,
  vencido: 1,
  proximo: 2,
  ok: 3,
};
