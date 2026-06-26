const CAREER_VALUES = [
  { name: "薪酬待遇", desc: "收入回报与生活保障" },
  { name: "工作稳定", desc: "岗位安全感与长期确定性" },
  { name: "发展空间", desc: "晋升机会与未来平台" },
  { name: "专业匹配", desc: "所学专业与岗位能力契合" },
  { name: "兴趣爱好", desc: "热爱、主动性与持续投入" },
  { name: "家庭期待", desc: "亲情责任与家庭支持" },
  { name: "社会地位", desc: "职业认可度与社会评价" },
  { name: "工作环境", desc: "城市、单位氛围与工作条件" },
  { name: "地域城市", desc: "发展区域与生活半径" },
  { name: "个人成长", desc: "能力提升与自我实现" },
  { name: "社会贡献", desc: "服务他人、回应社会需要" },
  { name: "国家需要", desc: "融入强国建设与民族复兴" }
];

const STEP_LABELS = ["12选5", "5选4", "4选3", "3留1"];
const FINAL_SLOGAN = {
  "薪酬待遇": "重视现实保障，是规划职业生活的重要起点。",
  "工作稳定": "追求稳定秩序，也是在为长期发展积蓄力量。",
  "发展空间": "看重成长平台，意味着你愿意面向未来持续攀登。",
  "专业匹配": "让所学服务所需，专业就有了更深的价值。",
  "兴趣爱好": "热爱是持续投入的动力，也需要与时代需求相遇。",
  "家庭期待": "把家庭责任放在心上，是青年成长的重要牵挂。",
  "社会地位": "职业荣誉来自社会认可，更来自真实贡献。",
  "工作环境": "良好环境能支持成长，也提醒我们理解现实条件。",
  "地域城市": "选择一座城，也是在选择一种奋斗坐标。",
  "个人成长": "成长不是只成就自己，也能让我们更好服务他人。",
  "社会贡献": "把努力带给更多人，职业价值就会更加充盈。",
  "国家需要": "把小我融入大我，青春就拥有更深沉的力量。"
};

function getConfig() {
  return window.APP_CONFIG || {};
}

function isConfigured() {
  const cfg = getConfig();
  return cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("请替换") &&
    !cfg.SUPABASE_ANON_KEY.includes("请替换");
}

function getClassId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("class") || getConfig().DEFAULT_CLASS_ID || "tju-career-values-demo";
}

function makeSupabaseClient() {
  if (!isConfigured()) return null;
  if (!window.supabase || !window.supabase.createClient) {
    throw new Error("Supabase SDK 未加载，请检查网络或 CDN。若现场网络限制，请换用已部署版本或刷新页面。 ");
  }
  return window.supabase.createClient(getConfig().SUPABASE_URL, getConfig().SUPABASE_ANON_KEY);
}

function getUserId() {
  const key = "tjuCareerValueUserId";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { hour12: false });
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

window.CAREER_VALUES = CAREER_VALUES;
window.STEP_LABELS = STEP_LABELS;
window.FINAL_SLOGAN = FINAL_SLOGAN;
window.AppUtils = { getConfig, isConfigured, getClassId, makeSupabaseClient, getUserId, escapeHtml, formatTime, downloadText };
