import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { ReturnStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, Trash2, Sparkles } from "lucide-react";
import { fmtBRL, fmtDateTime, isToday, statusLabel } from "@/lib/format";
import { lookup } from "@/lib/store";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";

interface FormState {
  empresaId: string;
  plataformaId: string;
  competencia: string;
  pedidoId: string;
  devolucaoId: string;
  modeloId: string;
  pecaId: string;
  cor: string;
  tamanho: string;
  motivoId: string;
  quantidade: string;
  valor: string;
  status: ReturnStatus;
}

const todayCompetencia = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const empty = (): FormState => ({
  empresaId: "",
  plataformaId: "",
  competencia: todayCompetencia(),
  pedidoId: "",
  devolucaoId: "",
  modeloId: "",
  pecaId: "",
  cor: "",
  tamanho: "",
  motivoId: "",
  quantidade: "1",
  valor: "",
  status: "resolved",
});

const statusOptions: { value: ReturnStatus; label: string; Icon: typeof CheckCircle2; cls: string }[] = [
  {
    value: "resolved",
    label: "Resolvida (R$ real)",
    Icon: CheckCircle2,
    cls: "data-[active=true]:bg-success-soft data-[active=true]:border-success/40 data-[active=true]:text-success-soft-foreground",
  },
  {
    value: "dispute",
    label: "Em disputa (R$ 1)",
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

  // Plataformas filtradas pela empresa selecionada
  const plataformasDisponiveis = useMemo(() => {
    if (!form.empresaId) return [];
    const ids = contas.filter((c) => c.empresaId === form.empresaId).map((c) => c.plataformaId);
    return plataformas.filter((p) => ids.includes(p.id));
  }, [form.empresaId, contas, plataformas]);

  // Reset plataforma se a empresa mudar e a plataforma atual não for válida
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

  const valid =
    form.empresaId &&
    form.plataformaId &&
    form.modeloId &&
    form.pecaId &&
    form.motivoId &&
    Number(form.quantidade) > 0 &&
    Number(form.valor) >= 0;

  const submit = (e?: React.FormEvent, andNext = false) => {
    e?.preventDefault();
    if (!valid) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Empresa, plataforma, modelo, peça, motivo, quantidade e valor.",
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
      modeloId: form.modeloId,
      pecaId: form.pecaId,
      cor: form.cor.trim(),
      tamanho: form.tamanho.trim(),
      motivoId: form.motivoId,
      quantidade: Number(form.quantidade),
      valor: Number(form.valor),
      status: form.status,
      valorRecuperado: form.status === "resolved" ? Number(form.valor) : undefined,
    });
    toast({
      title: "Devolução registrada",
      description: `${lookup(modelos, form.modeloId)} — ${statusLabel[form.status]}`,
    });
    if (andNext) {
      // Mantém empresa, plataforma e competência para acelerar entrada repetida
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

  // Atalho: Ctrl/Cmd + Enter envia
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
        description="Otimizado para entrada rápida. Use Tab para navegar e ⌘/Ctrl + Enter para salvar."
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
          </div>

          <div className="grid gap-x-4 gap-y-4 p-5 md:grid-cols-2">
            {/* Empresa */}
            <Field label="Empresa" required>
              <Select
                value={form.empresaId}
                onValueChange={(v) => set("empresaId", v)}
              >
                <SelectTrigger ref={firstFieldRef as never}>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Plataforma — depende da empresa */}
            <Field
              label="Plataforma / Loja"
              required
              hint={
                form.empresaId
                  ? `${plataformasDisponiveis.length} disponível(is)`
                  : "Selecione uma empresa primeiro"
              }
            >
              <Select
                value={form.plataformaId}
                onValueChange={(v) => set("plataformaId", v)}
                disabled={!form.empresaId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      form.empresaId
                        ? plataformasDisponiveis.length
                          ? "Selecione a plataforma"
                          : "Nenhuma plataforma vinculada"
                        : "—"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {plataformasDisponiveis.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Mês / Competência">
              <Input
                type="month"
                value={form.competencia}
                onChange={(e) => set("competencia", e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantidade" required>
                <Input
                  type="number"
                  min={1}
                  value={form.quantidade}
                  onChange={(e) => set("quantidade", e.target.value)}
                  className="tabular"
                />
              </Field>
              <Field label="Valor (R$)" required>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => set("valor", e.target.value)}
                  className="tabular"
                />
              </Field>
            </div>

            <Field label="ID do Pedido">
              <Input
                placeholder="Ex: MLA123456789"
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

            <Field label="Modelo" required>
              <Select value={form.modeloId} onValueChange={(v) => set("modeloId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Peça com defeito" required>
              <Select value={form.pecaId} onValueChange={(v) => set("pecaId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a peça" />
                </SelectTrigger>
                <SelectContent>
                  {pecas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Cor">
              <Select value={form.cor} onValueChange={(v) => set("cor", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {cores.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Tamanho">
              <Select value={form.tamanho} onValueChange={(v) => set("tamanho", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {tamanhos.map((t) => (
                    <SelectItem key={t.id} value={t.nome}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Motivo da devolução" required>
                <Select value={form.motivoId} onValueChange={(v) => set("motivoId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {motivos.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Status */}
            <div className="md:col-span-2">
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
                {filaHoje.map((d) => (
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
                        {lookup(modelos, d.modeloId)} · {lookup(pecas, d.pecaId)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {lookup(empresas, d.empresaId)} · {lookup(plataformas, d.plataformaId)}
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
                        {d.status === "dispute" ? "R$ 1,00" : fmtBRL(d.valor)}
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
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
