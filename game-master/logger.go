package main

import (
	"fmt"

	corev1 "k8s.io/api/core/v1"
)

func logPod(pod *corev1.Pod, message string) {
	team := pod.Labels["team"]
	emoji := "⚪"

	switch team {
	case "red":
		emoji = "🔴"
	case "blue":
		emoji = "🔵"
	}

	fmt.Printf("%s [%s] %s\n", emoji, pod.Name, message)
}
