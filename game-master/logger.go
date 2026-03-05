package main

import (
	"fmt"
	"time"

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

	timestamp := time.Now().Format("2006-01-02 15:04:05.000")
	fmt.Printf("%s %s [%s] %s\n", emoji, timestamp, pod.Name, message)

}
