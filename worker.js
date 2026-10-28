/**
 * 天猫双十一 CK 赛车 · 私有后端
 * ------------------------------------------------------------------
 * 作用：把作者快捷指令里最脆的一段（作者 JS 求值 / implId 计算 / 淘宝签名接口）
 *       搬到服务端，手机上的快捷指令只剩「问 cookie → 调本服务 → 逐条开网址」。
 *
 * 端点：
 *   GET  /health              健康检查
 *   GET  /config              返回作者当前的 ck11 配置 + tbcjs 脚本（调试用）
 *   POST /run                 body = 淘宝 cookie 纯文本   → 一次性跑完，返回要开的 URL 列表
 *   POST /calc                body = 淘宝接口返回的 JSON  → 只做纯计算（cookie 不经过后端）
 *
 * 隐私：cookie 只在 /run 的内存里出现，用完即弃；
 *       本文件不写任何 console.log 请求体/cookie，日志里不会出现凭据。
 */

import { getCookieValue, shortLinks, runTask, toItems, SESSIONS, sessionId } from './task.js';

const AUTHOR = {
  config: 'https://service-qd1gmnyf-1257225808.sh.apigw.tencentcs.com/release/task/ck11',
  getUrl: 'https://service-qd1gmnyf-1257225808.sh.apigw.tencentcs.com/release/getUrl',
  UA: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ---- 作者配置缓存（内存，60 秒）----
let cache = { at: 0, ck11: null, tbcjs: null };

async function getAuthorData() {
  if (Date.now() - cache.at < 60_000 && cache.ck11 && cache.tbcjs) return cache;
  const [ck11, tbcjs] = await Promise.all([
    fetch(AUTHOR.config).then((r) => r.text()),
    fetch(AUTHOR.config.replace('/ck11', '/tbcjs')).then((r) => r.text()),
  ]);
  cache = { at: Date.now(), ck11, tbcjs };
  return cache;
}

// ---- 从作者 getUrl 服务换到淘宝签名接口 ----
async function getTaobaoApiUrl(cookie, tag) {
  const tk = getCookieValue(cookie, '_m_h5_tk');
  if (!tk) throw new Error('cookie 里没有 _m_h5_tk（可能已过期，请重新抓）');
  const r = await fetch(`${AUTHOR.getUrl}?t=${encodeURIComponent(tk)}&k=${encodeURIComponent(tag)}`, {
    headers: { 'User-Agent': AUTHOR.UA, Referer: 'https://h5.m.taobao.com/' },
  });
  const j = await r.json();
  const url = j?.url || j?.data?.url || j?.data?.data?.url;
  if (!url) throw new Error('作者 getUrl 没返回可用地址：' + JSON.stringify(j).slice(0, 200));
  return url;
}

async function callTaobao(apiUrl, cookie) {
  const r = await fetch(apiUrl, {
    headers: {
      'User-Agent': AUTHOR.UA,
      Accept: '*/*',
      'Accept-Language': 'zh-cn',
      Referer: 'https://h5.m.taobao.com/',
      Host: 'h5api.m.taobao.com',
      Cookie: cookie,
    },
  });
  const text = await r.text();
  try { return JSON.parse(text); } catch { throw new Error('淘宝接口返回不是 JSON：' + text.slice(0, 200)); }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (request.method === 'GET' && (path === '/health' || path === '/')) {
        return json({ ok: true, service: 'tb1111-ck-backend', time: new Date().toISOString() });
      }

      if (request.method === 'GET' && path === '/config') {
        const { ck11, tbcjs } = await getAuthorData();
        return json({ ok: true, ck11: JSON.parse(ck11), tbcjs });
      }

      // 全流程：cookie 进后端（POST body 或 GET ?ck=）
      if ((request.method === 'POST' || request.method === 'GET') && path === '/run') {
        const cookie = request.method === 'GET'
          ? (url.searchParams.get('ck') || '').trim()
          : (await request.text()).trim();
        if (!cookie) return json({ ok: false, err: '没有收到 cookie', error: '没有收到 cookie', data: [] }, 400);
        const { ck11, tbcjs } = await getAuthorData();
        const ALLDATA = JSON.parse(ck11);
        const tag = ALLDATA.tag || 'tm1111';

        const apiUrl = await getTaobaoApiUrl(cookie, tag);
        const apiJson = await callTaobao(apiUrl, cookie);
        if (!apiJson?.data?.model?.length) {
          const m = '淘宝接口没返回任务列表（cookie 可能失效）';
          return json({ ok: false, err: m, error: m, data: [], raw: JSON.stringify(apiJson).slice(0, 300) }, 502);
        }
        // 同一 cookie 连续多轮共用一份 DB（跳过已跑过的商品），任务完成后自动清理
        const sid = sessionId(cookie);
        const db = SESSIONS.get(sid) || { run: 0, keys: {}, items: [] };
        const out = runTask(ck11, tbcjs, toItems(apiJson), db);
        if (out.end) SESSIONS.delete(sid); else SESSIONS.set(sid, db);
        return json({ ok: true, sid, ...out });
      }

      // 纯计算：cookie 不经过后端，手机把淘宝接口的返回丢进来即可
      if (request.method === 'POST' && path === '/calc') {
        const body = (await request.text()).trim();
        if (!body) return json({ ok: false, err: '没有收到接口返回', error: '没有收到接口返回', data: [] }, 400);
        const { ck11, tbcjs } = await getAuthorData();
        let apiJson;
        try { apiJson = JSON.parse(body); } catch { return json({ ok: false, error: 'body 不是 JSON' }, 400); }
        // 纯计算：不用 cookie，也不走会话
        const out = runTask(ck11, tbcjs, toItems(apiJson), { run: 0, keys: {}, items: [] });
        return json({ ok: true, ...out });
      }

      return json({ ok: false, err: 'not found', error: 'not found', data: [], paths: ['/health', '/config', '/run', '/calc'] }, 404);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      return json({ ok: false, err: msg, error: msg, data: [] }, 500);
    }
  },
};
