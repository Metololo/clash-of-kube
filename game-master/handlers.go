package main

import (
	"fmt"

	corev1 "k8s.io/api/core/v1"
)

func handlePodAdd(pod *corev1.Pod, gameState GameState, tracker *PodTracker, gm *GameMaster) {
	tracker.Set(pod.Name, Running)
	logPod(pod, "NEW POD DETECTED")
	gameState.Increment(pod.Labels["team"])
}

func handlePodUpdate(oldPod, newPod *corev1.Pod, gameState GameState, tracker *PodTracker, gm *GameMaster) {
	uid := newPod.Name
	team := newPod.Labels["team"]

	for _, cs := range newPod.Status.ContainerStatuses {
		isTerminated := cs.State.Terminated != nil && tracker.Get(uid) != Terminated
		isRespawned := cs.State.Running != nil && tracker.Get(uid) != Running
		isWaiting := cs.State.Waiting != nil

		switch {
		case isTerminated:
			handleTerminated(cs, newPod, uid, team, gameState, tracker, gm)
		case isRespawned:
			handleRunning(cs, newPod, uid, team, gameState, tracker)
		case isWaiting:
			handleWaiting(cs, newPod)
		}
	}
}

func handleTerminated(cs corev1.ContainerStatus, pod *corev1.Pod, uid, team string, gameState GameState, tracker *PodTracker, gm *GameMaster) {
	tracker.Set(uid, Terminated)
	exitCode := cs.State.Terminated.ExitCode
	reason := cs.State.Terminated.Reason

	if exitCode == 0 {
		logPod(pod, "DIED (Completed)")
	} else {
		logPod(pod, fmt.Sprintf("CRASHED! ExitCode=%d, Reason=%s", exitCode, reason))
	}

	gameState.Decrement(team)
	gm.CheckGameOver()
}

func handleRunning(cs corev1.ContainerStatus, pod *corev1.Pod, uid, team string, gameState GameState, tracker *PodTracker) {
	tracker.Set(uid, Running)
	logPod(pod, "RESPAWNED!")
	gameState.Increment(team)
}

func handleWaiting(cs corev1.ContainerStatus, pod *corev1.Pod) {
	logPod(pod, fmt.Sprintf("Waiting (Reason: %s)", cs.State.Waiting.Reason))
	if cs.State.Waiting.Reason == "CrashLoopBackOff" {
		logPod(pod, "In backoff!")
	}
}

func handlePodDelete(pod *corev1.Pod, gameState GameState, tracker *PodTracker, gm *GameMaster) {
	uid := pod.Name
	team := pod.Labels["team"]
	if tracker.Get(uid) == Running {
		gameState.Decrement(team)
		gm.CheckGameOver()
	}
	tracker.Delete(uid)
	logPod(pod, "DELETED")
}
