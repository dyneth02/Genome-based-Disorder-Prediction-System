// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import "./App.css";

const API_BASE = "http://localhost:8000"; // change if needed

// ---------- Backend schema keys (must match exactly) ----------
const SCHEMA_KEYS = {
  gender: ["Gender_ambiguous", "Gender_female", "Gender_male"],
  blood: [
    "Blood test result_abnormal",
    "Blood test result_inconclusive",
    "Blood test result_normal",
    "Blood test result_slightly abnormal",
  ],
  tests: ["Test 1", "Test 2", "Test 3", "Test 4", "Test 5"],
  symptoms: ["Symptom 1", "Symptom 2", "Symptom 3", "Symptom 4", "Symptom 5"],
  numeric: [
    "Patient Age",
    "Blood cell count (mcL)",
    "Mother's age",
    "Father's age",
    "No. of previous abortion",
    "White Blood cell count (thousand per microliter)",
    "Respiratory Rate (breaths/min)",
    "Heart Rate (rates/min", // NOTE: schema key has no closing ')'
  ],
  computed: [
    "Parental Age Diff", // auto: |Father - Mother|
    "Symptom Score", // auto: count of selected symptoms
  ],
  binaryYesNo: [
    "Genes in mother's side",
    "Inherited from father",
    "Maternal gene",
    "Paternal gene",
    "Birth asphyxia",
    "Autopsy shows birth defect (if applicable)",
    "Folic acid details (peri-conceptional)",
    "H/O serious maternal illness",
    "H/O radiation exposure (x-ray)",
    "H/O substance abuse",
    "Assisted conception IVF/ART",
    "History of anomalies in previous pregnancies",
    "Birth defects",
  ],
  statusAliveDeceased: "Status", // Alive (1) / Deceased (0)
  followUpHighLow: "Follow-up", // High(1)/Low(0)
};

// Limit which Yes/No items are rendered in the UI (others remain in payload as 0)
const VISIBLE_YES_NO = [
  "Genes in mother's side",
  "Inherited from father",
  "Maternal gene",
  "Paternal gene",
];

// Friendly names for UI only
const FRIENDLY_LABELS = {
  tests: {
    "Test 1": "Karyotyping / Chromosomal Analysis",
    "Test 2": "PCR / Molecular Genetic Test",
    "Test 3": "Enzyme Assay / Biochemical Test",
    "Test 4": "Prenatal Imaging / Ultrasound",
    "Test 5": "Hormone / Metabolic Panel",
  },
  symptoms: {
    "Symptom 1": "Developmental Delay / Growth Issues",
    "Symptom 2": "Neurological Symptoms (Seizures, Weakness)",
    "Symptom 3": "Respiratory Difficulties",
    "Symptom 4": "Cardiac Abnormalities",
    "Symptom 5": "Physical Traits / Dysmorphic Features",
  },
};

// Sample payload (for quick load)
const SAMPLE_PAYLOAD = {
  "Gender_ambiguous": 0,
  "Gender_female": 1,
  "Gender_male": 0,
  "Blood test result_abnormal": 0,
  "Blood test result_inconclusive": 0,
  "Blood test result_normal": 0,
  "Blood test result_slightly abnormal": 1,
  "Patient Age": 13,
  "Blood cell count (mcL)": 5000,
  "Mother's age": 34,
  "Father's age": 50,
  "Test 1": 0,
  "Test 2": 0,
  "Test 3": 0,
  "Test 4": 0,
  "Test 5": 0,
  "No. of previous abortion": 1,
  "White Blood cell count (thousand per microliter)": 12,
  "Symptom 1": 1,
  "Symptom 2": 0,
  "Symptom 3": 0,
  "Symptom 4": 0,
  "Symptom 5": 1,
  "Parental Age Diff": 4,
  "Symptom Score": 2,
  "Genes in mother's side": 0,
  "Inherited from father": 1,
  "Maternal gene": 1,
  "Paternal gene": 1,
  "Status": 1,
  "Respiratory Rate (breaths/min)": 10,
  "Heart Rate (rates/min": 92,
  "Follow-up": 0,
  "Birth asphyxia": 0,
  "Autopsy shows birth defect (if applicable)": 0,
  "Folic acid details (peri-conceptional)": 0,
  "H/O serious maternal illness": 0,
  "H/O radiation exposure (x-ray)": 0,
  "H/O substance abuse": 0,
  "Assisted conception IVF/ART": 0,
  "History of anomalies in previous pregnancies": 0,
  "Birth defects": 0,
};

// --- Legend content (user-friendly descriptions) ---
const LEGEND = [
  { label: "Patient Age", desc: "Represents the age of a patient" },
  { label: "Genes in mother's side", desc: "Represents a gene defect in a patient's mother" },
  { label: "Inherited from father", desc: "Represents a gene defect in a patient's father" },
  { label: "Maternal gene", desc: "Represents a gene defect in the patient's maternal side of the family" },
  { label: "Paternal gene", desc: "Represents a gene defect in a patient's paternal side of the family" },
  { label: "Blood cell count (mcL)", desc: "Represents the blood cell count of a patient" },
  { label: "Mother's age", desc: "Represents a patient's mother's age" },
  { label: "Father's age", desc: "Represents a patient's father's age" },
  { label: "Status", desc: "Represents whether a patient is deceased" },
  { label: "Respiratory Rate (breaths/min)", desc: "Represents a patient's respiratory breathing rate" },
  { label: "Heart Rate (rates/min)", desc: "Represents a patient's heart rate" },
  { label: "Test 1 - Test 5", desc: "Represents different (masked) tests that were conducted on a patient" },
  { label: "Follow-up", desc: "Represents a patient's level of risk (how intense their condition is)" },
  { label: "Gender", desc: "Represents a patient's gender" },
  { label: "Birth asphyxia", desc: "Represents whether a patient suffered from birth asphyxia" },
  { label: "Autopsy shows birth defect (if applicable)", desc: "Represents whether a patient's autopsy showed any birth defects" },
  { label: "Folic acid details (peri-conceptional)", desc: "Represents the periconceptional folic acid supplementation details of a patient" },
  { label: "H/O serious maternal illness", desc: "Represents an unexpected outcome of labor and delivery that resulted in significant short or long-term consequences to a patient's mother" },
  { label: "H/O radiation exposure (x-ray)", desc: "Represents whether a patient has any radiation exposure history" },
  { label: "H/O substance abuse", desc: "Represents whether a parent has a history of drug addiction" },
  { label: "Assisted conception IVF/ART", desc: "Represents the type of treatment used for infertility" },
  { label: "History of anomalies in previous pregnancies", desc: "Represents whether the mother had any anomalies in her previous pregnancies" },
  { label: "No. of previous abortion", desc: "Represents the number of abortions that a mother had" },
  { label: "Birth defects", desc: "Represents whether a patient has birth defects" },
  { label: "White Blood cell count (thousand per microliter)", desc: "Represents a patient's white blood cell count" },
  { label: "Blood test result", desc: "Represents a patient's blood test result" },
  { label: "Symptom 1 - Symptom 5", desc: "Represents (masked) different types of symptoms that a patient had" },
  { label: "Genetic Disorder", desc: "Represents the genetic disorder that a patient has" },
  { label: "Disorder Subclass", desc: "Represents the subclass of the disorder" },
];

// UI helpers
const prettyPercent = (p) => `${(p * 100).toFixed(2)}%`;
const chipBase =
    "px-3 py-1.5 rounded-xl border transition-colors text-sm select-none";
const chipOn = "bg-emerald-500/20 border-emerald-400/50 text-emerald-200";
const chipOff = "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10";

// Segmented control pill
function Segmented({ options, value, onChange, layoutId }) {
  return (
      <div className="inline-flex relative gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
              <button
                  key={opt.value}
                  onClick={() => onChange(opt.value)}
                  className={`relative px-3 py-1.5 rounded-xl text-sm border transition-colors
              ${active
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
              >
                {/* moving highlight (shared per group) */}
                {active && (
                    <motion.span
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-xl bg-emerald-500/20"
                        transition={{ type: "spring", stiffness: 160, damping: 26, mass: 0.28 }}
                    />
                )}
                {/* text sits above the highlight */}
                <span className="relative z-10">{opt.label}</span>
              </button>
          );
        })}
      </div>
  );
}

// Toggle pill Yes/No
function YesNo({ value, onChange, layoutId }) {
  const opts = [
    { label: "No", v: 0 },
    { label: "Yes", v: 1 },
  ];
  return (
      <div className="inline-flex relative gap-2">
        {opts.map((o) => {
          const active = value === o.v;
          return (
              <button
                  key={o.label}
                  onClick={() => onChange(o.v)}
                  className={`relative px-3 py-1.5 rounded-xl text-sm border transition-colors
              ${active
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
              >
                {active && (
                    <motion.span
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-xl bg-emerald-500/20"
                        transition={{ type: "spring", stiffness: 160, damping: 26, mass: 0.28 }}
                    />
                )}
                <span className="relative z-10">{o.label}</span>
              </button>
          );
        })}
      </div>
  );
}

// High/Low toggle
function HighLow({ value, onChange, layoutId }) {
  const opts = [
    { label: "Low", v: 0 },
    { label: "High", v: 1 },
  ];
  return (
      <div className="inline-flex relative gap-2">
        {opts.map((o) => {
          const active = value === o.v;
          return (
              <button
                  key={o.label}
                  onClick={() => onChange(o.v)}
                  className={`relative px-3 py-1.5 rounded-xl text-sm border transition-colors
              ${active
                      ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-200"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
              >
                {active && (
                    <motion.span
                        layoutId={layoutId}
                        className="absolute inset-0 rounded-xl bg-emerald-500/20"
                        transition={{ type: "spring", stiffness: 160, damping: 26, mass: 0.28 }}
                    />
                )}
                <span className="relative z-10">{o.label}</span>
              </button>
          );
        })}
      </div>
  );
}

export default function App() {
  const pageRef = useRef(null);
  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(
          pageRef.current,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  // ------------ UI State ------------
  const [modelId, setModelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showLegend, setShowLegend] = useState(false);
  const [showConfGD, setShowConfGD] = useState(false); // Genetic Disorder confidence modal
  const [showConfDS, setShowConfDS] = useState(false); // Disorder Subclass confidence modal
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Radio-like groups
  const [genderOpt, setGenderOpt] = useState("female"); // "ambiguous" | "female" | "male"
  const [bloodOpt, setBloodOpt] = useState("normal"); // "abnormal"|"inconclusive"|"normal"|"slightly abnormal"

  // Multi-select chips
  const [testsSel, setTestsSel] = useState(new Set()); // values: 1..5
  const [sympSel, setSympSel] = useState(new Set()); // values: 1..5

  // Numeric inputs
  const [nums, setNums] = useState({
    "Patient Age": "",
    "Blood cell count (mcL)": "",
    "Mother's age": "",
    "Father's age": "",
    "No. of previous abortion": "",
    "White Blood cell count (thousand per microliter)": "",
    "Respiratory Rate (breaths/min)": "",
    "Heart Rate (rates/min": "",
  });

  // Yes/No groups (value = 0/1)
  const initYN = {};
  SCHEMA_KEYS.binaryYesNo.forEach((k) => (initYN[k] = 0));
  const [yesNo, setYesNo] = useState(initYN);
  const [status, setStatus] = useState(1); // Alive (1) / Deceased (0)
  const [followUp, setFollowUp] = useState(0); // Low(0)/High(1)

  // Computed fields
  const symScore = useMemo(() => sympSel.size, [sympSel]);
  const parentalAgeDiff = useMemo(() => {
    const m = Number(nums["Mother's age"]);
    const f = Number(nums["Father's age"]);
    if (Number.isFinite(m) && Number.isFinite(f)) return Math.abs(f - m);
    return "";
  }, [nums]);

  // Helpers
  const toggleSet = (theSet, v) => {
    const s = new Set(theSet);
    if (s.has(v)) s.delete(v);
    else s.add(v);
    return s;
  };
  const handleNum = (k, v) =>
      setNums((p) => ({ ...p, [k]: v === "" ? "" : Number(v) }));

  // Build and print a modern report (use browser's Save as PDF)
  const downloadReportPdf = () => {
    if (!result) return;
    const preds = result?.predictions || {};
    const confs = result?.confidences || {};
    const targets = Array.isArray(result?.targets) && result.targets.length > 0
        ? result.targets
        : Object.keys(confs);
    const targetGD = targets.find((t) => t.toLowerCase().includes("genetic")) || targets[0];
    const targetDS = targets.find((t) => t.toLowerCase().includes("subclass")) || targets[1] || targets[0];

    const patientDetails = {
      Gender: genderOpt,
      "Blood Test Result": bloodOpt,
      ...nums,
      "Parental Age Diff": Number.isFinite(Number(parentalAgeDiff)) ? parentalAgeDiff : "",
      "Symptom Score": symScore,
    };

    const esc = (s) => String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const formatDetails = Object.entries(patientDetails)
        .map(([k, v]) => `<div class="row"><span>${esc(k)}</span><span>${esc(v)}</span></div>`)
        .join("");

    const confSection = Object.entries(confs)
        .map(([t, dist]) => {
          const rows = Object.entries(dist)
              .map(([label, prob]) => `<div class="row"><span>${esc(label)}</span><span>${prettyPercent(prob)}</span></div>`)
              .join("");
          return `<div class="card"><h3>${esc(t)}</h3>${rows}</div>`;
        })
        .join("");

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>GeneReveal Report</title>
<style>
  :root{--bg:#0b0f14;--card:#10151c;--muted:#94a3b8;--text:#e5e7eb;--accent:#34d399;--line:rgba(255,255,255,.08)}
  @media print {@page { size: A4; margin: 14mm }}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}
  .wrap{max-width:980px;margin:24px auto;padding:0 16px}
  .brand{display:flex;align-items:center;gap:12px;background:rgba(52,211,153,.12);border:1px solid rgba(52,211,153,.35);border-radius:16px;padding:16px 18px;margin-bottom:18px}
  .logo{height:40px;width:40px;border-radius:12px;background:rgba(52,211,153,.2);border:1px solid rgba(52,211,153,.4);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--accent)}
  .brand h1{font-size:20px;margin:0}
  .muted{color:var(--muted)}
  .grid{display:grid;grid-template-columns:1fr;gap:16px}
  @media(min-width:820px){.grid{grid-template-columns:1fr 1fr}}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px}
  .card h2{font-size:16px;margin:0 0 10px 0;color:var(--muted)}
  .card h3{font-size:14px;margin:6px 0 10px 0;color:var(--muted)}
  .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px dashed var(--line)}
  .row:last-child{border-bottom:none}
  .pill{display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(52,211,153,.15);border:1px solid rgba(52,211,153,.35);color:var(--accent);font-weight:700}
  .big{font-size:28px;font-weight:800;color:var(--accent)}
  pre{white-space:pre-wrap;word-wrap:break-word;margin:0}
</style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><div class="logo">GR</div><div><h1>GeneReveal</h1><div class="muted">Genetic Disorder Prediction Report</div></div></div>
    <div class="grid">
      <div class="card">
        <h2>Patient Details</h2>
        ${formatDetails}
      </div>
      <div class="card">
        <h2>Predicted Outcomes</h2>
        <div class="row"><span>Genetic Disorder</span><span class="pill">${esc(preds[targetGD] ?? Object.values(preds)[0] ?? "—")}</span></div>
        <div class="row"><span>Disorder Subclass</span><span class="pill">${esc(preds[targetDS] ?? Object.values(preds)[1] ?? "—")}</span></div>
      </div>
      <div class="card" style="grid-column:1/-1">
        <h2>Confidence Distributions</h2>
        ${confSection}
      </div>
      <div class="card" style="grid-column:1/-1">
        <h2>Supervision Note</h2>
        <pre>${esc(result?.note || "No note.")}</pre>
      </div>
    </div>
  </div>
  <script>window.addEventListener('load',()=>{setTimeout(()=>{window.print()},150)})</script>
</body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  // Load sample → map into smart controls
  const loadSample = () => {
    const p = SAMPLE_PAYLOAD;

    // Gender
    if (p["Gender_female"] === 1) setGenderOpt("female");
    else if (p["Gender_male"] === 1) setGenderOpt("male");
    else setGenderOpt("ambiguous");

    // Blood
    const bMap = {
      "Blood test result_abnormal": "abnormal",
      "Blood test result_inconclusive": "inconclusive",
      "Blood test result_normal": "normal",
      "Blood test result_slightly abnormal": "slightly abnormal",
    };
    let setTo = "normal";
    for (const [k, v] of Object.entries(bMap)) {
      if (p[k] === 1) setTo = v;
    }
    setBloodOpt(setTo);

    // Tests: keep hidden → force empty selection (payload → zeros)
    setTestsSel(new Set());

    // Symptoms
    const sSel = new Set();
    SCHEMA_KEYS.symptoms.forEach((label, idx) => {
      if (p[label] === 1) sSel.add(idx + 1);
    });
    setSympSel(sSel);

    // Numeric
    const numsNew = {};
    SCHEMA_KEYS.numeric.forEach((k) => (numsNew[k] = p[k]));
    setNums(numsNew);

    // Yes/No: only load visible keys; others remain zero
    const ynNew = {};
    SCHEMA_KEYS.binaryYesNo.forEach((k) => {
      ynNew[k] = VISIBLE_YES_NO.includes(k) ? p[k] : 0;
    });
    setYesNo(ynNew);

    // Status + Follow-up (force follow-up to 0; UI hidden)
    setStatus(p["Status"]);
    setFollowUp(0);

    setResult(null);
    setError("");
  };

  const clearAll = () => {
    setGenderOpt("female");
    setBloodOpt("normal");
    setTestsSel(new Set());
    setSympSel(new Set());
    const numsNew = {};
    SCHEMA_KEYS.numeric.forEach((k) => (numsNew[k] = ""));
    setNums(numsNew);
    const ynNew = {};
    SCHEMA_KEYS.binaryYesNo.forEach((k) => (ynNew[k] = 0));
    setYesNo(ynNew);
    setStatus(1);
    setFollowUp(0);
    setResult(null);
    setError("");
  };

  // Build backend payload from smart UI state
  const buildPayload = () => {
    const payload = {};

    // Gender one-hots
    const gMap = { ambiguous: 0, female: 1, male: 2 };
    const gIdx = gMap[genderOpt];
    SCHEMA_KEYS.gender.forEach((k, i) => (payload[k] = i === gIdx ? 1 : 0));

    // Blood one-hots
    const bloodOptions = ["abnormal", "inconclusive", "normal", "slightly abnormal"];
    SCHEMA_KEYS.blood.forEach((k, i) => (payload[k] = bloodOptions[i] === bloodOpt ? 1 : 0));

    // Numeric
    for (const k of SCHEMA_KEYS.numeric) {
      const v = nums[k];
      if (v === "" || !Number.isFinite(Number(v)))
        throw new Error(`Missing or invalid value for "${k}"`);
      payload[k] = Number(v);
    }

    // Computed
    payload["Parental Age Diff"] = Number.isFinite(Number(parentalAgeDiff))
        ? Number(parentalAgeDiff)
        : 0;
    payload["Symptom Score"] = symScore;

    // Tests (multi → one-hot ints)
    SCHEMA_KEYS.tests.forEach((label, idx) => {
      const id = idx + 1;
      payload[label] = testsSel.has(id) ? 1 : 0;
    });

    // Symptoms (multi → one-hot ints)
    SCHEMA_KEYS.symptoms.forEach((label, idx) => {
      const id = idx + 1;
      payload[label] = sympSel.has(id) ? 1 : 0;
    });

    // Binary Yes/No
    for (const k of SCHEMA_KEYS.binaryYesNo) payload[k] = yesNo[k] ?? 0;

    // Status (Alive/Deceased)
    payload[SCHEMA_KEYS.statusAliveDeceased] = status;

    // Follow-up (High/Low)
    payload[SCHEMA_KEYS.followUpHighLow] = followUp;

    return payload;
  };

  const submit = async () => {
    setError("");
    setResult(null);
    let payload;
    try {
      payload = buildPayload();
    } catch (e) {
      setError(e.message);
      return;
    }
    try {
      setLoading(true);
      const url = modelId
          ? `${API_BASE}/predict?model_id=${encodeURIComponent(modelId)}`
          : `${API_BASE}/predict`;
      const res = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
      });
      setResult(res.data);
    } catch (e) {
      setError(
          e?.response?.data?.detail
              ? `Server: ${e.response.data.detail}`
              : `Request failed: ${e.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // UI generators
  const TestChip = ({ label, id, set, setSet }) => {
    const active = set.has(id);
    return (
        <motion.button
            onClick={() => setSet((prev) => toggleSet(prev, id))}
            className={`${chipBase} ${active ? chipOn : chipOff}`}
            whileTap={{ scale: 0.98 }}
        >
          {label}
        </motion.button>
    );
  };



  return (
      <div
          ref={pageRef}
          className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100"
      >
        {/* Header */}
        <header className="w-full border-b border-white/10 sticky top-0 backdrop-blur supports-[backdrop-filter]:bg-black/40 bg-black/30 z-20">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <span className="text-emerald-300 font-bold">GR</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold">GeneReveal</h1>
                <p className="text-xs text-slate-400">
                  Uncover your inner Demons
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Legend button */}
              <button
                  onClick={() => setShowLegend(true)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm border border-white/10"
                  aria-label="Open legend"
                  title="Legend"
              >
                Legend
              </button>

              <input
                  className="hidden sm:block bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Optional: model_id (e.g. v2025-10-02_23-21)"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
              />
              <button
                  onClick={loadSample}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm"
              >
                Load sample
              </button>
              <button
                  onClick={clearAll}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Inputs */}
          <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:p-6"
          >
            <h2 className="text-base font-semibold mb-4">Patient Inputs</h2>
            <div className="space-y-6 max-h-[70vh] overflow-auto pr-2 custom-scroll">
              {/* Gender */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-slate-400 mb-2">Gender</p>
                <Segmented
                    value={genderOpt}
                    onChange={setGenderOpt}
                    options={[
                      { label: "Ambiguous", value: "ambiguous" },
                      { label: "Female", value: "female" },
                      { label: "Male", value: "male" },
                    ]}
                />
              </div>

              {/* Blood Test Result */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-slate-400 mb-2">Blood Test Result</p>
                <Segmented
                    value={bloodOpt}
                    onChange={setBloodOpt}
                    options={[
                      { label: "Abnormal", value: "abnormal" },
                      { label: "Inconclusive", value: "inconclusive" },
                      { label: "Normal", value: "normal" },
                      { label: "Slightly Abnormal", value: "slightly abnormal" },
                    ]}
                />
              </div>

              {/* Clinical Tests (multi) */}
              {/* Clinical Tests hidden in UI but preserved in payload as zeros */}

              {/* Symptoms (multi) + Symptom Score (auto) */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 mb-3">Symptoms</p>
                  <div className="text-xs text-slate-300">
                    Symptom Score:{" "}
                    <span className="font-medium text-emerald-300">{symScore}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SCHEMA_KEYS.symptoms.map((label, idx) => (
                      <TestChip
                          key={label}
                          label={FRIENDLY_LABELS.symptoms[label]}
                          id={idx + 1}
                          set={sympSel}
                          setSet={setSympSel}
                      />
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  * Score auto-calculates from selected symptoms.
                </p>
              </div>

              {/* Core Numerics */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-slate-400 mb-3">Demographics & Vitals</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SCHEMA_KEYS.numeric.map((k) => (
                      <div key={k} className="flex flex-col">
                        <label className="text-xs text-slate-400 mb-1">{k}</label>
                        <input
                            type="number"
                            step="any"
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
                            value={nums[k]}
                            onChange={(e) => handleNum(k, e.target.value)}
                        />
                      </div>
                  ))}
                  {/* Computed: Parental Age Diff */}
                  <div className="flex flex-col">
                    <label className="text-xs text-slate-400 mb-1">Parental Age Diff (auto)</label>
                    <input
                        type="number"
                        disabled
                        value={parentalAgeDiff}
                        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300"
                    />
                  </div>
                  {/* Computed: Symptom Score */}
                  <div className="flex flex-col">
                    <label className="text-xs text-slate-400 mb-1">Symptom Score (auto)</label>
                    <input
                        type="number"
                        disabled
                        value={symScore}
                        className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Binary Yes/No (show only core genetics) */}
              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <p className="text-xs text-slate-400 mb-3">Genetics</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {VISIBLE_YES_NO.map((k) => (
                      <div key={k} className="flex items-center justify-between gap-3">
                        <label className="text-xs text-slate-300">{k}</label>
                        <YesNo value={yesNo[k]} onChange={(v) => setYesNo((p) => ({ ...p, [k]: v }))} />
                      </div>
                  ))}
                  {/* Status */}
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-xs text-slate-300">Status</label>
                    <Segmented
                        value={status === 1 ? "alive" : "deceased"}
                        onChange={(val) => setStatus(val === "alive" ? 1 : 0)}
                        options={[
                          { label: "Deceased", value: "deceased" },
                          { label: "Alive", value: "alive" },
                        ]}
                    />
                  </div>
                  {/* Follow-up hidden in UI but preserved in payload as zero */}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                  onClick={submit}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Predicting..." : "Predict"}
              </button>
              {error && <p className="text-rose-400 text-sm">{error}</p>}
            </div>
          </motion.section>

          {/* Results */}
          <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-4 lg:p-6 min-h-[40vh]"
          >
            <h2 className="text-base font-semibold">Results</h2>

            {!result && !loading && (
                <p className="text-sm text-slate-400 mt-2">
                  Submit to view predictions, confidences, and the LLM note.
                </p>
            )}

            <AnimatePresence>
              {result && (
                  <motion.div
                      key="res-tiles"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4"
                  >
                    {(() => {
                      const preds = result?.predictions || {};
                      const confs = result?.confidences || {};
                      const targets = Array.isArray(result?.targets) && result.targets.length > 0
                          ? result.targets
                          : Object.keys(confs);
                      const targetGD = targets.find((t) => t.toLowerCase().includes("genetic")) || targets[0];
                      const targetDS = targets.find((t) => t.toLowerCase().includes("subclass")) || targets[1] || targets[0];
                      const primary = preds[targetGD] ?? Object.values(preds)[0];
                      const secondary = preds[targetDS] ?? Object.values(preds)[1] ?? Object.values(preds)[0];

                      return (
                          <div className="grid grid-cols-1 gap-4">
                            {/* Tile 1: Genetic Disorder */}
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col">
                              <p className="text-xl tracking-wide text-slate-400 font-semibold">Predicted Genetic Disorder</p>
                              <h3 className="mt-5 mb-5 ml-8 text-2xl sm:text-[1.75rem] font-semibold text-emerald-300 break-words">
                                {String(primary ?? "—")}
                              </h3>
                              <div className="mt-4 flex-1" />
                              {confs && confs[targetGD] && (
                                  <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowConfGD(true)}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm border border-white/10 flex items-center gap-1.5"
                                        aria-label="Open Genetic Disorder confidence details"
                                    >
                                      <span>How sure are we? 🔍</span>
                                    </button>
                                  </div>
                              )}
                            </div>

                            {/* Tile 2: Disorder Subclass */}
                            <div className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col">
                              <p className="text-xl tracking-wide text-slate-400 font-semibold">Predicted Disorder Subclass</p>
                              <h3 className="mt-5 mb-5 ml-8 text-2xl sm:text-[1.75rem] font-semibold text-emerald-300 break-words">
                                {String(secondary ?? "—")}
                              </h3>
                              <div className="mt-4 flex-1" />
                              {confs && confs[targetDS] && (
                                  <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowConfDS(true)}
                                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm border border-white/10 flex items-center gap-1.5"
                                        aria-label="Open Disorder Subclass confidence details"
                                    >
                                      <span>How sure are we? 🔍</span>
                                    </button>
                                  </div>
                              )}
                            </div>
                          </div>
                      );
                    })()}
                  </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Row under Results: Supervision Note + Download Report */}
          <AnimatePresence>
            {result && (
                <motion.section
                    key="row-below-results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch w-312"
                >
                  {/* Supervision Note (card) */}
                  {result?.note && (
                      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-4 lg:p-6 h-full">
                        <div className="pointer-events-none absolute -top-6 -right-6 text-7xl opacity-5 select-none">🧠</div>
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold flex items-center gap-2">
                            <span className="text-emerald-300">🧠</span>
                            <span>Supervision Note</span>
                          </h3>
                          <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                  if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(result.note);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs border border-white/10"
                                aria-label="Copy note"
                            >
                              Copy
                            </button>
                            <button
                                onClick={() => setShowNoteModal(true)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-xs border border-emerald-500/40"
                                aria-label="Open full note"
                            >
                              Read full
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 relative">
                          <p className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed line-clamp-5">
                            {result.note}
                          </p>
                          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/40 to-transparent" />
                        </div>
                      </div>
                  )}

                  {/* Download Report (card) */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 lg:p-6 h-full flex flex-col">
                    <div className="pointer-events-none absolute -top-6 -right-6 text-7xl opacity-5 select-none">📄</div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <span className="text-emerald-300">📄</span>
                      <span>Report</span>
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">Download a polished PDF report including patient details, predictions, confidence distributions, and the supervision note.</p>
                    <div className="mt-auto pt-3 flex items-center gap-2">
                      <button
                          onClick={downloadReportPdf}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm border border-emerald-500/40"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </motion.section>
            )}
          </AnimatePresence>

          {/* Supervision Note Modal */}
          <AnimatePresence>
            {showNoteModal && result?.note && (
                <motion.div
                    key="note-modal"
                    className="fixed inset-0 z-40 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNoteModal(false)}
                    style={{ backdropFilter: "blur(8px)" }}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="note-modal-title"
                >
                  <div className="absolute inset-0 bg-black/70" />
                  <motion.div
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.98, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-3xl w-[92vw] sm:w-[720px] rounded-2xl border border-white/10 bg-white/20 shadow-xl"
                  >
                    <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                      <h3 id="note-modal-title" className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                        <span>🧠</span>
                        <span>Supervision Note</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                              if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(result.note);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs border border-white/10"
                        >
                          Copy
                        </button>
                        <button onClick={() => setShowNoteModal(false)} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs border border-white/10">Close</button>
                      </div>
                    </div>
                    <div className="px-6 py-5 max-h-[70vh] overflow-auto custom-scroll">
                      <p className="whitespace-pre-wrap text-sm sm:text-base text-slate-200 leading-relaxed">
                        {result.note}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Confidence Modal: Genetic Disorder */}
          <AnimatePresence>
            {showConfGD && result && (
                <motion.div
                    key="conf-gd-overlay"
                    className="fixed inset-0 z-40 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowConfGD(false)}
                    style={{ backdropFilter: "blur(8px)" }}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="gd-modal-title"
                >
                  <div className="absolute inset-0 bg-black/70" />
                  <motion.div
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.98, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-5xl w-[94vw] sm:w-[960px] rounded-2xl border border-white/10 bg-white/20 shadow-xl"
                  >
                    <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                      <h3 id="gd-modal-title" className="text-lg sm:text-xl font-semibold text-slate-100">Our model is this much sure...</h3>
                      <button onClick={() => setShowConfGD(false)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-slate-200 border border-white/10">Close</button>
                    </div>
                    <div className="px-6 py-5 max-h-[72vh] overflow-auto custom-scroll">
                      {(() => {
                        const confs = result?.confidences || {};
                        const targets = Array.isArray(result?.targets) && result.targets.length > 0 ? result.targets : Object.keys(confs);
                        const targetGD = targets.find((t) => t.toLowerCase().includes("genetic")) || targets[0];
                        const dist = confs[targetGD] || {};
                        const entries = Object.entries(dist);
                        const maxProb = Math.max(...entries.map(([, p]) => p));
                        const featured = entries.find(([, p]) => p === maxProb) || entries[0];
                        const others = entries.filter(([l]) => l !== featured[0]);
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                              <div className="sm:flex sm:items-stretch sm:gap-4">
                                {/* Featured (left) */}
                                <div className="relative rounded-2xl border border-white/10 bg-black/30 p-7 sm:p-8 flex-1 mb-4 sm:mb-0 overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-400/40">
                                  <span className="absolute -right-2 -top-2 text-5xl sm:text-6xl opacity-10 select-none">🧬</span>
                                  <p className="text-xl sm:text-2xl font-semibold text-slate-100">{featured[0]}</p>
                                  <p className="mt-4 text-4xl sm:text-5xl font-extrabold text-emerald-300">{prettyPercent(featured[1])}</p>
                                  <p className="mt-4 text-lg sm:text-xl text-slate-300">We think there's <span className="font-semibold text-emerald-300">{prettyPercent(featured[1])}</span> chance of this.</p>
                                </div>

                                {/* Others (right column) */}
                                <div className="flex-1 flex flex-col gap-4">
                                  {others.map(([label, prob], idx) => (
                                      <div
                                          key={`gd-${String(label)}`}
                                          className="relative rounded-2xl border border-white/10 bg-black/30 p-5 flex-1 overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-400/30"
                                      >
                                        <span className="absolute -right-2 -top-2 text-4xl opacity-10 select-none">{idx === 0 ? "🔬" : "🧪"}</span>
                                        <p className="text-base sm:text-lg font-medium text-slate-100">{label}</p>
                                        <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-300">{prettyPercent(prob)}</p>
                                        <p className="mt-2 text-sm sm:text-base text-slate-300">We think there's <span className="font-semibold text-emerald-300">{prettyPercent(prob)}</span> chance of this.</p>
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                </motion.div>
            )}
          </AnimatePresence>

          {/* Confidence Modal: Disorder Subclass */}
          <AnimatePresence>
            {showConfDS && result && (
                <motion.div
                    key="conf-ds-overlay"
                    className="fixed inset-0 z-40 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowConfDS(false)}
                    style={{ backdropFilter: "blur(8px)" }}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="ds-modal-title"
                >
                  <div className="absolute inset-0 bg-black/70" />
                  <motion.div
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.98, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-6xl w-[94vw] sm:w-[1100px] rounded-2xl border border-white/10 bg-white/20 shadow-xl"
                  >
                    <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                      <h3 id="ds-modal-title" className="text-lg sm:text-xl font-semibold text-slate-100">How confident we are</h3>
                      <button onClick={() => setShowConfDS(false)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-slate-200 border border-white/10">Close</button>
                    </div>
                    <div className="px-6 py-5 max-h-[72vh] overflow-auto custom-scroll">
                      {(() => {
                        const confs = result?.confidences || {};
                        const targets = Array.isArray(result?.targets) && result.targets.length > 0 ? result.targets : Object.keys(confs);
                        const targetDS = targets.find((t) => t.toLowerCase().includes("subclass")) || targets[1] || targets[0];
                        const dist = confs[targetDS] || {};
                        const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
                        const top3 = entries.slice(0, 3);
                        const featured = top3[0];
                        const others = top3.slice(1);
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                              <div className="sm:flex sm:items-stretch sm:gap-4">
                                {/* Featured (left) */}
                                <div className="relative rounded-2xl border border-white/10 bg-black/30 p-7 sm:p-8 flex-1 mb-4 sm:mb-0 overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-2xl hover:border-emerald-400/40">
                                  <span className="absolute -right-2 -top-2 text-5xl sm:text-6xl opacity-10 select-none">🧬</span>
                                  <p className="text-xl sm:text-2xl font-semibold text-slate-100">{featured?.[0]}</p>
                                  <p className="mt-4 text-4xl sm:text-5xl font-extrabold text-emerald-300">{featured ? prettyPercent(featured[1]) : "—"}</p>
                                  <p className="mt-4 text-lg sm:text-xl text-slate-300">Our model is <span className="font-semibold text-emerald-300">{featured ? prettyPercent(featured[1]) : "—"}</span> sure about this.</p>
                                </div>

                                {/* Others (right stacked) */}
                                <div className="flex-1 flex flex-col gap-4">
                                  {others.map(([label, prob], idx) => (
                                      <div
                                          key={`ds-${String(label)}`}
                                          className="relative rounded-2xl border border-white/10 bg-black/30 p-5 flex-1 overflow-hidden transition-transform hover:-translate-y-0.5 hover:shadow-xl hover:border-emerald-400/30"
                                      >
                                        <span className="absolute -right-2 -top-2 text-4xl opacity-10 select-none">{idx === 0 ? "🔬" : "🧪"}</span>
                                        <p className="text-base sm:text-lg font-medium text-slate-100">{label}</p>
                                        <p className="mt-2 text-2xl sm:text-3xl font-bold text-emerald-300">{prettyPercent(prob)}</p>
                                        <p className="mt-2 text-sm sm:text-base text-slate-300">Our model is <span className="font-semibold text-emerald-300">{prettyPercent(prob)}</span> sure about this.</p>
                                      </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showLegend && (
                <motion.div
                    key="legend-overlay"
                    className="fixed inset-0 z-40 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowLegend(false)}  // click backdrop to close
                    style={{ backdropFilter: "blur(8px)" }}
                >
                  {/* semi-transparent dark veil */}
                  <div className="absolute inset-0 bg-black/50" />

                  {/* modal card (click stop propagation to keep it open) */}
                  <motion.div
                      onClick={(e) => e.stopPropagation()}
                      initial={{ opacity: 0, scale: 0.98, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98, y: 6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="relative z-50 max-w-3xl w-[92vw] sm:w-[720px] rounded-2xl border border-white/10 bg-white/10 shadow-xl"
                  >
                    {/* header */}
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-100">Legend</h3>
                      <button
                          onClick={() => setShowLegend(false)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-slate-200 border border-white/10"
                      >
                        Close
                      </button>
                    </div>

                    {/* content */}
                    <div className="px-5 py-4 max-h-[70vh] overflow-auto custom-scroll">
                      {/* Two-column responsive grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {LEGEND.map((item, idx) => (
                            <div
                                key={`${item.label}-${idx}`}
                                className="rounded-xl border border-white/10 bg-black/30 p-3"
                            >
                              <p className="text-sm font-medium text-slate-100">{item.label}</p>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="max-w-7xl mx-auto px-4 pb-8 pt-2 text-xs text-slate-500">
          <p>
            Ensure backend is running (<code>uvicorn app.main:app --reload</code>) and{" "}
            <code>LLM_MODEL</code> (e.g., <code>gemma3:4b</code>) is set.
          </p>
        </footer>
      </div>
  );
}

