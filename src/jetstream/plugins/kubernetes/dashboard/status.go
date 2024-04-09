package dashboard

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
)

const stratosServiceAccountSelector = "stratos-role%3Dkubernetes-dashboard-user"

// KubeDashboardStatus will determine if the specified Kube endpoint has the dashboard installed and ready
func KubeDashboardStatus(p api.PortalProxy, endpointGUID, userGUID string, includeToken bool) (*StatusResponse, error) {

	status := &StatusResponse{
		Endpoint:  endpointGUID,
		Installed: false,
		Running:   false,
		HasToken:  false,
		StratosInstalled: false,
	}

	pod, err := getKubeDashboardPod(p, endpointGUID, userGUID, "app%3Dkubernetes-dashboard")
	if err != nil {
		pod, err = getKubeDashboardPod(p, endpointGUID, userGUID, "k8s-app%3Dkubernetes-dashboard")
	}

	status.Pod = pod
	if err == nil {
		status.Installed = true
		status.Running = (pod.Status.Phase == "Running")

		// Get the image name
		if len(pod.Spec.Containers) == 1 {
			status.Version = pod.Spec.Containers[0].Image
		}
	}

	svc, err := getKubeDashboardServiceInfo(p, endpointGUID, userGUID)
	if err == nil {
		status.Service = &svc
		status.StratosInstalled = svc.StratosInstalled
	}

	svcAccount, err := getKubeDashboardServiceAccount(p, endpointGUID, userGUID, stratosServiceAccountSelector)
	status.ServiceAccont = svcAccount
	if err == nil && includeToken {
		token, err := getKubeDashboardSecretToken(p, endpointGUID, userGUID, svcAccount)
		if err == nil {
			status.HasToken = true
			status.Token = token
		}
	}

	return status, nil
}
