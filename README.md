# tb1111-ck-backend · 天猫双十一 CK 赛车私有后端

把作者快捷指令里最脆的一段搬上服务端，手机上的快捷指令只剩 27 个动作：
**问 cookie → 调本服务 → 拿到要开的网址 → 逐条打开**。

作者：爱吃鱼的九条（公众号：九条爱吃鱼）｜本仓库为用户自用改造，署名保留。

---

## 为什么不是 GitHub Pages

GitHub Pages 是**纯静态**托管，做不了带 Cookie / 自定义请求头的后端请求。
本仓库的代码在 GitHub 上管理，**运行时用 Cloudflare Workers**（免费、自带 HTTPS、可绑自己的域名），
GitHub Actions 负责一键部署。

> 不喜欢 Cloudflare 也可以：同一份 `worker.js` 扔到 Vercel / Netlify / 任何 Node 服务器都能跑，
> 入口是标准 `fetch(request)`。

---

## 目录结构

```
worker.js            # HTTP 入口：/health /config /run /calc
task.js              # 纯逻辑：作者 runTask 的等价移植（可直接在 node 里跑测试）
test/port.test.mjs   # 移植版 vs 作者原始 JS 的逐条对比测试
test/worker.e2e.mjs  # 端到端 + cookie 去向审计
test/session.test.mjs# 多轮会话 DB 测试
test/phone_sim.mjs   # 模拟手机端动作链
wrangler.toml        # Cloudflare 配置（已关闭日志，避免 cookie 进日志）
```

---

## 部署（三步）

### 1. 建仓库并上传
新建一个 GitHub 仓库（Public 或 Private 都行），把本目录里的文件传上去
（网页端：Add file → Upload files；或本地 `git push`）。

### 2. 拿 Cloudflare 凭据
登录 <https://dash.cloudflare.com> →
**Workers & Pages → Create → Worker** → 起名 `tb1111-ck-backend` → 部署（先随便建一个）。
然后：
- **API Token**：My Profile → API Tokens → Create Token → 模板 `Edit Cloudflare Workers`
- **Account ID**：Workers & Pages → 你的账号 → 右侧 Copy Account ID

### 3. 填进 GitHub Secrets 并部署
仓库 **Settings → Secrets and variables → Actions → New repository secret**，加两个：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

保存后 push 一次（或 Actions 页面点 Run workflow）→ 自动部署。
成功后拿到地址：`https://tb1111-ck-backend.<你的子域>.workers.dev`

### 验证
```bash
curl https://tb1111-ck-backend.<你的子域>.workers.dev/health
# {"ok":true,"service":"tb1111-ck-backend",...}
```

---

## 手机端怎么用

把 `CK赛车-薄壳-接自建后端.shortcut` 导入快捷指令 App，
**把第 2 个动作（文本）里的 `https://CHANGE-ME.workers.dev/run?ck=` 改成你的后端地址**，然后运行：
粘贴 cookie → 后端算好网址 → 手机逐条打开 → 跑完通知「跑完了」。

---

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查 |
| GET | `/config` | 返回作者当前的 ck11 配置 + tbcjs 脚本（调试用） |
| GET/POST | `/run` | 全流程。`GET /run?ck=<urlencode后的cookie>` 或 `POST` body 为 cookie 纯文本 → 返回 `{ok,data:[{url,wait}],end?,sid?}` |
| POST | `/calc` | 纯计算。body = 淘宝接口返回的 JSON → 只算 URL，**cookie 不经过后端** |

---

## cookie 流向（已用 mock 出站请求逐条审计过）

| 接收方 | 收到什么 |
|---|---|
| `h5api.m.taobao.com` | 完整 cookie（淘宝自家 API，必须如此） |
| 作者服务器 `...tencentcs.com` | **只有 `_m_h5_tk`**（mtop 签名 token，分钟级过期）+ `k=tm1111` 标签 |
| 你的磁盘 / 日志 | **零**（wrangler.toml 里 observability 已关闭；代码不写任何请求体日志） |

---

## 本地跑测试

```bash
node test/port.test.mjs      # 移植版 vs 作者原始 JS，必须输出「完全一致」
node test/worker.e2e.mjs     # 端到端 + cookie 审计
node test/session.test.mjs   # 多轮会话
node test/phone_sim.mjs      # 模拟手机动作链
```

---

## 注意

- 作者的 `ck11` / `tbcjs` 每天会变（短链、item 列表），本服务**每次运行都实时拉取**，不写死。
- `outItem`（作者要跳过的 deliveryId）沿用作者原逻辑，没有改。
- 需要 cookie 账号 = 淘宝 App 登录账号；一个手机最多 3 个账号。
