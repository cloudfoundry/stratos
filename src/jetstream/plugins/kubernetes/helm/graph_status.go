package helm

import (
	log "github.com/sirupsen/logrus"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
)

// NodeStatus represents the status of a node in the graph
type NodeStatus string

const (
	NodeOK      NodeStatus = "ok"
	NodeWarn    NodeStatus = "warn"
	NodeError   NodeStatus = "error"
	NodeUnknown NodeStatus = "unknown"
	NodeNone    NodeStatus = "none"
)

func mapDeploymentStatus(replicas, ready, available, unavailable int32) NodeStatus {
	if replicas == ready {
		return NodeOK
	}

	if unavailable > 0 {
		return NodeError
	}

	if replicas != unavailable {
		return NodeWarn
	}

	return NodeWarn
}

func mapReplicaSetStatus(status appsv1.ReplicaSetStatus) NodeStatus {
	if status.Replicas == status.ReadyReplicas {
		return NodeOK
	}

	if status.Replicas != status.AvailableReplicas {
		return NodeError
	}

	return NodeWarn
}

func mapContainerStatus(status v1.PodStatus, name string) NodeStatus {
	for _, cstat := range status.ContainerStatuses {
		if cstat.Name == name {
			if cstat.Ready {
				return NodeOK
			} else {
				// Could be a pod that has completed
				if cstat.State.Terminated != nil {
					if cstat.State.Terminated.ExitCode == 0 && cstat.State.Terminated.Reason == "Completed" {
						return NodeOK
					}
				}
				return NodeWarn
			}
		}
	}
	return NodeError
}

func mapPodStatus(phase v1.PodPhase) NodeStatus {

	status := NodeUnknown

	switch phase {
	case v1.PodFailed:
		status = NodeError
	case v1.PodRunning:
		status = NodeOK
	case v1.PodSucceeded:
		status = NodeOK
	case v1.PodPending:
		status = NodeWarn
	}

	log.Infof("Map Pod Status: %s => %s", phase, status)
	return status
}
