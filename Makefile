# =========================
# Config
# =========================

REGISTRY ?= metooo
TAG ?= latest
K8S_DIR = k8s

# If "project" is provided (e.g., make build project=gateway), use it. 
# Otherwise, default to all three.
project ?= game-master gateway soldier

.PHONY: help build push setup-k8s clean all

help:
	@echo "Usage:"
	@echo "  make build [project=name]  - Build one or all images"
	@echo "  make push [project=name]   - Push one or all images"
	@echo "  make setup-k8s             - Deploy the full cluster"

# =========================
# Build & Push Logic
# =========================

# The $(project) variable handles either a single string or the full list
build:
	@echo "🚀 Building: $(project)"
	@$(foreach p,$(project), \
		docker build -t $(REGISTRY)/$(p):$(TAG) ./$(p); \
	)

push:
	@echo "📤 Pushing: $(project)"
	@$(foreach p,$(project), \
		docker push $(REGISTRY)/$(p):$(TAG); \
	)

# =========================
# Kubernetes Operations
# =========================

setup-k8s:
	@echo "🛠️  Applying Kustomize (Redis, Game-Master, RBAC)..."
	kubectl apply -k $(K8S_DIR)
	
	@echo "🏗️  Deploying NestJS Gateway..."
	kubectl apply -f gateway/gateway-k8s.yaml
	
	@echo "⏳ Waiting for Gateway to be ready..."
	kubectl wait --for=condition=available deployment/gateway --timeout=60s
	
	@echo "🌍 Opening Gateway service..."
	minikube service gateway-service

clean:
	@echo "🧹 Cleaning up..."
	kubectl delete -k $(K8S_DIR) --ignore-not-found
	kubectl delete -f gateway/gateway-k8s.yaml --ignore-not-found
	kubectl delete deployments -l app=clash-of-kube --ignore-not-found