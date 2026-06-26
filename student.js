const { getConfig, isConfigured, getClassId, makeSupabaseClient, getUserId, escapeHtml } = window.AppUtils;

const classId = getClassId();
let sb = null;
try { sb = makeSupabaseClient(); } catch (err) { console.error(err); }

const state = {
  stage: 0,
  selected5: [],
  retained4: [],
  retained3: [],
  finalValue: "",
  submitting: false
};

const app = document.getElementById("app");
const classBadge = document.getElementById("classBadge");
classBadge.textContent = `场次：${classId}`;
document.getElementById("heroTitle").textContent = getConfig().APP_TITLE || "职业价值观取舍互动";

function renderSteps() {
  return `<div class="step-bar">${STEP_LABELS.map((label, i) => `<div class="step ${i === state.stage ? "active" : ""}">${label}</div>`).join("")}</div>`;
}

function toggleSelect(name) {
  if (state.stage !== 0) return;
  const exists = state.selected5.includes(name);
  if (exists) {
    state.selected5 = state.selected5.filter(x => x !== name);
  } else if (state.selected5.length < 5) {
    state.selected5.push(name);
  }
  render();
}

function discardFrom(stage, name) {
  if (stage === 1) {
    if (state.retained4.length === 5) state.retained4 = state.retained4.filter(x => x !== name);
  }
  if (stage === 2) {
    if (state.retained3.length === 4) state.retained3 = state.retained3.filter(x => x !== name);
  }
  render();
}

function chooseFinal(name) {
  state.finalValue = name;
  render();
}

function goNext() {
  if (state.stage === 0 && state.selected5.length === 5) {
    state.retained4 = [...state.selected5];
    state.stage = 1;
  } else if (state.stage === 1 && state.retained4.length === 4) {
    state.retained3 = [...state.retained4];
    state.stage = 2;
  } else if (state.stage === 2 && state.retained3.length === 3) {
    state.stage = 3;
  }
  render();
}

function goBack() {
  if (state.stage > 0) {
    state.stage -= 1;
    if (state.stage === 0) { state.retained4 = []; state.retained3 = []; state.finalValue = ""; }
    if (state.stage === 1) { state.retained3 = []; state.finalValue = ""; }
    if (state.stage === 2) { state.finalValue = ""; }
    render();
  }
}

async function submit() {
  if (!state.finalValue || state.submitting) return;
  state.submitting = true;
  render();
  const reflection = document.getElementById("reflection")?.value?.trim() || "";
  const row = {
    class_id: classId,
    user_id: getUserId(),
    initial5: state.selected5,
    retained4: state.retained4,
    retained3: state.retained3,
    final_value: state.finalValue,
    reflection
  };

  try {
    if (!sb) {
      const localRows = JSON.parse(localStorage.getItem("careerValueLocalRows") || "[]");
      const nextRows = localRows.filter(r => !(r.class_id === row.class_id && r.user_id === row.user_id));
      nextRows.unshift({ ...row, updated_at: new Date().toISOString() });
      localStorage.setItem("careerValueLocalRows", JSON.stringify(nextRows));
    } else {
      const { error } = await sb
        .from("career_value_responses")
        .upsert(row, { onConflict: "class_id,user_id" });
      if (error) throw error;
    }
    renderResult();
  } catch (err) {
    state.submitting = false;
    render();
    alert(`提交失败：${err.message || err}`);
  }
}

function renderOptionGrid(items, mode) {
  return `<div class="option-grid">${items.map(item => {
    const info = CAREER_VALUES.find(v => v.name === item.name || v.name === item) || { name: item, desc: "" };
    let cls = "option";
    let onclick = "";
    if (mode === "select") {
      cls += state.selected5.includes(info.name) ? " selected" : "";
      onclick = `onclick="toggleSelect('${info.name}')"`;
    } else if (mode === "discard4") {
      cls += state.retained4.length === 4 && !state.retained4.includes(info.name) ? "" : " selected";
      onclick = state.retained4.length === 5 ? `onclick="discardFrom(1,'${info.name}')"` : "";
    } else if (mode === "discard3") {
      cls += state.retained3.length === 3 && !state.retained3.includes(info.name) ? "" : " selected";
      onclick = state.retained3.length === 4 ? `onclick="discardFrom(2,'${info.name}')"` : "";
    } else if (mode === "final") {
      cls += state.finalValue === info.name ? " final" : "";
      onclick = `onclick="chooseFinal('${info.name}')"`;
    }
    return `<button type="button" class="${cls}" ${onclick}>
      <span class="name">${escapeHtml(info.name)}</span>
      <span class="desc">${escapeHtml(info.desc)}</span>
    </button>`;
  }).join("")}</div>`;
}

function render() {
  let body = "";
  if (state.stage === 0) {
    body = `
      <h2>第一步：从12项中选择你最看重的5项</h2>
      <p class="hint">这一步没有标准答案，请根据你真实的职业期待作答。</p>
      ${renderOptionGrid(CAREER_VALUES, "select")}
      <div class="toolbar">
        <span class="counter">已选择 ${state.selected5.length} / 5</span>
        <button ${state.selected5.length === 5 ? "" : "disabled"} onclick="goNext()">下一步：5选4</button>
      </div>`;
  }
  if (state.stage === 1) {
    body = `
      <h2>第二步：如果岗位只能满足4项，你最先舍弃哪一项？</h2>
      <p class="hint">点击一张卡片表示“舍弃”。舍弃后，剩余4项进入下一轮。</p>
      ${renderOptionGrid(state.selected5, "discard4")}
      <div class="toolbar">
        <span class="counter">当前保留 ${state.retained4.length} / 4</span>
        <button class="secondary" onclick="goBack()">返回上一步</button>
        <button ${state.retained4.length === 4 ? "" : "disabled"} onclick="goNext()">下一步：4选3</button>
      </div>`;
  }
  if (state.stage === 2) {
    body = `
      <h2>第三步：如果只能满足3项，请再次舍弃一项</h2>
      <p class="hint">职业选择常常不是“全都要”，而是在现实条件中辨认真正重要的价值。</p>
      ${renderOptionGrid(state.retained4, "discard3")}
      <div class="toolbar">
        <span class="counter">当前保留 ${state.retained3.length} / 3</span>
        <button class="secondary" onclick="goBack()">返回上一步</button>
        <button ${state.retained3.length === 3 ? "" : "disabled"} onclick="goNext()">下一步：3留1</button>
      </div>`;
  }
  if (state.stage === 3) {
    body = `
      <h2>第四步：最后只能保留1项，你会留下什么？</h2>
      <p class="hint">请留下你的“职业价值锚点”。提交后，教师端会生成班级职业价值观词云。</p>
      ${renderOptionGrid(state.retained3, "final")}
      <label style="display:block;margin-top:18px;font-weight:800;">写一句给未来自己的回信（选填）</label>
      <textarea id="reflection" rows="3" placeholder="例如：当我面对职业选择时，我愿意把国家需要放在更重要的位置，因为……"></textarea>
      <div class="toolbar">
        <button class="secondary" onclick="goBack()">返回上一步</button>
        <button ${state.finalValue && !state.submitting ? "" : "disabled"} onclick="submit()">${state.submitting ? "提交中……" : "提交我的选择"}</button>
      </div>`;
  }

  const warning = isConfigured() ? "" : `<div class="notice">当前未配置 Supabase，页面处于单机预览模式。部署正式课堂版前，请在 <b>config.js</b> 中填写 Supabase URL 和 anon key。</div>`;
  app.innerHTML = `<div class="card span-12">${renderSteps()}${warning}${body}</div>`;
}

function renderResult() {
  app.innerHTML = `<div class="card result-box">
    <span class="badge">提交成功</span>
    <h2>你的职业价值关键词</h2>
    <div class="result-keyword">${escapeHtml(state.finalValue)}</div>
    <p class="hint" style="font-size:18px;">${escapeHtml(FINAL_SLOGAN[state.finalValue] || "愿你在职业选择中找到属于自己的青春坐标。")}</p>
    <div class="toolbar" style="justify-content:center;">
      <button onclick="location.reload()" class="secondary">重新选择</button>
    </div>
  </div>`;
}

window.toggleSelect = toggleSelect;
window.discardFrom = discardFrom;
window.chooseFinal = chooseFinal;
window.goNext = goNext;
window.goBack = goBack;
window.submit = submit;
render();
