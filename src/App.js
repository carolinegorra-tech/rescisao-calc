import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════ CONSTANTS ═══════════════════════════ */

const SM = 1518.0;
const DSR = 0.0605;

const V = {
  saldoSalario:          { l: "Saldo de Salário",                    i: "💰", d: "Dias trabalhados no mês da rescisão (sal÷30 × dias)" },
  avisoIndenizado:       { l: "Aviso Prévio Indenizado",             i: "📅", d: "30d + 3d/ano completo (máx 90d) — Lei 12.506/2011" },
  decimoTerceiro:        { l: "13º Salário Proporcional",            i: "🎄", d: "Meses no ano ÷ 12, c/ projeção do aviso prévio" },
  feriasProporcionais:   { l: "Férias Proporcionais + ⅓",            i: "🏖️", d: "Meses desde último per. aquisitivo × 4/3" },
  feriasVencidas:        { l: "Férias Vencidas + ⅓",                 i: "⏰", d: "Períodos aquisitivos não gozados × sal × 4/3" },
  feriasEmDobro:         { l: "Férias em Dobro (Art. 137)",          i: "⚠️", d: "Período concessivo expirado → dobro + ⅓" },
  multaFGTS:             { l: "Multa 40% FGTS",                      i: "🏦", d: "40% sobre saldo real ou estimado (inc. FGTS s/ aviso)" },
  horasExtras:           { l: "Horas Extras",                        i: "⏱️", d: "Sal÷220 × (1+%) × média mensal × meses" },
  adicInsalubridade:     { l: "Adicional de Insalubridade",          i: "☣️", d: "10/20/40% do SM × meses" },
  adicPericulosidade:    { l: "Adicional de Periculosidade",         i: "⚡", d: "30% do salário-base × meses" },
  adicNoturno:           { l: "Adicional Noturno",                   i: "🌙", d: "20% sobre hora normal (22h–5h) × meses" },
  intervaloIntrajornada: { l: "Intervalo Intrajornada Suprimido",    i: "🍽️", d: "Período suprimido + 50% — Art. 71 §4º CLT" },
  salarioFamilia:        { l: "Salário-Família",                     i: "👨‍👩‍👧", d: "R$65,00/filho ≤14a (sal ≤ R$1.906,04) × meses" },
  gratificacao:          { l: "Gratificação",                        i: "🎁", d: "Valores habituais pagos pelo empregador" },
  gorjetas:              { l: "Gorjetas",                            i: "🍷", d: "Valores recebidos a título de gorjeta" },
  comissao:              { l: "Comissão",                            i: "📈", d: "Valores recebidos a título de comissão" },
  reflexoDSR:            { l: "Reflexo DSR s/ Variável",             i: "📊", d: "6,05% sobre parcelas variáveis (critério ECT)" },
  plrProporcional:       { l: "PLR Proporcional",                    i: "💵", d: "Extraído dos documentos — valor anual ÷ 12 × meses" },
  estabilidade:          { l: "Indenização por Estabilidade",        i: "🛡️", d: "Extraído dos docs — salários do período restante" },
  multaArt467:           { l: "Multa Art. 467 CLT",                  i: "⚖️", d: "50% verbas incontroversas não pagas na 1ª audiência" },
  multaArt477:           { l: "Multa Art. 477 CLT",                  i: "📜", d: "1 salário se atraso no pagamento rescisório" },
  indenizacaoArt9:       { l: "Inden. Art. 9º Lei 7.238/84",        i: "🔒", d: "1 salário se dispensa nos 30d antes da data-base" },
};

const TIPOS = {
  sem_justa_causa: "Dispensa Sem Justa Causa",
  pedido_demissao: "Pedido de Demissão",
  justa_causa: "Dispensa por Justa Causa",
  mutuo_acordo: "Rescisão por Mútuo Acordo",
};

// Editable fields config for validation screen
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

/* ═══════════════════════════ HELPERS ═══════════════════════════ */

function mB(a, b) {
  const s = new Date(a), e = new Date(b);
  let m = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() >= 15) m++;
  return Math.max(m, 0);
}
function avD(m) { return Math.min(30 + Math.floor(m / 12) * 3, 90); }
function fmt(v) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0); }

/* ═══════════════════════════ CALC ═══════════════════════════ */

function calc(f, dd) {
  const sal = parseFloat(f.salario) || 0;
  const dem = new Date(f.dataDemissao);
  const meses = mB(f.dataAdmissao, f.dataDemissao);
  const dias = dem.getDate();
  const sd = sal / 30, sh = sal / 220;
  const t = f.tipoRescisao;
  const sjc = t === "sem_justa_causa", ac = t === "mutuo_acordo", jc = t === "justa_causa";
  const dav = sjc ? avD(meses) : ac ? avD(meses) : 0;
  const d = dd || {};
  const r = {};

  r.saldoSalario = sd * dias;

  r.avisoIndenizado = sjc ? sd * dav : ac ? sd * dav * 0.5 : 0;

  // 13º Proporcional (projeta aviso como tempo de serviço)
  if (!jc) {
    const adm = new Date(f.dataAdmissao);
    const anoAdm = adm.getFullYear();
    const anoDem = dem.getFullYear();
    const inicioContagem13 = (anoAdm === anoDem) ? adm.getMonth() : 0;
    let m13 = (dem.getMonth() - inicioContagem13 + 1) + ((sjc || ac) ? Math.floor(dav / 30) : 0);
    m13 = Math.max(0, Math.min(m13, 12));
    r.decimoTerceiro = (sal / 12) * m13;
  } else r.decimoTerceiro = 0;

  // Férias Proporcionais + ⅓ (calcula a partir do aniversário do contrato)
  if (!jc) {
    const adm = new Date(f.dataAdmissao);
    let mesAdm = adm.getMonth(), diaAdm = adm.getDate();
    let ultimoAniv = new Date(dem.getFullYear(), mesAdm, diaAdm);
    if (ultimoAniv > dem) ultimoAniv.setFullYear(ultimoAniv.getFullYear() - 1);
    let mf = (dem.getFullYear() - ultimoAniv.getFullYear()) * 12 + (dem.getMonth() - ultimoAniv.getMonth());
    if (dem.getDate() >= 15 && dem.getDate() >= diaAdm) mf = Math.min(mf + (dem.getDate() < diaAdm ? 0 : 0), 12);
    mf = mf + ((sjc || ac) ? Math.floor(dav / 30) : 0);
    mf = Math.max(0, Math.min(mf, 12));
    r.feriasProporcionais = ((sal / 12) * mf) * (4 / 3);
  } else r.feriasProporcionais = 0;

  const qtdF = parseInt(f.feriasVencidasQtd) || (f.feriasVencidas ? 1 : 0);
  r.feriasVencidas = sal * (4 / 3) * qtdF;

  const qtdDobro = parseInt(f.feriasEmDobroQtd) || 0;
  r.feriasEmDobro = sal * (4 / 3) * qtdDobro;

  r.horasExtras = (d.horasExtrasMensais > 0) ? sh * (1 + (d.horasExtrasPercentual || 50) / 100) * d.horasExtrasMensais * meses : 0;
  r.adicInsalubridade = d.insalubridadeGrau ? SM * ({ minimo: .1, medio: .2, maximo: .4 }[d.insalubridadeGrau] || 0) * meses : 0;
  r.adicPericulosidade = d.periculosidade ? sal * 0.30 * meses : 0;
  r.adicNoturno = (d.horasNoturnasMensais > 0) ? sh * 0.20 * d.horasNoturnasMensais * meses : 0;

  if (d.intervaloSuprimidoMinutos > 0) {
    const hSup = d.intervaloSuprimidoMinutos / 60;
    r.intervaloIntrajornada = sh * 1.5 * hSup * (d.diasIntervaloSuprimido || meses * 22);
  } else r.intervaloIntrajornada = 0;

  r.salarioFamilia = (d.filhosMenores > 0 && sal <= 1906.04) ? 65.00 * d.filhosMenores * meses : 0;
  r.gratificacao = (d.gratificacaoMensal > 0) ? d.gratificacaoMensal * meses : 0;
  r.gorjetas = (d.gorjetasMensais > 0) ? d.gorjetasMensais * meses : 0;
  r.comissao = (d.comissaoMensal > 0) ? d.comissaoMensal * meses : 0;

  // Multa 40% FGTS
  // Na rescisão, o depósito de FGTS 8% incide sobre: saldo de salário, aviso prévio indenizado e 13º proporcional
  // As demais verbas variáveis (HE, adicionais, comissões) já geraram FGTS mês a mês durante o contrato
  const fgtsSobreRescisao = (r.saldoSalario + r.avisoIndenizado + r.decimoTerceiro) * 0.08;
  let fgtsTotal;
  if (d.saldoFGTS != null) {
    // Saldo real do extrato + FGTS sobre verbas rescisórias
    fgtsTotal = d.saldoFGTS + fgtsSobreRescisao;
  } else {
    // Estimativa: 8% sobre salários durante contrato + FGTS sobre verbas rescisórias
    fgtsTotal = (sal * 0.08 * meses) + fgtsSobreRescisao;
  }
  r.multaFGTS = sjc ? fgtsTotal * 0.40 : ac ? fgtsTotal * 0.20 : 0;

  const varT = (r.horasExtras || 0) + (r.gorjetas || 0) + (r.comissao || 0) + (r.adicNoturno || 0);
  r.reflexoDSR = varT * DSR;

  if (d.plrAnual > 0) {
    const mPLR = d.plrMesesTrabalhados || dem.getMonth() + 1;
    r.plrProporcional = (d.plrAnual / 12) * mPLR;
  } else r.plrProporcional = 0;

  if (d.estabilidadeTipo && d.estabilidadeMesesRestantes > 0) {
    r.estabilidade = sal * d.estabilidadeMesesRestantes;
  } else r.estabilidade = 0;

  r.multaArt467 = 0;
  r.multaArt477 = d.atrasoPagamento ? sal : 0;
  r.indenizacaoArt9 = d.dispensaPreDataBase ? sal : 0;

  return r;
}

/* ═══════════════════════════ AI ═══════════════════════════ */

const EXTRACT = `Você é um extrator de dados trabalhistas brasileiros altamente preciso. Analise o conteúdo abaixo — que pode ser holerites (Totvs, SAP, ADP, Senior, qualquer layout), controle de ponto, extrato FGTS ou histórico salarial — e extraia os campos em JSON puro.

REGRAS:
- Se não encontrar um campo com certeza, retorne null (NUNCA invente valores)
- Para médias mensais, calcule a média dos meses disponíveis
- Saldo FGTS: procure por "saldo para fins rescisórios" ou valor total
- Horas extras: procure por "H.E.", "HE 50%", "HE 100%", "Hora Extra"
- Insalubridade/Periculosidade: procure nos holerites por esses rubricas
- Comissão/Gorjeta: procure por "comissão", "gorjeta", "gratificação"
- PLR: procure por "PLR", "participação nos lucros", "PPR"
- Estabilidade: procure por referências a gestante, CIPA, acidente de trabalho, auxílio-doença acidentário

Retorne APENAS JSON sem backticks nem explicação:

{
  "saldoFGTS": number|null,
  "horasExtrasMensais": number|null,
  "horasExtrasPercentual": number|null,
  "insalubridadeGrau": "minimo"|"medio"|"maximo"|null,
  "periculosidade": boolean,
  "horasNoturnasMensais": number|null,
  "intervaloSuprimidoMinutos": number|null,
  "diasIntervaloSuprimido": number|null,
  "filhosMenores": number|null,
  "gratificacaoMensal": number|null,
  "gorjetasMensais": number|null,
  "comissaoMensal": number|null,
  "plrAnual": number|null,
  "plrMesesTrabalhados": number|null,
  "estabilidadeTipo": "gestante"|"cipa"|"acidentado"|null,
  "estabilidadeMesesRestantes": number|null,
  "atrasoPagamento": boolean,
  "dispensaPreDataBase": boolean
}

DADOS:\n`;

async function aiParse(text) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: EXTRACT + text }] }),
    });
    const j = await r.json();
    return JSON.parse((j.content?.find(b => b.type === "text")?.text || "").replace(/```json|```/g, "").trim());
  } catch (e) { console.error(e); return null; }
}

async function aiAnalysis(verbas, f, hasDoc, dd) {
  const total = Object.values(verbas).reduce((a, b) => a + b, 0);
  const m = mB(f.dataAdmissao, f.dataDemissao);
  const prompt = `Advogado trabalhista sênior. Resumo executivo PT-BR desta rescisão. Direto, profissional, destaque riscos.

Admissão: ${f.dataAdmissao} | Demissão: ${f.dataDemissao} | Sal: R$${f.salario} | ${m}m | ${TIPOS[f.tipoRescisao]}
Férias vencidas: ${f.feriasVencidas ? "Sim" : "Não"} | Docs: ${hasDoc ? "Sim (validados pelo cliente)" : "Não"}
${hasDoc ? `Extraído e validado: ${JSON.stringify(dd)}` : ""}

Verbas>0: ${Object.entries(verbas).filter(([_, v]) => v > 0).map(([k, v]) => `${V[k]?.l}: R$${v.toFixed(2)}`).join(" | ")}
TOTAL: R$${total.toFixed(2)}

${!hasDoc ? "⚠️ ESTIMATIVA sem documentos. Destaque isso claramente." : "✅ Dados extraídos dos documentos e validados pelo cliente."}
Max 8 linhas. Sem saudação.`;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const j = await r.json();
    return j.content?.find(b => b.type === "text")?.text || "Análise indisponível.";
  } catch { return "Não foi possível gerar a análise."; }
}

/* ═══════════════════════════ SMALL COMPONENTS ═══════════════════════════ */

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

function Dots({ c, total = 5 }) {
  return <div style={{ display: "flex", gap: 5 }}>{Array.from({ length: total }, (_, i) => <div key={i} style={{ width: i <= c ? 24 : 16, height: 4, borderRadius: 2, background: i <= c ? "linear-gradient(90deg,#1a5276,#2980b9)" : "#d5dbe0", transition: "all .35s" }} />)}</div>;
}

function F({ label, type, value, onChange, placeholder, select, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
      {select ? <select value={value} onChange={e => onChange(e.target.value)}>{Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        : <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

function Info({ bg, bc, icon, children }) {
  return <div style={{ padding: "11px 15px", borderRadius: 10, border: `1px solid ${bc}`, display: "flex", gap: 8, alignItems: "flex-start", background: bg }}>
    <span>{icon}</span><div style={{ fontSize: 12, lineHeight: 1.5 }}>{children}</div>
  </div>;
}

/* ═══════════════════════════ MAIN APP ═══════════════════════════ */
// Steps: 0=info, 1=docs, 2=processing, 3=validate, 4=results

export default function App() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    dataAdmissao: "", dataDemissao: "", salario: "",
    feriasVencidas: false, feriasVencidasQtd: "1", feriasEmDobroQtd: "0",
    tipoRescisao: "sem_justa_causa",
  });
  const [files, setFiles] = useState([]);
  const [dd, setDD] = useState(null);
  const [editDD, setEditDD] = useState(null); // editable copy for validation
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
        let t = ""; wb.SheetNames.forEach(n => { t += `\n=== ${n} ===\n` + X.utils.sheet_to_csv(wb.Sheets[n]); });
        res(t);
      } catch { res(""); }
    }; r.readAsArrayBuffer(file);
  });

  // Step 1→2: Parse documents
  const parseDocuments = async () => {
    setStep(2); let ext = null;
    if (files.length > 0) {
      if (!window.XLSX) {
        setMsg("Carregando leitor...");
        await new Promise(r => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; sc.onload = r; sc.onerror = r; document.head.appendChild(sc); });
      }
      setMsg("Lendo planilhas...");
      let all = "";
      for (const x of files) { if (/\.(xlsx|xls|csv)$/i.test(x.name)) all += `\n--- ${x.name} ---\n` + await readXL(x); }
      if (all.trim()) { setMsg("🤖 IA analisando documentos..."); ext = await aiParse(all.substring(0, 15000)); }
    }
    if (ext) {
      setDD(ext);
      setEditDD({ ...ext });
      setStep(3); // Go to validation
    } else {
      // No docs or parse failed — skip validation, go straight to calc
      setDD(null);
      setEditDD(null);
      await runCalc(null);
    }
  };

  // Step 1→4 (no docs) or Step 3→4 (after validation)
  const runCalc = async (docData) => {
    setStep(2);
    setMsg("Calculando 22 verbas...");
    await new Promise(r => setTimeout(r, 400));
    const verbas = calc(f, docData);
    setRes(verbas);
    setMsg("Gerando análise...");
    const analysis = await aiAnalysis(verbas, f, !!docData, docData);
    setAi(analysis);
    setStep(4);
  };

  // Confirm validated data and calculate
  const confirmAndCalc = () => {
    setDD(editDD);
    runCalc(editDD);
  };

  const updateField = (key, val) => {
    setEditDD(p => ({ ...p, [key]: val }));
  };

  const reset = () => {
    setStep(0);
    setF({ dataAdmissao: "", dataDemissao: "", salario: "", feriasVencidas: false, feriasVencidasQtd: "1", feriasEmDobroQtd: "0", tipoRescisao: "sem_justa_causa" });
    setFiles([]); setDD(null); setEditDD(null); setRes(null); setAi("");
  };

  const total = res ? Object.values(res).reduce((a, b) => a + b, 0) : 0;
  const pos = res ? Object.entries(res).filter(([_, v]) => v > 0).sort((a, b) => b[1] - a[1]) : [];
  const zero = res ? Object.entries(res).filter(([_, v]) => v === 0) : [];

  return (
    <div style={S.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        ::selection{background:#1a5276;color:#e8f4fd}
        input,select{font-family:'Source Sans 3',sans-serif;font-size:15px;padding:12px 14px;border:1.5px solid #cbd5e0;border-radius:10px;background:#f8fafb;color:#1a2d3d;width:100%;transition:all .2s;outline:none}
        input:focus,select:focus{border-color:#2980b9;background:#fff;box-shadow:0 0 0 3px rgba(41,128,185,.1)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideR{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .btn{font-family:'Source Sans 3',sans-serif;font-size:14px;font-weight:600;padding:13px 26px;border:none;border-radius:10px;cursor:pointer;transition:all .2s;letter-spacing:.2px}
        .btn:disabled{opacity:.3;cursor:not-allowed}
        .btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.1)}
        .row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #edf0f3;gap:12px}
        .row:last-child{border-bottom:none}
        details summary{list-style:none}
        details summary::-webkit-details-marker{display:none}
        .toggle{width:40px;height:22px;border-radius:11px;cursor:pointer;position:relative;transition:all .2s;border:none}
        .toggle::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:3px;transition:all .2s}
        .toggle.on{background:#2980b9}
        .toggle.on::after{left:21px}
        .toggle.off{background:#cbd5e0}
        .toggle.off::after{left:3px}
      `}</style>

      <div style={S.ctn}>
        {/* HEADER */}
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

        {/* ── STEP 0: DADOS ── */}
        {step === 0 && (
          <div style={{ animation: "fadeUp .4s ease both" }}>
            <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
              <h1 style={S.ttl}>Calculadora de <span style={{ color: "#2980b9", textDecoration: "underline", textDecorationColor: "#2980b9", textUnderlineOffset: "4px" }}>verbas rescisórias</span></h1>
              <p style={{ fontSize: 14, color: "#5a7080", maxWidth: 490, margin: "10px auto 16px", lineHeight: 1.6 }}>
                22 verbas. Anexe planilhas em qualquer formato — a IA extrai os dados e você valida antes do cálculo.
              </p>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
                {["22 Verbas", "Parser IA", "Validação", "FGTS Real", "DSR 6,05%", "Art. 137"].map((t, i) => (
                  <span key={t} style={{ ...S.tag, animation: `fadeUp .3s ease ${.07 * i}s both` }}>{t}</span>
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
                <div onClick={() => s("feriasVencidas", !f.feriasVencidas)}
                  style={{ ...S.chk, borderColor: f.feriasVencidas ? "#2980b9" : "#cbd5e0", background: f.feriasVencidas ? "rgba(41,128,185,.04)" : "#f8fafb" }}>
                  <div style={{ ...S.chkB, borderColor: f.feriasVencidas ? "#2980b9" : "#aab4c0", background: f.feriasVencidas ? "#2980b9" : "transparent" }}>
                    {f.feriasVencidas && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d" }}>Férias vencidas?</div>
                    <div style={{ fontSize: 11, color: "#7f8c9b" }}>Períodos aquisitivos não gozados</div>
                  </div>
                  {f.feriasVencidas && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: 11, color: "#5a7080" }}>Qtd:</span>
                      <input type="number" min="1" max="5" value={f.feriasVencidasQtd} onChange={e => s("feriasVencidasQtd", e.target.value)}
                        style={{ width: 48, padding: "5px 7px", fontSize: 12, textAlign: "center" }} />
                      <span style={{ fontSize: 11, color: "#5a7080", marginLeft: 6 }}>Em dobro:</span>
                      <input type="number" min="0" max="5" value={f.feriasEmDobroQtd} onChange={e => s("feriasEmDobroQtd", e.target.value)}
                        style={{ width: 48, padding: "5px 7px", fontSize: 12, textAlign: "center" }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16, padding: "10px 13px", background: "#f8f9fa", borderRadius: 8, border: "1px solid #e2e6ea", fontSize: 11, color: "#6b7b8d", lineHeight: 1.55 }}>
                <strong>Atenção:</strong> Este cálculo não contempla pagamentos previstos em acordo ou convenção coletiva de trabalho (ACT/CCT) e não aplica correção monetária sobre o saldo do FGTS.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                <button className="btn" disabled={!ok}
                  style={{ background: ok ? "linear-gradient(135deg,#1a3d5c,#2980b9)" : "#cbd5e0", color: "#fff" }}
                  onClick={() => setStep(1)}>
                  Próximo → Documentos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: DOCS ── */}
        {step === 1 && (
          <div style={{ animation: "fadeUp .4s ease both" }}>
            <div style={S.card}>
              <h2 style={S.ch}>📄 Documentos para Análise IA</h2>
              <p style={{ fontSize: 13, color: "#5a7080", marginBottom: 16, lineHeight: 1.6 }}>
                A IA lê planilhas em <strong>qualquer formato</strong> e extrai os dados. Você poderá <strong>revisar e corrigir</strong> tudo antes do cálculo.
              </p>

              <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); hF(e.dataTransfer.files); }}
                onClick={() => ref.current?.click()}
                style={{ border: `2px dashed ${drag ? "#2980b9" : "#cbd5e0"}`, borderRadius: 12, padding: "28px 16px", textAlign: "center", cursor: "pointer", background: drag ? "rgba(41,128,185,.03)" : "#fafbfd", transition: "all .2s" }}>
                <input ref={ref} type="file" multiple accept=".xlsx,.xls,.csv,.pdf" style={{ display: "none" }} onChange={e => hF(e.target.files)} />
                <div style={{ fontSize: 34, marginBottom: 4 }}>{drag ? "📥" : "📎"}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d" }}>Clique ou arraste</div>
                <div style={{ fontSize: 11, color: "#8a96a3", marginTop: 2 }}>Excel, CSV ou PDF</div>
              </div>

              {files.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                  {files.map((x, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", background: "#eef3f8", borderRadius: 8, animation: `slideR .25s ease ${i * .06}s both` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 15 }}>{/pdf/i.test(x.name) ? "📕" : "📊"}</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d" }}>{x.name}</span>
                        <span style={{ fontSize: 10, color: "#8a96a3" }}>({(x.size / 1024).toFixed(0)}KB)</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setFiles(p => p.filter((_, j) => j !== i)); }}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#8a96a3", padding: "2px 5px" }}>✕</button>
                    </div>
                  ))}
                  <Info bg="linear-gradient(135deg,#e8f8f0,#d5f0e3)" bc="#6fcf97" icon="🤖">
                    <span style={{ color: "#1a5c38" }}><strong>Parser IA ativado.</strong> Após a extração, você poderá revisar e corrigir todos os dados antes do cálculo.</span>
                  </Info>
                </div>
              )}

              {files.length === 0 && (
                <div style={{ marginTop: 12 }}>
                  <Info bg="linear-gradient(135deg,#fef9e7,#fdf2d0)" bc="#f0d060" icon="⚠️">
                    <span style={{ color: "#6b5a10" }}><strong>Sem documentos:</strong> Cálculo será estimativa (ballpark). Verbas como horas extras, adicionais, comissões, PLR e estabilidade só são calculadas com documentos.</span>
                  </Info>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
                <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a" }} onClick={() => setStep(0)}>← Voltar</button>
                <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff" }} onClick={parseDocuments}>
                  {files.length > 0 ? "🤖 Analisar Documentos" : "⚖️ Calcular Estimativa"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: LOADING ── */}
        {step === 2 && (
          <div style={{ animation: "fadeUp .3s ease both", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 380 }}>
            <div style={{ width: 48, height: 48, border: "3px solid #e0e6ec", borderTopColor: "#2980b9", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
            <div style={{ marginTop: 18, fontSize: 14, fontWeight: 500, color: "#1a2d3d" }}>{msg}</div>
          </div>
        )}

        {/* ── STEP 3: VALIDATE EXTRACTED DATA ── */}
        {step === 3 && editDD && (
          <div style={{ animation: "fadeUp .4s ease both" }}>
            <div style={S.card}>
              <h2 style={S.ch}>🔍 Confira os Dados Extraídos</h2>
              <Info bg="linear-gradient(135deg,#e8f0fd,#dae4f8)" bc="#7bafd4" icon="✏️">
                <span style={{ color: "#1a3d5c" }}>A IA extraiu estes dados dos seus documentos. <strong>Revise e corrija</strong> o que for necessário antes de calcular.</span>
              </Info>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
                {EDIT_FIELDS.map(({ key, label, type, options, placeholder }) => {
                  const val = editDD[key];
                  const hasValue = val !== null && val !== undefined && val !== "" && val !== false && val !== 0;

                  if (type === "bool") {
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: hasValue && val ? "#eef8f2" : "#f8fafb", borderRadius: 8, border: `1px solid ${hasValue && val ? "#6fcf97" : "#e8ecf0"}` }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#1a2d3d" }}>{label}</span>
                        <button className={`toggle ${val ? "on" : "off"}`} onClick={() => updateField(key, !val)} />
                      </div>
                    );
                  }

                  if (type === "select") {
                    return (
                      <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
                        <select value={val || ""} onChange={e => updateField(key, e.target.value || null)}
                          style={{ background: hasValue ? "#eef8f2" : undefined, borderColor: hasValue ? "#6fcf97" : undefined }}>
                          {Object.entries(options).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <label style={{ fontSize: 10, fontWeight: 600, color: "#4a6a7f", textTransform: "uppercase", letterSpacing: .5 }}>{label}</label>
                      <input type="number" placeholder={placeholder || "—"} value={val != null ? val : ""}
                        onChange={e => updateField(key, e.target.value === "" ? null : parseFloat(e.target.value))}
                        style={{ background: hasValue ? "#eef8f2" : undefined, borderColor: hasValue ? "#6fcf97" : undefined }} />
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, fontSize: 11, color: "#7f8c9b", lineHeight: 1.5 }}>
                Campos em <span style={{ color: "#2a8c5a", fontWeight: 600 }}>verde</span> foram detectados nos documentos. Campos vazios não serão considerados no cálculo.
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20, gap: 10 }}>
                <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a" }} onClick={() => setStep(1)}>← Voltar</button>
                <button className="btn" style={{ background: "linear-gradient(135deg,#1a3d5c,#2980b9)", color: "#fff" }} onClick={confirmAndCalc}>
                  ✅ Confirmar e Calcular
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: RESULTS ── */}
        {step === 4 && res && (
          <div style={{ animation: "fadeUp .4s ease both" }}>
            <div style={S.tot}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: 1.1, textTransform: "uppercase" }}>Total Estimado da Rescisão</div>
              <div style={{ fontSize: 38, fontWeight: 700, color: "#fff", marginTop: 6, fontFamily: "'Playfair Display',serif" }}><AV value={total} /></div>
              <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                <span style={S.tl}>{TIPOS[f.tipoRescisao]}</span>
                <span style={S.tl}>{mB(f.dataAdmissao, f.dataDemissao)} meses</span>
                <span style={S.tl}>22 verbas analisadas</span>
                {dd && <span style={{ ...S.tl, background: "rgba(111,207,151,.2)", color: "#a8f0c8" }}>✅ Dados validados</span>}
                {!dd && <span style={{ ...S.tl, background: "rgba(255,200,50,.2)", color: "#ffd54f" }}>⚠️ Estimativa</span>}
              </div>
            </div>

            {/* AI Analysis */}
            <div style={{ ...S.card, marginTop: 14 }}>
              <h2 style={S.ch}>🤖 Análise Automática</h2>
              {!ai
                ? <div style={{ padding: "14px 0" }}>{[100, 75, 50].map((w, i) => <div key={i} style={{ height: 10, borderRadius: 5, width: `${w}%`, background: "linear-gradient(90deg,#e8eef3,#d0dae4,#e8eef3)", backgroundSize: "200% 100%", animation: `shimmer 1.3s infinite ${i * .15}s`, marginBottom: 7 }} />)}</div>
                : <div style={{ fontSize: 13, color: "#2a3a4a", lineHeight: 1.7, whiteSpace: "pre-wrap", padding: "11px 14px", background: "#f8fafb", borderRadius: 9, border: "1px solid #e4eaf0" }}>{ai}</div>
              }
            </div>

            {/* Detail */}
            <div style={{ ...S.card, marginTop: 14 }}>
              <h2 style={S.ch}>📊 Detalhamento — {pos.length} Verbas Apuradas</h2>
              {pos.map(([k, v], i) => (
                <div className="row" key={k} style={{ animation: `slideR .3s ease ${i * .04}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 17, flexShrink: 0 }}>{V[k]?.i}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2d3d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{V[k]?.l}</div>
                      <div style={{ fontSize: 10, color: "#8a96a3", marginTop: 1 }}>{V[k]?.d}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a3d5c", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                    <AV value={v} delay={120 + i * 60} />
                  </div>
                </div>
              ))}
              {zero.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#8a96a3", textTransform: "uppercase", letterSpacing: .6, marginBottom: 6 }}>Não apuradas (R$ 0,00)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {zero.map(([k]) => <span key={k} style={{ ...S.tag, background: "#f0f2f5", color: "#8a96a3", fontSize: 9 }}>{V[k]?.l}</span>)}
                  </div>
                  {!dd && <div style={{ fontSize: 10, color: "#8a96a3", marginTop: 5, fontStyle: "italic" }}>Anexe documentos para apurar estas verbas.</div>}
                </div>
              )}
            </div>

            {/* Methodology */}
            <div style={{ ...S.card, marginTop: 14 }}>
              <details>
                <summary style={{ fontSize: 12, fontWeight: 600, color: "#2a4a6a", cursor: "pointer" }}>▶ Metodologia de Cálculo (22 verbas)</summary>
                <div style={{ fontSize: 11, color: "#5a7080", lineHeight: 1.7, marginTop: 10 }}>
                  {[
                    ["Saldo Salário", "(Sal ÷ 30) × dias trabalhados no mês da rescisão"],
                    ["Aviso Prévio", "(Sal ÷ 30) × (30 + 3/ano, máx 90d) — Lei 12.506/2011. Acordo=50%"],
                    ["13º Proporcional", "(Sal ÷ 12) × meses trabalhados no ano da demissão (se admissão no mesmo ano, conta a partir do mês de admissão) + projeção do aviso como tempo de serviço"],
                    ["Férias + ⅓", "(Sal ÷ 12) × meses desde o último aniversário do contrato × 4/3 + projeção do aviso"],
                    ["Férias Vencidas", "Sal × 4/3 × qtd de períodos aquisitivos completos não gozados"],
                    ["Férias em Dobro", "Art. 137 CLT: Sal × 4/3 adicional por período cujo prazo concessivo (12m) expirou"],
                    ["Multa 40% FGTS", "(Saldo FGTS real ou estimado + 8% sobre saldo de salário, aviso prévio indenizado e 13º proporcional) × 40% (ou 20% acordo)"],
                    ["Horas Extras", "(Sal ÷ 220) × (1 + adicional%) × média mensal × meses"],
                    ["Insalubridade", `SM (R$${SM.toFixed(2)}) × grau: mínimo 10%, médio 20%, máximo 40% × meses`],
                    ["Periculosidade", "Sal × 30% × meses — Art. 193 CLT"],
                    ["Ad. Noturno", "(Sal ÷ 220) × 20% × horas noturnas/mês (22h–5h) × meses"],
                    ["Intervalo Intrajornada", "(Sal ÷ 220) × 1,5 × horas suprimidas/dia × dias — Art. 71§4º (pós-Reforma: indenizatório, apenas período suprimido)"],
                    ["Sal-Família", "R$65,00/filho ≤14a para remuneração ≤ R$1.906,04 × meses — Portaria MPS/MF 6/2025"],
                    ["Gratificação/Gorjetas/Comissão", "Média mensal extraída dos docs × meses"],
                    ["Reflexo DSR", "6,05% sobre total de variáveis (HE + gorjetas + comissões + ad. noturno)"],
                    ["PLR Proporcional", "Extraído dos docs: PLR anual ÷ 12 × meses trabalhados no período de apuração"],
                    ["Estabilidade", "Extraído dos docs: Sal × meses restantes de estabilidade (gestante/CIPA/acidentado)"],
                    ["Multa Art. 477", "1 salário se atraso no pagamento rescisório — Art. 477 §8º CLT"],
                    ["Multa Art. 467", "50% das verbas incontroversas não pagas na 1ª audiência — Art. 467 CLT"],
                    ["Inden. Art. 9º", "1 salário se dispensa nos 30d antes da data-base — Lei 7.238/84"],
                  ].map(([t, d], i) => <p key={i} style={{ marginTop: i ? 5 : 0 }}><strong>{t}:</strong> {d}</p>)}
                </div>
              </details>
            </div>

            <div style={{ marginTop: 14, padding: "12px 16px", background: "#f8fafb", borderRadius: 10, border: "1px solid #e4eaf0", fontSize: 10, color: "#7f8c9b", lineHeight: 1.6 }}>
              <strong>Aviso Legal:</strong> {!dd ? "Valores são estimativas (ballpark figures). Anexe documentos para cálculo preciso." : "Valores baseados em dados extraídos por IA e validados pelo cliente."} Ferramenta de apoio — revisão por advogado habilitado indispensável. SM: R$ {SM.toFixed(2)} · Sal-Família: R$ 65,00/filho (2025).
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
              <button className="btn" style={{ background: "#eaeff3", color: "#2a4a6a" }} onClick={reset}>🔄 Novo Cálculo</button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "26px 0 10px", fontSize: 9, color: "#8a96a3" }}>
          RescisãoCalc — 22 verbas · Parser IA · Ferramenta de apoio
        </div>
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
