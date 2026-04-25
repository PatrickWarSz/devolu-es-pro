import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { useStore, lookup } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  downloadCSV,
  fmtBRL,
  fmtBRLCompact,
  fmtDate,
  statusLabel,
  valorEfetivo,
  valorTotal,
  quantidadeTotal,
} from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, TrendingDown, Activity, Percent } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
  "hsl(220 30% 50%)",
];

const ALL = "__all__";

export default function Dashboard() {
  const devolucoes = useStore((s) => s.devolucoes);
  const empresas = useStore((s) => s.empresas);
  const plataformas = useStore((s) => s.plataformas);
  const modelos = useStore((s) => s.modelos);
  const pecas = useStore((s) => s.pecas);
  const motivos = useStore((s) => s.motivos);

  const [fEmpresa, setFEmpresa] = useState(ALL);
  const [fPlataforma, setFPlataforma] = useState(ALL);
  const [fStatus, setFStatus] = useState(ALL);
  const [fMotivo, setFMotivo] = useState(ALL);
  const [fCompetencia, setFCompetencia] = useState(ALL);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const PAGE = 12;

  const competencias = useMemo(() => {
    const set = new Set<string>();
    devolucoes.forEach((d) => set.add(d.competencia));
    return Array.from(set).sort().reverse();
  }, [devolucoes]);

  const filtradas = useMemo(() => {
    return devolucoes.filter((d) => {
      if (fEmpresa !== ALL && d.empresaId !== fEmpresa) return false;
      if (fPlataforma !== ALL && d.plataformaId !== fPlataforma) return false;
      if (fStatus !== ALL && d.status !== fStatus) return false;
      if (fMotivo !== ALL && d.motivoId !== fMotivo) return false;
      if (fCompetencia !== ALL && d.competencia !== fCompetencia) return false;
      if (busca) {
        const q = busca.toLowerCase();
        const modelosTxt = d.itens.map((it) => lookup(modelos, it.modeloId)).join(" ");
        const txt = [d.pedidoId, d.devolucaoId, modelosTxt, lookup(empresas, d.empresaId)]
          .join(" ")
          .toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [devolucoes, fEmpresa, fPlataforma, fStatus, fMotivo, fCompetencia, busca, modelos, empresas]);

  const stats = useMemo(() => {
    // Conta por DEVOLUÇÃO (header), soma por ITEM
    const totalDevolucoes = filtradas.length;
    const totalItens = filtradas.reduce((s, d) => s + quantidadeTotal(d), 0);
    const valorPerda = filtradas
      .filter((d) => d.status === "loss")
      .reduce((s, d) => s + valorTotal(d), 0);
    const valorRecuperado = filtradas
      .filter((d) => d.status === "resolved")
      .reduce((s, d) => s + (d.valorRecuperado ?? valorTotal(d)), 0);
    const disputasAbertas = filtradas.filter((d) => d.status === "dispute").length;
    const valorEmDisputa = filtradas
      .filter((d) => d.status === "dispute")
      .reduce((s, d) => s + valorTotal(d), 0);
    const totalAvaliado = filtradas.reduce((s, d) => s + valorTotal(d), 0);
    const taxaRecuperacao = totalAvaliado > 0 ? (valorRecuperado / totalAvaliado) * 100 : 0;
    return {
      totalDevolucoes,
      totalItens,
      valorPerda,
      valorRecuperado,
      disputasAbertas,
      valorEmDisputa,
      taxaRecuperacao,
    };
  }, [filtradas]);

  const evolucaoMensal = useMemo(() => {
    const map = new Map<string, { mes: string; resolvidas: number; disputas: number; perdas: number }>();
    filtradas.forEach((d) => {
      const key = d.competencia;
      const cur = map.get(key) ?? { mes: key, resolvidas: 0, disputas: 0, perdas: 0 };
      const v = valorEfetivo(d);
      if (d.status === "resolved") cur.resolvidas += v;
      else if (d.status === "dispute") cur.disputas += v;
      else cur.perdas += v;
      map.set(key, cur);
    });
    return Array.from(map.values())
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-6)
      .map((m) => ({
        ...m,
        label: m.mes.split("-").reverse().join("/"),
      }));
  }, [filtradas]);

  const porEmpresa = useMemo(() => {
    const map = new Map<string, number>();
    filtradas.forEach((d) => {
      const k = lookup(empresas, d.empresaId);
      map.set(k, (map.get(k) ?? 0) + quantidadeTotal(d));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtradas, empresas]);

  const porMotivo = useMemo(() => {
    const map = new Map<string, number>();
    filtradas.forEach((d) => {
      const k = lookup(motivos, d.motivoId);
      map.set(k, (map.get(k) ?? 0) + quantidadeTotal(d));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtradas, motivos]);

  // ============== Análise de Produto ==============
  // Cruzamentos para entender PORQUÊ um produto está sendo devolvido:
  // - tamanho (ex: "G está pequeno"), cor (ex: "branco transparente"),
  // - peça com defeito (quando motivo = defeito).

  /** Top modelos devolvidos com breakdown do motivo principal. */
  const topModelos = useMemo(() => {
    type Acc = { qtd: number; motivos: Map<string, number> };
    const map = new Map<string, Acc>();
    filtradas.forEach((d) => {
      const motivoNome = lookup(motivos, d.motivoId);
      d.itens.forEach((it) => {
        const k = lookup(modelos, it.modeloId);
        const cur = map.get(k) ?? { qtd: 0, motivos: new Map() };
        cur.qtd += it.quantidade;
        cur.motivos.set(motivoNome, (cur.motivos.get(motivoNome) ?? 0) + it.quantidade);
        map.set(k, cur);
      });
    });
    return Array.from(map.entries())
      .map(([modelo, acc]) => {
        const motivoTop = Array.from(acc.motivos.entries()).sort((a, b) => b[1] - a[1])[0];
        return {
          modelo,
          qtd: acc.qtd,
          motivoTop: motivoTop ? motivoTop[0] : "—",
          motivoTopQtd: motivoTop ? motivoTop[1] : 0,
        };
      })
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [filtradas, modelos, motivos]);

  /** Combinação modelo + tamanho — revela problemas de modelagem (ex: "G pequeno"). */
  const topModeloTamanho = useMemo(() => {
    const map = new Map<string, { modelo: string; tamanho: string; qtd: number }>();
    filtradas.forEach((d) => {
      d.itens.forEach((it) => {
        const tam = it.tamanho || "—";
        const mod = lookup(modelos, it.modeloId);
        const k = `${mod}__${tam}`;
        const cur = map.get(k) ?? { modelo: mod, tamanho: tam, qtd: 0 };
        cur.qtd += it.quantidade;
        map.set(k, cur);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [filtradas, modelos]);

  /** Combinação modelo + cor — revela problemas específicos de cor (ex: branco transparente). */
  const topModeloCor = useMemo(() => {
    const map = new Map<string, { modelo: string; cor: string; qtd: number }>();
    filtradas.forEach((d) => {
      d.itens.forEach((it) => {
        const cor = it.cor || "—";
        const mod = lookup(modelos, it.modeloId);
        const k = `${mod}__${cor}`;
        const cur = map.get(k) ?? { modelo: mod, cor, qtd: 0 };
        cur.qtd += it.quantidade;
        map.set(k, cur);
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [filtradas, modelos]);

  /** Peças que voltam com defeito — só considera devoluções cujo motivo contém "defeito". */
  const topPecasDefeito = useMemo(() => {
    const motivosDefeito = new Set(
      motivos.filter((m) => m.nome.toLowerCase().includes("defeito")).map((m) => m.id),
    );
    const map = new Map<string, { peca: string; modelo: string; qtd: number }>();
    filtradas
      .filter((d) => motivosDefeito.has(d.motivoId))
      .forEach((d) => {
        d.itens.forEach((it) => {
          if (!it.pecaId) return;
          const peca = lookup(pecas, it.pecaId);
          const mod = lookup(modelos, it.modeloId);
          const k = `${mod}__${peca}`;
          const cur = map.get(k) ?? { peca, modelo: mod, qtd: 0 };
          cur.qtd += it.quantidade;
          map.set(k, cur);
        });
      });
    return Array.from(map.values())
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 8);
  }, [filtradas, modelos, motivos, pecas]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE));
  const ordenadas = useMemo(
    () => [...filtradas].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [filtradas],
  );
  const pageData = ordenadas.slice((pagina - 1) * PAGE, pagina * PAGE);

  const exportar = () => {
    // Exporta uma linha por ITEM, com dados do header repetidos para análise no Excel
    const rows = filtradas.flatMap((d) =>
      d.itens.map((it, idx) => ({
        Devolucao: d.devolucaoId,
        Pedido: d.pedidoId,
        Item: idx + 1,
        Data: fmtDate(d.createdAt),
        Competencia: d.competencia,
        Empresa: lookup(empresas, d.empresaId),
        Plataforma: lookup(plataformas, d.plataformaId),
        Modelo: lookup(modelos, it.modeloId),
        Peca: lookup(pecas, it.pecaId),
        Cor: it.cor,
        Tamanho: it.tamanho,
        Motivo: lookup(motivos, d.motivoId),
        Quantidade: it.quantidade,
        ValorTotalItem: it.valor,
        ValorRecuperado: d.valorRecuperado ?? "",
        Status: statusLabel[d.status],
      })),
    );
    downloadCSV(`devolucoes-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  const limparFiltros = () => {
    setFEmpresa(ALL);
    setFPlataforma(ALL);
    setFStatus(ALL);
    setFMotivo(ALL);
    setFCompetencia(ALL);
    setBusca("");
    setPagina(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Centro de inteligência. Cruze dados e exporte relatórios completos."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={limparFiltros}>
              Limpar filtros
            </Button>
            <Button variant="outline" size="sm" onClick={exportar} disabled={!filtradas.length}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-xs">
        <FilterSelect label="Empresa" value={fEmpresa} onChange={setFEmpresa}>
          <SelectItem value={ALL}>Todas as empresas</SelectItem>
          {empresas.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.nome}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Plataforma" value={fPlataforma} onChange={setFPlataforma}>
          <SelectItem value={ALL}>Todas plataformas</SelectItem>
          {plataformas.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.nome}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Competência" value={fCompetencia} onChange={setFCompetencia}>
          <SelectItem value={ALL}>Todas competências</SelectItem>
          {competencias.map((c) => (
            <SelectItem key={c} value={c}>
              {c.split("-").reverse().join("/")}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={fStatus} onChange={setFStatus}>
          <SelectItem value={ALL}>Todos status</SelectItem>
          <SelectItem value="resolved">Resolvidas</SelectItem>
          <SelectItem value="dispute">Em disputa</SelectItem>
          <SelectItem value="loss">Perdas</SelectItem>
        </FilterSelect>
        <FilterSelect label="Motivo" value={fMotivo} onChange={setFMotivo}>
          <SelectItem value={ALL}>Todos motivos</SelectItem>
          {motivos.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.nome}
            </SelectItem>
          ))}
        </FilterSelect>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Devoluções"
          value={stats.totalDevolucoes}
          icon={<Activity className="h-4 w-4" />}
          sub={`${stats.totalItens} itens no total`}
        />
        <KpiCard
          label="Valor de perda"
          value={fmtBRL(stats.valorPerda)}
          tone="destructive"
          icon={<TrendingDown className="h-4 w-4" />}
          sub="confirmadas"
        />
        <KpiCard
          label="Disputas em aberto"
          value={stats.disputasAbertas}
          tone="warning"
          sub={fmtBRL(stats.valorEmDisputa) + " em risco"}
        />
        <KpiCard
          label="Taxa de recuperação"
          value={`${stats.taxaRecuperacao.toFixed(1)}%`}
          tone="success"
          icon={<Percent className="h-4 w-4" />}
          sub={`${fmtBRL(stats.valorRecuperado)} recuperado`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="Evolução mensal" subtitle="Valor por status (últimos 6 meses)" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolucaoMensal} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => fmtBRLCompact(v as number)}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(v) => fmtBRL(v as number)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="resolvidas" name="Resolvidas" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="disputas" name="Disputas" fill="hsl(var(--warning))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="perdas" name="Perdas" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Por empresa" subtitle="Volume de itens devolvidos">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={porEmpresa}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {porEmpresa.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Principais motivos" subtitle="Top motivos de devolução (por itens)" className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={porMotivo} layout="vertical" margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={170}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--info))" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-medium">Relatório integrado</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtradas.length} devoluções · página {pagina} de {totalPaginas}
            </p>
          </div>
          <Input
            placeholder="Buscar por ID, modelo, pedido…"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            className="h-8 w-full max-w-xs text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Data</TableHead>
                <TableHead>Empresa · Plataforma</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.map((d) => {
                const principal = d.itens[0];
                const restante = d.itens.length - 1;
                return (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs text-muted-foreground tabular">{fmtDate(d.createdAt)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="font-medium">{lookup(empresas, d.empresaId)}</div>
                      <div className="text-xs text-muted-foreground">{lookup(plataformas, d.plataformaId)}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.pedidoId || "—"}</TableCell>
                    <TableCell className="text-sm">
                      {principal ? lookup(modelos, principal.modeloId) : "—"}
                      {principal && (
                        <span className="text-muted-foreground"> · {lookup(pecas, principal.pecaId)}</span>
                      )}
                      {restante > 0 && (
                        <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          +{restante}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lookup(motivos, d.motivoId)}</TableCell>
                    <TableCell className="text-right tabular text-sm">{quantidadeTotal(d)}</TableCell>
                    <TableCell className="text-right tabular text-sm font-medium">
                      {d.status === "dispute" ? "R$ 1,00" : fmtBRL(valorEfetivo(d))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {pageData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    Nenhum registro encontrado com esses filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
            <Button variant="ghost" size="sm" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground tabular">
              {pagina} / {totalPaginas}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"rounded-lg border border-border bg-card p-4 shadow-xs " + (className ?? "")}>
      <div className="mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
