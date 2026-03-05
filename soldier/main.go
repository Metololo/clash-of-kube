package main

import (
	"context"
	"log"
	"net"
	"os"
	"strconv"
	"time"

	pb "soldier/pb"

	"github.com/redis/go-redis/v9"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type SoldierServer struct {
	pb.UnimplementedSoldierServiceServer
	soldier *Soldier
}

func (s *SoldierServer) TakeDamage(ctx context.Context, req *pb.DamageRequest) (*pb.DamageResponse, error) {

	damage := int(req.Power)

	log.Printf("%s [%s] 👊 attacked by %s (%s) for %d damage",
		s.soldier.getEmoji(),
		s.soldier.ID,
		req.AttackerId,
		req.AttackerTeam,
		damage,
	)

	remaining := s.soldier.TakeDamage(damage)

	return &pb.DamageResponse{
		RemainingHealth: int32(remaining),
	}, nil
}

func main() {
	health := getEnvInt("HEALTH", 100)
	attack := getEnvInt("ATTACK_POWER", 10)
	enemyService := os.Getenv("ENEMY_SERVICE")
	redisAddr := getEnvString("REDIS_ADDR", "localhost:6379")
	port := getEnvString("PORT", "50051")
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
		waitForGameStart(ctx, rdb, emoji, s.ID)
		attackLoop(s, emoji, enemyService)
	}()

	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatal(err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterSoldierServiceServer(grpcServer, &SoldierServer{
		soldier: s,
	})

	log.Printf("%s [%s] gRPC server running on :%s", emoji, s.ID, port)
	log.Fatal(grpcServer.Serve(lis))
}

func waitForGameStart(ctx context.Context, rdb *redis.Client, emoji, id string) {

	status, _ := rdb.Get(ctx, "game:status").Result()
	if status == "RUNNING" {
		log.Printf("%s [%s] ⚔️ Battle already live! Joining the fray...", emoji, id)
		return
	}

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
			log.Printf("%s [%s] ⚔️ Battle started!", emoji, id)
			return
		}
	}
}

func attackLoop(s *Soldier, emoji, enemyService string) {
	for s.Health > 0 {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		conn, err := grpc.NewClient(enemyService, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			log.Printf("%s [%s] ❌ ATTACK FAILED (dial): %v", emoji, s.ID, err)
			time.Sleep(2 * time.Second)
			continue
		}

		client := pb.NewSoldierServiceClient(conn)

		req := &pb.DamageRequest{
			AttackerId:   s.ID,
			AttackerTeam: s.Team,
			Power:        int32(s.AttackPower),
		}

		resp, err := client.TakeDamage(ctx, req)
		if err != nil {
			log.Printf("%s [%s] ❌ ATTACK FAILED: %v", emoji, s.ID, err)
		} else {
			log.Printf("%s [%s] 👊 Attack landed! Enemy health: %d", emoji, s.ID, resp.RemainingHealth)
		}

		conn.Close()
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
