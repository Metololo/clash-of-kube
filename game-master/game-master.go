package main

import (
	"context"
	"log"
	"net/http"
	"os/exec"
	"sync"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type GameMaster struct {
	clientset *kubernetes.Clientset
	gameState GameState // Using the interface abstraction
	tracker   *PodTracker
	namespace string
	mu        sync.Mutex
}

func NewGameMaster(clientset *kubernetes.Clientset, gameState GameState, tracker *PodTracker, namespace string) *GameMaster {
	return &GameMaster{
		clientset: clientset,
		gameState: gameState,
		tracker:   tracker,
		namespace: namespace,
	}
}

// 1. CreateBattlefieldHandler handles the infrastructure provisioning (kubectl apply)
func (gm *GameMaster) CreateBattlefieldHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("🏗️  Provisioning Battlefield Infrastructure...")

	applyDeployment("/app/manifests/blue-team-deployment.yaml")
	applyDeployment("/app/manifests/red-team-deployment.yaml")

	w.WriteHeader(http.StatusAccepted)
	w.Write([]byte("Battlefield infrastructure requested. Deployment in progress..."))
}

func (gm *GameMaster) StartGameHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("🚀 Attempting to start game...")

	if gm.gameState.IsGameOver() == false && gm.gameState.GetCount("red") > 0 {
		http.Error(w, "Game already in progress", http.StatusConflict)
		return
	}
	if !gm.areSoldiersReady() {
		http.Error(w, "Soldiers not ready. Wait for all pods to be 'Running'.", http.StatusServiceUnavailable)
		return
	}
	gm.mu.Lock()
	gm.gameState.Reset()
	gm.mu.Unlock()

	log.Println("✅ All pods verified. Game state reset. Battle is live!")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("BATTLE STARTED!"))
}

// areSoldiersReady ensures that ReadyReplicas == DesiredReplicas
func (gm *GameMaster) areSoldiersReady() bool {
	teams := []string{"red-soldiers", "blue-soldiers"}
	for _, team := range teams {
		deploy, err := gm.clientset.AppsV1().Deployments(gm.namespace).Get(context.TODO(), team, metav1.GetOptions{})
		if err != nil {
			log.Printf("⚠️  Deployment %s not found", team)
			return false
		}

		desired := int32(0)
		if deploy.Spec.Replicas != nil {
			desired = *deploy.Spec.Replicas
		}

		if deploy.Status.ReadyReplicas < desired {
			log.Printf("⏳ Team %s: %d/%d pods ready", team, deploy.Status.ReadyReplicas, desired)
			return false
		}
	}
	return true
}

// CheckGameOver handles the distributed cleanup logic
func (gm *GameMaster) CheckGameOver() {
	// 1. Atomic Check: Has someone else already triggered the end?
	if gm.gameState.IsGameOver() {
		return
	}

	redCount := gm.gameState.GetCount("red")
	blueCount := gm.gameState.GetCount("blue")

	// 2. Victory Condition Check
	if redCount == 0 || blueCount == 0 {
		// 3. Atomic Lock: Only one GM instance wins the right to delete
		if !gm.gameState.SetGameOver() {
			return
		}

		winner := "Blue"
		if blueCount == 0 && redCount > 0 {
			winner = "Red"
		} else if redCount == 0 && blueCount == 0 {
			winner = "Draw"
		}

		log.Printf("🏆 VALIDATED GAME OVER! Winner: %s (Red: %d, Blue: %d)", winner, redCount, blueCount)
		gm.DeleteDeployment("red-soldiers")
		gm.DeleteDeployment("blue-soldiers")
	}
}

func (gm *GameMaster) DeleteDeployment(name string) {
	err := gm.clientset.AppsV1().Deployments(gm.namespace).Delete(context.TODO(), name, metav1.DeleteOptions{})
	if err != nil {
		if errors.IsNotFound(err) {
			return
		}
		log.Printf("❌ Failed to delete deployment %s: %v", name, err)
		return
	}
	log.Printf("🗑️ Deployment %s deleted", name)
}

func applyDeployment(path string) {
	cmd := exec.Command("kubectl", "apply", "-f", path)
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("❌ Failed to apply %s: %v\nOutput: %s", path, err, string(out))
		return
	}
	log.Printf("✅ Applied deployment from %s", path)
}
