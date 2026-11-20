#!/usr/bin/env bash
# =============================================================================
# REPTIC.CM — Déploiement sur le serveur
#
#   bash scripts/deploy.sh               déploie la dernière version de main
#   bash scripts/deploy.sh --si-nouveau  ne fait rien si le serveur est déjà à jour
#                                        (mode utilisé par la tâche cron, toutes les 5 min)
#
# Étapes : git pull → npm ci → npm run build → redémarrage PM2.
# Le fichier .env.production.local du serveur n'est jamais touché.
# Variable facultative : PM2_APP (nom du processus PM2, défaut : all).
#
# Prérequis serveur (une fois) : clé de déploiement GitHub pour l'utilisateur,
# Node 22 via nvm, et une règle sudoers autorisant sans mot de passe « pm2 » et
# « chown » (voir le guide de déploiement automatique).
# =============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

# Un seul déploiement à la fois (la tâche cron peut se relancer pendant un build)
exec 9>"/tmp/reptic-deploy.lock"
if ! flock -n 9; then
  echo "Déploiement déjà en cours, rien à faire."
  exit 0
fi

# Node 22 via nvm : à charger explicitement, cron et ssh ne lisent pas ~/.bashrc
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use 22 >/dev/null
fi

git fetch --quiet origin main
if [ "${1:-}" = "--si-nouveau" ] && [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  exit 0 # déjà à jour
fi

echo "[$(date '+%F %T')] Déploiement de $(git log --oneline -1 origin/main)"

# Mise à jour du code (refuse si l'historique local a divergé : rien n'est écrasé)
git pull --ff-only --quiet origin main

# Dépendances, puis construction (les variables NEXT_PUBLIC_* sont figées ici).
# Le site tournant sous root écrit son cache dans .next : on le récupère avant le build.
npm ci --no-audit --no-fund
sudo -n chown -R "$(id -un):$(id -gn)" .next 2>/dev/null || true
npm run build

# Redémarrage (PM2 tourne sous root)
sudo -n pm2 restart "${PM2_APP:-all}" --update-env

echo "[$(date '+%F %T')] Déploiement terminé : $(git log --oneline -1)"
