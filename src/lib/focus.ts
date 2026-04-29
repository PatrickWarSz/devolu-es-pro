/**
 * Helpers para navegação rápida por teclado em formulários.
 *
 * Padrão adotado em `Registrar` e `Pedidos a caminho`:
 * - Enter em <input> avança para o próximo campo (sem submeter o form).
 * - Shift+Enter mantém o comportamento padrão (newline em textarea, submit em outros).
 * - QuickSelect já cuida do avanço pós-seleção via `nextFocusRef`.
 */
import type { KeyboardEvent, RefObject } from "react";

export function focusElement(el: HTMLElement | null | undefined) {
  if (!el) return;
  el.focus();
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    try {
      el.select();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Handler para usar em <Input onKeyDown={advanceOnEnter(nextRef)}>.
 * Faz Enter avançar para `nextRef` sem submeter o form.
 */
export function advanceOnEnter(nextRef: RefObject<HTMLElement>) {
  return (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    // Não interfere quando o usuário está em <textarea> com Shift+Enter etc.
    e.preventDefault();
    focusElement(nextRef.current);
  };
}
