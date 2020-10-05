package terminal

import (
	"math/rand"
	"strconv"
	"time"

	log "github.com/sirupsen/logrus"

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
	log.Debug("Kubernetes Terminal cleanup will start in %d minutes", wait)

	for {
		time.Sleep(time.Duration(wait) * time.Minute)
		log.Debug("Cleaning up stale Kubernetes Terminal pods and secrets ...")

		// Get all pods with a given label
		podClient, secretClient, err := k.getClients()
		if err == nil {
			// Only want the pods that are kube terminals
			options := metaV1.ListOptions{}
			options.LabelSelector = "stratos-role=kube-terminal"
			pods, err := podClient.List(options)
			if err == nil {
				for _, pod := range pods.Items {
					if sessionID, ok := pod.Annotations[stratosSessionAnnotation]; ok {
						i, err := strconv.Atoi(sessionID)
						if err == nil {
							isValid, err := k.PortalProxy.GetSessionDataStore().IsValidSession(i)
							if err == nil && !isValid {
								log.Debugf("Deleting pod %s", pod.Name)
								podClient.Delete(pod.Name, nil)
							}
						}
					}
				}
			} else {
				log.Debug("Kube Terminal Cleanup: Could not get pods")
				log.Debug(err)
			}

			// Only want the secrets that are kube terminals
			secrets, err := secretClient.List(options)
			if err == nil {
				for _, secret := range secrets.Items {
					if sessionID, ok := secret.Annotations[stratosSessionAnnotation]; ok {
						i, err := strconv.Atoi(sessionID)
						if err == nil {
							isValid, err := k.PortalProxy.GetSessionDataStore().IsValidSession(i)
							if err == nil && !isValid {
								log.Debugf("Deleting secret %s", secret.Name)
								secretClient.Delete(secret.Name, nil)
							}
						}
					}
				}
			} else {
				log.Warn("Kube Terminal Cleanup: Could not get secrets")
				log.Warn(err)
			}

		} else {
			log.Warn("Kube Terminal Cleanup: Could not get clients")
			log.Warn(err)
		}

		wait = waitPeriod
	}
}
