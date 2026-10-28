# 按网站说明上传到 GitHub

1. 打开 github.com → New repository → 名字随意（例如 `tb1111-ck-backend`）→ 先不要勾选 README
2. 解压本目录（或 `tb1111-ck-backend-github-ready.zip`）后，用网页 **Add file → Upload files** 把所有文件拖进去（务必包含隐藏目录 `.github/workflows/deploy.yml`）
3. Cloudflare：建 Worker + 拿 API Token（Edit Cloudflare Workers）+ Account ID
4. 仓库 Settings → Secrets and variables → Actions 添加：
   - CLOUDFLARE_API_TOKEN
   - CLOUDFLARE_ACCOUNT_ID
5. push / 或 Actions 里 Run workflow → 得到 `https://<worker>.<subdomain>.workers.dev`
6. `curl https://…/health` 验证
7. iPhone 导入 `shortcut-thin-backend.shortcut`，改文本里的 CHANGE-ME 地址
