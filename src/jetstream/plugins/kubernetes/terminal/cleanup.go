package terminal

import (
	"context"
	"log/slog"
	"math/rand"
	"strconv"
	"time"

	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// Wait time in minutes after random intiial wait
const waitPeriod = 10

// StartCleanup starts a background routine to cleanup orphaned pods
func (k *KubeTerminal) StartCleanup() {
	go k.cleanup()
}

func (k *KubeTerminal) cleanup() {
	// Use a random initial wait before cleaning up
	// If we had more than one backend, this helps to ensure they are not all trying to cleanup at the same time
	wait := rand.Intn(30)
	slog.Debug("Kubernetes Terminal cleanup scheduled", "waitMinutes", wait)

	for {
		time.Sleep(time.Duration(wait) * time.Minute)
		slog.Debug("cleaning up stale Kubernetes Terminal pods and secrets", "namespace", k.Namespace)

		// Get all pods with a given label
		podClient, secretClient, err := k.getClients()

		ctx := context.Background()

		if err == nil {
			// Only want the pods that are kube terminals
			options := metaV1.ListOptions{}
			options.LabelSelector = "stratos-role=kube-terminal"
			pods, err := podClient.List(ctx, options)
			if err == nil {
				for _, pod := range pods.Items {
					if sessionID, ok := pod.Annotations[stratosSessionAnnotation]; ok {
						i, err := strconv.Atoi(sessionID)
						if err == nil {
							isValid, err := k.PortalProxy.GetSessionDataStore().IsValidSession(i)
							if err == nil && !isValid {
								slog.Debug("deleting a stale Kubernetes Terminal pod", "pod", pod.Name, "namespace", k.Namespace, "session", i)
								podClient.Delete(ctx, pod.Name, metaV1.DeleteOptions{})
							}
						}
					}
				}
			} else {
				slog.Warn("Kubernetes Terminal cleanup could not list the pods", "namespace", k.Namespace, "error", err)
			}

			// Only want the secrets that are kube terminals
			secrets, err := secretClient.List(ctx, options)
			if err == nil {
				for _, secret := range secrets.Items {
					if sessionID, ok := secret.Annotations[stratosSessionAnnotation]; ok {
						i, err := strconv.Atoi(sessionID)
						if err == nil {
							isValid, err := k.PortalProxy.GetSessionDataStore().IsValidSession(i)
							if err == nil && !isValid {
								slog.Debug("deleting a stale Kubernetes Terminal secret", "secret", secret.Name, "namespace", k.Namespace, "session", i)
								secretClient.Delete(ctx, secret.Name, metaV1.DeleteOptions{})
							}
						}
					}
				}
			} else {
				slog.Warn("Kubernetes Terminal cleanup could not list the secrets", "namespace", k.Namespace, "error", err)
			}

		} else {
			slog.Warn("Kubernetes Terminal cleanup could not get the Kubernetes clients", "namespace", k.Namespace, "error", err)
		}

		wait = waitPeriod
	}
}
