// 纯逻辑模块：与作者 tbcjs 的 runTask 等价实现（可直接在 node 里跑测试）
export { getCookieValue, shortLinks, runTask, toItems };

// ---- cookie 解析 ----
function getCookieValue(cookie, name) {
  const m = new RegExp('(?:^|;\\s*)' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)').exec(cookie || '');
  return m ? m[1] : '';
}

// ---- 从作者 tbcjs 里取当日的短链（作者每天会改，硬编码会失效）----
function shortLinks(tbcjs) {
  const pick = (name) => {
    const m = new RegExp('var\\s+' + name + "\\s*=\\s*'([^']*)'").exec(tbcjs || '');
    return m ? m[1] : '';
  };
  return { pv: pick('pvStr'), end: pick('endStr'), gwc: pick('gStr') };
}

// ---- 作者 runTask 的等价实现（原样搬，参数化随机词保持一致）----
function runTask(ck11, tbcjs, data, dbIn) {
  const ALLDATA = JSON.parse(ck11);
  const taskList = (ALLDATA.activity && ALLDATA.activity.taskList) || [];
  const oneTask = ALLDATA.taskData[taskList[0]];
  if (!oneTask) throw new Error('ck11 里没有任务配置（taskData.' + taskList[0] + '）');

  const t = oneTask.task;
  const itme = t.ckItem || [];
  const outItme = t.outItem || [];
  const wait = t.wait ?? 15;
  const paramObj = t.param || {};
  const { pv, end, gwc } = shortLinks(tbcjs);

  const scheme = {
    scheme: 'taobao',
    main: 'taobao://m.taobao.com/tbopen/index.html?h5Url=https://m.taobao.com',
    start: 'taobao://m.tb.cn/h.' + pv,
    end: 'taobao://m.tb.cn/h.' + end,
    gwc: 'taobao://m.tb.cn/h.' + gwc,
  };

  const DB = dbIn || { run: 0, keys: {}, items: [] };
  DB.run = (DB.run || 0) + 1;

  const urlItem = [];
  let nowToken = '';

  for (const item of data || []) {
    if (String(item.needTimes) === '0') continue;
    const deliveryId = item.deliveryId;
    const implId = item.implId;
    const fromToken = item.fromToken;
    const index = Number(item.index) || 0;
    nowToken = fromToken || nowToken;

    if (DB.keys[deliveryId]) continue;
    if (outItme.includes(deliveryId)) continue;   // 作者的「跳过名单」，原样保留

    let num = Number(item.needTimes) || 0;
    if (num <= 3) DB.keys[deliveryId] = true;
    if (num > 3) num = 3;

    for (let i = 0; i < num; i++) {
      // implId 末段换成 index+i
      const parts = String(implId).split('_');
      parts.pop();
      const nowImplId = parts.join('_') + '_' + (index + i);
      DB.items.push(`${deliveryId} ${nowImplId}`);

      let url = scheme.scheme + t.ckurl + `&implId=${nowImplId}&deliveryId=${deliveryId}&fromToken=${fromToken}`;
      for (const key in paramObj) {
        const arr = paramObj[key];
        const rep = arr[Math.floor(Math.random() * arr.length)];
        url = url.replace(new RegExp(key, 'g'), rep);
      }
      urlItem.push({ url, wait });
    }
  }

  const urlD = [];
  if (DB.run === 1) {
    urlD.push({ url: scheme.end, wait: 10 });
    urlD.push({ url: scheme.start, wait: 5 });
    urlD.push({ url: scheme.main, wait: 5 });
  }

  if (DB.run === 1 && nowToken) {
    // 商品定位：用作者的 ckItem（"deliveryId implId"）
    for (const line of itme) {
      const params = String(line).split(' ');
      let url = scheme.scheme + t.ckitemUrl + '&fromToken=' + nowToken;
      for (const key in paramObj) {
        const arr = paramObj[key];
        url = url.replace(new RegExp(key, 'g'), arr[Math.floor(Math.random() * arr.length)]);
      }
      params.forEach((v, i) => { if (v) url = url.replace(new RegExp('占位参数' + (i + 1), 'g'), v); });
      urlItem.push({ url, wait });
    }
  }

  urlItem.forEach((v) => { urlD.push(v); urlD.push({ url: scheme.main, wait: 5 }); });

  return {
    succes: 'ok',
    data: urlD,
    db: DB,
    token: nowToken || undefined,
    end: urlItem.length === 0 ? scheme.gwc : undefined,
  };
}

// ---- 淘宝接口返回 → 作者要的简化 item 列表 ----
function toItems(apiJson) {
  const model = (apiJson && apiJson.data && apiJson.data.model) || (Array.isArray(apiJson) ? apiJson : []);
  return model.map((m) => ({
    needTimes: m.progress?.needTimes ?? 0,
    index: m.progress?.times ?? 0,
    num: m.progress?.times ?? 0,
    deliveryId: m.taskParams?.deliveryId,
    implId: m.taskParams?.implId,
    fromToken: m.taskParams?.fromToken,
  })).filter((i) => i.deliveryId);
}


// ---- 会话 DB：同一 cookie 的多轮共用；任务完成自动清理 ----
export const SESSIONS = new Map();
export function sessionId(cookie) {
  // 只用 cookie 的哈希做 key，不落盘、不外发
  let h = 0;
  for (let i = 0; i < cookie.length; i++) h = (h * 31 + cookie.charCodeAt(i)) >>> 0;
  return 's' + h.toString(16);
}
