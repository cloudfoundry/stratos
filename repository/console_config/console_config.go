package console_config

import (
	"github.com/cloudfoundry-incubator/stratos/repository/interfaces"
)

type Repository interface {
	GetConsoleConfig() (*interfaces.ConsoleConfig, error)
	SaveConsoleConfig(config *interfaces.ConsoleConfig) error
	UpdateConsoleConfig(config *interfaces.ConsoleConfig) error
	IsInitialised() (bool, error)
}
