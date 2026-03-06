package main

import (
	"log"
	"net/http"
	"os"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/informers"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
)

func main() {
	clientset := getKubernetesClient()
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	gameState := NewRedisGameState(redisAddr)
	namespace := "default"

	gm := NewGameMaster(clientset, gameState, namespace)

	mux := http.NewServeMux()
	mux.HandleFunc("/setup", gm.CreateBattlefieldHandler)
	mux.HandleFunc("/start", gm.StartGameHandler)

	go func() {
		log.Printf("🚀 Game Master v15! listening on :8080")
		server := &http.Server{
			Addr:    ":8080",
			Handler: mux,
		}
		if err := server.ListenAndServe(); err != nil {
			log.Fatal(err)
		}
	}()

	podInformer := createInformer(clientset, "app=soldier")
	setupEventHandlers(podInformer, gameState, gm)
	startInformer(podInformer)
}

func getKubernetesClient() *kubernetes.Clientset {
	config, err := rest.InClusterConfig()
	if err != nil {
		log.Panicf("failed to get in-cluster config: %v", err)
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Panicf("failed to create kubernetes client: %v", err)
	}
	return clientset
}

func createInformer(clientset *kubernetes.Clientset, labelSelector string) cache.SharedIndexInformer {
	factory := informers.NewSharedInformerFactoryWithOptions(
		clientset,
		10*time.Minute,
		informers.WithTweakListOptions(func(options *metav1.ListOptions) {
			options.LabelSelector = labelSelector
		}),
	)
	return factory.Core().V1().Pods().Informer()
}

func setupEventHandlers(podInformer cache.SharedIndexInformer, gameState GameState, gm *GameMaster) {
	podInformer.AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			handlePodAdd(obj.(*corev1.Pod), gameState)
		},
		UpdateFunc: func(oldObj, newObj interface{}) {
			handlePodUpdate(oldObj.(*corev1.Pod), newObj.(*corev1.Pod), gameState, gm)
		},
		DeleteFunc: func(obj interface{}) {
			handlePodDelete(obj.(*corev1.Pod), gameState, gm)
		},
	})
}

func startInformer(podInformer cache.SharedIndexInformer) {
	stopper := make(chan struct{})
	defer close(stopper)

	podInformer.Run(stopper)

	if !cache.WaitForCacheSync(stopper, podInformer.HasSynced) {
		log.Panic("failed to sync cache")
	}

	<-stopper
}
