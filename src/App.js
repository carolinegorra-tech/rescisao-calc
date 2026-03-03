import { useState, useEffect, useRef } from "react";

const SM = 1518.0;
const DSR = 0.0605;

const V = {
  saldoSalario:          { l: "Saldo de Salário",                    i: "💰", d: "Dias trabalhados no mês da rescisão (sal÷30 × dias)" },
  avisoIndenizado:       { l: "Aviso Prévio Indenizado",             i: "📅", d: "30d + 3d/ano completo (máx 90d) — Lei 12.506/2011" },
  decimoTerceiro:        { l: "13º Salário Proporcional",            i: "🎄", d: "Meses no ano ÷ 12, c/ projeção do aviso prévio" },
  feriasProporcionais:   { l: "Férias Proporcionais + ⅓",            i: "🏖️", d: "Meses desde último per. aquisitivo × 4/3" },
  feriasVencidas:        { l: "Férias Vencidas + ⅓",                 i: "⏰", d: "Períodos aquisitivos não gozados × sal × 4/3" },
  feriasEmDobro:         { l: "Férias em Dobro (Art. 137)",          i: "⚠️", d: "Período concessivo expirado → dobro + ⅓" },
  multaFGTS:             { l: "Multa 40% FGTS",                      i: "🏦", d: "40% sobre saldo FGTS + 8% s/ saldo sal, aviso e 13º (férias indenizadas não incidem)" },
  horasExtras:           { l: "Horas Extras",                        i: "⏱️", d: "Sal÷220 × (1+%) × média mensal × meses" },
  adicInsalubridade:     { l: "Adicional de Insalubridade",          i: "☣️", d: "10/20/40% do SM × meses" },
  adicPericulosidade:    { l: "Adicional de Periculosidade",         i: "⚡", d: "30% do salário-base × meses" },
  adicNoturno:           { l: "Adicional Noturno",                   i: "🌙", d: "20% sobre hora normal (22h–5h) × meses" },
  intervaloIntrajornada: { l: "Intervalo Intrajornada Suprimido",    i: "🍽️", d: "Período suprimido + 50% — Art. 71 §4º CLT" },
  salarioFamilia:        { l: "Salário-Família",                     i: "👨‍👩‍👧", d: "R$65,00/filho ≤14a (sal ≤ R$1.906,04) × meses" },
  gratificacao:          { l: "Gratificação",                        i: "🎁", d: "Valores habituais pagos pelo empregador" },
  gorjetas:              { l: "Gorjetas",                            i: "🍷", d: "Valores recebidos a título de gorjeta" },
  comissao:              { l: "Comissão",                            i: "📈", d: "Valores recebidos a título de comissão" },
  reflexoDSR:            { l: "Reflexo DSR s/ Variável",             i: "📊", d: "6,05% sobre parcelas variáveis" },
  plrProporcional:       { l: "PLR Proporcional",                    i: "💵", d: "Extraído dos docs — valor anual ÷ 12 × meses" },
  estabilidade:          { l: "Indenização por Estabilidade",        i: "🛡️", d: "Extraído dos docs — salários do período restante" },
  multaArt467:           { l: "Multa Art. 467 CLT",                  i: "⚖️", d: "50% verbas incontroversas na 1ª audiência" },
  multaArt477:           { l: "Multa Art. 477 CLT",                  i: "📜", d: "1 salário se atraso no pagamento rescisório" },
  indenizacaoArt9:       { l: "Inden. Art. 9º Lei 7.238/84",        i: "🔒", d: "1 salário se dispensa 30d antes da data-base" },
  fgtsDepositoRescisorio:{ l: "FGTS 8% sobre Rescisórias",          i: "🏦", d: "8% sobre saldo sal. + aviso + 13º → acresce ao saldo FGTS" },
  contribPrevidenciaria: { l: "Contribuição Previdenciária",         i: "🏛️", d: "Patronal sobre verbas de natureza salarial" },
};

const TIPOS = {
  sem_justa_causa: "Dispensa Sem Justa Causa",
  pedido_demissao: "Pedido de Demissão",
  justa_causa: "Dispensa por Justa Causa",
  mutuo_acordo: "Rescisão por Mútuo Acordo",
};

const EDIT_FIELDS = [
  { key: "saldoFGTS", label: "Saldo FGTS (R$)", type: "number" },
  { key: "horasExtrasMensais", label: "Horas Extras Média/Mês", type: "number" },
  { key: "horasExtrasPercentual", label: "% Adicional HE", type: "number", placeholder: "50 ou 100" },
  { key: "horasNoturnasMensais", label: "Horas Noturnas Média/Mês", type: "number" },
  { key: "intervaloSuprimidoMinutos", label: "Intervalo Suprimido (min/dia)", type: "number" },
  { key: "diasIntervaloSuprimido", label: "Dias c/ Intervalo Suprimido", type: "number" },
  { key: "insalubridadeGrau", label: "Insalubridade", type: "select", options: { "": "Nenhuma", minimo: "Mínimo (10%)", medio: "Médio (20%)", maximo: "Máximo (40%)" } },
  { key: "periculosidade", label: "Periculosidade (30%)", type: "bool" },
  { key: "filhosMenores", label: "Filhos ≤14 anos", type: "number" },
  { key: "gratificacaoMensal", label: "Gratificação Média/Mês (R$)", type: "number" },
  { key: "gorjetasMensais", label: "Gorjetas Média/Mês (R$)", type: "number" },
  { key: "comissaoMensal", label: "Comissão Média/Mês (R$)", type: "number" },
  { key: "plrAnual", label: "PLR Anual (R$)", type: "number" },
  { key: "plrMesesTrabalhados", label: "Meses Trab. no Período PLR", type: "number" },
  { key: "estabilidadeTipo", label: "Estabilidade", type: "select", options: { "": "Nenhuma", gestante: "Gestante", cipa: "CIPA", acidentado: "Acidentado" } },
  { key: "estabilidadeMesesRestantes", label: "Meses Restantes Estabilidade", type: "number" },
  { key: "atrasoPagamento", label: "Atraso no Pagamento Rescisório", type: "bool" },
  { key: "dispensaPreDataBase", label: "Dispensa nos 30d Pré Data-Base", type: "bool" },
];

// TIMEZONE-SAFE date parsing: "YYYY-MM-DD" -> {y, m, d} where m is 1-indexed
function pD(s) { const p = s.split("-").map(Number); return { y: p[0], m: p[1], d: p[2] }; }

function mB(a, b) {
  const s = pD(a), e = pD(b);
  let m = (e.y - s.y) * 12 + (e.m - s.m);
  if (e.d >= 15) m++;
  return Math.max(m, 0);
}

function avD(m) { return Math.min(30 + Math.floor(m / 12) * 3, 90); }
function fmt(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0); }

function calc(f, dd) {
  const sal = parseFloat(f.salario) || 0;
  const dem = pD(f.dataDemissao);
  const adm = pD(f.dataAdmissao);
  const meses = mB(f.dataAdmissao, f.dataDemissao);
  const dias = dem.d;
  const sd = sal / 30, sh = sal / 220;
  const t = f.tipoRescisao;
  const sjc = t === "sem_justa_causa", ac = t === "mutuo_acordo", jc = t === "justa_causa";
  const dav = sjc ? avD(meses) : ac ? avD(meses) : 0;
  const d = dd || {};
  const r = {};

  // Variavel: determinar remuneracao (sal + media variavel)
  const varTipos = (dd && dd.tiposVariavel) || [];
  const temComissao = varTipos.includes("comissao") || varTipos.includes("grat_mensal");
  const temGratAjust = varTipos.includes("grat_ajustada");
  const gratSemestral = (dd && dd.gratAjustadaPeriod === "semestral");
  
  // Media mensal do variavel
  let mediaVar = 0;
  if (temComissao) mediaVar += parseFloat((dd && dd.comissaoMedia12) || 0);
  if (temGratAjust) mediaVar += parseFloat((dd && dd.gratAjustadaTotal) || 0) / 12;
  
  // Remuneracao = sal + media (para verbas que usam rem como base)
  const rem = sal + mediaVar;
  
  // Para ferias/aviso: so usa rem se variavel mensal OU grat semestral+
  // Se grat anual: so impacta 13o
  const remFerias = (temComissao || gratSemestral) ? rem : sal;
  const rem13 = (mediaVar > 0) ? rem : sal;
  
  // FGTS estimado usa rem (empregador depositava 8% sobre remuneracao)
  const remFGTS = (mediaVar > 0) ? rem : sal;

  r.saldoSalario = sd * dias;
  const sdRem = remFerias / 30;
  r.avisoIndenizado = sjc ? sdRem * dav : ac ? sdRem * dav * 0.5 : 0;

  // 13o: count from admission month if same year, otherwise from January (m=1)
  if (!jc) {
    const inicio = (adm.y === dem.y) ? adm.m : 1;
    let m13 = (dem.m - inicio + 1) + ((sjc || ac) ? Math.floor(dav / 30) : 0);
    m13 = Math.max(0, Math.min(m13, 12));
    r.decimoTerceiro = (rem13 / 12) * m13;
  } else r.decimoTerceiro = 0;

  // Ferias proporcionais: months since last contract anniversary
  if (!jc) {
    let anivAno = dem.y;
    if (dem.m < adm.m || (dem.m === adm.m && dem.d < adm.d)) anivAno--;
    let mf = (dem.y - anivAno) * 12 + (dem.m - adm.m);
    if (dem.m < adm.m) mf = dem.m + 12 - adm.m;
    if (anivAno === dem.y) mf = dem.m - adm.m;
    if (mf < 0) mf += 12;
    mf += ((sjc || ac) ? Math.floor(dav / 30) : 0);
    mf = Math.max(0, Math.min(mf, 12));
    r.feriasProporcionais = ((remFerias / 12) * mf) * (4 / 3);
  } else r.feriasProporcionais = 0;

  const qtdF = parseInt(f.feriasVencidasQtd) || (f.feriasVencidas ? 1 : 0);
  r.feriasVencidas = remFerias * (4 / 3) * qtdF;

  const qtdDobro = parseInt(f.feriasEmDobroQtd) || 0;
  r.feriasEmDobro = remFerias * (4 / 3) * qtdDobro;

  r.horasExtras = (d.horasExtrasMensais > 0) ? sh * (1 + (d.horasExtrasPercentual || 50) / 100) * d.horasExtrasMensais * meses : 0;
  r.adicInsalubridade = d.insalubridadeGrau ? SM * ({ minimo: .1, medio: .2, maximo: .4 }[d.insalubridadeGrau] || 0) * meses : 0;
  r.adicPericulosidade = d.periculosidade ? sal * 0.30 * meses : 0;
  r.adicNoturno = (d.horasNoturnasMensais > 0) ? sh * 0.20 * d.horasNoturnasMensais * meses : 0;

  if (d.intervaloSuprimidoMinutos > 0) {
    r.intervaloIntrajornada = sh * 1.5 * (d.intervaloSuprimidoMinutos / 60) * (d.diasIntervaloSuprimido || meses * 22);
  } else r.intervaloIntrajornada = 0;

  r.salarioFamilia = (d.filhosMenores > 0 && sal <= 1906.04) ? 65.00 * d.filhosMenores * meses : 0;
  r.gratificacao = (d.gratificacaoMensal > 0) ? d.gratificacaoMensal * meses : 0;
  r.gorjetas = (d.gorjetasMensais > 0) ? d.gorjetasMensais * meses : 0;
  r.comissao = (d.comissaoMensal > 0) ? d.comissaoMensal * meses : 0;

  // FGTS: na rescisao, 8% incide sobre saldo salario, aviso previo e 13o proporcional
  const fgtsSobreRescisao = (r.saldoSalario + r.avisoIndenizado + r.decimoTerceiro) * 0.08;
  let fgtsTotal;
  if (d.saldoFGTS != null) {
    fgtsTotal = d.saldoFGTS + fgtsSobreRescisao;
  } else {
    fgtsTotal = (remFGTS * 0.08 * meses) + fgtsSobreRescisao;
  }
  r.multaFGTS = sjc ? fgtsTotal * 0.40 : ac ? fgtsTotal * 0.20 : 0;

  const varT = (r.horasExtras || 0) + (r.gorjetas || 0) + (r.comissao || 0) + (r.adicNoturno || 0);
  r.reflexoDSR = varT * DSR;

  if (d.plrAnual > 0) {
    r.plrProporcional = (d.plrAnual / 12) * (d.plrMesesTrabalhados || dem.m);
  } else r.plrProporcional = 0;

  if (d.estabilidadeTipo && d.estabilidadeMesesRestantes > 0) {
    r.estabilidade = sal * d.estabilidadeMesesRestantes;
  } else r.estabilidade = 0;

  r.multaArt467 = 0;
  r.multaArt477 = d.atrasoPagamento ? sal : 0;
  r.indenizacaoArt9 = d.dispensaPreDataBase ? sal : 0;

  // FGTS deposito sobre verbas rescisorias (valor que acresce ao saldo)
  r.fgtsDepositoRescisorio = f.calcEncargos ? fgtsSobreRescisao : 0;

  // Contribuicao previdenciaria patronal
  if (f.calcEncargos) {
    const percPrev = parseFloat(f.percPrevidencia || 28.8) / 100;
    const basePrevidencia = r.saldoSalario + r.avisoIndenizado + r.decimoTerceiro +
      (r.horasExtras || 0) + (r.adicInsalubridade || 0) + (r.adicPericulosidade || 0) +
      (r.adicNoturno || 0) + (r.comissao || 0) + (r.gorjetas || 0) + (r.gratificacao || 0);
    r.contribPrevidenciaria = basePrevidencia * percPrev;
  } else {
    r.contribPrevidenciaria = 0;
  }

  return r;
}

const EXTRACT_PROMPT = 'Voce e um extrator de dados trabalhistas brasileiros. Analise planilhas/holerites/ponto/FGTS e retorne APENAS JSON sem backticks. Se nao encontrar um campo, retorne null. NUNCA invente valores.\n{"saldoFGTS":null,"horasExtrasMensais":null,"horasExtrasPercentual":null,"insalubridadeGrau":null,"periculosidade":false,"horasNoturnasMensais":null,"intervaloSuprimidoMinutos":null,"diasIntervaloSuprimido":null,"filhosMenores":null,"gratificacaoMensal":null,"gorjetasMensais":null,"comissaoMensal":null,"plrAnual":null,"plrMesesTrabalhados":null,"estabilidadeTipo":null,"estabilidadeMesesRestantes":null,"atrasoPagamento":false,"dispensaPreDataBase":false}\nDADOS:\n';

async function aiParse(text) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: EXTRACT_PROMPT + text }] }),
    });
    const j = await r.json();
    return JSON.parse((j.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim());
  } catch (e) { console.error(e); return null; }
}

async function aiAnalysis(verbas, f, hasDoc, dd) {
  const total = Object.values(verbas).reduce((a, b) => a + b, 0);
  const m = mB(f.dataAdmissao, f.dataDemissao);
  const prompt = "Advogado trabalhista senior. Resumo executivo PT-BR desta rescisao. Direto, profissional, destaque riscos.\n" +
    "Admissao: " + f.dataAdmissao + " | Demissao: " + f.dataDemissao + " | Sal: R$" + f.salario + " | " + m + "m | " + TIPOS[f.tipoRescisao] + "\n" +
    "Ferias vencidas: " + (f.feriasVencidas ? "Sim" : "Nao") + " | Docs: " + (hasDoc ? "Sim (validados)" : "Nao") + "\n" +
    (hasDoc ? "Extraido e validado: " + JSON.stringify(dd) + "\n" : "") +
    "Verbas>0: " + Object.entries(verbas).filter(([_, v]) => v > 0).map(([k, v]) => (V[k]?.l || k) + ": R$" + v.toFixed(2)).join(" | ") + "\n" +
    "TOTAL: R$" + total.toFixed(2) + "\n" +
    (!hasDoc ? "ESTIMATIVA sem documentos." : "Dados validados pelo cliente.") +
    "\nMax 8 linhas. Sem saudacao.";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const j = await r.json();
    return j.content?.find(b => b.type === "text")?.text || "Análise indisponível.";
  } catch { return "Não foi possível gerar a análise."; }
}

function AV({ value, delay = 0 }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const s = Date.now();
      const go = () => { const p = Math.min((Date.now() - s) / 600, 1); setD(value * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(go); };
      go();
    }, delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return <span>{fmt(d)}</span>;
}

function Dots({ c }) {
  return <div style={{ display: "flex", gap: 5 }}>{[0,1,2,3,4].map(i => <div key={i} style={{ width: i <= c ? 24 : 16, height: 4, borderRadius: 2, background: i <= c ? "linear-gradient(90deg,#1a5276,#2980b9)" : "#d5dbe0", transition: "all .35s" }} />)}</div>;
}

function F({ label, type, value, onChange, placeholder, select, options }) {
  return (<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
    {select ? <select value={value} onChange={e => onChange(e.target.value)}>{Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      : <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />}
  </div>);
}

function Info({ bg, bc, icon, children }) {
  return <div style={{ padding: "11px 15px", borderRadius: 10, border: "1px solid " + bc, display: "flex", gap: 8, alignItems: "flex-start", background: bg }}>
    <span>{icon}</span><div style={{ fontSize: 12, lineHeight: 1.5 }}>{children}</div>
  </div>;
}


const METODOLOGIA = {
  saldoSalario: "(Sal / 30) x dias trabalhados no mes da rescisao",
  avisoIndenizado: "(Sal / 30) x (30 + 3/ano, max 90d) - Lei 12.506/2011",
  decimoTerceiro: "(Sal / 12) x meses no ano da demissao + projecao do aviso",
  feriasProporcionais: "(Sal / 12) x meses desde ultimo aniversario x 4/3 + aviso",
  feriasVencidas: "Sal x 4/3 x qtd periodos nao gozados",
  feriasEmDobro: "Art. 137 CLT: Sal x 4/3 por periodo com concessivo expirado",
  multaFGTS: "(Saldo FGTS + 8% s/ saldo sal, aviso e 13o) x 40% (ou 20%)",
  horasExtras: "(Sal / 220) x (1 + %) x media mensal x meses",
  adicInsalubridade: "SM x grau (10/20/40%) x meses - Art. 192 CLT",
  adicPericulosidade: "Sal x 30% x meses - Art. 193 CLT",
  adicNoturno: "(Sal / 220) x 20% x h noturnas/mes x meses - Art. 73 CLT",
  intervaloIntrajornada: "(Sal / 220) x 1,5 x h suprimidas/dia x dias - Art. 71",
  salarioFamilia: "R$65/filho ate 14a (sal ate R$1.906,04) x meses",
  gratificacao: "Media mensal x meses",
  gorjetas: "Media mensal x meses",
  comissao: "Media mensal x meses",
  reflexoDSR: "6,05% sobre variaveis (HE+gorjetas+comissoes+ad.noturno)",
  plrProporcional: "PLR anual / 12 x meses no periodo",
  estabilidade: "Sal x meses restantes (gestante/CIPA/acidentado)",
  multaArt467: "50% verbas incontroversas - Art. 467 CLT",
  multaArt477: "1 salario se atraso - Art. 477 CLT",
  indenizacaoArt9: "1 salario se dispensa 30d antes data-base - Lei 7.238/84",
};

async function exportExcel(res, f, dd) {
  if (!window.XLSX) {
    await new Promise(r => {
      const sc = document.createElement("script");
      sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      sc.onload = r; sc.onerror = r; document.head.appendChild(sc);
    });
  }
  const X = window.XLSX;
  if (!X) return;
  const rows = [
    ["RESCISAOCALC - DEMONSTRATIVO DE VERBAS RESCISORIAS"],
    [],
    ["DADOS DO CONTRATO"],
    ["Admissao", f.dataAdmissao],
    ["Demissao", f.dataDemissao],
    ["Salario (R$)", parseFloat(f.salario)],
    ["Tipo de Rescisao", TIPOS[f.tipoRescisao]],
    ["Tempo de Servico (meses)", mB(f.dataAdmissao, f.dataDemissao)],
    ["Dados extraidos por IA", dd ? "Sim (validados)" : "Nao"],
    [],
    ["VERBA", "FORMULA / BASE LEGAL", "VALOR (R$)"],
  ];
  const allEntries = Object.entries(res).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of allEntries) {
    rows.push([V[k]?.l || k, METODOLOGIA[k] || "", Math.round(v * 100) / 100]);
  }
  const total = Object.values(res).reduce((a, b) => a + b, 0);
  rows.push([]);
  rows.push(["TOTAL", "", Math.round(total * 100) / 100]);
  rows.push([]);
  rows.push(["Ferramenta de apoio - revisao por advogado habilitado indispensavel."]);
  const ws = X.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 35 }, { wch: 60 }, { wch: 16 }];
  const wb = X.utils.book_new();
  X.utils.book_append_sheet(wb, ws, "Rescisao");
  X.writeFile(wb, "rescisao-" + f.dataDemissao + ".xlsx");
}


function exportXLSX(res, f, dd) {
  const XLSX = window.XLSX;
  if (!XLSX) {
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    sc.onload = () => exportXLSX(res, f, dd);
    document.head.appendChild(sc);
    return;
  }

  const sal = parseFloat(f.salario) || 0;
  const meses = mB(f.dataAdmissao, f.dataDemissao);
  const dem = pD(f.dataDemissao);
  const adm = pD(f.dataAdmissao);
  const dav = avD(meses);
  const d = dd || {};
  const t = f.tipoRescisao;
  const sjc = t === "sem_justa_causa", ac = t === "mutuo_acordo", jc = t === "justa_causa";

  // Remuneracao
  const varTipos = (d.tiposVariavel) || [];
  const temComissao = varTipos.includes("comissao") || varTipos.includes("grat_mensal");
  const temGratAjust = varTipos.includes("grat_ajustada");
  const gratSemestral = d.gratAjustadaPeriod === "semestral";
  let mediaVar = 0;
  if (temComissao) mediaVar += parseFloat(d.comissaoMedia12 || 0);
  if (temGratAjust) mediaVar += parseFloat(d.gratAjustadaTotal || 0) / 12;
  const remVal = sal + mediaVar;
  const remFerias = (temComissao || gratSemestral) ? remVal : sal;
  const rem13 = (mediaVar > 0) ? remVal : sal;
  const remFGTS = (mediaVar > 0) ? remVal : sal;

  // Calc components
  const saldoSal = res.saldoSalario || 0;
  const aviso = res.avisoIndenizado || 0;

  // 13o
  const inicio13 = (adm.y === dem.y) ? adm.m : 1;
  let m13 = (dem.m - inicio13 + 1) + ((sjc || ac) ? Math.floor(dav / 30) : 0);
  m13 = Math.max(0, Math.min(m13, 12));
  const dias13 = Math.round(m13 * 30);
  const val13 = res.decimoTerceiro || 0;

  // Ferias vencidas
  const qtdFV = parseInt(f.feriasVencidasQtd) || (f.feriasVencidas ? 1 : 0);
  const fvBase = qtdFV > 0 ? remFerias * qtdFV : 0;
  const fvTerco = fvBase / 3;
  const fvTotal = fvBase + fvTerco;

  // Ferias proporcionais
  let anivAno = dem.y;
  if (dem.m < adm.m || (dem.m === adm.m && dem.d < adm.d)) anivAno--;
  let mfp = dem.m - adm.m;
  if (anivAno < dem.y) mfp = (dem.y - anivAno) * 12 + (dem.m - adm.m);
  if (dem.m < adm.m) mfp = dem.m + 12 - adm.m;
  if (anivAno === dem.y) mfp = dem.m - adm.m;
  if (mfp < 0) mfp += 12;
  mfp += ((sjc || ac) ? Math.floor(dav / 30) : 0);
  mfp = Math.max(0, Math.min(mfp, 12));
  const fpBase = jc ? 0 : (remFerias / 12) * mfp;
  const fpTerco = fpBase / 3;
  const fpTotal = fpBase + fpTerco;

  // Ferias em dobro
  const qtdDobro = parseInt(f.feriasEmDobroQtd) || 0;
  const fdBase = remFerias * qtdDobro;
  const fdTerco = fdBase / 3;
  const fdTotal = fdBase + fdTerco;

  // FGTS
  const fgtsSobreResc = (saldoSal + aviso + val13) * 0.08;
  const saldoFGTSEstimado = d.saldoFGTS != null ? d.saldoFGTS : (remFGTS * 0.08 * meses);
  const saldoFGTSTotal = saldoFGTSEstimado + fgtsSobreResc;
  const multaFGTS = sjc ? saldoFGTSTotal * 0.40 : ac ? saldoFGTSTotal * 0.20 : 0;

  const r = [
    ["RESCISÃOCALC — DETALHAMENTO DE VERBAS RESCISÓRIAS", "", ""],
    ["", "", ""],
    ["DADOS DO CONTRATO", "", ""],
    ["Data de Admissão", f.dataAdmissao, ""],
    ["Data de Demissão", f.dataDemissao, ""],
    ["Salário Base (R$)", "", sal],
  ];
  if (mediaVar > 0) {
    r.push(["Variável Mensal — média 12m (R$)", "", mediaVar]);
    r.push(["Remuneração = Sal + Variável (R$)", "", remVal]);
    const imp = (temComissao || gratSemestral) ? "aviso, 13º, férias, FGTS" : "apenas 13º";
    r.push(["Impacto da variável", imp, ""]);
  }
  r.push(["Tipo de Rescisão", TIPOS[t], ""]);
  r.push(["Tempo de Serviço (meses)", "", meses]);
  r.push(["Dias de Aviso Prévio", "", dav]);
  r.push(["", "", ""]);

  // === VERBAS RESCISORIAS ===
  r.push(["VERBAS RESCISÓRIAS", "MEMÓRIA DE CÁLCULO", "VALOR (R$)"]);
  r.push(["", "", ""]);

  // Saldo de salario
  r.push(["Saldo de Salário", "R$ " + sal.toFixed(2) + " ÷ 30 × " + dem.d + " dias", saldoSal]);

  // Aviso previo
  if (aviso > 0) {
    const baseAv = remFerias;
    const pctAv = ac ? " × 50%" : "";
    r.push(["Aviso Prévio Indenizado (" + dav + " dias)", "R$ " + baseAv.toFixed(2) + " ÷ 30 × " + dav + " dias" + pctAv, aviso]);
  }

  // Ferias vencidas (separado base + 1/3)
  if (fvTotal > 0) {
    r.push(["Férias Vencidas (" + qtdFV + " período" + (qtdFV > 1 ? "s" : "") + ")", "R$ " + remFerias.toFixed(2) + " × " + qtdFV, fvBase]);
    r.push(["1/3 Constitucional — Férias Vencidas", "R$ " + fvBase.toFixed(2) + " ÷ 3", fvTerco]);
  }

  // Ferias proporcionais (separado base + 1/3)
  if (fpTotal > 0) {
    r.push(["Férias Proporcionais (" + mfp + " meses)", "R$ " + remFerias.toFixed(2) + " ÷ 12 × " + mfp + " meses", fpBase]);
    r.push(["1/3 Constitucional — Férias Proporcionais", "R$ " + fpBase.toFixed(2) + " ÷ 3", fpTerco]);
  }

  // Ferias em dobro (separado base + 1/3)
  if (fdTotal > 0) {
    r.push(["Férias em Dobro — Art. 137 (" + qtdDobro + " período" + (qtdDobro > 1 ? "s" : "") + ")", "R$ " + remFerias.toFixed(2) + " × " + qtdDobro + " (prazo concessivo expirado)", fdBase]);
    r.push(["1/3 Constitucional — Férias em Dobro", "R$ " + fdBase.toFixed(2) + " ÷ 3", fdTerco]);
  }

  // 13o
  if (val13 > 0) {
    r.push(["13º Salário Proporcional (" + m13 + " meses / " + dias13 + " dias)", "R$ " + rem13.toFixed(2) + " ÷ 12 × " + m13 + " meses (inc. projeção aviso)", val13]);
  }

  // Outras verbas
  if (res.horasExtras > 0) r.push(["Horas Extras", "(R$ " + sal.toFixed(2) + " ÷ 220) × " + (1 + (d.horasExtrasPercentual || 50) / 100).toFixed(2) + " × " + (d.horasExtrasMensais || 0) + "h/mês × " + meses + "m", res.horasExtras]);
  if (res.adicInsalubridade > 0) r.push(["Adicional de Insalubridade", "SM R$ " + SM.toFixed(2) + " × " + ({minimo:"10%",medio:"20%",maximo:"40%"}[d.insalubridadeGrau] || "") + " × " + meses + "m", res.adicInsalubridade]);
  if (res.adicPericulosidade > 0) r.push(["Adicional de Periculosidade", "R$ " + sal.toFixed(2) + " × 30% × " + meses + "m", res.adicPericulosidade]);
  if (res.adicNoturno > 0) r.push(["Adicional Noturno", "(R$ " + sal.toFixed(2) + " ÷ 220) × 20% × " + (d.horasNoturnasMensais || 0) + "h/mês × " + meses + "m", res.adicNoturno]);
  if (res.intervaloIntrajornada > 0) r.push(["Intervalo Intrajornada Suprimido", "(R$ " + sal.toFixed(2) + " ÷ 220) × 1,5 × " + ((d.intervaloSuprimidoMinutos || 0)/60).toFixed(2) + "h/dia × " + (d.diasIntervaloSuprimido || meses*22) + " dias", res.intervaloIntrajornada]);
  if (res.salarioFamilia > 0) r.push(["Salário-Família", "R$ 65,00 × " + (d.filhosMenores || 0) + " filho(s) × " + meses + "m", res.salarioFamilia]);
  if (res.gratificacao > 0) r.push(["Gratificação", "R$ " + (d.gratificacaoMensal || 0).toFixed(2) + "/mês × " + meses + "m", res.gratificacao]);
  if (res.gorjetas > 0) r.push(["Gorjetas", "R$ " + (d.gorjetasMensais || 0).toFixed(2) + "/mês × " + meses + "m", res.gorjetas]);
  if (res.comissao > 0) r.push(["Comissão", "R$ " + (d.comissaoMensal || 0).toFixed(2) + "/mês × " + meses + "m", res.comissao]);
  if (res.reflexoDSR > 0) r.push(["Reflexo DSR 6,05%", "6,05% sobre variáveis (HE + gorjetas + comissões + ad. noturno)", res.reflexoDSR]);
  if (res.plrProporcional > 0) r.push(["PLR Proporcional", "R$ " + (d.plrAnual || 0).toFixed(2) + " ÷ 12 × " + (d.plrMesesTrabalhados || dem.m) + "m", res.plrProporcional]);
  if (res.estabilidade > 0) r.push(["Indenização por Estabilidade", "R$ " + sal.toFixed(2) + " × " + (d.estabilidadeMesesRestantes || 0) + " meses restantes", res.estabilidade]);
  if (res.multaArt477 > 0) r.push(["Multa Art. 477 §8º CLT", "1 salário — atraso pagamento rescisório", res.multaArt477]);
  if (res.multaArt467 > 0) r.push(["Multa Art. 467 CLT", "50% verbas incontroversas", res.multaArt467]);
  if (res.indenizacaoArt9 > 0) r.push(["Inden. Art. 9º Lei 7.238/84", "1 salário — dispensa 30d antes da data-base", res.indenizacaoArt9]);

  // Subtotal verbas
  const subtotalVerbas = saldoSal + aviso + fvTotal + fpTotal + fdTotal + val13 +
    (res.horasExtras || 0) + (res.adicInsalubridade || 0) + (res.adicPericulosidade || 0) +
    (res.adicNoturno || 0) + (res.intervaloIntrajornada || 0) + (res.salarioFamilia || 0) +
    (res.gratificacao || 0) + (res.gorjetas || 0) + (res.comissao || 0) + (res.reflexoDSR || 0) +
    (res.plrProporcional || 0) + (res.estabilidade || 0) + (res.multaArt477 || 0) +
    (res.multaArt467 || 0) + (res.indenizacaoArt9 || 0);

  r.push(["", "", ""]);
  r.push(["SUBTOTAL VERBAS RESCISÓRIAS", "", subtotalVerbas]);

  // === ENCARGOS ===
  r.push(["", "", ""]);
  r.push(["ENCARGOS", "MEMÓRIA DE CÁLCULO", "VALOR (R$)"]);
  r.push(["", "", ""]);

  // Contribuicao previdenciaria
  const percPrev = parseFloat(f.percPrevidencia || 28.8);
  const basePrevidencia = saldoSal + aviso + val13 +
    (res.horasExtras || 0) + (res.adicInsalubridade || 0) + (res.adicPericulosidade || 0) +
    (res.adicNoturno || 0) + (res.comissao || 0) + (res.gorjetas || 0) + (res.gratificacao || 0);
  const contribPrev = f.calcEncargos ? basePrevidencia * (percPrev / 100) : 0;
  r.push(["Contribuição Previdenciária Patronal (" + percPrev + "%)", percPrev + "% × base salarial R$ " + basePrevidencia.toFixed(2) + " (saldo sal + aviso + 13º + HE + adicionais + comissões — férias não incidem)", contribPrev]);

  // FGTS
  r.push(["", "", ""]);
  r.push(["Saldo FGTS " + (d.saldoFGTS != null ? "(real)" : "(estimado)"), d.saldoFGTS != null ? "Extrato informado" : "R$ " + remFGTS.toFixed(2) + " × 8% × " + meses + " meses", saldoFGTSEstimado]);
  r.push(["FGTS 8% sobre Verbas Rescisórias (depósito)", "8% × (saldo sal. R$ " + saldoSal.toFixed(2) + " + aviso R$ " + aviso.toFixed(2) + " + 13º R$ " + val13.toFixed(2) + ")", fgtsSobreResc]);
  r.push(["Saldo FGTS Total (acumulado + rescisório)", "R$ " + saldoFGTSEstimado.toFixed(2) + " + R$ " + fgtsSobreResc.toFixed(2), saldoFGTSTotal]);

  if (multaFGTS > 0) {
    const pctMulta = ac ? "20%" : "40%";
    r.push(["Multa " + pctMulta + " FGTS", "R$ " + saldoFGTSTotal.toFixed(2) + " × " + pctMulta, multaFGTS]);
  }

  // === TOTAL GERAL ===
  const totalCost = subtotalVerbas + contribPrev + fgtsSobreResc + multaFGTS;
  r.push(["", "", ""]);
  r.push(["", "", ""]);
  r.push(["CUSTO TOTAL DA RESCISÃO", "", totalCost]);
  r.push(["", "", ""]);
  r.push(["Gerado por RescisãoCalc — Ferramenta de apoio. Revisão por advogado habilitado indispensável.", "", ""]);

  const ws = XLSX.utils.aoa_to_sheet(r);
  ws["!cols"] = [{ wch: 48 }, { wch: 85 }, { wch: 20 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Verbas Rescisórias");
  XLSX.writeFile(wb, "rescisao_detalhamento.xlsx");
}

export default function App() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ dataAdmissao: "", dataDemissao: "", salario: "", feriasVencidas: false, feriasVencidasQtd: "1", feriasEmDobroQtd: "0", tipoRescisao: "sem_justa_causa", temVariavel: false, tiposVariavel: [], comissaoMedia12: "", gratAjustadaTotal: "", gratAjustadaPeriod: "", variavelMediaMensal: "", percPrevidencia: "28.8", calcEncargos: false });
  const [files, setFiles] = useState([]);
  const [dd, setDD] = useState(null);
  const [editDD, setEditDD] = useState(null);
  const [res, setRes] = useState(null);
  const [ai, setAi] = useState("");
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const ref = useRef(null);

  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const ok = f.dataAdmissao && f.dataDemissao && f.salario;
  const hF = fl => setFiles(p => [...p, ...Array.from(fl).filter(x => /\.(xlsx|xls|csv|pdf)$/i.test(x.name))]);

  const readXL = async file => new Promise(res => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const X = window.XLSX; if (!X) { res(""); return; }
        const wb = X.read(new Uint8Array(e.target.result), { type: "array" });
        let t = ""; wb.SheetNames.forEach(n => { t += "\n=== " + n + " ===\n" + X.utils.sheet_to_csv(wb.Sheets[n]); });
        res(t);
      } catch { res(""); }
    }; r.readAsArrayBuffer(file);
  });

  const parseDocuments = async () => {
    setStep(2); let ext = null;
    if (files.length > 0) {
      if (!window.XLSX) {
        setMsg("Carregando leitor...");
        await new Promise(r => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; sc.onload = r; sc.onerror = r; document.head.appendChild(sc); });
      }
      setMsg("Lendo planilhas...");
      let all = "";
      for (const x of files) { if (/\.(xlsx|xls|csv)$/i.test(x.name)) all += "\n--- " + x.name + " ---\n" + await readXL(x); }
      if (all.trim()) { setMsg("IA analisando documentos..."); ext = await aiParse(all.substring(0, 15000)); }
    }
    if (ext) {
      const merged = { ...ext, tiposVariavel: f.tiposVariavel || [], comissaoMedia12: f.comissaoMedia12, gratAjustadaTotal: f.gratAjustadaTotal, gratAjustadaPeriod: f.gratAjustadaPeriod };
      setDD(merged); setEditDD({ ...merged }); setStep(3);
    }
    else { setDD(null); setEditDD(null); await runCalc({ tiposVariavel: f.tiposVariavel || [], comissaoMedia12: f.comissaoMedia12, gratAjustadaTotal: f.gratAjustadaTotal, gratAjustadaPeriod: f.gratAjustadaPeriod }); }
  };

  const runCalc = async (docData) => {
    setStep(2); setMsg("Calculando 22 verbas...");
    await new Promise(r => setTimeout(r, 400));
    const verbas = calc(f, docData);
    setRes(verbas); setStep(4);
  };

  const confirmAndCalc = () => {
    const merged = { ...editDD, tiposVariavel: f.tiposVariavel || [], comissaoMedia12: f.comissaoMedia12, gratAjustadaTotal: f.gratAjustadaTotal, gratAjustadaPeriod: f.gratAjustadaPeriod };
    setDD(merged); runCalc(merged);
  };
  const updateField = (key, val) => setEditDD(p => ({ ...p, [key]: val }));
  const reset = () => { setStep(0); setF({ dataAdmissao: "", dataDemissao: "", salario: "", feriasVencidas: false, feriasVencidasQtd: "1", feriasEmDobroQtd: "0", tipoRescisao: "sem_justa_causa", temVariavel: false, tiposVariavel: [], comissaoMedia12: "", gratAjustadaTotal: "", gratAjustadaPeriod: "", variavelMediaMensal: "", percPrevidencia: "28.8", calcEncargos: false }); setFiles([]); setDD(null); setEditDD(null); setRes(null); setAi(""); };

  const total = res ? Object.values(res).reduce((a, b) => a + b, 0) : 0;
  const pos = res ? Object.entries(res).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]) : [];
  const zero = res ? Object.entries(res).filter(([_, v]) => v === 0) : [];

  const CSS = '<style>' +
    "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');" +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    '::selection{background:#1a5276;color:#e8f4fd}' +
    "input,select{font-family:'Source Sans 3',sans-serif;font-size:15px;padding:12px 14px;border:1.5px solid #cbd5e0;border-radius:10px;background:#f8fafb;color:#1a2d3d;width:100%;transition:all .2s;outline:none}" +
    'input:focus,select:focus{border-color:#2980b9;background:#fff;box-shadow:0 0 0 3px rgba(41,128,185,.1)}' +
    '@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}' +
    '@keyframes slideR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}' +
    '@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}' +
    '@keyframes spin{to{transform:rotate(360deg)}}' +
    ".btn{font-family:'Source Sans 3',sans-serif;font-size:14px;font-weight:600;padding:13px 26px;border:none;border-radius:10px;cursor:pointer;transition:all .2s;letter-spacing:.2px}" +
    '.btn:disabled{opacity:.3;cursor:not-allowed}' +
    '.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1)}' +
    '.row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #edf0f3;gap:12px}' +
    '.row:last-child{border-bottom:none}' +
    'details summary{list-style:none}details summary::-webkit-details-marker{display:none}' +
    '.toggle{width:40px;height:22px;border-radius:11px;cursor:pointer;position:relative;transition:all .2s;border:none}' +
    ".toggle::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:3px;transition:all .2s}" +
    '.toggle.on{background:#2980b9}.toggle.on::after{left:21px}' +
    '.toggle.off{background:#cbd5e0}.toggle.off::after{left:3px}' +
    '</style>';

  return (
    <div style={S.wrap}>
      <div dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={S.ctn}>
        <div style={S.hdr}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 24 }}>⚖️</span>
            <div>
              <div style={S.logo}>Rescisão<span style={{ color: "#2980b9" }}>Calc</span></div>
              <div style={{ fontSize: 9, color: "#7f8c9b", letterSpacing: .7, textTransform: "uppercase" }}>22 Verbas · Parser IA</div>
            </div>
          </div>
          <Dots c={step} />
        </div>

        {step === 0 && (<div style={{ animation: "fadeUp .4s ease both" }}>
          <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
            <h1 style={S.ttl}>Calculadora de <span style={{ color: "#2980b9", textDecoration: "underline", textDecorationColor: "#2980b9", textUnderlineOffset: "4px" }}>verbas rescisórias</span></h1>
            <p style={{ fontSize: 14, color: "#5a7080", maxWidth: 490, margin: "10px auto 16px", lineHeight: 1.6 }}>22 verbas. Anexe planilhas em qualquer formato. A IA extrai os dados e você valida antes do cálculo.</p>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
              {["22 Verbas", "Parser IA", "Validação", "FGTS Real", "DSR 6,05%", "Art. 137"].map((t, i) => (
                <span key={t} style={{ ...S.tag, animation: "fadeUp .3s ease " + (.07 * i) + "s both" }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <h2 style={S.ch}>📋 Dados do Contrato</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <F label="Data de Admissão" type="date" value={f.dataAdmissao} onChange={v => s("dataAdmissao", v)} />
              <F label="Data de Demissão" type="date" value={f.dataDemissao} onChange={v => s("dataDemissao", v)} />
              <F label="Salário Atual (R$)" type="number" placeholder="5000.00" value={f.salario} onChange={v => s("salario", v)} />
              <F label="Tipo de Rescisão" select options={TIPOS} value={f.tipoRescisao} onChange={v => s("tipoRescisao", v)} />
            </div>
            <div style={{ marginTop: 16 }}>
              <div onClick={() => s("feriasVencidas", !f.feriasVencidas)} style={{ ...S.chk, borderColor: f.feriasVencidas ? "#2980b9" : "#cbd5e0", background: f.feriasVencidas ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
                <div style={{ ...S.chkB, borderColor: f.feriasVencidas ? "#2980b9" : "#aab4c0", background: f.feriasVencidas ? "#2980b9" : "transparent" }}>
                  {f.feriasVencidas && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d" }}>Férias vencidas?</div>
                  <div style={{ fontSize: 11, color: "#7f8c9b" }}>Períodos aquisitivos não gozados</div>
                </div>
                {f.feriasVencidas && (<div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 11, color: "#5a7080" }}>Qtd:</span>
                  <input type="number" min="1" max="5" value={f.feriasVencidasQtd} onChange={e => s("feriasVencidasQtd", e.target.value)} style={{ width: 48, padding: "5px 7px", fontSize: 12, textAlign: "center" }} />
                  <span style={{ fontSize: 11, color: "#5a7080", marginLeft: 6 }}>Em dobro:</span>
                  <input type="number" min="0" max="5" value={f.feriasEmDobroQtd} onChange={e => s("feriasEmDobroQtd", e.target.value)} style={{ width: 48, padding: "5px 7px", fontSize: 12, textAlign: "center" }} />
                </div>)}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <div onClick={() => s("temVariavel", !f.temVariavel)} style={{ ...S.chk, borderColor: f.temVariavel ? "#2980b9" : "#cbd5e0", background: f.temVariavel ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
                <div style={{ ...S.chkB, borderColor: f.temVariavel ? "#2980b9" : "#aab4c0", background: f.temVariavel ? "#2980b9" : "transparent" }}>
                  {f.temVariavel && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d" }}>Remuneração variável nos últimos 12 meses?</div>
                  <div style={{ fontSize: 11, color: "#7f8c9b" }}>Comissões, gratificações, PLR, prêmios</div>
                </div>
              </div>
              {f.temVariavel && (<div style={{ marginTop: 10, padding: "14px", background: "#f8fafb", borderRadius: 9, border: "1px solid #e4eaf0" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Tipos de variável recebido</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[["plr","PLR"],["premio","Prêmio"],["comissao","Comissões"],["grat_mensal","Gratif. ajustada mensal"],["grat_ajustada","Gratif. ajustada (total)"]].map(([k,l]) => {
                    const sel = (f.tiposVariavel || []).includes(k);
                    return <div key={k} onClick={() => {
                      const cur = f.tiposVariavel || [];
                      s("tiposVariavel", sel ? cur.filter(x => x !== k) : [...cur, k]);
                    }} style={{ padding: "6px 12px", borderRadius: 16, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1.5px solid " + (sel ? "#2980b9" : "#cbd5e0"), background: sel ? "rgba(41,128,185,.08)" : "#fff", color: sel ? "#1a5276" : "#5a7080", transition: "all .2s" }}>{l}</div>;
                  })}
                </div>
                {((f.tiposVariavel || []).includes("comissao") || (f.tiposVariavel || []).includes("grat_mensal")) && (<div style={{ marginTop: 12 }}>
                  <F label="Média mensal (inc. DSR) nos últimos 12m (R$)" type="number" placeholder="Ex: 2500.00" value={f.comissaoMedia12} onChange={v => s("comissaoMedia12", v)} />
                </div>)}
                {(f.tiposVariavel || []).includes("grat_ajustada") && (<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <F label="Valor TOTAL gratificações ajustadas 12m (R$)" type="number" placeholder="Ex: 30000.00" value={f.gratAjustadaTotal} onChange={v => s("gratAjustadaTotal", v)} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Periodicidade do pagamento</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[["semestral","Semestral ou menor"],["anual","Anual"]].map(([k,l]) => {
                        const sel2 = f.gratAjustadaPeriod === k;
                        return <div key={k} onClick={() => s("gratAjustadaPeriod", k)} style={{ padding: "8px 14px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1.5px solid " + (sel2 ? "#2980b9" : "#cbd5e0"), background: sel2 ? "rgba(41,128,185,.08)" : "#fff", color: sel2 ? "#1a5276" : "#5a7080", flex: 1, textAlign: "center" }}>{l}</div>;
                      })}
                    </div>
                    {f.gratAjustadaPeriod === "semestral" && <div style={{ marginTop: 6, fontSize: 10, color: "#1a6b3a", fontWeight: 500 }}>Impacta TUDO: 13º, férias, aviso, FGTS</div>}
                    {f.gratAjustadaPeriod === "anual" && <div style={{ marginTop: 6, fontSize: 10, color: "#c0392b", fontWeight: 500 }}>Impacta SOMENTE o 13º</div>}
                  </div>
                </div>)}
                {(f.tiposVariavel || []).some(t => ["comissao","grat_mensal","grat_ajustada"].includes(t)) && (<div style={{ marginTop: 10, padding: "8px 12px", background: "#e8f4fd", borderRadius: 8, border: "1px solid #b8d8f0", fontSize: 11, color: "#1a5276", lineHeight: 1.5 }}>
                  <strong>Impacto:</strong> A média soma ao salário base = <strong>remuneração</strong>, nova base de cálculo.
                </div>)}
              </div>)}
            </div>
            <div style={{ marginTop: 16 }}>
              <div onClick={() => s("calcEncargos", !f.calcEncargos)} style={{ ...S.chk, borderColor: f.calcEncargos ? "#2980b9" : "#cbd5e0", background: f.calcEncargos ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
                <div style={{ ...S.chkB, borderColor: f.calcEncargos ? "#2980b9" : "#aab4c0", background: f.calcEncargos ? "#2980b9" : "transparent" }}>
                  {f.calcEncargos && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d" }}>Calcular encargos patronais?</div>
                  <div style={{ fontSize: 11, color: "#7f8c9b" }}>FGTS depósito rescisório + contribuição previdenciária (consultivo / RH)</div>
                </div>
              </div>
              {f.calcEncargos && (<div style={{ marginTop: 10, padding: "14px", background: "#f8fafb", borderRadius: 9, border: "1px solid #e4eaf0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "end" }}>
                  <F label="Contribuição previdenciária patronal (%)" type="number" placeholder="28.8" value={f.percPrevidencia} onChange={v => s("percPrevidencia", v)} />
                  <div style={{ fontSize: 10, color: "#7f8c9b", paddingBottom: 14 }}>Padrão: 28,8% (INSS 20% + RAT + terceiros).<br/>Incide sobre saldo sal., aviso, 13º, HE, adicionais e comissões.<br/>Férias indenizadas não incidem.</div>
                </div>
              </div>)}
            </div>
            <div style={{ marginTop: 16, padding: "10px 13px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #e2e6ea", fontSize: 11, color: "#6b7b8d", lineHeight: 1.55 }}>
              <strong>Atenção:</strong> Este calculo não contempla pagamentos previstos em acordo ou convenção coletiva de trabalho (ACT/CCT) e não aplica correção monetária sobre o saldo do FGTS.
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
              <button className="btn" disabled={!ok} style={{ background: ok ? "linear-gradient(135deg,#1a3d5c,#2980b9)" : "#cbd5e0", color: "#fff" }} onClick={() => setStep(1)}>Próximo → Documentos</button>
            </div>
          </div>
        </div>)}

        {step === 1 && (<div style={{ animation: "fadeUp .4s ease both" }}>
          <div style={S.card}>
            <h2 style={S.ch}>Documentos para Análise IA</h2>
            <p style={{ fontSize: 13, color: "#5a7080", marginBottom: 16, lineHeight: 1.6 }}>A IA lê planilhas em <strong>qualquer formato</strong> e extrai os dados. Voce podera <strong>revisar e corrigir</strong> tudo antes do calculo.</p>
            <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); hF(e.dataTransfer.files); }} onClick={() => ref.current?.click()} style={{ border: "2px dashed " + (drag ? "#2980b9" : "#cbd5e0"), borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: drag ? "rgba(41,128,185,.03)" : "#fafbfd", transition: "all .2s" }}>
              <input ref={ref} type="file" multiple accept=".xlsx,.xls,.csv,.pdf" style={{ display: "none" }} onChange={e => hF(e.target.files)} />
              <div style={{ fontSize: 34, marginBottom: 4 }}>{drag ? "📥" : "📎"}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d" }}>Clique ou arraste</div>
              <div style={{ fontSize: 11, color: "#8a96a3", marginTop: 2 }}>Excel, CSV ou PDF</div>
            </div>
            {files.length > 0 && (<div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
              {files.map((x, i) => (<div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "#eef3f8", borderRadius: 8, animation: "slideR .25s ease " + (i * .06) + "s both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 15 }}>{/pdf/i.test(x.name) ? "📕" : "📊"}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d" }}>{x.name}</span>
                  <span style={{ fontSize: 10, color: "#8a96a3" }}>({(x.size / 1024).toFixed(0)}KB)</span>
                </div>
                <button onClick={e => { e.stopPropagation(); setFiles(p => p.filter((_, j) => j !== i)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#8a96a3", padding: "2px 5px" }}>X</button>
              </div>))}
              <Info bg="linear-gradient(135deg,#e8f8f0,#d5f0e3)" bc="#6fcf97" icon="🤖"><span style={{ color: "#1a5c38" }}><strong>Parser IA ativado.</strong> Apos a extracao, você poderá revisar e corrigir todos os dados.</span></Info>
            </div>)}
            {files.length === 0 && (<div style={{ marginTop: 12 }}>
              <Info bg="linear-gradient(135deg,#fef9e7,#fdf2d0)" bc="#f0d060" icon="⚠️"><span style={{ color: "#6b5a10" }}><strong>Sem documentos:</strong> Cálculo será estimativa. Verbas como HE, adicionais, comissões, PLR e estabilidade só são calculadas com documentos.</span></Info>
            </div>)}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
              <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a" }} onClick={() => setStep(0)}>Voltar</button>
              <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff" }} onClick={parseDocuments}>{files.length > 0 ? "🤖 Analisar Documentos" : "⚖️ Calcular Estimativa"}</button>
            </div>
          </div>
        </div>)}

        {step === 2 && (<div style={{ animation: "fadeUp .3s ease both", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 380 }}>
          <div style={{ width: 48, height: 48, border: "3px solid #e0e6ec", borderTopColor: "#2980b9", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
          <div style={{ marginTop: 18, fontSize: 14, fontWeight: 500, color: "#1a2d3d" }}>{msg}</div>
        </div>)}

        {step === 3 && editDD && (<div style={{ animation: "fadeUp .4s ease both" }}>
          <div style={S.card}>
            <h2 style={S.ch}>🔍 Confira os Dados Extraídos</h2>
            <Info bg="linear-gradient(135deg,#e8f0fd,#dae4f8)" bc="#7bafd4" icon="✏️"><span style={{ color: "#1a3d5c" }}>A IA extraiu estes dados dos seus documentos. <strong>Revise e corrija</strong> o que for necessário.</span></Info>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
              {EDIT_FIELDS.map(({ key, label, type, options, placeholder }) => {
                const val = editDD[key];
                const hasValue = val !== null && val !== undefined && val !== "" && val !== false && val !== 0;
                if (type === "bool") return (<div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: val ? "#eef8f2" : "#f8fafb", borderRadius: 8, border: "1px solid " + (val ? "#6fcf97" : "#e8ecf0") }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d" }}>{label}</span>
                  <button className={"toggle " + (val ? "on" : "off")} onClick={() => updateField(key, !val)} />
                </div>);
                if (type === "select") return (<div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
                  <select value={val || ""} onChange={e => updateField(key, e.target.value || null)} style={{ background: hasValue ? "#eef8f2" : undefined, borderColor: hasValue ? "#6fcf97" : undefined }}>{Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                </div>);
                return (<div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
                  <input type="number" placeholder={placeholder || "-"} value={val != null ? val : ""} onChange={e => updateField(key, e.target.value === "" ? null : parseFloat(e.target.value))} style={{ background: hasValue ? "#eef8f2" : undefined, borderColor: hasValue ? "#6fcf97" : undefined }} />
                </div>);
              })}
            </div>
            <div style={{ marginTop: 16, fontSize: 11, color: "#7f8c9b", lineHeight: 1.5 }}>Campos em <span style={{ color: "#2a8c5a", fontWeight: 600 }}>verde</span> foram detectados nos documentos.</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
              <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a" }} onClick={() => setStep(1)}>Voltar</button>
              <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff" }} onClick={confirmAndCalc}>✅ Confirmar e Calcular</button>
            </div>
          </div>
        </div>)}

        {step === 4 && res && (<div style={{ animation: "fadeUp .4s ease both" }}>
          <div style={S.tot}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: 1.1, textTransform: "uppercase" }}>Total Estimado da Rescisão</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: "#fff", marginTop: 6, fontFamily: "'Playfair Display',serif" }}><AV value={total} /></div>
            <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
              <span style={S.tl}>{TIPOS[f.tipoRescisao]}</span>
              <span style={S.tl}>{mB(f.dataAdmissao, f.dataDemissao)} meses</span>
              <span style={S.tl}>22 verbas analisadas</span>
              {dd && <span style={{ ...S.tl, background: "rgba(111,207,151,.2)", color: "#a8f0c8" }}>Dados validados</span>}
              {!dd && <span style={{ ...S.tl, background: "rgba(255,200,50,.2)", color: "#ffd54f" }}>Estimativa</span>}
            </div>
            {(() => {
              const varT = f.tiposVariavel || [];
              const temC = varT.includes("comissao") || varT.includes("grat_mensal");
              const temG = varT.includes("grat_ajustada");
              let mv = 0, label = "";
              if (temC) { mv += parseFloat(f.comissaoMedia12 || 0); label = "Grat./Comissão mensal"; }
              if (temG) { mv += parseFloat(f.gratAjustadaTotal || 0) / 12; label = temC ? label + " + Grat. ajustada" : "Grat. ajustada"; }
              if (mv > 0) {
                const sal = parseFloat(f.salario) || 0;
                const rem = sal + mv;
                const impacto = (temC || (temG && f.gratAjustadaPeriod === "semestral")) ? "aviso, 13º, férias, FGTS" : "apenas 13º";
                return <div style={{ marginTop: 8, padding: "8px 14px", background: "rgba(255,255,255,.08)", borderRadius: 8, fontSize: 12, color: "rgba(255,255,255,.85)", lineHeight: 1.5 }}>
                  <strong style={{ color: "#ffd54f" }}>Remuneração:</strong> Sal. {fmt(sal)} + {label} {fmt(mv)}/mês = <strong>{fmt(rem)}</strong> <span style={{ opacity: .7 }}>→ impacta {impacto}</span>
                </div>;
              }
              return null;
            })()}
          </div>

          <div style={{ ...S.card, marginTop: 14 }}>
            <h2 style={S.ch}>📊 Detalhamento — {pos.length} Verbas Apuradas</h2>
            {pos.map(([k, v], i) => (<div className="row" key={k} style={{ animation: "slideR .3s ease " + (i * .04) + "s both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: 17, flexShrink: 0 }}>{V[k]?.i}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{V[k]?.l}</div>
                  <div style={{ fontSize: 10, color: "#8a96a3", marginTop: 1 }}>{V[k]?.d}</div>
                </div>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1a3d5c", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}><AV value={v} delay={120 + i * 60} /></div>
            </div>))}
            {zero.length > 0 && (<div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#8a96a3", textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Nao apuradas (R$ 0,00)</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{zero.map(([k]) => <span key={k} style={{ ...S.tag, background: "#f0f2f5", color: "#8a96a3", fontSize: 9 }}>{V[k]?.l}</span>)}</div>
              {!dd && <div style={{ fontSize: 10, color: "#8a96a3", marginTop: 5, fontStyle: "italic" }}>Anexe documentos para apurar estas verbas.</div>}
            </div>)}
          </div>

          <div style={{ ...S.card, marginTop: 14 }}>
            <details>
              <summary style={{ fontSize: 12, fontWeight: 600, color: "#2a4a6a", cursor: "pointer" }}>▶ Metodologia de Cálculo (22 verbas)</summary>
              <div style={{ fontSize: 11, color: "#5a7080", lineHeight: 1.7, marginTop: 10 }}>
                {[
                  ["Saldo Salario", "(Sal / 30) x dias trabalhados no mes da rescisao"],
                  ["Aviso Previo", "(Sal / 30) x (30 + 3/ano, max 90d) - Lei 12.506/2011. Acordo=50%"],
                  ["13o Proporcional", "(Sal / 12) x meses trabalhados no ano da demissao (se admissao no mesmo ano, conta a partir do mes de admissao) + projecao do aviso como tempo de servico"],
                  ["Ferias + 1/3", "(Sal / 12) x meses desde o ultimo aniversario do contrato x 4/3 + projecao do aviso"],
                  ["Ferias Vencidas", "Sal x 4/3 x qtd de periodos aquisitivos completos nao gozados"],
                  ["Ferias em Dobro", "Art. 137 CLT: Sal x 4/3 adicional por periodo cujo prazo concessivo (12m) expirou"],
                  ["Multa 40% FGTS", "(Saldo FGTS real ou estimado + 8% sobre saldo de salario, aviso previo indenizado e 13o proporcional) x 40% (ou 20% acordo)"],
                  ["Horas Extras", "(Sal / 220) x (1 + adicional%) x media mensal x meses"],
                  ["Insalubridade", "SM (R$" + SM.toFixed(2) + ") x grau: minimo 10%, medio 20%, maximo 40% x meses"],
                  ["Periculosidade", "Sal x 30% x meses - Art. 193 CLT"],
                  ["Ad. Noturno", "(Sal / 220) x 20% x horas noturnas/mes (22h-5h) x meses"],
                  ["Intervalo Intrajornada", "(Sal / 220) x 1,5 x horas suprimidas/dia x dias - Art. 71 par. 4o (pos-Reforma)"],
                  ["Sal-Familia", "R$65,00/filho ate 14a para remuneracao ate R$1.906,04 x meses - Portaria MPS/MF 6/2025"],
                  ["Gratificacao/Gorjetas/Comissao", "Media mensal extraida dos docs x meses"],
                  ["Reflexo DSR", "6,05% sobre total de variaveis (HE + gorjetas + comissões + ad. noturno)"],
                  ["PLR Proporcional", "Extraido dos docs: PLR anual / 12 x meses trabalhados no periodo de apuracao"],
                  ["Estabilidade", "Extraido dos docs: Sal x meses restantes de estabilidade (gestante/CIPA/acidentado)"],
                  ["Multa Art. 477", "1 salario se atraso no pagamento rescisorio - Art. 477 par. 8o CLT"],
                  ["Multa Art. 467", "50% das verbas incontroversas nao pagas na 1a audiencia - Art. 467 CLT"],
                  ["Inden. Art. 9o", "1 salario se dispensa nos 30d antes da data-base - Lei 7.238/84"],
                ].map(([t, d], i) => <p key={i} style={{ marginTop: i ? 5 : 0 }}><strong>{t}:</strong> {d}</p>)}
              </div>
            </details>
          </div>

          <div style={{ marginTop: 14, padding: "12px 16px", background: "#f8fafb", borderRadius: 10, border: "1px solid #e4eaf0", fontSize: 10, color: "#7f8c9b", lineHeight: 1.6 }}>
            <strong>Aviso Legal:</strong> {!dd ? "Valores são estimativas (ballpark figures). Anexe documentos para cálculo preciso." : "Valores baseados em dados extraidos por IA e validados pelo cliente."} Ferramenta de apoio - revisão por advogado habilitado indispensável. SM: R$ {SM.toFixed(2)} - Sal-Familia: R$ 65,00/filho (2025).
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 18, gap: 10 }}>
            <button className="btn" style={{ background: "linear-gradient(135deg,#0d5f2c,#1a8c4e)", color: "#fff" }} onClick={() => exportExcel(res, f, dd)}>📥 Exportar Excel</button>
            <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a" }} onClick={reset}>🔄 Novo Cálculo</button>
              <button className="btn" style={{ background: "linear-gradient(135deg,#1a6b3a,#27ae60)", color: "#fff" }} onClick={() => exportXLSX(res, f, dd)}>📊 Exportar Excel</button>
          </div>
        </div>)}

        <div style={{ textAlign: "center", padding: "26px 0 10px", fontSize: 9, color: "#8a96a3" }}>RescisãoCalc — 22 verbas · Parser IA · Ferramenta de apoio</div>
      </div>
    </div>
  );
}

const S = {
  wrap: { minHeight: "100vh", background: "linear-gradient(165deg,#eef2f6,#e0e8f0,#e8eef5)", fontFamily: "'Source Sans 3',sans-serif" },
  ctn: { maxWidth: 640, margin: "0 auto", padding: "0 16px 40px" },
  hdr: { padding: "16px 0 12px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)", background: "rgba(238,242,246,.82)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logo: { fontSize: 18, fontWeight: 700, color: "#1a2d3d", fontFamily: "'Playfair Display',serif" },
  ttl: { fontSize: 28, fontWeight: 700, color: "#1a2d3d", fontFamily: "'Playfair Display',serif", lineHeight: 1.25 },
  card: { background: "#fff", borderRadius: 13, padding: "22px", boxShadow: "0 1px 3px rgba(0,0,0,.04),0 5px 18px rgba(0,0,0,.05)", border: "1px solid rgba(200,214,230,.4)" },
  ch: { fontSize: 16, fontWeight: 600, color: "#1a2d3d", marginBottom: 14, fontFamily: "'Playfair Display',serif" },
  tag: { display: "inline-block", padding: "3px 9px", borderRadius: 14, fontSize: 10, fontWeight: 600, letterSpacing: .3, background: "rgba(41,128,185,.07)", color: "#1a5276" },
  tl: { display: "inline-block", padding: "3px 9px", borderRadius: 14, fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)" },
  chk: { display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 9, cursor: "pointer", border: "1.5px solid", transition: "all .2s" },
  chkB: { width: 18, height: 18, borderRadius: 4, border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 },
  tot: { background: "linear-gradient(135deg,#0f2740,#1a3d5c 50%,#2a6496)", borderRadius: 13, padding: "24px 22px", boxShadow: "0 4px 18px rgba(26,58,92,.3)" },
};
