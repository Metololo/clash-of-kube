package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
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
	id := os.Getenv("SOLDIER_ID")
	if id == "" {
		log.Fatal("SOLDIER_ID must be set")
	}

	s := &Soldier{ID: id, Health: health, AttackPower: attack}
	log.Printf("[%s][%s] Health=%d Attack=%d",
		s.ID,
		os.Getenv("TEAM"),
		s.Health,
		s.AttackPower,
	)
	port := getEnvString("PORT", "8080")

	http.HandleFunc("/takeDamage", TakeDamageHandler(s))
	log.Printf("[%s] running on :%s (Health=%d, Attack=%d)", s.ID, port, health, attack)
	log.Fatal(http.ListenAndServe(":"+port, nil))
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
