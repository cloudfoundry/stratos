package console_config

import (
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
)

type Repository interface {
	GetConsoleConfig() (*interfaces.ConsoleConfig, error)
	SaveConsoleConfig(config *interfaces.ConsoleConfig) error
	IsInitialised() (bool, error)
}
