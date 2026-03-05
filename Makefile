# =========================
# Config
# =========================

REGISTRY ?= metooo
TAG ?= v1.1

GAME_MASTER_IMAGE = $(REGISTRY)/game-master:$(TAG)
SOLDIER_IMAGE     = $(REGISTRY)/soldier:$(TAG)

K8S_DIR = k8s

.PHONY: help build-game-master build-soldier push-game-master push-soldier \
        deploy-teams deploy-game-master build push deploy all clean prepare

# ... (Help section) ...

# =========================
# Management Commands
# =========================

# Prepare the Game Master environment using Kustomize (Redis, ConfigMaps, RBAC, etc.)
prepare:
	@echo "🛠️  Preparing Game Master environment..."
	kubectl apply -k $(K8S_DIR)

# Delete all deployments created by the game to start fresh
clean:
	@echo "🧹 Cleaning up deployments..."
	kubectl delete deployments red-soldiers blue-soldiers game-master redis || true
	kubectl delete service red-team blue-team game-master-service redis-service || true
	@echo "✨ Environment cleared."

# =========================
# Build & Push (Existing)
# =========================
# ... (Keep your existing build/push logic) ...

# =========================
# Deploy
# =========================

# Updated deploy to use prepare logic
deploy: prepare

# =========================
# All-in-one
# =========================
all: build push prepare