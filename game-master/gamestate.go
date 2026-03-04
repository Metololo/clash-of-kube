package main

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

// GameState interface provides an abstraction layer for the game logic.
// This allows the GameMaster to remain technology-agnostic.
type GameState interface {
	Increment(team string)
	Decrement(team string)
	GetCount(team string) int
	Reset()
	IsGameOver() bool
	SetGameOver() bool
	GetStatus() string
	SetStatus(status string)
}

type RedisGameState struct {
	rdb *redis.Client
}

// NewRedisGameState initializes the Redis client and returns the interface.
func NewRedisGameState(addr string) GameState {
	rdb := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	// Fail fast: verify connection on startup
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Redis Connection Warning: %v", err)
	}

	return &RedisGameState{rdb: rdb}
}

func (r *RedisGameState) Increment(team string) {
	key := fmt.Sprintf("count:%s", team)
	val, err := r.rdb.Incr(ctx, key).Result()
	if err != nil {
		log.Printf("❌ Redis Incr error: %v", err)
		return
	}
	fmt.Printf("📈 Team %s count: %d\n", team, val)
}

func (r *RedisGameState) Decrement(team string) {
	key := fmt.Sprintf("count:%s", team)
	val, err := r.rdb.Decr(ctx, key).Result()
	if err != nil {
		log.Printf("❌ Redis Decr error: %v", err)
		return
	}

	// Ensure counts never remain negative in Redis
	if val < 0 {
		r.rdb.Set(ctx, key, 0, 0)
		val = 0
	}
	fmt.Printf("📉 Team %s count: %d\n", team, val)
}

func (r *RedisGameState) GetCount(team string) int {
	key := fmt.Sprintf("count:%s", team)
	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return 0
	}
	count, _ := strconv.Atoi(val)
	return count
}

func (r *RedisGameState) Reset() {
	// Atomic deletion of all state keys
	err := r.rdb.Del(ctx, "count:red", "count:blue", "game:is_over").Err()
	if err != nil {
		log.Printf("❌ Redis Reset error: %v", err)
	}
}

func (r *RedisGameState) IsGameOver() bool {
	val, err := r.rdb.Get(ctx, "game:is_over").Result()
	if err != nil {
		return false
	}
	return val == "true"
}

func (r *RedisGameState) SetGameOver() bool {
	// Using the modern approach for atomic SET if Not Exists
	// SetNX returns true if the key was set, false if it already existed.
	// This acts as a distributed lock for the cleanup sequence.
	success, err := r.rdb.SetNX(ctx, "game:is_over", "true", 10*time.Minute).Result()
	if err != nil {
		log.Printf("❌ Redis SetGameOver error: %v", err)
		return false
	}
	return success
}

func (r *RedisGameState) GetStatus() string {
	val, _ := r.rdb.Get(ctx, "game:status").Result()
	if val == "" {
		return "WAITING"
	}
	return val
}

func (r *RedisGameState) SetStatus(status string) {
	r.rdb.Set(ctx, "game:status", status, 0)
}
