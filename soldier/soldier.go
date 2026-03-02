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
	mu          sync.Mutex
}

func (s *Soldier) TakeDamage(damage int) int {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.Health -= damage
	log.Printf("[%s] took %d damage, remaining health: %d", s.ID, damage, s.Health)

	if s.Health <= 0 {
		s.Die()
	}
	return s.Health
}

func (s *Soldier) Die() {
	log.Printf("[%s] has died. Exiting.", s.ID)
	os.Exit(0)
}
