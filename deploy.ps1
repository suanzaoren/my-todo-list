# Deploy todo app to GitHub (run after gh auth login)
$ErrorActionPreference = "Stop"

$repoName = "my-todo-list"
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ghPath = "C:\Program Files\GitHub CLI\gh.exe"
$gitPaths = @("D:\Git\cmd", "C:\Program Files\Git\cmd")

foreach ($p in $gitPaths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
        $env:Path = "$p;$env:Path"
    }
}

if (Get-Command gh -ErrorAction SilentlyContinue) {
    $gh = "gh"
} elseif (Test-Path $ghPath) {
    $gh = $ghPath
    $env:Path += ";C:\Program Files\GitHub CLI"
} else {
    Write-Host "GitHub CLI not found. Install with: winget install GitHub.cli" -ForegroundColor Red
    exit 1
}

Set-Location $projectDir

$prevErrorAction = $ErrorActionPreference
$ErrorActionPreference = "Continue"
& $gh auth status 2>&1 | Out-Null
$loggedIn = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevErrorAction

if (-not $loggedIn) {
    Write-Host "Please login first:" -ForegroundColor Yellow
    Write-Host '  "C:\Program Files\GitHub CLI\gh.exe" auth login -h github.com -p https -w' -ForegroundColor Cyan
    exit 1
}

git branch -M main

$owner = & $gh api user -q .login
$ErrorActionPreference = "Continue"
& $gh repo view "$owner/$repoName" 2>&1 | Out-Null
$repoExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevErrorAction

if (-not $repoExists) {
    & $gh repo create $repoName --public --source=. --remote=origin --description "Todo list web app"
    git push -u origin main
} else {
    git remote remove origin 2>$null
    git remote add origin "https://github.com/$owner/$repoName.git"
    git push -u origin main
}

$ErrorActionPreference = "Continue"
& $gh api "repos/$owner/$repoName/pages" -X POST -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    & $gh api "repos/$owner/$repoName/pages" -X PUT -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>&1 | Out-Null
}
$ErrorActionPreference = $prevErrorAction

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host "Repo:  https://github.com/$owner/$repoName"
Write-Host "Pages: https://$owner.github.io/$repoName/"
