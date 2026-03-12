import { useState, useEffect, useRef } from "react";

const SM = 1518.0;
const DSR = 0.0605;

const V = {
  saldoSalario:          { l: "Saldo de Salário",                    en: "Salary Balance",                    i: "💰", d: "Dias trabalhados no mês da rescisão",            de: "Days worked in termination month" },
  avisoIndenizado:       { l: "Aviso Prévio Indenizado",             en: "Notice Pay (Indemnified)",          i: "📅", d: "30d + 3d/ano (máx 90d) — Lei 12.506/2011",      de: "30d + 3d/yr (max 90d) — Law 12,506/2011" },
  decimoTerceiro:        { l: "13º Salário Proporcional",            en: "13th Salary (Proportional)",        i: "🎄", d: "Meses no ano ÷ 12 c/ projeção do aviso",        de: "Months in year ÷ 12 w/ notice projection" },
  feriasProporcionais:   { l: "Férias Proporcionais + ⅓",            en: "Proportional Vacation + ⅓",         i: "🏖️", d: "Meses desde último per. aquisitivo + 1/3",       de: "Months since last accrual period + 1/3" },
  feriasVencidas:        { l: "Férias Vencidas + ⅓",                 en: "Accrued Vacation + ⅓",              i: "⏰", d: "Períodos aquisitivos não gozados",              de: "Unused accrual periods" },
  feriasEmDobro:         { l: "Férias em Dobro (Art. 137)",          en: "Double Vacation (Art. 137)",        i: "⚠️", d: "Período concessivo expirado",                   de: "Expired concession period" },
  multaFGTS:             { l: "Multa 40% FGTS",                      en: "FGTS 40% Penalty",                  i: "🏦", d: "40% sobre saldo FGTS (20% mútuo acordo)",       de: "40% on FGTS balance (20% mutual agreement)" },
  horasExtras:           { l: "Horas Extras",                        en: "Overtime",                          i: "⏱️", d: "Sal÷220 × (1+%) × média mensal × meses",       de: "Salary÷220 × (1+%) × monthly avg × months" },
  adicInsalubridade:     { l: "Adicional de Insalubridade",          en: "Unhealthy Work Premium",            i: "☣️", d: "10/20/40% do SM × meses",                      de: "10/20/40% of min. wage × months" },
  adicPericulosidade:    { l: "Adicional de Periculosidade",         en: "Hazard Pay",                        i: "⚡", d: "30% do salário-base × meses",                   de: "30% of base salary × months" },
  adicNoturno:           { l: "Adicional Noturno",                   en: "Night Shift Premium",               i: "🌙", d: "20% sobre hora normal × meses",                de: "20% over regular hourly rate × months" },
  intervaloIntrajornada: { l: "Intervalo Intrajornada Suprimido",    en: "Suppressed Break Indemnity",        i: "🍽️", d: "Período suprimido + 50% — Art. 71 §4º",        de: "Suppressed period + 50% — Art. 71 §4" },
  salarioFamilia:        { l: "Salário-Família",                     en: "Family Allowance",                  i: "👨‍👩‍👧", d: "R$65,00/filho ≤14a × meses",                   de: "R$65.00/child ≤14y × months" },
  gratificacao:          { l: "Gratificação",                        en: "Bonus/Gratification",               i: "🎁", d: "Valores habituais × meses",                    de: "Customary amounts × months" },
  gorjetas:              { l: "Gorjetas",                            en: "Tips",                              i: "🍷", d: "Média mensal × meses",                         de: "Monthly average × months" },
  comissao:              { l: "Comissão",                            en: "Commission",                        i: "📈", d: "Média mensal × meses",                         de: "Monthly average × months" },
  reflexoDSR:            { l: "Reflexo DSR s/ Variável",             en: "Weekly Rest Reflex on Variable",    i: "📊", d: "6,05% sobre parcelas variáveis",               de: "6.05% on variable payments" },
  plrProporcional:       { l: "PLR Proporcional",                    en: "Profit Sharing (Proportional)",     i: "💵", d: "Valor anual ÷ 12 × meses",                    de: "Annual amount ÷ 12 × months" },
  estabilidade:          { l: "Indenização por Estabilidade",        en: "Job Stability Indemnity",           i: "🛡️", d: "Salários do período restante",                 de: "Salaries for remaining protected period" },
  multaArt467:           { l: "Multa Art. 467 CLT",                  en: "Penalty Art. 467 CLT",              i: "⚖️", d: "50% verbas incontroversas",                   de: "50% of undisputed amounts" },
  multaArt477:           { l: "Multa Art. 477 CLT",                  en: "Penalty Art. 477 CLT",              i: "📜", d: "1 salário — atraso no pagamento",              de: "1 salary — late payment" },
  indenizacaoArt9:       { l: "Inden. Art. 9º Lei 7.238/84",        en: "Indemnity Art. 9 Law 7,238/84",    i: "🔒", d: "1 salário — 30d antes data-base",              de: "1 salary — 30d before base date" },
  fgtsDepositoRescisorio:{ l: "FGTS 8% sobre Rescisórias",          en: "FGTS 8% on Severance",              i: "🏦", d: "8% sobre saldo sal. + aviso + 13º",            de: "8% on salary bal. + notice + 13th" },
  contribPrevidenciaria: { l: "Contribuição Previdenciária",         en: "Social Security Contribution",      i: "🏛️", d: "Patronal sobre verbas salariais",              de: "Employer contribution on salary items" },
};

const TIPOS = {
  sem_justa_causa: { pt: "Sem Justa Causa", en: "Without Just Cause" },
  pedido_demissao: { pt: "Pedido de Demissão", en: "Voluntary Resignation" },
  justa_causa: { pt: "Justa Causa", en: "Just Cause" },
  mutuo_acordo: { pt: "Mútuo Acordo", en: "Mutual Agreement" },
};

const EDIT_FIELDS = [
  { key: "saldoFGTS", label: "Saldo FGTS (R$)", type: "number" },
  { key: "horasExtrasMensais", label: "Horas Extras Média/Mês", type: "number" },
  { key: "horasExtrasPercentual", label: "% Adicional HE", type: "number" },
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

function pD(s) { const p = s.split("-").map(Number); return { y: p[0], m: p[1], d: p[2] }; }
function mB(a, b) {
  const s = pD(a), e = pD(b);
  let m = (e.y - s.y) * 12 + (e.m - s.m);
  if (e.d >= 15) m++;
  return Math.max(m, 0);
}
function avD(m) { return Math.min(30 + Math.floor(m / 12) * 3, 90); }
function fmt(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0); }
function fmtNum(v) { return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0); }

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

  const varTipos = (dd && dd.tiposVariavel) || [];
  const temComissao = varTipos.includes("comissao") || varTipos.includes("grat_mensal");
  const temGratAjust = varTipos.includes("grat_ajustada");
  const gratSemestral = (dd && dd.gratAjustadaPeriod === "semestral");
  let mediaVar = 0;
  if (temComissao) mediaVar += parseFloat((dd && dd.comissaoMedia12) || 0);
  if (temGratAjust) mediaVar += parseFloat((dd && dd.gratAjustadaTotal) || 0) / 12;
  const rem = sal + mediaVar;
  const remFerias = (temComissao || gratSemestral) ? rem : sal;
  const rem13 = (mediaVar > 0) ? rem : sal;
  const remFGTS = (mediaVar > 0) ? rem : sal;

  const lastDayOfMonth = new Date(dem.y, dem.m, 0).getDate();
  r.saldoSalario = (dias >= lastDayOfMonth) ? sal : sd * dias;
  r.avisoIndenizado = sjc ? (remFerias / 30) * dav : ac ? (remFerias / 30) * dav * 0.5 : 0;

  if (!jc) {
    const inicio = (adm.y === dem.y) ? adm.m : 1;
    let m13 = (dem.m - inicio + 1) + ((sjc || ac) ? Math.floor(dav / 30) : 0);
    m13 = Math.max(0, Math.min(m13, 12));
    r.decimoTerceiro = (rem13 / 12) * m13;
  } else r.decimoTerceiro = 0;

  if (!jc) {
    // Férias proporcionais: apenas meses COMPLETOS desde o último aniversário — CLT não arredonda
    let anivAno = dem.y;
    if (dem.m < adm.m || (dem.m === adm.m && dem.d < adm.d)) anivAno--;
    // meses completos: só conta o mês atual se dem.d >= adm.d
    let mf = (dem.m - adm.m);
    if (dem.m < adm.m) mf = dem.m + 12 - adm.m;
    if (anivAno === dem.y) mf = dem.m - adm.m;
    if (dem.d < adm.d) mf = Math.max(0, mf - 1); // mês incompleto: não conta
    if (mf < 0) mf += 12;
    mf += ((sjc || ac) ? Math.floor(dav / 30) : 0);
    mf = Math.max(0, Math.min(mf, 12));
    r.feriasProporcionais = ((remFerias / 12) * mf) * (4 / 3);
  } else r.feriasProporcionais = 0;

  const qtdF = f.feriasVencidas ? (parseInt(f.feriasVencidasQtd) || 1) : 0;
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

  const fgtsSobreRescisao = (r.saldoSalario + r.avisoIndenizado + r.decimoTerceiro) * 0.08;
  let fgtsBalance;
  if (d.saldoFGTS != null) {
    fgtsBalance = d.saldoFGTS;
  } else {
    fgtsBalance = remFGTS * 0.08 * meses;
  }
  r.multaFGTS = sjc ? fgtsBalance * 0.40 : ac ? fgtsBalance * 0.20 : 0;

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

  r.fgtsDepositoRescisorio = f.calcEncargos ? fgtsSobreRescisao : 0;
  if (f.calcEncargos) {
    const percPrev = parseFloat(f.percPrevidencia || 28.8) / 100;
    const basePrevidencia = r.saldoSalario + r.decimoTerceiro +
      (r.feriasProporcionais || 0) + (r.feriasVencidas || 0) + (r.feriasEmDobro || 0) +
      (r.horasExtras || 0) + (r.adicInsalubridade || 0) + (r.adicPericulosidade || 0) +
      (r.adicNoturno || 0) + (r.comissao || 0) + (r.gorjetas || 0) + (r.gratificacao || 0);
    r.contribPrevidenciaria = basePrevidencia * percPrev;
  } else r.contribPrevidenciaria = 0;

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

// ─── XLSX EXPORT (multi-employee) ────────────────────────────────────────────
async function exportXLSXColetivo(employees, lang = "pt") {
  if (!window.ExcelJS) {
    await new Promise((resolve, reject) => {
      const sc = document.createElement("script");
      sc.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
      sc.onload = resolve; sc.onerror = reject;
      document.head.appendChild(sc);
    });
  }
  const EJ = window.ExcelJS;
  const wb = new EJ.Workbook();

  const NAVY = "1A3D5C", BLUE = "2980B9", LBLUE = "D6EAF8", VLBLUE = "EBF5FB";
  const GREEN = "1E8449", LGREEN = "D5F5E3";
  const GRAY = "F2F3F4", WHITE = "FFFFFF", DGRAY = "34495E";
  const thinB = { style: "thin", color: { argb: "D5D8DC" } };
  const fillC = c => ({ type: "pattern", pattern: "solid", fgColor: { argb: c } });
  const fontA = (sz, b, c, i) => ({ name: "Arial", size: sz, bold: !!b, color: { argb: c || "2C3E50" }, italic: !!i });

  // ── SUMMARY SHEET ──────────────────────────────────────────────────────────
  const wsSummary = wb.addWorksheet(lang === "en" ? "Summary" : "Resumo", { properties: { tabColor: { argb: NAVY } } });
  wsSummary.columns = [
    { width: 28 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 18 }
  ];

  // Title
  const tRow = wsSummary.addRow([lang === "en" ? "COLLECTIVE TERMINATION — SUMMARY" : "DISPENSA COLETIVA — RESUMO"]);
  wsSummary.mergeCells(tRow.number, 1, tRow.number, 11);
  tRow.height = 40;
  tRow.eachCell(c => { c.font = fontA(14, true, WHITE); c.fill = fillC(NAVY); c.alignment = { horizontal: "center", vertical: "middle" }; });

  wsSummary.addRow([]).height = 6;

  // Header row
  const headers = lang === "en"
    ? ["Employee", "Type", "Tenure", "Base Salary", "Severance\nBalance", "Notice\nPay", "13th\nProp.", "Vacation\nProp.+1/3", "FGTS\nPenalty", "Others", "TOTAL"]
    : ["Funcionário", "Tipo", "Tempo", "Salário Base", "Saldo\nSalário", "Aviso\nPrévio", "13º\nProp.", "Férias\nProp.+1/3", "Multa\nFGTS", "Outros", "TOTAL"];
  const hRow = wsSummary.addRow(headers);
  hRow.height = 36;
  hRow.eachCell((c, i) => {
    c.font = fontA(9, true, WHITE);
    c.fill = fillC(BLUE);
    c.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    c.border = { bottom: { style: "medium", color: { argb: WHITE } } };
  });

  let grandTotal = 0;
  employees.forEach((emp, idx) => {
    const res = emp.result;
    if (!res) return;
    const total = Object.values(res).reduce((a, b) => a + b, 0);
    const meses = mB(emp.form.dataAdmissao, emp.form.dataDemissao);
    const mainVerbas = (res.saldoSalario || 0) + (res.avisoIndenizado || 0) + (res.decimoTerceiro || 0) + (res.feriasProporcionais || 0) + (res.multaFGTS || 0);
    const outros = total - mainVerbas;
    grandTotal += total;

    const row = wsSummary.addRow([
      emp.form.nome || `Func. ${idx + 1}`,
      TIPOS[emp.form.tipoRescisao]?.[lang === "en" ? "en" : "pt"],
      `${meses}m`,
      parseFloat(emp.form.salario) || 0,
      res.saldoSalario || 0,
      res.avisoIndenizado || 0,
      res.decimoTerceiro || 0,
      res.feriasProporcionais || 0,
      res.multaFGTS || 0,
      outros,
      total,
    ]);
    row.height = 22;
    const bg = idx % 2 === 0 ? VLBLUE : WHITE;
    row.eachCell((c, i) => {
      c.font = fontA(i === 11 ? 10 : 9, i === 11, i === 11 ? NAVY : "2C3E50");
      c.fill = fillC(bg);
      c.alignment = { horizontal: i === 1 || i === 2 || i === 3 ? "left" : "right", vertical: "middle" };
      c.border = { bottom: thinB };
      if (i >= 4) { c.numFmt = "#,##0.00"; }
    });
  });

  // Grand total row
  wsSummary.addRow([]).height = 4;
  const gtRow = wsSummary.addRow([
    lang === "en" ? "GRAND TOTAL" : "TOTAL GERAL",
    "", "", "", "", "", "", "", "", "",
    grandTotal
  ]);
  wsSummary.mergeCells(gtRow.number, 1, gtRow.number, 10);
  gtRow.height = 36;
  gtRow.getCell(1).font = fontA(12, true, WHITE);
  gtRow.getCell(1).fill = fillC(NAVY);
  gtRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
  gtRow.getCell(11).font = fontA(12, true, WHITE);
  gtRow.getCell(11).fill = fillC(NAVY);
  gtRow.getCell(11).alignment = { horizontal: "right", vertical: "middle" };
  gtRow.getCell(11).numFmt = "#,##0.00";

  wsSummary.addRow([]).height = 8;
  const f1 = wsSummary.addRow([lang === "en" ? "Generated by RescisãoCalc — Support tool. Review by qualified attorney is essential." : "Gerado por RescisãoCalc — Ferramenta de apoio. Revisão por advogado habilitado indispensável."]);
  wsSummary.mergeCells(f1.number, 1, f1.number, 11);
  f1.getCell(1).font = fontA(8, false, "808080");

  // ── INDIVIDUAL SHEETS ──────────────────────────────────────────────────────
  employees.forEach((emp, idx) => {
    const res = emp.result;
    if (!res) return;
    const f = emp.form;
    const dd = emp.docData;
    const nome = f.nome || `Func ${idx + 1}`;
    const sheetName = nome.substring(0, 28).replace(/[\\\/\*\?\[\]:]/g, "");
    const ws = wb.addWorksheet(sheetName, { properties: { tabColor: { argb: BLUE } } });
    ws.columns = [{ width: 44 }, { width: 70 }, { width: 22 }];

    const sal = parseFloat(f.salario) || 0;
    const meses = mB(f.dataAdmissao, f.dataDemissao);
    const total = Object.values(res).reduce((a, b) => a + b, 0);

    // Title
    const tR = ws.addRow([lang === "en" ? `SEVERANCE — ${nome.toUpperCase()}` : `RESCISÃO — ${nome.toUpperCase()}`]);
    ws.mergeCells(tR.number, 1, tR.number, 3);
    tR.height = 36;
    tR.eachCell(c => { c.font = fontA(13, true, WHITE); c.fill = fillC(NAVY); c.alignment = { horizontal: "center", vertical: "middle" }; });

    ws.addRow([]).height = 5;

    // Contract info
    const infoHead = ws.addRow([lang === "en" ? "CONTRACT DATA" : "DADOS DO CONTRATO"]);
    ws.mergeCells(infoHead.number, 1, infoHead.number, 3);
    infoHead.height = 24;
    infoHead.eachCell(c => { c.font = fontA(10, true, WHITE); c.fill = fillC(DGRAY); c.alignment = { horizontal: "center", vertical: "middle" }; });

    const infoRows = [
      [(lang === "en" ? "Admission: " : "Admissão: ") + f.dataAdmissao, (lang === "en" ? "Termination: " : "Demissão: ") + f.dataDemissao, ""],
      [(lang === "en" ? "Salary: " : "Salário: ") + fmt(sal), (lang === "en" ? "Tenure: " : "Tempo: ") + meses + "m", (lang === "en" ? "Type: " : "Tipo: ") + TIPOS[f.tipoRescisao]?.[lang === "en" ? "en" : "pt"]],
    ];
    infoRows.forEach((r, i) => {
      const row = ws.addRow(r);
      row.height = 20;
      row.eachCell(c => { c.font = fontA(10, false); c.fill = fillC(i % 2 === 0 ? GRAY : WHITE); c.alignment = { vertical: "middle" }; });
    });

    ws.addRow([]).height = 6;

    // Verbas header
    const vHead = ws.addRow([lang === "en" ? "SEVERANCE PAYMENTS" : "VERBAS RESCISÓRIAS"]);
    ws.mergeCells(vHead.number, 1, vHead.number, 3);
    vHead.height = 26;
    vHead.eachCell(c => { c.font = fontA(11, true, WHITE); c.fill = fillC(BLUE); c.alignment = { horizontal: "center", vertical: "middle" }; });

    const colH = ws.addRow([lang === "en" ? "Item" : "Verba", lang === "en" ? "Calculation Basis" : "Memória de Cálculo", lang === "en" ? "Amount (R$)" : "Valor (R$)"]);
    colH.height = 22;
    colH.eachCell((c, i) => { c.font = fontA(9, true, BLUE); c.fill = fillC(LBLUE); c.alignment = { horizontal: i === 3 ? "right" : "left", vertical: "middle" }; c.border = { bottom: { style: "medium", color: { argb: BLUE } } }; });

    let vi = 0;
    const pos = Object.entries(res).filter(([_, v]) => v > 0.005);
    pos.forEach(([k, v]) => {
      const row = ws.addRow([lang === "en" ? (V[k]?.en || V[k]?.l || k) : (V[k]?.l || k), lang === "en" ? (V[k]?.de || V[k]?.d || "") : (V[k]?.d || ""), v]);
      row.height = 22;
      const bg = vi % 2 === 0 ? VLBLUE : WHITE;
      row.getCell(1).font = fontA(10, false);
      row.getCell(1).fill = fillC(bg);
      row.getCell(1).alignment = { vertical: "middle" };
      row.getCell(1).border = { bottom: thinB };
      row.getCell(2).font = fontA(9, false, "5D6D7E");
      row.getCell(2).fill = fillC(bg);
      row.getCell(2).alignment = { vertical: "middle" };
      row.getCell(2).border = { bottom: thinB };
      row.getCell(3).font = fontA(10, false);
      row.getCell(3).fill = fillC(bg);
      row.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
      row.getCell(3).numFmt = "#,##0.00";
      row.getCell(3).border = { bottom: thinB };
      vi++;
    });

    // Total row
    ws.addRow([]).height = 4;
    const totRow = ws.addRow([lang === "en" ? "TOTAL" : "TOTAL", "", total]);
    ws.mergeCells(totRow.number, 1, totRow.number, 2);
    totRow.height = 36;
    totRow.getCell(1).font = fontA(12, true, WHITE);
    totRow.getCell(1).fill = fillC(NAVY);
    totRow.getCell(1).alignment = { horizontal: "right", vertical: "middle" };
    totRow.getCell(3).font = fontA(12, true, WHITE);
    totRow.getCell(3).fill = fillC(NAVY);
    totRow.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
    totRow.getCell(3).numFmt = "#,##0.00";
  });

  // Download
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = lang === "en" ? "collective_termination.xlsx" : "dispensa_coletiva.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}

// ─── ANIMATED VALUE ──────────────────────────────────────────────────────────
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

// ─── DOTS PROGRESS ───────────────────────────────────────────────────────────
function Dots({ c }) {
  return <div style={{ display: "flex", gap: 5 }}>{[0,1,2,3,4].map(i => <div key={i} style={{ width: i <= c ? 24 : 16, height: 4, borderRadius: 2, background: i <= c ? "linear-gradient(90deg,#1a5276,#2980b9)" : "#d5dbe0", transition: "all .35s" }} />)}</div>;
}

// ─── FIELD ────────────────────────────────────────────────────────────────────
function F({ label, type, value, onChange, placeholder, select, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
      {select
        ? <select value={value} onChange={e => onChange(e.target.value)}>{Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        : <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

function Info({ bg, bc, icon, children }) {
  return <div style={{ padding: "11px 15px", borderRadius: 10, border: "1px solid " + bc, display: "flex", gap: 8, alignItems: "flex-start", background: bg }}>
    <span>{icon}</span><div style={{ fontSize: 12, lineHeight: 1.5 }}>{children}</div>
  </div>;
}

// ─── EMPTY EMPLOYEE FORM ──────────────────────────────────────────────────────
function emptyEmp(id) {
  return {
    id,
    form: { nome: "", dataAdmissao: "", dataDemissao: "", salario: "", tipoRescisao: "sem_justa_causa", feriasVencidas: false, feriasVencidasQtd: "1", feriasEmDobroQtd: "0", temVariavel: false, tiposVariavel: [], comissaoMedia12: "", gratAjustadaTotal: "", gratAjustadaPeriod: "", calcEncargos: false, percPrevidencia: "28.8" },
    files: [],
    docData: null,
    editDD: null,
    result: null,
    step: "idle", // idle | parsing | review | done
    msg: "",
  };
}

// ─── EMPLOYEE CARD ────────────────────────────────────────────────────────────
function EmployeeCard({ emp, onUpdate, onRemove, onCalc, showIndex }) {
  const { form, files, docData, editDD, result, step, msg } = emp;
  const [expanded, setExpanded] = useState(!result);
  const [showReview, setShowReview] = useState(false);
  const fileRef = useRef(null);

  const s = (k, v) => onUpdate({ form: { ...form, [k]: v } });
  const ok = form.dataAdmissao && form.dataDemissao && form.salario;
  const total = result ? Object.values(result).reduce((a, b) => a + b, 0) : 0;
  const meses = (form.dataAdmissao && form.dataDemissao) ? mB(form.dataAdmissao, form.dataDemissao) : 0;

  const hFiles = fl => onUpdate({ files: [...files, ...Array.from(fl).filter(x => /\.(xlsx|xls|csv|pdf)$/i.test(x.name))] });

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

  const parseAndCalc = async () => {
    onUpdate({ step: "parsing", msg: "Lendo documentos..." });
    let ext = null;
    if (files.length > 0) {
      if (!window.XLSX) {
        await new Promise(r => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; sc.onload = r; sc.onerror = r; document.head.appendChild(sc); });
      }
      let all = "";
      for (const x of files) { if (/\.(xlsx|xls|csv)$/i.test(x.name)) all += "\n--- " + x.name + " ---\n" + await readXL(x); }
      if (all.trim()) { onUpdate({ msg: "IA analisando..." }); ext = await aiParse(all.substring(0, 15000)); }
    }

    if (ext) {
      const merged = { ...ext, tiposVariavel: form.tiposVariavel || [], comissaoMedia12: form.comissaoMedia12, gratAjustadaTotal: form.gratAjustadaTotal, gratAjustadaPeriod: form.gratAjustadaPeriod };
      onUpdate({ docData: merged, editDD: { ...merged }, step: "review", msg: "" });
      setShowReview(true);
    } else {
      const docData = { tiposVariavel: form.tiposVariavel || [], comissaoMedia12: form.comissaoMedia12, gratAjustadaTotal: form.gratAjustadaTotal, gratAjustadaPeriod: form.gratAjustadaPeriod };
      const res = calc(form, docData);
      onUpdate({ docData, result: res, step: "done", msg: "" });
      setExpanded(false);
    }
  };

  const confirmCalc = () => {
    const merged = { ...editDD, tiposVariavel: form.tiposVariavel || [], comissaoMedia12: form.comissaoMedia12, gratAjustadaTotal: form.gratAjustadaTotal, gratAjustadaPeriod: form.gratAjustadaPeriod };
    const res = calc(form, merged);
    onUpdate({ docData: merged, result: res, step: "done", msg: "" });
    setShowReview(false);
    setExpanded(false);
  };

  const updateField = (key, val) => onUpdate({ editDD: { ...editDD, [key]: val } });

  return (
    <div style={{ background: "#fff", borderRadius: 13, border: "1.5px solid " + (result ? "#b8d8f0" : "#e4eaf0"), boxShadow: "0 2px 12px rgba(0,0,0,.05)", overflow: "hidden", transition: "all .2s" }}>
      {/* Card header */}
      <div onClick={() => setExpanded(e => !e)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", cursor: "pointer", background: result ? "linear-gradient(90deg,#eef6fd,#f5f9fd)" : "#fafbfc" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: result ? "linear-gradient(135deg,#1a3d5c,#2980b9)" : "#e4eaf0", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
            {showIndex}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2d3d" }}>{form.nome || `Funcionário ${showIndex}`}</div>
            {result
              ? <div style={{ fontSize: 12, color: "#2980b9", fontWeight: 600 }}><AV value={total} /> — {meses}m · {TIPOS[form.tipoRescisao]?.pt}</div>
              : <div style={{ fontSize: 11, color: "#8a96a3" }}>{ok ? `${meses}m · ${TIPOS[form.tipoRescisao]?.pt}` : "Preencha os dados"}</div>
            }
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {result && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 10, background: "rgba(41,128,185,.1)", color: "#1a5276" }}>✓ Calculado</span>}
          {step === "parsing" && <span style={{ fontSize: 11, color: "#2980b9" }}>⏳ {msg}</span>}
          <button onClick={e => { e.stopPropagation(); onRemove(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#c0c8d0", fontSize: 16, padding: "2px 4px", lineHeight: 1 }}>×</button>
          <span style={{ color: "#8a96a3", fontSize: 14 }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div style={{ padding: "16px 18px", borderTop: "1px solid #edf0f3", animation: "fadeUp .2s ease" }}>
          {/* Basic fields */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <F label="Nome do Funcionário" type="text" placeholder="Ex: João Silva" value={form.nome} onChange={v => s("nome", v)} />
            </div>
            <F label="Data de Admissão" type="date" value={form.dataAdmissao} onChange={v => s("dataAdmissao", v)} />
            <F label="Data de Demissão" type="date" value={form.dataDemissao} onChange={v => s("dataDemissao", v)} />
            <F label="Salário Atual (R$)" type="number" placeholder="5000.00" value={form.salario} onChange={v => s("salario", v)} />
            <F label="Tipo de Rescisão" select options={Object.fromEntries(Object.entries(TIPOS).map(([k, v]) => [k, v.pt]))} value={form.tipoRescisao} onChange={v => s("tipoRescisao", v)} />
          </div>

          {/* Férias */}
          <div style={{ marginTop: 10 }}>
            <div onClick={() => s("feriasVencidas", !form.feriasVencidas)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "1.5px solid " + (form.feriasVencidas ? "#2980b9" : "#cbd5e0"), background: form.feriasVencidas ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, border: "2px solid " + (form.feriasVencidas ? "#2980b9" : "#aab4c0"), background: form.feriasVencidas ? "#2980b9" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {form.feriasVencidas && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d", flex: 1 }}>Férias vencidas?</span>
              {form.feriasVencidas && (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 10, color: "#5a7080" }}>Qtd:</span>
                  <input type="number" min="1" max="5" value={form.feriasVencidasQtd} onChange={e => s("feriasVencidasQtd", e.target.value)} style={{ width: 44, padding: "4px 6px", fontSize: 11, textAlign: "center" }} />
                  <span style={{ fontSize: 10, color: "#5a7080" }}>Em dobro:</span>
                  <input type="number" min="0" max="5" value={form.feriasEmDobroQtd} onChange={e => s("feriasEmDobroQtd", e.target.value)} style={{ width: 44, padding: "4px 6px", fontSize: 11, textAlign: "center" }} />
                </div>
              )}
            </div>
          </div>

          {/* Encargos */}
          <div style={{ marginTop: 8 }}>
            <div onClick={() => s("calcEncargos", !form.calcEncargos)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "1.5px solid " + (form.calcEncargos ? "#2980b9" : "#cbd5e0"), background: form.calcEncargos ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, border: "2px solid " + (form.calcEncargos ? "#2980b9" : "#aab4c0"), background: form.calcEncargos ? "#2980b9" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {form.calcEncargos && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d", flex: 1 }}>Calcular encargos patronais?</span>
              {form.calcEncargos && (
                <div onClick={e => e.stopPropagation()}>
                  <input type="number" placeholder="28.8" value={form.percPrevidencia} onChange={e => s("percPrevidencia", e.target.value)} style={{ width: 70, padding: "4px 6px", fontSize: 11, textAlign: "center" }} />
                </div>
              )}
            </div>
          </div>

          {/* Remuneração Variável */}
          <div style={{ marginTop: 8 }}>
            <div onClick={() => s("temVariavel", !form.temVariavel)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: "1.5px solid " + (form.temVariavel ? "#2980b9" : "#cbd5e0"), background: form.temVariavel ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, border: "2px solid " + (form.temVariavel ? "#2980b9" : "#aab4c0"), background: form.temVariavel ? "#2980b9" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {form.temVariavel && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d" }}>Remuneração variável nos últimos 12 meses?</div>
                <div style={{ fontSize: 10, color: "#7f8c9b" }}>Comissões, gratificações, PLR, prêmios</div>
              </div>
            </div>
            {form.temVariavel && (
              <div style={{ marginTop: 8, padding: "12px", background: "#f8fafb", borderRadius: 8, border: "1px solid #e4eaf0" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Tipos de variável recebido</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {[["plr","PLR"],["premio","Prêmio"],["comissao","Comissões"],["grat_mensal","Gratif. mensal"],["grat_ajustada","Gratif. ajustada"]].map(([k,l]) => {
                    const sel = (form.tiposVariavel || []).includes(k);
                    return (
                      <div key={k} onClick={() => {
                        const cur = form.tiposVariavel || [];
                        s("tiposVariavel", sel ? cur.filter(x => x !== k) : [...cur, k]);
                      }} style={{ padding: "5px 10px", borderRadius: 14, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1.5px solid " + (sel ? "#2980b9" : "#cbd5e0"), background: sel ? "rgba(41,128,185,.08)" : "#fff", color: sel ? "#1a5276" : "#5a7080", transition: "all .2s" }}>{l}</div>
                    );
                  })}
                </div>
                {((form.tiposVariavel || []).includes("comissao") || (form.tiposVariavel || []).includes("grat_mensal")) && (
                  <div style={{ marginTop: 10 }}>
                    <F label="Média mensal (inc. DSR) nos últimos 12m (R$)" type="number" placeholder="Ex: 2500.00" value={form.comissaoMedia12} onChange={v => s("comissaoMedia12", v)} />
                  </div>
                )}
                {(form.tiposVariavel || []).includes("grat_ajustada") && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    <F label="Valor TOTAL gratificações ajustadas 12m (R$)" type="number" placeholder="Ex: 30000.00" value={form.gratAjustadaTotal} onChange={v => s("gratAjustadaTotal", v)} />
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>Periodicidade</div>
                      <div style={{ display: "flex", gap: 5 }}>
                        {[["semestral","Semestral ou menor"],["anual","Anual"]].map(([k,l]) => {
                          const sel2 = form.gratAjustadaPeriod === k;
                          return <div key={k} onClick={() => s("gratAjustadaPeriod", k)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer", border: "1.5px solid " + (sel2 ? "#2980b9" : "#cbd5e0"), background: sel2 ? "rgba(41,128,185,.08)" : "#fff", color: sel2 ? "#1a5276" : "#5a7080", flex: 1, textAlign: "center" }}>{l}</div>;
                        })}
                      </div>
                      {form.gratAjustadaPeriod === "semestral" && <div style={{ marginTop: 4, fontSize: 10, color: "#1a6b3a", fontWeight: 500 }}>Impacta tudo: 13º, férias, aviso, FGTS</div>}
                      {form.gratAjustadaPeriod === "anual" && <div style={{ marginTop: 4, fontSize: 10, color: "#c0392b", fontWeight: 500 }}>Impacta somente o 13º</div>}
                    </div>
                  </div>
                )}
                {(form.tiposVariavel || []).some(t => ["comissao","grat_mensal","grat_ajustada"].includes(t)) && (
                  <div style={{ marginTop: 8, padding: "7px 10px", background: "#e8f4fd", borderRadius: 7, border: "1px solid #b8d8f0", fontSize: 10, color: "#1a5276", lineHeight: 1.5 }}>
                    <strong>Impacto:</strong> Média soma ao salário base = <strong>remuneração</strong>, nova base de cálculo.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload docs */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Documentos (opcional)</div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); hFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: "1.5px dashed #cbd5e0", borderRadius: 8, padding: "14px", textAlign: "center", cursor: "pointer", background: "#fafbfd" }}
            >
              <input ref={fileRef} type="file" multiple accept=".xlsx,.xls,.csv,.pdf" style={{ display: "none" }} onChange={e => hFiles(e.target.files)} />
              <span style={{ fontSize: 11, color: "#8a96a3" }}>📎 Clique ou arraste Excel / CSV / PDF</span>
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {files.map((x, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", background: "#eef3f8", borderRadius: 6, fontSize: 11 }}>
                    <span>{/pdf/i.test(x.name) ? "📕" : "📊"}</span>
                    <span style={{ color: "#1a2d3d" }}>{x.name}</span>
                    <button onClick={() => onUpdate({ files: files.filter((_, j) => j !== i) })} style={{ background: "none", border: "none", cursor: "pointer", color: "#8a96a3", fontSize: 12, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review panel */}
          {showReview && editDD && (
            <div style={{ marginTop: 12, padding: "14px", background: "#f0f6fc", borderRadius: 10, border: "1px solid #b8d4ec" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a3d5c", marginBottom: 10 }}>🔍 Dados extraídos — revise e corrija</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {EDIT_FIELDS.map(({ key, label, type, options }) => {
                  const val = editDD[key];
                  const hasValue = val !== null && val !== undefined && val !== "" && val !== false && val !== 0;
                  if (type === "bool") return (
                    <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: val ? "#eef8f2" : "#f8fafb", borderRadius: 6, border: "1px solid " + (val ? "#6fcf97" : "#e8ecf0") }}>
                      <span style={{ fontSize: 11, color: "#1a2d3d" }}>{label}</span>
                      <button style={{ width: 36, height: 20, borderRadius: 10, background: val ? "#2980b9" : "#cbd5e0", border: "none", cursor: "pointer", position: "relative" }} onClick={() => updateField(key, !val)}>
                        <span style={{ position: "absolute", width: 14, height: 14, borderRadius: "50%", background: "#fff", top: 3, left: val ? 19 : 3, transition: "left .15s" }} />
                      </button>
                    </div>
                  );
                  if (type === "select") return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={{ fontSize: 9, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase" }}>{label}</label>
                      <select value={val || ""} onChange={e => updateField(key, e.target.value || null)} style={{ fontSize: 12, borderColor: hasValue ? "#6fcf97" : undefined, background: hasValue ? "#eef8f2" : undefined }}>{Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                    </div>
                  );
                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={{ fontSize: 9, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase" }}>{label}</label>
                      <input type="number" value={val != null ? val : ""} onChange={e => updateField(key, e.target.value === "" ? null : parseFloat(e.target.value))} style={{ fontSize: 12, borderColor: hasValue ? "#6fcf97" : undefined, background: hasValue ? "#eef8f2" : undefined }} />
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff", fontSize: 12 }} onClick={confirmCalc}>✅ Confirmar e Calcular</button>
              </div>
            </div>
          )}

          {/* Action button */}
          {!showReview && step !== "parsing" && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12, gap: 8 }}>
              {result && (
                <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a", fontSize: 12 }} onClick={() => { setExpanded(false); }}>Fechar</button>
              )}
              <button className="btn" disabled={!ok} style={{ background: ok ? "linear-gradient(135deg,#1a3d5c,#2980b9)" : "#cbd5e0", color: "#fff", fontSize: 12 }} onClick={parseAndCalc}>
                {files.length > 0 ? "🤖 Analisar e Calcular" : "⚖️ Calcular"}
              </button>
            </div>
          )}

          {/* Result mini-summary */}
          {result && !showReview && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "linear-gradient(90deg,#eef6fd,#f5f9fd)", borderRadius: 8, border: "1px solid #b8d8f0" }}>
              <div style={{ fontSize: 11, color: "#5a7080", marginBottom: 6 }}>Principais verbas:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {Object.entries(result).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 10, padding: "3px 8px", background: "#fff", borderRadius: 6, border: "1px solid #d6eaf8", color: "#1a3d5c" }}>
                    {V[k]?.i} {V[k]?.l}: <strong>{fmt(v)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [mode, setMode] = useState("home"); // home | collective
  const [employees, setEmployees] = useState([emptyEmp(1)]);
  const [nextId, setNextId] = useState(2);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkMsg, setBulkMsg] = useState("");
  const [showResults, setShowResults] = useState(false);
  const bulkRef = useRef(null);

  const addEmployee = () => {
    setEmployees(p => [...p, emptyEmp(nextId)]);
    setNextId(n => n + 1);
  };

  const removeEmployee = (id) => setEmployees(p => p.filter(e => e.id !== id));

  const updateEmployee = (id, patch) => setEmployees(p => p.map(e => e.id === id ? { ...e, ...patch } : e));

  const allDone = employees.length > 0 && employees.every(e => e.result !== null);
  const anyDone = employees.some(e => e.result !== null);
  const grandTotal = employees.reduce((sum, e) => sum + (e.result ? Object.values(e.result).reduce((a, b) => a + b, 0) : 0), 0);

  // ── Bulk upload from spreadsheet ─────────────────────────────────────────
  const processBulkUpload = async (file) => {
    setBulkMsg("Lendo planilha...");
    if (!window.XLSX) {
      await new Promise(r => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; sc.onload = r; sc.onerror = r; document.head.appendChild(sc); });
    }
    try {
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => {
          const wb = window.XLSX.read(new Uint8Array(e.target.result), { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          res(window.XLSX.utils.sheet_to_json(ws, { defval: "" }));
        };
        r.onerror = rej;
        r.readAsArrayBuffer(file);
      });

      if (!data.length) { setBulkMsg("Planilha vazia."); return; }

      // Map columns flexibly (case-insensitive)
      const normalize = s => String(s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const getVal = (row, keys) => {
        for (const k of Object.keys(row)) {
          if (keys.some(q => normalize(k).includes(normalize(q)))) return String(row[k] || "").trim();
        }
        return "";
      };

      const tipoMap = v => {
        const n = normalize(v);
        if (n.includes("justa") && n.includes("sem")) return "sem_justa_causa";
        if (n.includes("justa") && !n.includes("sem")) return "justa_causa";
        if (n.includes("acordo") || n.includes("mutuo")) return "mutuo_acordo";
        if (n.includes("demissao") || n.includes("pedido")) return "pedido_demissao";
        return "sem_justa_causa";
      };

      const formatDate = v => {
        if (!v) return "";
        // already YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
        // DD/MM/YYYY
        const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        // Excel serial
        const n = parseFloat(v);
        if (!isNaN(n) && n > 40000) {
          const d = new Date((n - 25569) * 86400000);
          return d.toISOString().split("T")[0];
        }
        return v;
      };

      const newEmps = data.map((row, i) => {
        const emp = emptyEmp(nextId + i);
        emp.form.nome = getVal(row, ["nome", "funcionario", "name", "employee"]);
        emp.form.dataAdmissao = formatDate(getVal(row, ["admissao", "admiss", "admission", "data adm", "dt adm"]));
        emp.form.dataDemissao = formatDate(getVal(row, ["demissao", "demiss", "termination", "data dem", "dt dem", "rescisao"]));
        emp.form.salario = getVal(row, ["salario", "salary", "remuneracao", "sal"]).replace(",", ".");
        emp.form.tipoRescisao = tipoMap(getVal(row, ["tipo", "type", "motivo", "modalidade"]));
        const fv = getVal(row, ["ferias vencidas", "férias vencidas", "ferias_vencidas"]);
        emp.form.feriasVencidas = fv === "1" || normalize(fv) === "sim" || normalize(fv) === "yes";
        return emp;
      });

      setEmployees(p => [...p.filter(e => e.form.nome || e.form.salario), ...newEmps]);
      setNextId(n => n + newEmps.length);
      setBulkMsg(`✅ ${newEmps.length} funcionários importados!`);
      setBulkFile(null);
    } catch (err) {
      console.error(err);
      setBulkMsg("Erro ao ler planilha. Verifique o formato.");
    }
  };

  const calcAll = () => {
    employees.forEach(emp => {
      if (!emp.result && emp.form.dataAdmissao && emp.form.dataDemissao && emp.form.salario) {
        const docData = { tiposVariavel: emp.form.tiposVariavel || [], comissaoMedia12: emp.form.comissaoMedia12, gratAjustadaTotal: emp.form.gratAjustadaTotal, gratAjustadaPeriod: emp.form.gratAjustadaPeriod };
        const res = calc(emp.form, docData);
        updateEmployee(emp.id, { result: res, docData, step: "done" });
      }
    });
    setShowResults(true);
  };

  const reset = () => {
    setEmployees([emptyEmp(1)]);
    setNextId(2);
    setBulkFile(null);
    setBulkMsg("");
    setShowResults(false);
  };

  const CSS = `<style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    ::selection{background:#1a5276;color:#e8f4fd}
    input,select{font-family:'Source Sans 3',sans-serif;font-size:14px;padding:10px 13px;border:1.5px solid #cbd5e0;border-radius:9px;background:#f8fafb;color:#1a2d3d;width:100%;transition:all .2s;outline:none}
    input:focus,select:focus{border-color:#2980b9;background:#fff;box-shadow:0 0 0 3px rgba(41,128,185,.1)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .btn{font-family:'Source Sans 3',sans-serif;font-size:14px;font-weight:600;padding:12px 22px;border:none;border-radius:10px;cursor:pointer;transition:all .2s;letter-spacing:.2px}
    .btn:disabled{opacity:.3;cursor:not-allowed}
    .btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
  </style>`;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(165deg,#eef2f6,#e0e8f0,#e8eef5)", fontFamily: "'Source Sans 3',sans-serif" }}>
      <div dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px 60px" }}>

        {/* Header */}
        <div style={{ padding: "16px 0 12px", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(10px)", background: "rgba(238,242,246,.82)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 22 }}>⚖️</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2d3d", fontFamily: "'Playfair Display',serif" }}>Rescisão<span style={{ color: "#2980b9" }}>Calc</span></div>
              <div style={{ fontSize: 9, color: "#7f8c9b", letterSpacing: .7, textTransform: "uppercase" }}>Dispensa Coletiva · 22 Verbas · Parser IA</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {anyDone && (
              <>
                <button className="btn" style={{ background: "linear-gradient(135deg,#1a6b3a,#27ae60)", color: "#fff", fontSize: 12, padding: "8px 14px" }} onClick={() => exportXLSXColetivo(employees, "pt")}>📊 Excel PT</button>
                <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff", fontSize: 12, padding: "8px 14px" }} onClick={() => exportXLSXColetivo(employees, "en")}>📊 Excel EN</button>
              </>
            )}
            {employees.length > 0 && <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a", fontSize: 12, padding: "8px 14px" }} onClick={reset}>🔄 Reset</button>}
          </div>
        </div>

        {/* Summary bar when there are results */}
        {anyDone && (
          <div style={{ background: "linear-gradient(135deg,#0f2740,#1a3d5c 50%,#2a6496)", borderRadius: 13, padding: "20px 22px", marginBottom: 16, boxShadow: "0 4px 18px rgba(26,58,92,.3)", animation: "fadeUp .4s ease" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: 1.1, textTransform: "uppercase" }}>Total Geral da Dispensa Coletiva</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#fff", marginTop: 4, fontFamily: "'Playfair Display',serif" }}><AV value={grandTotal} /></div>
            <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
              <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 14, fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)" }}>{employees.filter(e => e.result).length} calculados</span>
              <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 14, fontSize: 9, fontWeight: 600, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)" }}>{employees.length} funcionários</span>
              {employees.filter(e => !e.result).length > 0 && <span style={{ display: "inline-block", padding: "3px 9px", borderRadius: 14, fontSize: 9, fontWeight: 600, background: "rgba(255,200,50,.15)", color: "#ffd54f" }}>{employees.filter(e => !e.result).length} pendentes</span>}
            </div>
          </div>
        )}

        {/* Bulk upload */}
        <div style={{ background: "#fff", borderRadius: 13, padding: "18px 20px", marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,.04),0 5px 18px rgba(0,0,0,.05)", border: "1px solid rgba(200,214,230,.4)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "#1a2d3d", fontFamily: "'Playfair Display',serif" }}>📥 Importar Planilha de Funcionários</h2>
          </div>
          <Info bg="linear-gradient(135deg,#f0f6fd,#e8f1fa)" bc="#b8d4ec" icon="📋">
            <span style={{ color: "#1a3d5c" }}>Planilha com colunas: <strong>Nome, Admissão, Demissão, Salário, Tipo</strong>. Formatos de data: DD/MM/AAAA ou AAAA-MM-DD.</span>
          </Info>
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <input ref={bulkRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) { setBulkFile(e.target.files[0]); setBulkMsg(""); } }} />
            <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a", fontSize: 12, padding: "9px 16px" }} onClick={() => bulkRef.current?.click()}>
              {bulkFile ? `📊 ${bulkFile.name}` : "📎 Selecionar planilha"}
            </button>
            {bulkFile && <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff", fontSize: 12, padding: "9px 16px" }} onClick={() => processBulkUpload(bulkFile)}>Importar →</button>}
            {bulkMsg && <span style={{ fontSize: 12, color: bulkMsg.startsWith("✅") ? "#1a6b3a" : "#c0392b", fontWeight: 500 }}>{bulkMsg}</span>}
          </div>
        </div>

        {/* Employee list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {employees.map((emp, idx) => (
            <EmployeeCard
              key={emp.id}
              emp={emp}
              showIndex={idx + 1}
              onUpdate={patch => updateEmployee(emp.id, patch)}
              onRemove={() => removeEmployee(emp.id)}
              onCalc={() => {}}
            />
          ))}
        </div>

        {/* Add + Calc All */}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn" style={{ background: "#fff", color: "#2a4a6a", border: "1.5px dashed #b8d4ec", flex: 1 }} onClick={addEmployee}>
            + Adicionar Funcionário
          </button>
          {employees.filter(e => !e.result && e.form.dataAdmissao && e.form.dataDemissao && e.form.salario).length > 0 && (
            <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff", flex: 1 }} onClick={calcAll}>
              ⚖️ Calcular Todos ({employees.filter(e => !e.result && e.form.dataAdmissao && e.form.dataDemissao && e.form.salario).length})
            </button>
          )}
        </div>

        {/* Methodology */}
        <div style={{ background: "#fff", borderRadius: 13, padding: "16px 20px", marginTop: 14, border: "1px solid rgba(200,214,230,.4)" }}>
          <details>
            <summary style={{ fontSize: 12, fontWeight: 600, color: "#2a4a6a", cursor: "pointer" }}>▶ Metodologia (22 verbas)</summary>
            <div style={{ fontSize: 11, color: "#5a7080", lineHeight: 1.7, marginTop: 10 }}>
              {[
                ["Saldo Salário", "(Sal / 30) × dias trabalhados no mês"],
                ["Aviso Prévio", "(Sal / 30) × (30 + 3/ano, máx 90d) — Lei 12.506/2011. Acordo=50%"],
                ["13º Proporcional", "(Sal / 12) × meses + projeção do aviso"],
                ["Férias + ⅓", "(Sal / 12) × meses desde aniversário + 1/3 constitucional"],
                ["Férias Vencidas", "Sal + 1/3 por período aquisitivo não gozado"],
                ["Férias em Dobro", "Art. 137 CLT: prazo concessivo expirado"],
                ["Multa 40% FGTS", "Saldo FGTS (depósitos mensais) × 40% ou 20%"],
                ["Horas Extras", "(Sal / 220) × (1 + %) × média/mês × meses"],
                ["Insalubridade", `SM R$${SM.toFixed(2)} × grau (10/20/40%) × meses`],
                ["Periculosidade", "Sal × 30% × meses — Art. 193 CLT"],
                ["Ad. Noturno", "(Sal / 220) × 20% × horas × meses (22h-5h)"],
                ["Intervalo Intrajornada", "(Sal / 220) × 1,5 × horas suprimidas × dias — Art. 71 §4º"],
                ["Salário-Família", "R$65,00/filho ≤14a (sal ≤ R$1.906,04) × meses"],
                ["Reflexo DSR", "6,05% sobre HE + gorjetas + comissões + ad. noturno"],
                ["Multas Art. 467/477", "50% incontroversas / 1 salário atraso"],
              ].map(([t, d], i) => <p key={i} style={{ marginTop: i ? 4 : 0 }}><strong>{t}:</strong> {d}</p>)}
            </div>
          </details>
        </div>

        <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8fafb", borderRadius: 10, border: "1px solid #e4eaf0", fontSize: 10, color: "#7f8c9b", lineHeight: 1.6 }}>
          <strong>Aviso Legal:</strong> Ferramenta de apoio — revisão por advogado habilitado indispensável. SM: R$ {SM.toFixed(2)} · Salário-Família: R$ 65,00/filho (2025). Não contempla ACT/CCT nem correção monetária do FGTS.
        </div>

        <div style={{ textAlign: "center", padding: "20px 0 0", fontSize: 9, color: "#8a96a3" }}>RescisãoCalc Coletiva — 22 verbas · Parser IA · Ferramenta de apoio</div>
      </div>
    </div>
  );
}
