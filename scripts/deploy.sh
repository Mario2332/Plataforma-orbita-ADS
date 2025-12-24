#!/bin/bash

# Script de deploy para múltiplos projetos Firebase
# Uso: ./scripts/deploy.sh [orbita|free|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Chaves de serviço
ORBITA_KEY="/home/ubuntu/upload/plataforma-orbita-firebase-adminsdk-fbsvc-3c844434df.json"
FREE_KEY="/home/ubuntu/upload/orbita-free-firebase-adminsdk-fbsvc-41354821ba.json"

deploy_orbita() {
    echo "🚀 Fazendo deploy para plataforma-orbita..."
    cd "$PROJECT_DIR"
    
    # Build com variável de ambiente
    VITE_FIREBASE_PROJECT=plataforma-orbita pnpm run build
    
    # Deploy
    export GOOGLE_APPLICATION_CREDENTIALS="$ORBITA_KEY"
    firebase use plataforma-orbita
    firebase deploy --only hosting
    
    echo "✅ Deploy para plataforma-orbita concluído!"
}

deploy_free() {
    echo "🚀 Fazendo deploy para orbita-free..."
    cd "$PROJECT_DIR"
    
    # Build com variável de ambiente
    VITE_FIREBASE_PROJECT=orbita-free pnpm run build
    
    # Deploy
    export GOOGLE_APPLICATION_CREDENTIALS="$FREE_KEY"
    firebase use orbita-free
    firebase deploy --only hosting
    
    echo "✅ Deploy para orbita-free concluído!"
}

case "$1" in
    orbita)
        deploy_orbita
        ;;
    free)
        deploy_free
        ;;
    all)
        deploy_orbita
        echo ""
        deploy_free
        ;;
    *)
        echo "Uso: $0 [orbita|free|all]"
        echo ""
        echo "  orbita  - Deploy para plataforma-orbita (white-label)"
        echo "  free    - Deploy para orbita-free (gratuito com anúncios)"
        echo "  all     - Deploy para ambos os projetos"
        exit 1
        ;;
esac
