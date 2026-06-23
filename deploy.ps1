# 部署待办清单到 GitHub（需先执行 gh auth login 完成登录）
$ErrorActionPreference = "Stop"

$repoName = "my-todo-list"
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Set-Location $projectDir

# 检查 GitHub 登录
gh auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "请先登录 GitHub：" -ForegroundColor Yellow
    Write-Host "  gh auth login -h github.com -p https -w" -ForegroundColor Cyan
    exit 1
}

# 切换到 main 分支
git branch -M main

# 创建远程仓库并推送（若仓库已存在会报错，可改为手动添加 remote）
$owner = gh api user -q .login
$exists = gh repo view "$owner/$repoName" 2>$null
if ($LASTEXITCODE -ne 0) {
    gh repo create $repoName --public --source=. --remote=origin --description "简洁现代的待办事项 Web 应用"
    git push -u origin main
} else {
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$owner/$repoName.git"
    git push -u origin main
}

# 启用 GitHub Pages
gh api "repos/$owner/$repoName/pages" -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>$null
if ($LASTEXITCODE -ne 0) {
    gh api "repos/$owner/$repoName/pages" -X PUT -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>$null
}

Write-Host ""
Write-Host "部署完成！" -ForegroundColor Green
Write-Host "仓库地址: https://github.com/$owner/$repoName"
Write-Host "Pages 地址: https://$owner.github.io/$repoName/ （启用后约 1-2 分钟生效）"
