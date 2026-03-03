package main

import "sync"

type PodState string

const (
	Running    PodState = "Running"
	Terminated PodState = "Terminated"
)

type PodTracker struct {
	states map[string]PodState
	mu     sync.Mutex
}

func NewPodTracker() *PodTracker {
	return &PodTracker{
		states: make(map[string]PodState),
	}
}

func (t *PodTracker) Get(uid string) PodState {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.states[uid]
}

func (t *PodTracker) Set(uid string, state PodState) {
	t.mu.Lock()
	defer t.mu.Unlock()
	t.states[uid] = state
}

func (t *PodTracker) Delete(uid string) {
	t.mu.Lock()
	defer t.mu.Unlock()
	delete(t.states, uid)
}
