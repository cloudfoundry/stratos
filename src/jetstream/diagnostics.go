package main

import (
	"os/exec"
	"strings"

	log "github.com/sirupsen/logrus"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	goosedbversion "github.com/cloudfoundry/stratos/src/jetstream/repository/goose-db-version"
)

func (p *portalProxy) StoreDiagnostics() {

	diagnostics := &api.Diagnostics{}

	log.Info("Storing Diagnostics")

	// Git Client Version
	cmdName := "git"
	cmdArgs := []string{"version"}
	if cmdOut, err := exec.Command(cmdName, cmdArgs...).Output(); err == nil {
		diagnostics.GitClientVersion = strings.TrimPrefix(strings.TrimSpace(string(cmdOut)), "git version ")
	}

	if p.DatabaseConnectionPool != nil {
		dbVersionRepo, _ := goosedbversion.NewPostgresGooseDBVersionRepository(p.DatabaseConnectionPool)
		if versions, err := dbVersionRepo.List(); err == nil {
			diagnostics.DBMigrations = versions
		}
	}

	// Deployment information - when deployed via Helm

	diagnostics.HelmName = p.Env().String("HELM_NAME", "")
	diagnostics.HelmRevision = p.Env().String("HELM_REVISION", "")
	diagnostics.HelmChartVersion = p.Env().String("HELM_CHART_VERSION", "")
	diagnostics.HelmLastModified = p.Env().String("HELM_LAST_MODIFIED", "")

	// Deployment type
	switch {
	case len(diagnostics.HelmName) > 0:
		diagnostics.DeploymentType = "Kubernetes"
	case p.Config.IsCloudFoundry:
		diagnostics.DeploymentType = "Cloud Foundry"
	case len(p.Env().String("STRATOS_DEPLOYMENT_DOCKER", "")) > 0:
		diagnostics.DeploymentType = "Docker"
	case len(p.Env().String("STRATOS_DEPLOYMENT_DOCKER_AIO", "")) > 0:
		diagnostics.DeploymentType = "Docker All-in-One"
	default:
		diagnostics.DeploymentType = "Development"
	}

	diagnostics.DatabaseBackend = p.Config.DatabaseProviderName

	p.Diagnostics = diagnostics
}
