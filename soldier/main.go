// main.go
package main

import (
	"fmt"
	"net/http"
)

func handler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Im a future soldier pod")
}

func main() {
	http.HandleFunc("/", handler)
	fmt.Println("Soldier service started on :8080")
	http.ListenAndServe(":8080", nil)
}