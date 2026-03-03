# =========================
# Config
# =========================

REGISTRY ?= metooo
TAG ?= v1.1

GAME_MASTER_IMAGE = $(REGISTRY)/game-master:$(TAG)
SOLDIER_IMAGE     = $(REGISTRY)/soldier:$(TAG)

K8S_DIR = k8s

.PHONY: help build-game-master build-soldier push-game-master push-soldier \
        deploy-teams deploy-game-master build push deploy all

# =========================
# Help
# =========================
help:
	@echo "Available targets:"
	@echo "  make build-game-master    Build game-master image"
	@echo "  make build-soldier        Build soldier image"
	@echo "  make push-game-master     Push game-master image"
	@echo "  make push-soldier         Push soldier image"
	@echo "  make deploy-teams         Deploy blue-team.yaml and red-team.yaml"
	@echo "  make deploy-game-master   Deploy game-master.yaml"
	@echo "  make build                Build both images"
	@echo "  make push                 Push both images"
	@echo "  make deploy               Deploy all manifests"
	@echo "  make all                  Build, push, and deploy everything"

# =========================
# Build
# =========================
build-game-master:
	docker build -t $(GAME_MASTER_IMAGE) ./Dockerfile

build-soldier:
	docker build -t $(SOLDIER_IMAGE) ./soldier

build: build-game-master build-soldier

# =========================
# Push
# =========================
push-game-master:
	docker push $(GAME_MASTER_IMAGE)

push-soldier:
	docker push $(SOLDIER_IMAGE)

push: push-game-master push-soldier

# =========================
# Deploy
# =========================
deploy-teams:
	kubectl apply -f $(K8S_DIR)/blue-team-deployment.yaml
	kubectl apply -f $(K8S_DIR)/red-team-deployment.yaml

deploy-game-master:
	kubectl apply -f $(K8S_DIR)/game-master.yaml

deploy: deploy-teams deploy-game-master

# =========================
# All-in-one
# =========================
all: build push deploy