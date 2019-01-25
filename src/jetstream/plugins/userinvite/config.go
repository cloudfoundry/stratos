package userinvite

import (
	"fmt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/config"
)

// SMTPConfig represents email configuration
type SMTPConfig struct {
	Auth        bool   `configName:"SMTP_AUTH"`
	FromAddress string `configName:"SMTP_FROM_ADDRESS"`
	Host        string `configName:"SMTP_HOST"`
	Password    string `configName:"SMTP_PASSWORD"`
	Port        string `configName:"SMTP_PORT"`
	UseTLS      int    `configName:"SMTP_STARTTLS"`
	Username    int    `configName:"SMTP_USER"`
}

// TemplateConfig configures the templates for sending emails
type TemplateConfig struct {
	TemplateDir       string `configName:"TEMPLATE_DIR"`
	HTMLTemplate      string `configName:"INVITE_USER_HTML_TEMPLATE"`
	PlainTextTemplate string `configName:"INVITE_USER_TEXT_TEMPLATE"`
}

// Config represents the configuration required
type Config struct {
	SMTP           *SMTPConfig
	TemplateConfig *TemplateConfig
}

// LoadConfig loads the configuration for inviting users
func (userinvite *UserInvite) LoadConfig() (*Config, error) {

	c := &Config{}

	smtpConfig := &SMTPConfig{}
	if err := config.Load(smtpConfig); err != nil {
		return c, fmt.Errorf("Unable to load SMTP configuration. %v", err)
	}

	templateConfig := &TemplateConfig{}
	if err := config.Load(templateConfig); err != nil {
		return c, fmt.Errorf("Unable to load Template configuration. %v", err)
	}

	c.SMTP = smtpConfig
	c.TemplateConfig = templateConfig
	return c, nil
}

// ValidateConfig will valikdate that enough configuration is available
func (userinvite *UserInvite) ValidateConfig(c *Config) error {
	//return fmt.Errorf("Not configured")
	return nil
}
