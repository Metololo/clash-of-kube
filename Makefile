# =========================
# Config
# =========================

REGISTRY ?= metooo
TAG ?= latest
K8S_DIR = k8s
PROJECTS := game-master soldier gateway

# If "project" is provided (e.g., make build project=gateway), use it. 
# Otherwise, default to all three.
project ?= game-master gateway soldier

.PHONY: help build push setup-k8s clean all

help:
	@echo "Usage:"
	@echo "  make build [project=name]  - Build one or all images"
	@echo "  make push [project=name]   - Push one or all images"
	@echo "  make setup-k8s             - Deploy the full cluster"
	@echo "  make clean                 - Delete resources created from setup-k8s"
	@echo "  make all                   - Build, Push, and Deploy the full cluster"

BUILD_TARGETS := $(addprefix build-, $(PROJECTS))
PUSH_TARGETS  := $(addprefix push-, $(PROJECTS))

build: $(BUILD_TARGETS)

push: $(PUSH_TARGETS)

$(BUILD_TARGETS): build-%:
	@echo "🚀 Building: $*"
	docker build -t $(REGISTRY)/$*:$(TAG) ./$*

# Template for push targets
$(PUSH_TARGETS): push-%:
	@echo "📤 Pushing: $*"
	docker push $(REGISTRY)/$*:$(TAG)

# =========================
# Kubernetes Operations
# =========================

setup-k8s:
	@echo "🛠️  Applying Kustomize (Redis, Game-Master, RBAC)..."
	kubectl apply -k $(K8S_DIR)
	
	@echo "🏗️  Deploying NestJS Gateway..."
	kubectl apply -f $(K8S_DIR)/gateway.yaml
	
	@echo "⏳ Waiting for Gateway to be ready..."
	kubectl wait --for=condition=available deployment/gateway --timeout=60s
	
	@echo "🌍 Opening Gateway service..."
	minikube service gateway-service

clean:
	@echo "🧹 Cleaning up..."
	# Remove Kustomize resources
	kubectl delete -k $(K8S_DIR) --ignore-not-found
	# Remove Gateway manifest
	kubectl delete -f $(K8S_DIR)/gateway.yaml --ignore-not-found
	# Remove Team Deployments and Services
	kubectl delete deployment/blue-soldiers --ignore-not-found
	kubectl delete deployment/red-soldiers --ignore-not-found
	kubectl delete service blue-team-service red-team-service gateway-service --ignore-not-found
	@echo "✨ Environment cleared."