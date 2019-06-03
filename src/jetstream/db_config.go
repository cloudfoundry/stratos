package main

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/console_config"
	log "github.com/sirupsen/logrus"
)


func (p *portalProxy) GetConfigValue(group, name string) (string, error) {
	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Warn("Failed to connect to Database!")
		return "", err
	}
	value, ok, err := consoleRepo.GetValue(group, name)
	if err != nil || !ok {
		return "", err
	}

	return value, nil
}

func (p *portalProxy) DeleteConfigValue(group, name string) error {
	consoleRepo, err := console_config.NewPostgresConsoleConfigRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Warn("Failed to connect to Database!")
		return err
	}
	err = consoleRepo.DeleteValue(group, name)
	return err
}
