import { useRef, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface QuickSelectOption {
  value: string;
  label: string;
}

interface QuickSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: QuickSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Ref para o trigger (para foco programático) */
  triggerRef?: React.Ref<HTMLButtonElement>;
  /** Abre o dropdown automaticamente ao ganhar foco */
  openOnFocus?: boolean;
  /** Após selecionar (Enter / clique), foca o próximo elemento focável do form */
  advanceOnSelect?: boolean;
}

/**
 * Select otimizado para data-entry rápido:
 * - Setas ↑/↓ navegam pelas opções (nativo do Radix quando aberto)
 * - Enter abre o dropdown e, ao escolher, avança para o próximo campo
 * - Tab pula o campo sem selecionar (comportamento padrão preservado)
 */
export function QuickSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  triggerRef,
  openOnFocus = true,
  advanceOnSelect = true,
}: QuickSelectProps) {
  const [open, setOpen] = useState(false);
  const innerRef = useRef<HTMLButtonElement>(null);
  // Bloqueia reabertura imediata quando o foco volta ao trigger logo após uma seleção
  const justInteractedRef = useRef(false);

  const setRef = useCallback(
    (node: HTMLButtonElement | null) => {
      innerRef.current = node;
      if (typeof triggerRef === "function") triggerRef(node);
      else if (triggerRef) (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [triggerRef],
  );

  const markInteracted = () => {
    justInteractedRef.current = true;
    setTimeout(() => {
      justInteractedRef.current = false;
    }, 250);
  };

  const focusNext = () => {
    const trigger = innerRef.current;
    if (!trigger) return;
    const form = trigger.closest("form");
    const root: HTMLElement = form ?? document.body;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute("data-skip-focus") && el.offsetParent !== null);
    const idx = focusables.indexOf(trigger);
    const next = focusables[idx + 1];
    if (next) {
      next.setAttribute("data-advanced-focus", "1");
      next.focus();
      setTimeout(() => next.removeAttribute("data-advanced-focus"), 100);
    }
  };

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        markInteracted();
        onValueChange(v);
        if (advanceOnSelect) {
          // Aguarda o Radix fechar o popover e devolver foco antes de avançar
          setTimeout(focusNext, 60);
        }
      }}
      open={open}
      onOpenChange={(next) => {
        // Se acabamos de selecionar, ignora pedidos de "abrir" vindos do Radix devolvendo o foco
        if (next && justInteractedRef.current) return;
        setOpen(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        ref={setRef}
        onFocus={(e) => {
          if (!openOnFocus) return;
          if (justInteractedRef.current) return;
          if (e.currentTarget.hasAttribute("data-advanced-focus")) return;
          setOpen(true);
        }}
        onKeyDown={(e) => {
          // Tab nunca deve abrir/selecionar — deixa o navegador mover o foco
          if (e.key === "Tab") {
            markInteracted();
          }
          // Escape fecha sem mexer
          if (e.key === "Escape" && open) {
            markInteracted();
          }
        }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
