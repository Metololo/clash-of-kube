package main

import (
	"fmt"
	"sync"
)

type GameState interface {
	Increment(team string)
	Decrement(team string)
	GetCount(team string) int
}

type MemoryGameState struct {
	counts map[string]int
	mu     sync.Mutex
}

func NewMemoryGameState() *MemoryGameState {
	return &MemoryGameState{
		counts: make(map[string]int),
	}
}

func (m *MemoryGameState) Increment(team string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.counts[team]++
	fmt.Printf("📈 Team %s count: %d\n", team, m.counts[team])
}

func (m *MemoryGameState) Decrement(team string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.counts[team]--
	if m.counts[team] < 0 {
		m.counts[team] = 0
	}
	fmt.Printf("📉 Team %s count: %d\n", team, m.counts[team])
}

func (m *MemoryGameState) GetCount(team string) int {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.counts[team]
}
