package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os/exec"
	"sync"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

type CreateBattleDto struct {
	BattleName   string `json:"battleName"`
	RedReplicas  int    `json:"redReplicas"`
	BlueReplicas int    `json:"blueReplicas"`
}

const (
	StatusWaiting = "WAITING"
	StatusRunning = "RUNNING"
	StatusOver    = "OVER"

	TeamRed  = "red"
	TeamBlue = "blue"

	DeploymentRed  = "red-soldiers"
	DeploymentBlue = "blue-soldiers"

	ManifestRed  = "/app/manifests/red-team-deployment.yaml"
	ManifestBlue = "/app/manifests/blue-team-deployment.yaml"
)

type GameMaster struct {
	clientset *kubernetes.Clientset
	gameState GameState
	namespace string
	mu        sync.Mutex
}

func NewGameMaster(clientset *kubernetes.Clientset, gameState GameState, namespace string) *GameMaster {
	return &GameMaster{
		clientset: clientset,
		gameState: gameState,
		namespace: namespace,
	}
}

func (gm *GameMaster) CreateBattlefieldHandler(w http.ResponseWriter, r *http.Request) {

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var dto CreateBattleDto
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Println("🏗️  Provisioning battlefield")

	gm.resetGame()

	gm.applyBattlefieldManifests()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{"status": "provisioning"})
}

func (gm *GameMaster) StartGameHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	log.Println("🚀 Start game requested")

	if gm.isGameAlreadyRunning() {
		http.Error(w, "Game already running", http.StatusConflict)
		return
	}

	if !gm.areSoldiersReady() {
		http.Error(w, "Soldiers not ready", http.StatusServiceUnavailable)
		return
	}

	if err := gm.startGame(); err != nil {
		http.Error(w, "Failed to start game", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "started"})
}

func (gm *GameMaster) startGame() error {
	gm.gameState.SetStatus(StatusRunning)

	err := gm.gameState.PublishEvent("game-events", "START")
	if err != nil {
		log.Printf("❌ Failed to publish start event: %v", err)
		return err
	}

	publishBattleEvent(gm.gameState, "GAME_STARTED", map[string]interface{}{
		"message": "The battle has begun!",
	})

	log.Println("✅ Game started")
	return nil
}

func (gm *GameMaster) resetGame() {
	gm.mu.Lock()
	defer gm.mu.Unlock()

	gm.gameState.Reset()
}

func (gm *GameMaster) isGameAlreadyRunning() bool {
	status := gm.gameState.GetStatus()
	return status == StatusRunning && !gm.gameState.IsGameOver()
}

func (gm *GameMaster) areSoldiersReady() bool {
	deployments := []string{
		DeploymentRed,
		DeploymentBlue,
	}

	for _, deployment := range deployments {
		ready := gm.isDeploymentReady(deployment)
		if !ready {
			return false
		}
	}

	return true
}

func (gm *GameMaster) isDeploymentReady(name string) bool {
	deploy, err := gm.clientset.
		AppsV1().
		Deployments(gm.namespace).
		Get(context.TODO(), name, metav1.GetOptions{})

	if err != nil {
		log.Printf("⚠️ Deployment %s not found", name)
		return false
	}

	desired := int32(0)
	if deploy.Spec.Replicas != nil {
		desired = *deploy.Spec.Replicas
	}

	ready := deploy.Status.ReadyReplicas

	if ready < desired {
		log.Printf("⏳ %s: %d/%d ready", name, ready, desired)
		return false
	}

	return true
}

func (gm *GameMaster) CheckGameOver() {
	if gm.gameState.IsGameOver() {
		return
	}

	gm.mu.Lock()
	defer gm.mu.Unlock()

	redAlive := gm.gameState.GetTeamCount(TeamRed)
	blueAlive := gm.gameState.GetTeamCount(TeamBlue)

	if gm.shouldGameContinue(redAlive, blueAlive) {
		return
	}

	gm.finishGame(redAlive, blueAlive)
}

func (gm *GameMaster) shouldGameContinue(red, blue int) bool {
	return red > 0 && blue > 0
}

func (gm *GameMaster) finishGame(red, blue int) {
	gm.gameState.SetStatus(StatusOver)
	winner := determineWinner(red, blue)

	publishBattleEvent(gm.gameState, "GAME_OVER", map[string]interface{}{
		"winner": winner,
		"score": map[string]int{
			"red":  red,
			"blue": blue,
		},
	})

	log.Println("--------------------------------------------------")
	log.Printf("🏆 GAME OVER! Winner: %s", winner)
	log.Printf("📊 Final Score -> Red: %d | Blue: %d", red, blue)
	log.Println("--------------------------------------------------")

	go gm.cleanupBattlefield(winner)
}

func determineWinner(red, blue int) string {
	if red == 0 && blue > 0 {
		return "Blue"
	}

	if blue == 0 && red > 0 {
		return "Red"
	}

	return "Draw"
}

func (gm *GameMaster) cleanupBattlefield(winner string) {
	gm.deleteDeployment(DeploymentRed)
	gm.deleteDeployment(DeploymentBlue)

	event := fmt.Sprintf(`{"type":"GAME_OVER","winner":"%s"}`, winner)

	_ = gm.gameState.PublishEvent("battle:events", event)
}

func (gm *GameMaster) deleteDeployment(name string) {
	err := gm.clientset.
		AppsV1().
		Deployments(gm.namespace).
		Delete(context.TODO(), name, metav1.DeleteOptions{})

	if err != nil && !errors.IsNotFound(err) {
		log.Printf("❌ Failed deleting %s: %v", name, err)
		return
	}

	log.Printf("🗑️ Deployment %s deleted", name)
}

func (gm *GameMaster) applyBattlefieldManifests() {
	applyManifest(ManifestRed)
	applyManifest(ManifestBlue)
}

func applyManifest(path string) {
	cmd := exec.Command("kubectl", "apply", "-f", path)

	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("❌ Apply failed (%s): %v\n%s", path, err, out)
		return
	}

	log.Printf("✅ Applied %s", path)
}
