package main

import (
	"context"
	"fmt"
	"log"
	"strconv"

	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()

const (
	keyGameStatus = "game:status"
	keyTeamCount  = "count:%s"
	keyContainer  = "container:%s:%s"
)

type GameState interface {
	IncrementTeamCount(team string)
	DecrementTeamCount(team string)
	GetTeamCount(team string) int

	MarkContainerRunning(podUID, container string)
	MarkContainerStopped(podUID, container string)
	IsContainerRunning(podUID, container string) bool

	GetStatus() string
	SetStatus(status string)
	IsGameOver() bool
	Reset()

	PublishEvent(channel string, message string) error
}

type RedisGameState struct {
	rdb *redis.Client
}

func NewRedisGameState(addr string) GameState {
	rdb := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Redis connection warning: %v", err)
	}

	return &RedisGameState{rdb: rdb}
}

func (r *RedisGameState) PublishEvent(channel string, message string) error {
	return r.rdb.Publish(ctx, channel, message).Err()
}

func (r *RedisGameState) IncrementTeamCount(team string) {
	key := fmt.Sprintf(keyTeamCount, team)

	val, err := r.rdb.Incr(ctx, key).Result()
	if err != nil {
		log.Printf("❌ Redis INCR error: %v", err)
		return
	}

	log.Printf("📈 Team %s count: %d", team, val)
}

func (r *RedisGameState) DecrementTeamCount(team string) {
	key := fmt.Sprintf(keyTeamCount, team)

	val, err := r.rdb.Decr(ctx, key).Result()
	if err != nil {
		log.Printf("❌ Redis DECR error: %v", err)
		return
	}

	if val < 0 {
		r.rdb.Set(ctx, key, 0, 0)
		val = 0
	}

	log.Printf("📉 Team %s count: %d", team, val)
}

func (r *RedisGameState) GetTeamCount(team string) int {
	key := fmt.Sprintf(keyTeamCount, team)

	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return 0
	}

	count, _ := strconv.Atoi(val)
	return count
}

func (r *RedisGameState) MarkContainerRunning(podUID, container string) {
	key := fmt.Sprintf(keyContainer, podUID, container)
	r.rdb.Set(ctx, key, "1", 0)
}

func (r *RedisGameState) MarkContainerStopped(podUID, container string) {
	key := fmt.Sprintf(keyContainer, podUID, container)
	r.rdb.Set(ctx, key, "0", 0)
}

func (r *RedisGameState) IsContainerRunning(podUID, container string) bool {
	key := fmt.Sprintf(keyContainer, podUID, container)

	val, err := r.rdb.Get(ctx, key).Result()
	if err != nil {
		return false
	}

	return val == "1"
}

func (r *RedisGameState) GetStatus() string {
	val, err := r.rdb.Get(ctx, keyGameStatus).Result()
	if err != nil || val == "" {
		return StatusWaiting
	}

	return val
}

func (r *RedisGameState) SetStatus(status string) {
	r.rdb.Set(ctx, keyGameStatus, status, 0)
}

func (r *RedisGameState) IsGameOver() bool {
	return r.GetStatus() == StatusOver
}

func (r *RedisGameState) Reset() {
	iter := r.rdb.Scan(ctx, 0, "*", 0).Iterator()

	for iter.Next(ctx) {
		r.rdb.Del(ctx, iter.Val())
	}

	if err := iter.Err(); err != nil {
		log.Printf("❌ Redis reset error: %v", err)
	}
}
