import { readFileSync } from 'node:fs';
import { runTask as myRunTask, toItems } from '../task.js';
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
let calls=[]; const realRandom=Math.random;
Math.random=()=>{calls.push(1); return 0.5;};  // 固定返回值，只数次数
const a=JSON.parse(orig({run:0,keys:{},items:[]},JSON.parse(CK11),items,''));
console.log('原版 Math.random 调用次数:', calls.length);
calls=[];
const b=myRunTask(CK11,TBCJS,items,{run:0,keys:{},items:[]});
console.log('我的  Math.random 调用次数:', calls.length);
Math.random=realRandom;
// 再看 urlItem 数量
console.log('原版 urlD 长度', a.data.length, '我的', b.data.length);
console.log('原版 data.model 里的 key 顺序:', Object.keys(JSON.parse(CK11).taskData['种树'].task.param));
