package console_config

import (
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

type Repository interface {
	GetConsoleConfig() (*interfaces.ConsoleConfig, error)
	DeleteConsoleConfig() error

	// Access to the config data
	GetValue(group, name string) (string, bool, error)
	SetValue(group, name, value string) error
	DeleteValue(group, name string) error
	GetValues(group string) (map[string]string, error)
}
