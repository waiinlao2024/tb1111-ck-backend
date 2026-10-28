/**
 * 验证：我的 runTask 移植版 vs 作者 tbcjs 原始 JS —— 同输入、同输出？
 * 运行：node test/port.test.mjs
 */
import { readFileSync } from 'node:fs';
import { runTask as myRunTask, toItems, getCookieValue, shortLinks } from '../task.js';

const CK11 = readFileSync('/workspace/tmp-fetch/ck11.json', 'utf8');
const TBCJS = readFileSync('/workspace/tmp-fetch/tbcjs.js', 'utf8');

// ---- 从作者 tbcjs 里抽出原始 runTask（含依赖的 run/getCookie）----
function extractOriginal() {
  const src = TBCJS;
  const start = src.indexOf('function runTask()');
  const end = src.indexOf('function run ()');
  const body = src.slice(start, end);
  const gi = src.indexOf('function getCookie(cookie,name)');
  const getCookie = src.slice(gi);   // tbcjs 里 getCookie 在文件末尾
  // 原版 runTask 依赖页面全局变量 DB / ALLDATA / data / cookies，这里用形参注入
  return new Function('DB', 'ALLDATA', 'data', 'cookies',
    body + '\n' + getCookie + '\nreturn runTask();');
}
const orig = extractOriginal();

// ---- 造一份淘宝接口返回（模仿 data.model 结构）----
const API = {
  data: { model: [
    { progress: { needTimes: '2', times: 3 }, taskParams: { deliveryId: '99673', implId: 'other_1396_3138010_99673_0', fromToken: 'TOKEN_A' } },
    { progress: { needTimes: '1', times: 0 }, taskParams: { deliveryId: '99889', implId: 'other_1396_3144004_99889_0', fromToken: 'TOKEN_A' } },
    { progress: { needTimes: '5', times: 1 }, taskParams: { deliveryId: '101866', implId: 'other_1396_3227011_101866_0', fromToken: 'TOKEN_A' } },
    { progress: { needTimes: '0', times: 9 }, taskParams: { deliveryId: '107021', implId: 'x_1_2_3_0', fromToken: 'TOKEN_A' } },   // needTimes=0 -> 跳过
    { progress: { needTimes: '2', times: 0 }, taskParams: { deliveryId: '99732', implId: 'y_1_2_3_0', fromToken: 'TOKEN_A' } },   // 在 outItem -> 跳过
  ] },
};
const items = toItems(API);

// 固定随机，保证两边可比
let c = 0;
const origRandom = Math.random;
const seeded = () => { c = 0; Math.random = () => { const v = (c % 97) / 97; c++; return v; }; };

seeded();
const a = JSON.parse(orig({ run: 0, keys: {}, items: [] }, JSON.parse(CK11), items, ''));  // 原版返回 JSON 字符串
seeded();
const b = myRunTask(CK11, TBCJS, items, { run: 0, keys: {}, items: [] });
Math.random = origRandom;

const A = JSON.stringify(a), B = JSON.stringify(b);
console.log('作者原始输出条数:', a.data.length, '| 我的移植输出条数:', b.data.length);
if (A === B) {
  console.log('✅ 完全一致（含随机商品定位词、DB、token、end）');
} else {
  console.log('❌ 不一致，逐条 diff：');
  const la = a.data, lb = b.data;
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (JSON.stringify(la[i]) !== JSON.stringify(lb[i])) console.log('  #'+i, '\n   原:', JSON.stringify(la[i]), '\n   我:', JSON.stringify(lb[i]));
  }
  console.log('  db 原:', JSON.stringify(a.db), '\n  db 我:', JSON.stringify(b.db));
  console.log('  end 原:', a.end, '| end 我:', b.end);
  process.exitCode = 1;
}
console.log('\n样例输出前 4 条：');
b.data.slice(0, 4).forEach((x) => console.log('  ', x.url.slice(0, 130), '| wait', x.wait));
console.log('\ncookie 解析自测:', getCookieValue('a=1; _m_h5_tk=abc123; b=2', '_m_h5_tk'));
console.log('当日短链自测:', JSON.stringify(shortLinks(TBCJS)));
