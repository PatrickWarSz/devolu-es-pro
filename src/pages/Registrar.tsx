import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuickSelect } from "@/components/QuickSelect";
import { useStore, lookup } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { ReturnStatus, DevolucaoItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Trash2, Sparkles, Plus, Package } from "lucide-react";
import { fmtBRL, fmtDateTime, isToday, statusLabel, valorTotal, quantidadeTotal } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

type ItemForm = Omit<DevolucaoItem, "id"> & { id: string };

interface FormState {
  empresaId: string;
  plataformaId: string;
  competencia: string;
  pedidoId: string;
  devolucaoId: string;
  motivoId: string;
  status: ReturnStatus;
  itens: ItemForm[];
}

const todayCompetencia = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const localUid = () => `tmp-${Math.random().toString(36).slice(2, 8)}`;

const emptyItem = (): ItemForm => ({
  id: localUid(),
  modeloId: "",
  pecaId: "",
  cor: "",
  tamanho: "",
  quantidade: 1,
  valor: 0,
});

const empty = (): FormState => ({
  empresaId: "",
  plataformaId: "",
  competencia: todayCompetencia(),
  pedidoId: "",
  devolucaoId: "",
  motivoId: "",
  status: "resolved",
  itens: [emptyItem()],
});

const statusOptions: { value: ReturnStatus; label: string; Icon: typeof CheckCircle2; cls: string }[] = [
  {
    value: "resolved",
    label: "Resolvida",
    Icon: CheckCircle2,
    cls: "data-[active=true]:bg-success-soft data-[active=true]:border-success/40 data-[active=true]:text-success-soft-foreground",
  },
  {
    value: "dispute",
    label: "Em disputa",
    Icon: AlertCircle,
    cls: "data-[active=true]:bg-warning-soft data-[active=true]:border-warning/40 data-[active=true]:text-warning-soft-foreground",
  },
  {
    value: "loss",
    label: "Perda confirmada",
    Icon: XCircle,
    cls: "data-[active=true]:bg-destructive-soft data-[active=true]:border-destructive/40 data-[active=true]:text-destructive-soft-foreground",
  },
];

export default function Registrar() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty());
  const empresas = useStore((s) => s.empresas);
  const plataformas = useStore((s) => s.plataformas);
  const contas = useStore((s) => s.contas);
  const modelos = useStore((s) => s.modelos);
  const pecas = useStore((s) => s.pecas);
  const cores = useStore((s) => s.cores);
  const tamanhos = useStore((s) => s.tamanhos);
  const motivos = useStore((s) => s.motivos);
  const devolucoes = useStore((s) => s.devolucoes);
  const addDevolucao = useStore((s) => s.addDevolucao);
  const deleteDevolucao = useStore((s) => s.deleteDevolucao);

  const firstFieldRef = useRef<HTMLButtonElement>(null);

  const plataformasDisponiveis = useMemo(() => {
    if (!form.empresaId) return [];
    const ids = contas.filter((c) => c.empresaId === form.empresaId).map((c) => c.plataformaId);
    return plataformas.filter((p) => ids.includes(p.id));
  }, [form.empresaId, contas, plataformas]);

  useEffect(() => {
    if (form.plataformaId && !plataformasDisponiveis.find((p) => p.id === form.plataformaId)) {
      setForm((f) => ({ ...f, plataformaId: "" }));
    }
  }, [plataformasDisponiveis, form.plataformaId]);

  const filaHoje = useMemo(
    () =>
      devolucoes
        .filter((d) => isToday(d.createdAt))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [devolucoes],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const updateItem = (id: string, patch: Partial<ItemForm>) =>
    setForm((f) => ({
      ...f,
      itens: f.itens.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));

  const addItem = () =>
    setForm((f) => ({ ...f, itens: [...f.itens, emptyItem()] }));

  const removeItem = (id: string) =>
    setForm((f) => ({
      ...f,
      itens: f.itens.length === 1 ? f.itens : f.itens.filter((it) => it.id !== id),
    }));

  const itensValidos = form.itens.filter(
    (it) => it.modeloId && it.pecaId && Number(it.quantidade) > 0 && Number(it.valor) >= 0,
  );

  const valid =
    form.empresaId &&
    form.plataformaId &&
    form.motivoId &&
    itensValidos.length === form.itens.length &&
    form.itens.length > 0;

  const totalCalc = useMemo(
    () => form.itens.reduce((s, it) => s + Number(it.valor || 0) * Number(it.quantidade || 0), 0),
    [form.itens],
  );

  const submit = (e?: React.FormEvent, andNext = false) => {
    e?.preventDefault();
    if (!valid) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Empresa, plataforma, motivo e ao menos 1 item completo (modelo, peça, qtd e valor).",
        variant: "destructive",
      });
      return;
    }
    addDevolucao({
      empresaId: form.empresaId,
      plataformaId: form.plataformaId,
      competencia: form.competencia,
      pedidoId: form.pedidoId.trim(),
      devolucaoId: form.devolucaoId.trim(),
      motivoId: form.motivoId,
      status: form.status,
      valorRecuperado: form.status === "resolved" ? totalCalc : undefined,
      itens: form.itens.map((it) => ({
        id: it.id,
        modeloId: it.modeloId,
        pecaId: it.pecaId,
        cor: it.cor,
        tamanho: it.tamanho,
        quantidade: Number(it.quantidade),
        valor: Number(it.valor),
      })),
    });
    toast({
      title: "Devolução registrada",
      description: `${form.itens.length} ite${form.itens.length === 1 ? "m" : "ns"} · ${fmtBRL(totalCalc)} · ${statusLabel[form.status]}`,
    });
    if (andNext) {
      setForm({
        ...empty(),
        empresaId: form.empresaId,
        plataformaId: form.plataformaId,
        competencia: form.competencia,
      });
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    } else {
      setForm(empty());
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        submit(undefined, e.shiftKey);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrar devolução"
        description="Use ↑/↓ para navegar opções, Enter para selecionar e avançar, Tab para pular. ⌘/Ctrl + Enter salva."
        actions={
          <Button variant="ghost" size="sm" onClick={() => setForm(empty())}>
            Limpar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Formulário */}
        <form
          onSubmit={(e) => submit(e)}
          className="rounded-lg border border-border bg-card shadow-xs"
        >
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-medium">Nova devolução</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Preencha os dados do pedido e adicione um ou mais produtos.
            </p>
          </div>

          {/* Cabeçalho da devolução */}
          <div className="grid gap-x-4 gap-y-4 p-5 md:grid-cols-2">
            <Field label="Empresa" required>
              <QuickSelect
                triggerRef={firstFieldRef}
                value={form.empresaId}
                onValueChange={(v) => set("empresaId", v)}
                placeholder="Selecione a empresa"
                options={empresas.map((e) => ({ value: e.id, label: e.nome }))}
              />
            </Field>

            <Field
              label="Plataforma / Loja"
              required
              hint={
                form.empresaId
                  ? `${plataformasDisponiveis.length} disponível(is)`
                  : "Selecione uma empresa primeiro"
              }
            >
              <QuickSelect
                value={form.plataformaId}
                onValueChange={(v) => set("plataformaId", v)}
                disabled={!form.empresaId}
                placeholder={
                  form.empresaId
                    ? plataformasDisponiveis.length
                      ? "Selecione a plataforma"
                      : "Nenhuma plataforma vinculada"
                    : "—"
                }
                options={plataformasDisponiveis.map((p) => ({ value: p.id, label: p.nome }))}
              />
            </Field>

            <Field label="Mês / Competência">
              <Input
                type="month"
                value={form.competencia}
                onChange={(e) => set("competencia", e.target.value)}
              />
            </Field>

            <Field label="Motivo da devolução" required>
              <QuickSelect
                value={form.motivoId}
                onValueChange={(v) => set("motivoId", v)}
                placeholder="Selecione o motivo"
                options={motivos.map((m) => ({ value: m.id, label: m.nome }))}
              />
            </Field>

            <Field label="ID do Pedido">
              <Input
                placeholder="Ex: SHP-991023"
                value={form.pedidoId}
                onChange={(e) => set("pedidoId", e.target.value)}
                className="font-mono text-sm"
              />
            </Field>

            <Field label="ID da Devolução">
              <Input
                placeholder="Ex: DEV-00823"
                value={form.devolucaoId}
                onChange={(e) => set("devolucaoId", e.target.value)}
                className="font-mono text-sm"
              />
            </Field>
          </div>

          {/* Itens */}
          <div className="border-t border-border bg-surface-muted/30 px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-sm font-medium">
                  Itens da devolução
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {form.itens.length} {form.itens.length === 1 ? "item" : "itens"} · {fmtBRL(totalCalc)}
                  </span>
                </h3>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={addItem} className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar item
              </Button>
            </div>
          </div>

          <div className="divide-y divide-border">
            {form.itens.map((it, idx) => (
              <ItemRow
                key={it.id}
                index={idx}
                item={it}
                modelos={modelos}
                pecas={pecas}
                cores={cores}
                tamanhos={tamanhos}
                onChange={(patch) => updateItem(it.id, patch)}
                onRemove={() => removeItem(it.id)}
                canRemove={form.itens.length > 1}
              />
            ))}
          </div>

          {/* Status */}
          <div className="border-t border-border p-5">
            <Label className="text-xs font-medium text-muted-foreground">
              Status da devolução
            </Label>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {statusOptions.map((opt) => {
                const active = form.status === opt.value;
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-active={active}
                    onClick={() => set("status", opt.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-foreground transition-all hover:bg-muted",
                      opt.cls,
                      active && "shadow-xs",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-muted/40 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              <span className="kbd">⌘</span> <span className="kbd">↵</span> salvar ·{" "}
              <span className="kbd">⌘⇧</span> <span className="kbd">↵</span> salvar e próxima
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => submit(undefined, true)}
                disabled={!valid}
              >
                Salvar e próxima
              </Button>
              <Button type="submit" size="sm" disabled={!valid}>
                Registrar devolução
              </Button>
            </div>
          </div>
        </form>

        {/* Fila de hoje */}
        <aside className="rounded-lg border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-medium">Fila de hoje</h2>
              <p className="text-xs text-muted-foreground">
                {filaHoje.length} registro{filaHoje.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {filaHoje.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={Sparkles}
                  title="Nenhum registro hoje"
                  description="Os lançamentos do dia aparecem aqui em tempo real."
                />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filaHoje.map((d) => {
                  const total = valorTotal(d);
                  const qtd = quantidadeTotal(d);
                  const primeiroItem = d.itens[0];
                  const restante = d.itens.length - 1;
                  return (
                    <li
                      key={d.id}
                      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={d.status} />
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {fmtDateTime(d.createdAt).split(" ")[1]}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-medium">
                          {primeiroItem ? lookup(modelos, primeiroItem.modeloId) : "—"}
                          {restante > 0 && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                              +{restante} {restante === 1 ? "item" : "itens"}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {lookup(empresas, d.empresaId)} · {lookup(plataformas, d.plataformaId)} · {qtd} un.
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span
                          className={cn(
                            "text-sm font-semibold tabular",
                            d.status === "loss"
                              ? "text-destructive"
                              : d.status === "dispute"
                                ? "text-warning"
                                : "text-foreground",
                          )}
                        >
                          {d.status === "dispute" ? "R$ 1,00" : fmtBRL(total)}
                        </span>
                        <button
                          onClick={() => deleteDevolucao(d.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ============= Item Row =============

function ItemRow({
  index,
  item,
  modelos,
  pecas,
  cores,
  tamanhos,
  onChange,
  onRemove,
  canRemove,
}: {
  index: number;
  item: ItemForm;
  modelos: { id: string; nome: string }[];
  pecas: { id: string; nome: string }[];
  cores: { id: string; nome: string }[];
  tamanhos: { id: string; nome: string }[];
  onChange: (patch: Partial<ItemForm>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const subtotal = Number(item.valor || 0) * Number(item.quantidade || 0);
  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Item {index + 1}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular">
            Subtotal: <span className="font-medium text-foreground">{fmtBRL(subtotal)}</span>
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remover item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-x-3 gap-y-3 md:grid-cols-6">
        <div className="md:col-span-2">
          <Field label="Modelo" required compact>
            <QuickSelect
              value={item.modeloId}
              onValueChange={(v) => onChange({ modeloId: v })}
              placeholder="Modelo"
              options={modelos.map((m) => ({ value: m.id, label: m.nome }))}
            />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Peça" required compact>
            <QuickSelect
              value={item.pecaId}
              onValueChange={(v) => onChange({ pecaId: v })}
              placeholder="Peça"
              options={pecas.map((p) => ({ value: p.id, label: p.nome }))}
            />
          </Field>
        </div>
        <Field label="Cor" compact>
          <QuickSelect
            value={item.cor}
            onValueChange={(v) => onChange({ cor: v })}
            placeholder="—"
            options={cores.map((c) => ({ value: c.nome, label: c.nome }))}
          />
        </Field>
        <Field label="Tamanho" compact>
          <QuickSelect
            value={item.tamanho}
            onValueChange={(v) => onChange({ tamanho: v })}
            placeholder="—"
            options={tamanhos.map((t) => ({ value: t.nome, label: t.nome }))}
          />
        </Field>
        <Field label="Quantidade" required compact>
          <Input
            type="number"
            min={1}
            value={item.quantidade}
            onChange={(e) => onChange({ quantidade: Number(e.target.value) })}
            className="tabular"
          />
        </Field>
        <div className="md:col-span-5">
          <Field label="Valor unitário (R$)" required compact>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              value={item.valor}
              onChange={(e) => onChange({ valor: Number(e.target.value) })}
              className="tabular"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  compact,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <div className="flex items-baseline justify-between">
        <Label className={cn(compact ? "text-[11px]" : "text-xs", "font-medium text-muted-foreground")}>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
