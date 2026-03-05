package main

import (
	"log"
	"os"
	"sync"
)

type Soldier struct {
	ID          string
	Health      int
	AttackPower int
	Team        string
	mu          sync.Mutex
}

func (s *Soldier) getEmoji() string {
	if s.Team == "red" {
		return "🔴"
	}
	return "🔵"
}

func (s *Soldier) TakeDamage(damage int) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.Health -= damage
	log.Printf("%s [%s] took %d damage, remaining health: %d", s.getEmoji(), s.ID, damage, s.Health)

	if s.Health <= 0 {
		s.Die()
	}
	return s.Health
}

func (s *Soldier) Die() {
	log.Printf("%s [%s] 💀 I have fallen!", s.getEmoji(), s.ID)
	os.Exit(1)
}
