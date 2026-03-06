package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

type EventType string

const (
	WarriorReady  EventType = "WARRIOR_READY"
	WarriorDied   EventType = "WARRIOR_DIED"
	WarriorAttack EventType = "WARRIOR_ATTACK"
)

type BattleEvent struct {
	Type      string                 `json:"type"`
	Payload   map[string]interface{} `json:"payload"`
	Timestamp int64                  `json:"timestamp"`
}

func publishSoldierEvent(rdb *redis.Client, t EventType, payload map[string]interface{}) {
	evt := BattleEvent{
		Type:      string(t),
		Payload:   payload,
		Timestamp: time.Now().UnixMilli(),
	}

	data, err := json.Marshal(evt)
	if err != nil {
		return
	}

	_ = rdb.Publish(context.Background(), "battle:events", string(data)).Err()
}
