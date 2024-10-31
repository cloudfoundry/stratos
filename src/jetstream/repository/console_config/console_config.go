package console_config

import (
	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

type Repository interface {
	GetConsoleConfig() (*api.ConsoleConfig, error)
	DeleteConsoleConfig() error

	// Access to the config data
	GetValue(group, name string) (string, bool, error)
	SetValue(group, name, value string) error
	DeleteValue(group, name string) error
	GetValues(group string) (map[string]string, error)
}
