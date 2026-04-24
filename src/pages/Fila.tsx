import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { useStore, lookup } from "@/lib/store";
import { fmtBRL, isToday, statusLabel, valorEfetivo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Inbox } from "lucide-react";
import { downloadCSV } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import type { ReturnStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";

export default function Fila() {
  const devolucoes = useStore((s) => s.devolucoes);
  const setStatus = useStore((s) => s.setStatus);
  const empresas = useStore((s) => s.empresas);
  const plataformas = useStore((s) => s.plataformas);
  const modelos = useStore((s) => s.modelos);
  const pecas = useStore((s) => s.pecas);
  const motivos = useStore((s) => s.motivos);
  const [busca, setBusca] = useState("");

  const hoje = useMemo(
    () => devolucoes.filter((d) => isToday(d.createdAt)),
    [devolucoes],
  );

  const filtrada = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return hoje;
    return hoje.filter((d) =>
      [d.pedidoId, d.devolucaoId, lookup(modelos, d.modeloId), lookup(empresas, d.empresaId)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [hoje, busca, modelos, empresas]);

  const stats = useMemo(() => {
    const resolvidas = hoje.filter((d) => d.status === "resolved");
    const disputas = hoje.filter((d) => d.status === "dispute");
    const perdas = hoje.filter((d) => d.status === "loss");
    const valorPerda = perdas.reduce((s, d) => s + d.valor * d.quantidade, 0);
    return {
      total: hoje.length,
      resolvidas: resolvidas.length,
      disputas: disputas.length,
      valorPerda,
    };
  }, [hoje]);

  const exportar = () => {
    downloadCSV(
      `devolucoes-hoje-${new Date().toISOString().slice(0, 10)}.csv`,
      hoje.map((d) => ({
        ID: d.id,
        Empresa: lookup(empresas, d.empresaId),
        Plataforma: lookup(plataformas, d.plataformaId),
        Pedido: d.pedidoId,
        Devolucao: d.devolucaoId,
        Modelo: lookup(modelos, d.modeloId),
        Peca: lookup(pecas, d.pecaId),
        Motivo: lookup(motivos, d.motivoId),
        Quantidade: d.quantidade,
        Valor: d.valor,
        Status: statusLabel[d.status],
      })),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fila do dia"
        description={`Devoluções registradas hoje · ${new Date().toLocaleDateString("pt-BR", { dateStyle: "long" })}`}
        actions={
          <Button variant="outline" size="sm" onClick={exportar} disabled={!hoje.length}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar CSV
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total do dia" value={stats.total} sub="registros" />
        <KpiCard
          label="Resolvidas"
          value={stats.resolvidas}
          tone="success"
          sub="finalizadas"
        />
        <KpiCard
          label="Em disputa"
          value={stats.disputas}
          tone="warning"
          sub="aguardando"
        />
        <KpiCard
          label="Perda do dia"
          value={fmtBRL(stats.valorPerda)}
          tone="destructive"
          sub="confirmadas"
        />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Devoluções de hoje</h2>
          <Input
            placeholder="Buscar pedido, modelo…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-8 w-full max-w-xs text-sm"
          />
        </div>

        {filtrada.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Inbox}
              title={hoje.length ? "Nada encontrado" : "Sem registros hoje"}
              description={hoje.length ? "Tente outra busca." : "Vá para Registrar para iniciar."}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Empresa</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Modelo · Peça</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrada.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">
                      {lookup(empresas, d.empresaId)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lookup(plataformas, d.plataformaId)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{lookup(modelos, d.modeloId)}</span>
                      <span className="text-muted-foreground"> · {lookup(pecas, d.pecaId)}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lookup(motivos, d.motivoId)}
                    </TableCell>
                    <TableCell className="text-right tabular text-sm">{d.quantidade}</TableCell>
                    <TableCell className="text-right tabular text-sm font-medium">
                      {fmtBRL(valorEfetivo(d) * d.quantidade)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(["resolved", "dispute", "loss"] as ReturnStatus[]).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={s === d.status}
                              onClick={() => setStatus(d.id, s)}
                            >
                              Marcar como {statusLabel[s].toLowerCase()}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
