package main

import (
	corev1 "k8s.io/api/core/v1"
)

func handlePodAdd(pod *corev1.Pod, gameState GameState) {
	if gameState.IsGameOver() {
		return
	}

	publishBattleEvent(gameState, PodAdded, map[string]interface{}{
		"podName": pod.Name,
		"team":    pod.Labels["team"],
		"status":  "pending",
	})

	logPod(pod, "POD ADDED (PENDING)")
}

func handlePodUpdate(oldPod, newPod *corev1.Pod, gameState GameState, gm *GameMaster) {
	if gameState.IsGameOver() {
		return
	}

	podUID := string(newPod.UID)
	team := newPod.Labels["team"]

	for _, cs := range newPod.Status.ContainerStatuses {
		containerName := cs.Name
		wasRunning := gameState.IsContainerRunning(podUID, containerName)
		isRunning := cs.State.Running != nil

		if hasRespawnedContainer(wasRunning, isRunning) {
			handleContainerRespawn(newPod, podUID, containerName, team, gameState)
			continue
		}

		if hasDiedContainer(wasRunning, isRunning) {
			handleContainerDeath(newPod, podUID, containerName, team, gameState, gm)
		}
	}
}

func handleContainerRespawn(pod *corev1.Pod, podUID string, containerName string, team string, gameState GameState) {
	gameState.MarkContainerRunning(podUID, containerName)
	gameState.IncrementTeamCount(team)

	publishBattleEvent(gameState, WarriorReady, map[string]interface{}{
		"podName": pod.Name,
		"team":    team,
		"status":  "running",
	})

	logPod(pod, "⚔️ WARRIOR READY: "+containerName)
}

func handleContainerDeath(pod *corev1.Pod, podUID string, containerName string, team string, gameState GameState, gm *GameMaster) {
	gameState.MarkContainerStopped(podUID, containerName)
	gameState.DecrementTeamCount(team)

	publishBattleEvent(gameState, WarriorDied, map[string]interface{}{
		"podName": pod.Name,
		"team":    team,
		"status":  "dead",
	})

	logPod(pod, "💀 CONTAINER DIED: "+containerName)
	gm.CheckGameOver()
}

func handlePodDelete(pod *corev1.Pod, gameState GameState, gm *GameMaster) {
	if gameState.IsGameOver() {
		return
	}

	podUID := string(pod.UID)
	team := pod.Labels["team"]

	for _, cs := range pod.Status.ContainerStatuses {
		containerName := cs.Name
		if wasRunning(podUID, containerName, gameState) {
			handleContainerStoppedOnDelete(pod, podUID, containerName, team, gameState, gm)
		}
	}
	logPod(pod, "POD DELETED")
}

func handleContainerStoppedOnDelete(pod *corev1.Pod, podUID string, containerName string, team string, gameState GameState, gm *GameMaster) {
	gameState.MarkContainerStopped(podUID, containerName)
	gameState.DecrementTeamCount(team)

	publishBattleEvent(gameState, WarriorDied, map[string]interface{}{
		"podName": pod.Name,
		"team":    team,
		"status":  "deleted",
	})

	gm.CheckGameOver()
}

func hasRespawnedContainer(wasRunning, isRunning bool) bool { return !wasRunning && isRunning }
func hasDiedContainer(wasRunning, isRunning bool) bool      { return wasRunning && !isRunning }
func wasRunning(podUID, container string, gameState GameState) bool {
	return gameState.IsContainerRunning(podUID, container)
}
