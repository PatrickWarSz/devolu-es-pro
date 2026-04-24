import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { useStore, lookup } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Calendar, Trophy, X } from "lucide-react";
import { fmtBRL, fmtDate, daysBetween } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import type { Devolucao } from "@/lib/types";

export default function Disputas() {
  const devolucoes = useStore((s) => s.devolucoes);
  const setStatus = useStore((s) => s.setStatus);
  const empresas = useStore((s) => s.empresas);
  const plataformas = useStore((s) => s.plataformas);
  const modelos = useStore((s) => s.modelos);
  const pecas = useStore((s) => s.pecas);
  const motivos = useStore((s) => s.motivos);
  const { toast } = useToast();
  const [winning, setWinning] = useState<Devolucao | null>(null);
  const [valorRec, setValorRec] = useState("");

  const disputas = useMemo(
    () =>
      devolucoes
        .filter((d) => d.status === "dispute")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [devolucoes],
  );

  const stats = useMemo(() => {
    const valorRisco = disputas.reduce((s, d) => s + d.valor * d.quantidade, 0);
    const maisAntiga = disputas[0]?.createdAt;
    return {
      total: disputas.length,
      valorRisco,
      maisAntigaDias: maisAntiga ? daysBetween(maisAntiga) : 0,
      maisAntigaData: maisAntiga,
    };
  }, [disputas]);

  const handleWin = () => {
    if (!winning) return;
    const v = Number(valorRec);
    if (Number.isNaN(v) || v < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setStatus(winning.id, "resolved", v);
    toast({
      title: "Disputa ganha 🏆",
      description: `${fmtBRL(v)} recuperados.`,
    });
    setWinning(null);
    setValorRec("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputas em aberto"
        description="Gerencie casos pendentes. Resolva ou confirme perda."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard
          label="Em disputa agora"
          value={stats.total}
          tone="warning"
          icon={<ShieldAlert className="h-4 w-4" />}
          sub="registros pendentes"
        />
        <KpiCard
          label="Valor em risco"
          value={fmtBRL(stats.valorRisco)}
          tone="warning"
          sub="estimativa total"
        />
        <KpiCard
          label="Mais antiga"
          value={stats.maisAntigaData ? `${stats.maisAntigaDias}d` : "—"}
          icon={<Calendar className="h-4 w-4" />}
          sub={stats.maisAntigaData ? `desde ${fmtDate(stats.maisAntigaData)}` : "nenhuma"}
        />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-xs">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Casos pendentes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ordenados pela disputa mais antiga
          </p>
        </div>

        {disputas.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Trophy}
              title="Sem disputas em aberto"
              description="Bom trabalho. Todas as devoluções foram resolvidas."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {disputas.map((d) => {
              const dias = daysBetween(d.createdAt);
              const urgente = dias >= 5;
              return (
                <li key={d.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {lookup(modelos, d.modeloId)} · {lookup(pecas, d.pecaId)}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium tabular",
                          urgente
                            ? "bg-destructive-soft text-destructive-soft-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {dias}d
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{d.devolucaoId || d.pedidoId}</span> ·{" "}
                      {lookup(empresas, d.empresaId)} · {lookup(plataformas, d.plataformaId)} ·{" "}
                      {lookup(motivos, d.motivoId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-warning tabular min-w-[80px] text-right">
                      {fmtBRL(d.valor * d.quantidade)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-success/40 bg-success-soft text-success-soft-foreground hover:bg-success-soft/80"
                      onClick={() => {
                        setWinning(d);
                        setValorRec(String(d.valor * d.quantidade));
                      }}
                    >
                      <Trophy className="h-3.5 w-3.5 mr-1" />
                      Ganhei
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-destructive/40 bg-destructive-soft text-destructive-soft-foreground hover:bg-destructive-soft/80"
                      onClick={() => {
                        setStatus(d.id, "loss");
                        toast({
                          title: "Perda registrada",
                          description: `${fmtBRL(d.valor * d.quantidade)} confirmados como perda.`,
                          variant: "destructive",
                        });
                      }}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Perdi
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={!!winning}
        onOpenChange={(o) => {
          if (!o) {
            setWinning(null);
            setValorRec("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar disputa ganha</DialogTitle>
            <DialogDescription>
              Informe o valor recuperado nesta devolução.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs">Valor recuperado (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={valorRec}
              onChange={(e) => setValorRec(e.target.value)}
              autoFocus
              className="tabular"
            />
            {winning && (
              <p className="text-xs text-muted-foreground">
                Valor original: {fmtBRL(winning.valor * winning.quantidade)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWinning(null)}>
              Cancelar
            </Button>
            <Button onClick={handleWin}>Confirmar recuperação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
