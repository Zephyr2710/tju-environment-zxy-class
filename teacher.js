const { getConfig, isConfigured, getClassId, makeSupabaseClient, escapeHtml, formatTime, downloadText } = window.AppUtils;
let currentClass = getClassId();
let sb = null;
try { sb = makeSupabaseClient(); } catch (err) { console.error(err); }
let rows = [];
let timer = null;

const classInput = document.getElementById("classInput");
const studentUrlInput = document.getElementById("studentUrl");
const qrImg = document.getElementById("qrImg");
const cloudEl = document.getElementById("wordCloud");
const barsEl = document.getElementById("barList");
const tableEl = document.getElementById("dataTable");
const countEl = document.getElementById("participantCount");
const topEl = document.getElementById("topChoice");
const statusEl = document.getElementById("statusText");
const titleEl = document.getElementById("teacherTitle");

titleEl.textContent = getConfig().APP_TITLE || "职业价值观取舍互动";
classInput.value = currentClass;

function buildStudentUrl() {
  const url = new URL(window.location.href);
  url.pathname = url.pathname.replace(/teacher\.html.*$/, "index.html");
  if (!url.pathname.endsWith("index.html")) {
    const base = url.pathname.replace(/\/[^/]*$/, "/");
    url.pathname = `${base}index.html`;
  }
  url.search = `?class=${encodeURIComponent(currentClass)}`;
  return url.toString();
}

function updateLink() {
  const studentUrl = buildStudentUrl();
  studentUrlInput.value = studentUrl;
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(studentUrl)}`;
}

async function loadData() {
  statusEl.textContent = "正在同步……";
  try {
    if (!sb) {
      rows = JSON.parse(localStorage.getItem("careerValueLocalRows") || "[]").filter(r => r.class_id === currentClass);
    } else {
      const { data, error } = await sb
        .from("career_value_responses")
        .select("*")
        .eq("class_id", currentClass)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      rows = data || [];
    }
    renderDashboard();
    statusEl.textContent = `已同步：${new Date().toLocaleTimeString("zh-CN", { hour12: false })}`;
  } catch (err) {
    statusEl.textContent = `同步失败：${err.message || err}`;
  }
}

function getCounts() {
  const counts = Object.fromEntries(CAREER_VALUES.map(v => [v.name, 0]));
  rows.forEach(row => {
    if (counts[row.final_value] !== undefined) counts[row.final_value] += 1;
    else counts[row.final_value] = (counts[row.final_value] || 0) + 1;
  });
  return counts;
}

function renderDashboard() {
  const counts = getCounts();
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...Object.values(counts));
  const total = rows.length;
  countEl.textContent = total;
  topEl.textContent = total ? `${entries[0][0]}（${entries[0][1]}人）` : "暂无";

  const rotations = ["-6deg", "3deg", "0deg", "7deg", "-3deg", "5deg"];
  const visibleWords = entries.filter(([, count]) => count > 0);
  cloudEl.innerHTML = visibleWords.length ? visibleWords.map(([name, count], i) => {
    const size = 22 + Math.round((count / max) * 52);
    const opacity = 0.58 + (count / max) * 0.42;
    return `<span style="font-size:${size}px;--rotate:${rotations[i % rotations.length]};--opacity:${opacity};" title="${count}人">${escapeHtml(name)}</span>`;
  }).join("") : `<p class="hint">等待学生提交后，自动生成班级职业价值观词云。</p>`;

  barsEl.innerHTML = entries.map(([name, count]) => {
    const percent = total ? Math.round((count / total) * 100) : 0;
    return `<div class="bar-row">
      <div class="bar-name">${escapeHtml(name)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${percent}%"></div></div>
      <div>${count}人</div>
    </div>`;
  }).join("");

  const tableRows = rows.slice(0, 80).map((row, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><b>${escapeHtml(row.final_value)}</b></td>
      <td>${escapeHtml((row.initial5 || []).join("、"))}</td>
      <td>${escapeHtml(row.reflection || "")}</td>
      <td>${formatTime(row.updated_at || row.created_at)}</td>
    </tr>`).join("");
  tableEl.innerHTML = `<table>
    <thead><tr><th>#</th><th>最终保留</th><th>第一轮5项</th><th>给未来自己的回信</th><th>提交时间</th></tr></thead>
    <tbody>${tableRows || `<tr><td colspan="5">暂无数据</td></tr>`}</tbody>
  </table>`;
}

function setClass() {
  const val = classInput.value.trim();
  if (!val) return alert("请输入场次ID");
  currentClass = val;
  const url = new URL(window.location.href);
  url.searchParams.set("class", currentClass);
  history.replaceState(null, "", url.toString());
  updateLink();
  loadData();
}

async function copyStudentUrl() {
  try {
    await navigator.clipboard.writeText(studentUrlInput.value);
    alert("学生端链接已复制");
  } catch {
    studentUrlInput.select();
    document.execCommand("copy");
    alert("学生端链接已复制");
  }
}

function exportCsv() {
  const header = ["序号", "场次", "最终保留", "第一轮5项", "第二轮4项", "第三轮3项", "回信", "提交时间"];
  const lines = rows.map((row, idx) => [
    idx + 1,
    row.class_id,
    row.final_value,
    (row.initial5 || []).join("/"),
    (row.retained4 || []).join("/"),
    (row.retained3 || []).join("/"),
    (row.reflection || "").replaceAll("\n", " "),
    formatTime(row.updated_at || row.created_at)
  ].map(v => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","));
  downloadText(`职业价值观取舍结果-${currentClass}.csv`, [header.map(h => `"${h}"`).join(","), ...lines].join("\n"));
}

async function resetClass() {
  if (!confirm(`确认清空场次「${currentClass}」的所有提交数据？此操作不可恢复。`)) return;
  try {
    if (!sb) {
      const all = JSON.parse(localStorage.getItem("careerValueLocalRows") || "[]");
      localStorage.setItem("careerValueLocalRows", JSON.stringify(all.filter(r => r.class_id !== currentClass)));
    } else {
      const { error } = await sb.from("career_value_responses").delete().eq("class_id", currentClass);
      if (error) throw error;
    }
    await loadData();
  } catch (err) {
    alert(`清空失败：${err.message || err}`);
  }
}

function startPolling() {
  if (timer) clearInterval(timer);
  timer = setInterval(loadData, 3000);
}

window.setClass = setClass;
window.copyStudentUrl = copyStudentUrl;
window.exportCsv = exportCsv;
window.resetClass = resetClass;
window.loadData = loadData;

if (!isConfigured()) {
  document.getElementById("configNotice").style.display = "block";
}
updateLink();
loadData();
startPolling();
