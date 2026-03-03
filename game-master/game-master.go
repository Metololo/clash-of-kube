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
	clientset  *kubernetes.Clientset
	gameState  GameState
	tracker    *PodTracker
	namespace  string
	mu         sync.Mutex
	isGameOver bool
}

func NewGameMaster(clientset *kubernetes.Clientset, gameState GameState, tracker *PodTracker, namespace string) *GameMaster {
	return &GameMaster{
		clientset:  clientset,
		gameState:  gameState,
		tracker:    tracker,
		namespace:  namespace,
		isGameOver: true,
	}
}

func (gm *GameMaster) CheckGameOver() {
	gm.mu.Lock()
	if gm.isGameOver {
		gm.mu.Unlock()
		return
	}

	redCount := gm.gameState.GetCount("red")
	blueCount := gm.gameState.GetCount("blue")

	if redCount == 0 || blueCount == 0 {
		gm.isGameOver = true
		gm.mu.Unlock()

		winner := "Blue"
		if blueCount == 0 && redCount > 0 {
			winner = "Red"
		} else if redCount == 0 && blueCount == 0 {
			winner = "Draw/Mutual Destruction"
		}

		log.Printf("🏆 GAME OVER! Team %s wins! Final Count - Red: %d, Blue: %d", winner, redCount, blueCount)

		gm.DeleteDeployment("red-soldiers")
		gm.DeleteDeployment("blue-soldiers")
	} else {
		gm.mu.Unlock()
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

func (gm *GameMaster) StartNewGameHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("⚡ Starting new game...")

	gm.mu.Lock()
	gm.isGameOver = false
	gm.gameState = NewMemoryGameState()
	gm.tracker = NewPodTracker()
	gm.mu.Unlock()

	applyDeployment("/app/manifests/blue-team-deployment.yaml")
	applyDeployment("/app/manifests/red-team-deployment.yaml")

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("New game started! Soldiers are deploying..."))
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
