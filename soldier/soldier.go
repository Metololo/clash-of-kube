package main

import (
	"log"
	"os"
	"sync"

	"github.com/redis/go-redis/v9"
)

type Soldier struct {
	ID          string
	Health      int
	AttackPower int
	Team        string
	mu          sync.Mutex
	rdb         *redis.Client
}

func (s *Soldier) getEmoji() string {
	if s.Team == "red" {
		return "🔴"
	}
	return "🔵"
}

func (s *Soldier) TakeDamage(damage int, attackerID string, attackerTeam string) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.Health -= damage

	displayHealth := s.Health
	if displayHealth < 0 {
		displayHealth = 0
	}

	publishSoldierEvent(s.rdb, WarriorAttack, map[string]interface{}{
		"attacker":        attackerID,
		"attackerTeam":    attackerTeam,
		"target":          s.ID,
		"targetTeam":      s.Team,
		"damage":          damage,
		"remainingHealth": displayHealth,
	})

	if s.Health <= 0 {
		s.Die()
	}

	return s.Health
}

func (s *Soldier) Die() {
	publishSoldierEvent(s.rdb, WarriorDied, map[string]interface{}{
		"podName": s.ID,
		"team":    s.Team,
		"status":  "dead",
	})

	log.Printf("%s [%s] 💀 Fallen!", s.getEmoji(), s.ID)
	os.Exit(1)
}
