/** 全链路模拟：把「薄壳快捷指令」的动作链在 node 里跑一遍，看最终会打开哪些网址 */
import { readFileSync } from 'node:fs';
const CK11 = readFileSync('/workspace/tmp-fetch/ck11.json','utf8');
const TBCJS = readFileSync('/workspace/tmp-fetch/tbcjs.js','utf8');
const worker = (await import('../worker.js')).default;

const COOKIE = 'cna=abc; _m_h5_tk=TOK123; tracknick=me;';
let apiRound = 0;
globalThis.fetch = async (url, opts={}) => {
  const u=String(url);
  const json=(o)=>new Response(JSON.stringify(o),{headers:{'Content-Type':'application/json'}});
  if (u.includes('/release/task/ck11')) return new Response(CK11);
  if (u.includes('/release/task/tbcjs')) return new Response(TBCJS);
  if (u.includes('/release/getUrl')) return json({url:'https://h5api.m.taobao.com/h5/x'});
  if (u.includes('h5api.m.taobao.com')) {
    apiRound++;
    const model = apiRound===1 ? [
      {progress:{needTimes:'1',times:0},taskParams:{deliveryId:'99889',implId:'other_1396_3144004_99889_0',fromToken:'TK'}},
      {progress:{needTimes:'2',times:0},taskParams:{deliveryId:'101866',implId:'other_1396_3227011_101866_0',fromToken:'TK'}}]
      : [{progress:{needTimes:'0',times:1},taskParams:{deliveryId:'99889',implId:'other_1396_3144004_99889_0',fromToken:'TK'}}];
    return json({data:{model}});
  }
  throw new Error('unmocked '+u);
};

// —— 模拟手机端动作链 ——
const opened = [];
// 动作3 urlencode
const enc = encodeURIComponent(COOKIE);
// 动作4 拼地址
const phoneUrl = 'https://mock.workers.dev/run?ck=' + enc;
// 动作5 下载
let r = await worker.fetch(new Request(phoneUrl));
let body = await r.json();
// 动作6/7/8 取值
const data = body.data || [], end = body.end || '', err = body.err || '';
console.log('后端返回: data', data.length, '| end:', end||'无', '| err:', err||'无');
// 动作10 each → 12 openurl / 13 delay
for (const item of data) { opened.push({ url: item.url, wait: item.wait }); }
// 动作19 end 不为空 → 20 openurl → 通知 → exit
if (end) { opened.push({ url: end, wait: 0, note: '完成度页' }); console.log('✅ 客户端按 end 收尾并退出'); }
console.log('\n手机会依次打开这些网址：');
opened.forEach((o,i)=>console.log(` ${String(i+1).padStart(2)}. [等 ${o.wait}s] ${o.url.slice(0,110)}`));
console.log('\n总耗时约:', opened.reduce((s,o)=>s+(o.wait||0),0), '秒');
