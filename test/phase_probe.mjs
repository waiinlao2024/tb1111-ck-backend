import { readFileSync } from 'node:fs';
import { toItems } from '../task.js';
const CK11 = readFileSync('/workspace/tmp-fetch/ck11.json','utf8');
const TBCJS = readFileSync('/workspace/tmp-fetch/tbcjs.js','utf8');
const src=TBCJS;
const body = src.slice(src.indexOf('function runTask()'), src.indexOf('function run ()'));
const gi=src.indexOf('function getCookie(cookie,name)');
const orig = new Function('DB','ALLDATA','data','cookies', body + src.slice(gi) + '\nreturn runTask();');
const API={data:{model:[
 {progress:{needTimes:'2',times:3},taskParams:{deliveryId:'99673',implId:'other_1396_3138010_99673_0',fromToken:'T'}},
 {progress:{needTimes:'1',times:0},taskParams:{deliveryId:'99889',implId:'other_1396_3144004_99889_0',fromToken:'T'}},
 {progress:{needTimes:'5',times:1},taskParams:{deliveryId:'101866',implId:'other_1396_3227011_101866_0',fromToken:'T'}},
]}};
const items=toItems(API);
let c=0;
Math.random=()=>{ const v=(c%7)/7; c++; return v; };
const a=JSON.parse(orig({run:0,keys:{},items:[]},JSON.parse(CK11),items,''));
const callsOrig=c;
c=0;
// 我的移植版：同样注入计数器
const { runTask } = await import('../task.js');
const b=runTask(CK11,TBCJS,items,{run:0,keys:{},items:[]});
const callsMine=c;
console.log('原版随机调用次数', callsOrig, '| 我的', callsMine);
const words = arr => arr.map(x=>x.url).map(u=>((u.match(/taobao:\/\/(\w+)\.m\.tmall\.com/)||[])[1])).filter(Boolean);
console.log('原版 ckItem 品牌顺序:', words(a.data).join(','));
console.log('我的 ckItem 品牌顺序:', words(b.data).join(','));
console.log('（品牌下标 = 随机调用序号 % 7）');
