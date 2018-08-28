package main

import (
	"os/exec"
	"strings"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/config"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/goose-db-version"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

func (p *portalProxy) StoreDiagnostics() {

	diagnostics := &interfaces.Diagnostics{}

	log.Info("Storing Diagnostics")

	// Git Client Version
	cmdName := "git"
	cmdArgs := []string{"version"}
	if cmdOut, err := exec.Command(cmdName, cmdArgs...).Output(); err == nil {
		diagnostics.GitClientVersion = strings.TrimSpace(string(cmdOut))
		if strings.HasPrefix(diagnostics.GitClientVersion, "git version ") {
			diagnostics.GitClientVersion = diagnostics.GitClientVersion[12:]
		}
	}

	if p.DatabaseConnectionPool != nil {
		dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(p.DatabaseConnectionPool)
		if versions, err := dbVersionRepo.List(); err == nil {
			diagnostics.DBMigrations = versions
		}
	}

	// Deployment information - when deployed via Helm
	diagnostics.HelmName = config.GetString("HELM_NAME")
	diagnostics.HelmRevision = config.GetString("HELM_REVISION")
	diagnostics.HelmChartVersion = config.GetString("HELM_CHART_VERSION")
	diagnostics.HelmLastModified = config.GetString("HELM_LAST_MODIFIED")

	// Deployment type
	switch {
	case len(diagnostics.HelmName) > 0:
		diagnostics.DeploymentType = "Kubernetes"
	case p.Config.IsCloudFoundry:
		diagnostics.DeploymentType = "Cloud Foundry"
	case len(config.GetString("STRATOS_DEPLOYMENT_DOCKER")) > 0:
		diagnostics.DeploymentType = "Docker"
	case len(config.GetString("STRATOS_DEPLOYMENT_DOCKER_AIO")) > 0:
		diagnostics.DeploymentType = "Docker All-in-One"
	default:
		diagnostics.DeploymentType = "Development"
	}

	diagnostics.DatabaseBackend = p.Config.DatabaseProviderName

	p.Diagnostics = diagnostics
}
