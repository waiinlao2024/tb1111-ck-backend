import { readFileSync } from 'node:fs';
const CK11 = readFileSync('/workspace/tmp-fetch/ck11.json','utf8');
const TBCJS = readFileSync('/workspace/tmp-fetch/tbcjs.js','utf8');
const worker = (await import('../worker.js')).default;
let round = 0;
globalThis.fetch = async (url, opts={}) => {
  const u=String(url);
  const json=(o)=>new Response(JSON.stringify(o),{headers:{'Content-Type':'application/json'}});
  if (u.includes('/release/task/ck11')) return new Response(CK11);
  if (u.includes('/release/task/tbcjs')) return new Response(TBCJS);
  if (u.includes('/release/getUrl')) return json({url:'https://h5api.m.taobao.com/x'});
  if (u.includes('h5api.m.taobao.com')) {
    round++;
    // 第 1 轮：3 个任务；第 2 轮：只剩 1 个（模拟已完成）
    const model = round===1 ? [
      {progress:{needTimes:'1',times:0},taskParams:{deliveryId:'99889',implId:'a_1_2_3_0',fromToken:'T'}},
      {progress:{needTimes:'1',times:0},taskParams:{deliveryId:'101866',implId:'b_1_2_3_0',fromToken:'T'}}]
      : [{progress:{needTimes:'0',times:1},taskParams:{deliveryId:'99889',implId:'a_1_2_3_0',fromToken:'T'}}];
    return json({data:{model}});
  }
  throw new Error('unmocked '+u);
};
const post = async (path, body) => (await worker.fetch(new Request('https://x.dev'+path,{method:'POST',body}))).json();
const ck = 'a=1; _m_h5_tk=TOK; b=2';
const r1 = await post('/run', ck);
console.log('第1轮 url 条数:', r1.data.length, '| sid:', r1.sid, '| end:', r1.end||'无');
const r2 = await post('/run', ck);
console.log('第2轮 url 条数:', r2.data.length, '| end:', r2.end||'无');
console.log(r2.end ? '✅ 任务完成时返回 end，客户端据此收尾' : '❌');
