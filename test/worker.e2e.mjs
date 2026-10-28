/** 端到端：用假 fetch 跑通 /health /config /run /calc，验证请求链路和 cookie 去向 */
import { readFileSync } from 'node:fs';
const CK11 = readFileSync('/workspace/tmp-fetch/ck11.json','utf8');
const TBCJS = readFileSync('/workspace/tmp-fetch/tbcjs.js','utf8');
const worker = (await import('../worker.js')).default;

const sent = [];           // 记录所有出站请求，用于审计 cookie 去向
globalThis.fetch = async (url, opts = {}) => {
  const u = String(url);
  sent.push({ url: u, method: opts.method || 'GET', hasCookieHeader: !!(opts.headers && opts.headers.Cookie) });
  const json = (o) => new Response(JSON.stringify(o), { headers: { 'Content-Type': 'application/json' } });

  if (u.includes('/release/task/ck11')) return new Response(CK11, { headers: { 'Content-Type': 'application/json' } });
  if (u.includes('/release/task/tbcjs')) return new Response(TBCJS);
  if (u.includes('/release/getUrl')) {
    return json({ succes: 'ok', url: 'https://h5api.m.taobao.com/h5/mtop.taobao.wireless.amp2.im.message.unreadcount/1.0/?jsv=2.5.1&appKey=12574478' });
  }
  if (u.includes('h5api.m.taobao.com')) {
    return json({ data: { model: [
      { progress: { needTimes: '2', times: 0 }, taskParams: { deliveryId: '99673', implId: 'other_1396_3138010_99673_0', fromToken: 'TK' } },
      { progress: { needTimes: '1', times: 0 }, taskParams: { deliveryId: '99889', implId: 'other_1396_3144004_99889_0', fromToken: 'TK' } },
    ] } });
  }
  throw new Error('mock 未覆盖: ' + u);
};

const call = async (path, method, body) => {
  const r = await worker.fetch(new Request('https://x.workers.dev' + path, { method, body }));
  return { status: r.status, json: await r.json() };
};

let r = await call('/health', 'GET');
console.log('/health ->', r.status, r.json.ok ? '✅' : '❌');

r = await call('/config', 'GET');
console.log('/config ->', r.status, 'ck11 任务数', Object.keys(r.json.ck11.taskData).length, 'tbcjs 长度', r.json.tbcjs.length);

r = await call('/run', 'POST', 'a=1; _m_h5_tk=TOKEN123; b=2');
console.log('/run ->', r.status, 'ok:', r.json.ok, '| 返回 URL 条数:', r.json.data?.length, '| end:', r.json.end ? '有' : '无');
console.log('   前3条:'); (r.json.data || []).slice(0, 3).forEach(x => console.log('     ', x.url.slice(0, 100), '| wait', x.wait));

r = await call('/calc', 'POST', JSON.stringify({ data: { model: [
  { progress: { needTimes: '1', times: 0 }, taskParams: { deliveryId: '99889', implId: 'other_1396_3144004_99889_0', fromToken: 'TK' } }] } }));
console.log('/calc ->', r.status, 'ok:', r.json.ok, '| URL 条数:', r.json.data?.length);

r = await call('/run', 'POST', 'cookie 里没有 token');
console.log('/run(无token) ->', r.status, '| 错误:', r.json.error);

console.log('\n=== 出站请求审计（cookie 去向）===');
for (const s of sent) {
  const leak = s.hasCookieHeader ? '  ⬅ 携带完整 cookie' : '';
  console.log(` ${s.method.padEnd(4)} ${s.url.slice(0, 96)}${leak}`);
}
const authorCalls = sent.filter(s => s.url.includes('tencentcs.com'));
console.log('\n给作者服务器的请求里，有携带 cookie 的吗？', authorCalls.some(s => s.hasCookieHeader) ? '❌ 有！' : '✅ 没有（只带 _m_h5_tk）');
