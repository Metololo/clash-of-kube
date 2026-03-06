package main

import (
	"encoding/json"
	"time"
)

type EventType string

const (
	PodAdded     EventType = "POD_ADDED"     // Grey icon (Pending)
	WarriorReady EventType = "WARRIOR_READY" // Colored icon (Running)
	WarriorDied  EventType = "WARRIOR_DIED"  // Red/Cross icon

	GameStarted EventType = "GAME_STARTED"
	GameOver    EventType = "GAME_OVER"
)

type BattleEvent struct {
	Type      string                 `json:"type"`
	Payload   map[string]interface{} `json:"payload"`
	Timestamp int64                  `json:"timestamp"`
}

func publishBattleEvent(gs GameState, t EventType, payload map[string]interface{}) {
	evt := BattleEvent{
		Type:      string(t),
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}

	data, err := json.Marshal(evt)
	if err != nil {
		return
	}

	_ = gs.PublishEvent("battle:events", string(data))
}
