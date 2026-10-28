# 淘宝双十一 1111 任务：作者说法 + 作者当前版本的完整步骤拆解

> 抓取时间：2026-10-28 10:00 (Asia/Shanghai)
> 作者：爱吃鱼的九条（公众号：九条爱吃鱼，QQ 963696474 / 1003989875）

---

## 一、作者的说法（为什么你"从昨天起没反应"）

作者仓库 `jiutiao/TTTASK` 的最新提交：

```
2026-10-28T09:38:45+08:00  update: 更新文件 1111.json
```

这次提交**只改了一行菜单文案**（`src/taobao/new/1111.json`）：

| 时间 | 菜单项文案 |
|---|---|
| 改之前（09:26 抓的） | `普通版被制裁，先用ck版的`、`ck过期的等我更新一个版本` |
| **改之后（现在）** | **`暂时失效了，明天我会出一个新版本`** |

同一份数据里作者留的 tip 原文（没改）：

```
普通的暂时出问题了,先用ck版
---------------
点击ck下载
---------------
普通的再想办法
ck过期的等我更新一个版本
```

### 结论
1. **你那份干净版走的是"普通版"路线**（静态 deliveryId 直接 openurl），这条路作者自己已经标注"暂时失效"，
   说 **2026-10-29（明天）出新版本**。所以**不是 delivery ID 换不换的问题，是整条普通版被淘宝风控了**，
   换任何 ID 都不会再触发。
2. 你现在能跑的只有 **CK 版**（天猫双十一CK赛车）——它不靠静态 deliveryId，靠 cookie + 动态接口。

### 怎么当场验证
打开你原来那个「双十一赛车任务」快捷指令（`94620402e7b747c9aee246b5444bc665`），
它的菜单是从 `new/1111.json` 实时拉的，现在应该能看到 **「暂时失效了，明天我会出一个新版本」** 这一条。

---

## 二、作者当前 CK 版的完整步骤拆解
（数据源 `…/release/task/ck11` + 脚本 `…/release/task/tbcjs` + 捷径 `94974d38ee454c41a3388ea2b1ae2305`）

### 准备
- **CK / cookie**：抓包 stream 或 Scriptable 持久化模式；必须和 App 登录账号是同一个人；一个手机最多 3 个账号。
- 教程：公众号文章《配置stream视频以及遇到问题的解决方案》。

### 执行链
| 步 | 动作 | 关键点 |
|---|---|---|
| 1 | 拉任务配置 | `GET …/release/task/ck11` → 菜单 + `taskData.种树`（ckurl / ckitemUrl / ckItem / outItem / wait / param） |
| 2 | 从 cookie 取 `_m_h5_tk` | 拼 `GET …/release/getUrl?t=<_m_h5_tk>&k=tm1111` |
| 3 | 换到淘宝真实接口 URL | 拿到带签名的 h5api 地址（**这一步必须靠有效 CK，静态 ID 替代不了**） |
| 4 | 请求该接口 → 拿任务列表 | 每项含 `progress.needTimes`、`progress.times`、`taskParams.deliveryId/implId/fromToken` |
| 5 | 动态算 implId | 把 implId 末段替换成 `index+i`，i 从 0 起，最多跑 3 次 |
| 6 | 拼"跑任务"URL | `ckurl + &implId=..&deliveryId=..&fromToken=..`，再随机替换 param（商品定位词 nike/anta/adidas/chanel/dior/biotherm/oppo） |
| 7 | **跳过 outItem** | `outItem` 里的 deliveryId 直接不跑（14 个） |
| 8 | 商品定位 | `ckitemUrl + &fromToken=..`，用 ckItem 每行 `deliveryId implId` 填 占位参数1/占位参数2（11 行） |
| 9 | 穿插回主页 | 每跑 1 个插一次 main，每 2 个插一次 |
| 10 | 收尾 | 跳 `taobao://m.tb.cn/h.jYO5Mc1` 看完成度；数据存 `abc/tb/config.txt`、`abc/cookie/ckfile.txt` |

### 为什么"只有 delivery ID 的静态列表"现在必死
- 普通版现在的 baseurl 换成了
  `://pages.tmall.com/wow/go/mx-growth/undertake/3d47a29c22504699886d09f9b7a5a067?disableNav=YES&deliveryId=占位参数1&sceneId=8917&hd_from_id=100260&implId=占位参数2`
  —— **同时要 deliveryId 和 implId**，而 implId 只能从第 4 步的实时接口拿，静态列表给不出。
- 旧静态清单（你用的 56 条）在 `src/taobao/tbck/1111.json`，作者还留着但没再更新它。
- 所以：**要跑出收益，只能用作者的 CK 版原版（带 cookie 的那个），或者等明天的新普通版。**

---

## 三、附录：三个版本的 deliveryId 清单
| 文件 | 行数 | 状态 |
|---|---|---|
| `deliveryId-合集.txt` | 76 | 原 64 行 + 作者 outItem 新增 11 行 |
| `deliveryId-A-25个.txt` | 25 | 只去重，ID 不丢 |
| `deliveryId.txt` | 11 | 严格对齐作者 ckItem |

**但在作者出新普通版之前，这三个都跑不出金币了**——普通版整体失效。
