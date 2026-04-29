## Objetivo
Deixar o cadastro realmente fluido para operação diária: menos cliques, menos fricção e navegação por teclado previsível.

## Diagnóstico atual
O problema não parece ser só “um bug isolado”. Hoje o fluxo rápido está frágil porque:
- o `QuickSelect` abre automaticamente ao focar, o que atrapalha o `Tab` e dá sensação de foco “se perdendo”;
- o avanço com `Enter` existe só para alguns campos, não para o formulário como um todo;
- o próximo foco é descoberto por varredura genérica do DOM, então a ordem pode ficar inconsistente;
- há mistura de `Input`, `QuickSelect`, botões de status e listas dinâmicas de itens sem uma estratégia única de navegação.

## Plano

### 1) Reconstruir a navegação rápida do formulário
Implementar uma lógica única de navegação para `Registrar devolução`:
- `Enter` em campo simples avança para o próximo campo útil;
- `Enter` em `Select` abre, seleciona e só então avança;
- `Tab` volta a ser nativo e previsível, sem abrir dropdown sozinho;
- setas `↑/↓` ficam restritas ao contexto do select aberto, sem interferir no fluxo geral;
- remover comportamentos que “roubam” foco ou reabrem o select logo após selecionar.

### 2) Tornar a ordem de foco explícita
Em vez de depender só de busca genérica no DOM, definir uma ordem clara de preenchimento para os campos principais:
1. Empresa
2. Plataforma
3. Competência
4. Motivo
5. Tipo de defeito (quando existir)
6. ID do pedido
7. ID da devolução
8. Valor
9. Status
10. Itens
11. Ações finais

Isso evita o `Tab` e o `Enter` irem para lugares inesperados, principalmente quando aparecem campos condicionais.

### 3) Ajustar o `QuickSelect` para data entry real
Refatorar o componente para comportamento mais estável:
- desativar abertura automática ao receber foco como padrão, ou torná-la opcional por tela;
- separar claramente “foco”, “dropdown aberto” e “item selecionado”;
- melhorar o avanço pós-seleção para não depender de timing frágil do Radix;
- evitar que elementos internos/ocultos entrem na sequência de navegação.

### 4) Melhorar produtividade no `Registrar`
Além de corrigir o teclado, otimizar o cadastro para ganhar tempo:
- manter preenchimentos recorrentes entre registros (empresa, plataforma, competência) como já existe, e revisar onde mais faz sentido persistir no próximo cadastro;
- priorizar os campos mais importantes no topo e deixar o resto mais leve visualmente;
- revisar os campos opcionais para não parecer obrigatório preencher tudo;
- melhorar o fluxo de itens para que adicionar item extra não quebre a navegação.

### 5) Aplicar o mesmo padrão em `Pedidos a caminho`
Como essa tela usa o mesmo `QuickSelect`, levar a mesma correção para lá, evitando que o problema reapareça em outro ponto do sistema.

### 6) Validar o fluxo completo no preview
Testar os cenários principais:
- cadastro completo só com teclado;
- cadastro com status que exige ID do pedido;
- cadastro com e sem tipo de defeito;
- múltiplos itens;
- fluxo vindo de “Pedido a caminho”; 
- comportamento em viewport menor, já que você está usando em tela estreita.

## Resultado esperado
Depois dessa rodada, o operador deve conseguir:
- preencher quase tudo sem tirar a mão do teclado;
- usar `Enter` para avançar sem surpresas;
- usar `Tab` normalmente quando quiser pular;
- selecionar opções com setas de forma consistente;
- registrar devoluções em menos tempo e com menos erro.

## Detalhes técnicos
Arquivos mais prováveis:
- `src/components/QuickSelect.tsx`
- `src/pages/Registrar.tsx`
- `src/pages/ACaminho.tsx`

Implementação prevista:
- refatorar o `QuickSelect` para não abrir no `focus` por padrão;
- criar uma navegação mais determinística entre campos, em vez de depender apenas do DOM scan atual;
- padronizar handlers de teclado entre `Input` e `QuickSelect`;
- revisar elementos marcados com `data-skip-focus` e o impacto deles na sequência;
- ajustar os campos condicionais para entrarem e saírem da ordem sem quebrar o avanço.

## Entrega
Se você aprovar, eu faço a correção já com foco em duas coisas ao mesmo tempo:
1. consertar o teclado de verdade;
2. deixar o cadastro mais rápido e menos chato de preencher.