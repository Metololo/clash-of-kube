package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

func TakeDamageHandler(s *Soldier) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		power := r.URL.Query().Get("power")
		damage, err := strconv.Atoi(power)
		if err != nil {
			http.Error(w, "Invalid damage", http.StatusBadRequest)
			return
		}

		remaining := s.TakeDamage(damage)
		fmt.Fprintf(w, "Remaining health: %d\n", remaining)
	}
}

func main() {
	health := getEnvInt("HEALTH", 100)
	attack := getEnvInt("ATTACK_POWER", 10)
	enemyURL := os.Getenv("ENEMY_URL")
	redisAddr := getEnvString("REDIS_ADDR", "localhost:6379")
	port := getEnvString("PORT", "8080")
	team := os.Getenv("TEAM")
	id := os.Getenv("SOLDIER_ID")

	if id == "" {
		log.Fatal("SOLDIER_ID must be set")
	}

	s := &Soldier{
		ID:          id,
		Health:      health,
		AttackPower: attack,
		Team:        team,
	}

	emoji := s.getEmoji()
	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	ctx := context.Background()

	log.Printf("%s [%s][%s] Initialized (Health=%d Attack=%d)",
		emoji, s.ID, s.Team, s.Health, s.AttackPower,
	)

	go func() {
		for s.Health > 0 {
			waitForGameStart(ctx, rdb, emoji, s.ID, enemyURL)
			attackLoop(ctx, s, rdb, emoji, enemyURL)
			time.Sleep(1 * time.Second)
		}
	}()
	http.HandleFunc("/takeDamage", TakeDamageHandler(s))
	log.Printf("%s [%s] server running on :%s", emoji, s.ID, port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func waitForGameStart(ctx context.Context, rdb *redis.Client, emoji, id, enemyURL string) {
	status, _ := rdb.Get(ctx, "game:status").Result()
	if status == "RUNNING" {
		log.Printf("%s [%s] ⚔️ Battle already live! Joining the fray...", emoji, id)
		return
	}

	log.Printf("status = %s", status)

	pubsub := rdb.Subscribe(ctx, "game-events")
	defer pubsub.Close()
	log.Printf("%s [%s] 🛡️ Waiting for battle cry...", emoji, id)

	for {
		msg, err := pubsub.ReceiveMessage(ctx)
		if err != nil {
			time.Sleep(1 * time.Second)
			continue
		}
		if msg.Payload == "START" {
			log.Printf("%s [%s] ⚔️ Battle started! Attacking %s", emoji, id, enemyURL)
			return
		}
	}
}

func attackLoop(ctx context.Context, s *Soldier, rdb *redis.Client, emoji, enemyURL string) {
	for s.Health > 0 {
		gameStatus, _ := rdb.Get(ctx, "game:status").Result()
		if gameStatus == "OVER" {
			log.Printf("%s [%s] 🏁 Game over, stopping attacks", emoji, s.ID)
			return
		}

		url := fmt.Sprintf("%s?power=%d", enemyURL, s.AttackPower)
		resp, err := http.Get(url)
		if err != nil {
			log.Printf("%s [%s] ❌ ATTACK FAILED: %v", emoji, s.ID, err)
		} else {
			log.Printf("%s [%s] 👊 Attack landed on %s (Status: %d)", emoji, s.ID, enemyURL, resp.StatusCode)
			resp.Body.Close()
		}

		time.Sleep(2 * time.Second)
	}
}

func getEnvInt(key string, defaultVal int) int {
	if v, err := strconv.Atoi(os.Getenv(key)); err == nil && v > 0 {
		return v
	}
	return defaultVal
}

func getEnvString(key, defaultVal string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return defaultVal
}
