// ---------- Data pools ----------
const activities = [
  "debugging a null pointer exception", "reviewing a stalled pull request", "waiting on a CI pipeline",
  "triaging a Slack thread", "sitting through a status meeting", "fixing a regression from the last deploy",
  "reading a 40-page requirements doc", "context-switching between tickets", "writing a postmortem",
  "onboarding onto a new codebase", "refactoring legacy code", "preparing a sprint demo"
];
const benefits = [
  "sustained attention", "working memory recall", "task-switching efficiency", "code review accuracy",
  "error-detection rate", "self-reported focus", "short-term recall", "decision latency",
  "reported alertness", "perceived cognitive load", "subjective energy scores"
];
// First-author surnames + initials, for citation-style attribution
const surnames = [
  "Menon", "Pillai", "Nair", "Varghese", "Krishnan", "Thomas", "Joseph", "Raghavan",
  "Iyer", "Chandran", "Balakrishnan", "Mathew"
];
const institutions = [
  "Dept. of Behavioral Science, Univ. of Kerala", "Cognitive Performance Lab, IIT Madras",
  "Centre for Applied Workplace Psychology", "School of Human Factors Research",
  "Institute of Occupational Health Studies", "Division of Organizational Behavior, NIT Calicut"
];
const journals = [
  "Journal of Occupational Health Psychology", "International Journal of Workplace Behavior",
  "Applied Cognitive Psychology", "Journal of Applied Social Psychology",
  "Frontiers in Organizational Psychology", "Human Factors & Ergonomics Review"
];
// Real-sounding beverage/ritual framing, kept vague enough to plausibly apply to any hot beverage break
const interventions = [
  "a structured hot-beverage break", "a brief non-work micro-break involving a hot beverage",
  "a 10-minute tea-based recovery interval", "a scheduled beverage-break intervention",
  "a short caffeinated-beverage pause"
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max, decimals = 1) {
  const v = Math.random() * (max - min) + min;
  return v.toFixed(decimals);
}

function generateCitation() {
  const a1 = rand(surnames);
  let a2 = rand(surnames);
  while (a2 === a1) a2 = rand(surnames);
  const year = randInt(2018, 2025);
  const journal = rand(journals);
  const vol = randInt(12, 58);
  const issue = randInt(1, 4);
  const pageStart = randInt(100, 480);
  const pageEnd = pageStart + randInt(6, 22);
  const doiSuffix = `10.${randInt(1000, 9999)}/jbs.${year}.${randInt(1000, 9999)}`;
  return `${a1}, ${a2[0]}. (${year}). ${journal}, ${vol}(${issue}), ${pageStart}-${pageEnd}. doi:${doiSuffix}`;
}

function generateExcuse() {
  const pct = randFloat(6, 34, 1);          // effect size, kept in a "plausible" single-digit-to-low-30s range
  const p = rand(["0.01", "0.02", "0.03", "0.04", "< .001", "0.008"]);
  const n = randInt(24, 412);
  const ciLow = randFloat(1, pct - 2 > 1 ? pct - 2 : 1, 1);
  const ciHigh = randFloat(Number(pct) + 1, Number(pct) + 9, 1);
  const activity = rand(activities);
  const benefit = rand(benefits);
  const intervention = rand(interventions);
  const institution = rand(institutions);
  const citation = generateCitation();

  const templates = [
    `In a sample of N=${n} knowledge workers, ${intervention} was associated with a ${pct}% improvement in ${benefit} during tasks resembling ${activity} (p ${p.startsWith('<') ? p : '= ' + p}).`,
    `A within-subjects study (N=${n}) reported that ${benefit} increased by ${pct}% (95% CI [${ciLow}, ${ciHigh}]) following ${intervention}, most notably while ${activity}.`,
    `Researchers at ${institution} found ${intervention} correlated with a ${pct}% gain in ${benefit} among participants ${activity} (N=${n}, p ${p.startsWith('<') ? p : '= ' + p}).`,
    `Self-reported ${benefit} rose by ${pct}% after ${intervention}, per a survey of ${n} participants engaged in tasks like ${activity} (95% CI [${ciLow}, ${ciHigh}]).`
  ];

  const excuse = rand(templates);
  const source = citation;
  return { excuse, source, pct: Number(pct) };
}

// ---------- State ----------
let streak = 0;
let history = []; // productivity values over time
let peak = 0;

const excuseBox = document.getElementById('excuseBox');
const streakNum = document.getElementById('streakNum');
const prodNum = document.getElementById('prodNum');
const kudumbamMsg = document.getElementById('kudumbamMsg');
const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const displayWidth = canvas.clientWidth;
  canvas.width = displayWidth * ratio;
  canvas.height = 180 * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
window.addEventListener('resize', () => { resizeCanvas(); drawChart(); });

function drawChart() {
  const w = canvas.clientWidth;
  const h = 180;
  ctx.clearRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  if (history.length === 0) {
    ctx.fillStyle = '#c9b8a8';
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Log a chaya break to see your "productivity" spike', w / 2, h / 2);
    return;
  }

  const maxVal = 40;
  const padding = 20;
  const usableW = w - padding * 2;
  const usableH = h - 20;
  const step = history.length > 1 ? usableW / (history.length - 1) : 0;

  // area fill
  ctx.beginPath();
  history.forEach((val, i) => {
    const x = padding + step * i;
    const y = h - 10 - (val / maxVal) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding + step * (history.length - 1), h - 10);
  ctx.lineTo(padding, h - 10);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(232,161,59,0.35)');
  grad.addColorStop(1, 'rgba(232,161,59,0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // line
  ctx.beginPath();
  history.forEach((val, i) => {
    const x = padding + step * i;
    const y = h - 10 - (val / maxVal) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#e8a13b';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // dots
  ctx.fillStyle = '#f5e6d3';
  history.forEach((val, i) => {
    const x = padding + step * i;
    const y = h - 10 - (val / maxVal) * usableH;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

const kudumbamLines = [
  "Kudumbam proud of you.",
  "Even your ancestors approve of this break.",
  "This is peak Malayali productivity science.",
  "Your chaya glass has never been more scientific.",
  "Somewhere, an elder is nodding in approval."
];

function updateStats() {
  streakNum.textContent = streak;
  prodNum.textContent = peak.toFixed(1) + '%';
  if (streak > 0) {
    kudumbamMsg.textContent = `You've justified ${streak} chaya break${streak === 1 ? '' : 's'} this week. ${rand(kudumbamLines)}`;
  }
}

document.getElementById('justifyBtn').addEventListener('click', () => {
  const { excuse, source, pct } = generateExcuse();
  excuseBox.innerHTML = `${excuse}<span class="excuse-source">${source}</span>`;
  streak += 1;
  history.push(pct);
  if (history.length > 10) history.shift();
  peak = Math.max(peak, pct);
  updateStats();
  drawChart();
});

// ---------- Certificate ----------
const certModal = document.getElementById('certModal');
const certCanvas = document.getElementById('certCanvas');
const cctx = certCanvas.getContext('2d');

function drawCertificate() {
  const w = certCanvas.width, h = certCanvas.height;
  cctx.fillStyle = '#f5e6d3';
  cctx.fillRect(0, 0, w, h);

  // border
  cctx.strokeStyle = '#a8632e';
  cctx.lineWidth = 8;
  cctx.strokeRect(16, 16, w - 32, h - 32);
  cctx.strokeStyle = '#e8a13b';
  cctx.lineWidth = 2;
  cctx.strokeRect(28, 28, w - 56, h - 56);

  cctx.fillStyle = '#3a2418';
  cctx.textAlign = 'center';

  cctx.font = '700 26px Georgia, serif';
  cctx.fillText('☕ Certificate of Chaya Justification ☕', w / 2, 90);

  cctx.font = '400 15px Georgia, serif';
  cctx.fillText('This certifies that the bearer has scientifically justified', w / 2, 140);

  cctx.font = '700 22px Georgia, serif';
  cctx.fillText(`${streak} chaya break${streak === 1 ? '' : 's'}`, w / 2, 180);

  cctx.font = '400 15px Georgia, serif';
  cctx.fillText('in the pursuit of peak productivity, with a documented', w / 2, 220);
  cctx.fillText(`peak performance boost of ${peak.toFixed(1)}%.`, w / 2, 245);

  cctx.font = 'italic 13px Georgia, serif';
  cctx.fillText('Verified by the Kudumbam Council of Wellness', w / 2, 290);

  const today = new Date();
  cctx.font = '400 12px Georgia, serif';
  cctx.fillText(today.toDateString(), w / 2, 320);

  cctx.font = '700 14px Georgia, serif';
  cctx.fillStyle = '#a8632e';
  cctx.fillText('Chaya Kudi Justifier™ — Not Peer Reviewed. Not a Doctor.', w / 2, 380);
}

document.getElementById('certBtn').addEventListener('click', () => {
  drawCertificate();
  certModal.classList.add('show');
});
document.getElementById('closeCertBtn').addEventListener('click', () => {
  certModal.classList.remove('show');
});
document.getElementById('downloadCertBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'chaya-certificate.png';
  link.href = certCanvas.toDataURL('image/png');
  link.click();
});

// init
resizeCanvas();
drawChart();
