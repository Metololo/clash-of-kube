package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Im a future soldier pod")
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	http.HandleFunc("/", handler)
	
	addr := ":" + port
	fmt.Printf("Soldier service started on %s\n", addr)
	
	log.Fatal(http.ListenAndServe(addr, nil))
}