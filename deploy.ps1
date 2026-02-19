# --- SCRIPT D'AUTOMATISATION SHOPMASTER (v3) ---
Write-Host "--- Demarrage du processus ---" -ForegroundColor Cyan

# 1. Nettoyage
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 2. Test du Build local (npm run build)
Write-Host "Test du Build local..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Le build local a echoue." -ForegroundColor Red
    exit
}

# 3. Sauvegarde sur Git
Write-Host "Git: Envoi vers GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Update Shopmaster $(Get-Date -Format 'HH:mm')"
git push origin main --force

# 4. Deploiement sur Vercel
Write-Host "Deploiement sur Vercel..." -ForegroundColor Green
vercel --prod --yes

Write-Host "TERMINE ! Verifie le lien Vercel ci-dessus." -ForegroundColor Cyan