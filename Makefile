# Makefile for Industrial Automation UI Deployment

# Load environment variables from .env.k8s if it exists
-include .env.k8s

# Default values
REGISTRY ?= localhost:5000
IMAGE_NAME ?= industrial-automation-ui
IMAGE_TAG ?= latest
NAMESPACE ?= default
FULL_IMAGE = $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: help
help: ## Show this help message
	@echo "Industrial Automation UI - Deployment Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

.PHONY: build
build: ## Build Docker image
	@echo "Building Docker image: $(FULL_IMAGE)"
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(FULL_IMAGE)

.PHONY: push
push: ## Push Docker image to registry
	@echo "Pushing image: $(FULL_IMAGE)"
	docker push $(FULL_IMAGE)

.PHONY: build-push
build-push: build push ## Build and push Docker image

.PHONY: deploy
deploy: ## Deploy to Kubernetes
	@echo "Deploying to Kubernetes namespace: $(NAMESPACE)"
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	kubectl apply -f k8s/ -n $(NAMESPACE)

.PHONY: deploy-wait
deploy-wait: deploy ## Deploy and wait for rollout
	@echo "Waiting for deployment to complete..."
	kubectl wait --for=condition=available --timeout=300s deployment/industrial-automation-ui -n $(NAMESPACE)

.PHONY: update-image
update-image: ## Update deployment with new image
	@echo "Updating deployment image to: $(FULL_IMAGE)"
	kubectl set image deployment/industrial-automation-ui \
		industrial-automation-ui=$(FULL_IMAGE) \
		-n $(NAMESPACE)
	kubectl rollout status deployment/industrial-automation-ui -n $(NAMESPACE)

.PHONY: rollback
rollback: ## Rollback to previous deployment
	kubectl rollout undo deployment/industrial-automation-ui -n $(NAMESPACE)
	kubectl rollout status deployment/industrial-automation-ui -n $(NAMESPACE)

.PHONY: scale
scale: ## Scale deployment (usage: make scale REPLICAS=3)
	kubectl scale deployment industrial-automation-ui --replicas=$(REPLICAS) -n $(NAMESPACE)

.PHONY: status
status: ## Show deployment status
	@echo "Deployment Status:"
	kubectl get deployment industrial-automation-ui -n $(NAMESPACE)
	@echo ""
	@echo "Pods:"
	kubectl get pods -n $(NAMESPACE) -l app=industrial-automation-ui
	@echo ""
	@echo "Service:"
	kubectl get svc industrial-automation-ui -n $(NAMESPACE)
	@echo ""
	@echo "Ingress:"
	kubectl get ingress industrial-automation-ui -n $(NAMESPACE)

.PHONY: logs
logs: ## Show logs from all pods
	kubectl logs -f -n $(NAMESPACE) -l app=industrial-automation-ui --tail=100

.PHONY: logs-pod
logs-pod: ## Show logs from specific pod (usage: make logs-pod POD=pod-name)
	kubectl logs -f -n $(NAMESPACE) $(POD)

.PHONY: describe
describe: ## Describe deployment
	kubectl describe deployment industrial-automation-ui -n $(NAMESPACE)

.PHONY: port-forward
port-forward: ## Port forward to local machine (localhost:8080)
	kubectl port-forward -n $(NAMESPACE) svc/industrial-automation-ui 8080:80

.PHONY: shell
shell: ## Get shell in running pod
	kubectl exec -it -n $(NAMESPACE) $$(kubectl get pod -n $(NAMESPACE) -l app=industrial-automation-ui -o jsonpath='{.items[0].metadata.name}') -- /bin/sh

.PHONY: config
config: ## Show ConfigMap
	kubectl get configmap automation-config -n $(NAMESPACE) -o yaml

.PHONY: edit-config
edit-config: ## Edit ConfigMap
	kubectl edit configmap automation-config -n $(NAMESPACE)

.PHONY: restart
restart: ## Restart deployment
	kubectl rollout restart deployment/industrial-automation-ui -n $(NAMESPACE)

.PHONY: delete
delete: ## Delete all resources
	kubectl delete -f k8s/ -n $(NAMESPACE)

.PHONY: clean
clean: ## Delete namespace (removes all resources)
	kubectl delete namespace $(NAMESPACE)

.PHONY: all
all: build-push deploy-wait status ## Build, push, deploy and show status

.PHONY: dev-install
dev-install: ## Install npm dependencies for development
	npm install

.PHONY: dev
dev: ## Run development server
	npm run dev

.PHONY: check-cluster
check-cluster: ## Check cluster connectivity
	@echo "Current cluster context:"
	kubectl config current-context
	@echo ""
	@echo "Cluster info:"
	kubectl cluster-info
	@echo ""
	@echo "Available nodes:"
	kubectl get nodes

.PHONY: check-prereqs
check-prereqs: ## Check prerequisites
	@echo "Checking prerequisites..."
	@command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
	@command -v kubectl >/dev/null 2>&1 || { echo "ERROR: kubectl not found"; exit 1; }
	@echo "✓ Docker installed"
	@echo "✓ kubectl installed"
	@kubectl cluster-info >/dev/null 2>&1 || { echo "ERROR: Cannot connect to Kubernetes cluster"; exit 1; }
	@echo "✓ Kubernetes cluster accessible"
	@echo ""
	@echo "All prerequisites met!"
