package userinvite

import (
	"errors"
	"fmt"
	html "html/template"
	"path"
	text "text/template"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api/config"

	"github.com/govau/cf-common/env"
	log "github.com/sirupsen/logrus"
)

// SMTPConfig represents email configuration
type SMTPConfig struct {
	Auth        bool   `configName:"SMTP_AUTH"`
	FromAddress string `configName:"SMTP_FROM_ADDRESS"`
	Host        string `configName:"SMTP_HOST"`
	Password    string `configName:"SMTP_PASSWORD"`
	Port        int    `configName:"SMTP_PORT"`
	Username    string `configName:"SMTP_USER"`
	// Will always use TLS
	// UseTLS      bool   `configName:"SMTP_STARTTLS"`
}

// TemplateConfig configures the templates for sending emails
type TemplateConfig struct {
	TemplateDir       string `configName:"TEMPLATE_DIR"`
	HTMLTemplate      string `configName:"INVITE_USER_HTML_TEMPLATE"`
	PlainTextTemplate string `configName:"INVITE_USER_TEXT_TEMPLATE"`
	Subject           string `configName:"INVITE_USER_SUBJECT"`
}

// UAA Client details used to create uaa & cf user
type ClientConfig struct {
	ID     string `configName:"INVITE_USER_CLIENT_ID"`
	Secret string `configName:"INVITE_USER_CLIENT_SECRET"`
}

// Config represents the configuration required
type Config struct {
	SMTP              *SMTPConfig
	TemplateConfig    *TemplateConfig
	PlainTextTemplate *text.Template
	HTMLTemplate      *html.Template
	SubjectTemplate   *text.Template
	Client            *ClientConfig
}

const (
	defaultSMTPPort          = 25
	defaultHTMLTemplate      = "user-invite-email.html"
	defaultPlainTextTemplate = "user-invite-email.txt"
	defaultSubject           = "You have been invited to join a Cloud Foundry"
)

// LoadConfig loads the configuration for inviting users
func (userinvite *UserInvite) LoadConfig(env env.VarSet) (*Config, error) {

	c := &Config{}

	smtpConfig := &SMTPConfig{}
	if err := config.Load(smtpConfig, env.Lookup); err != nil {
		return c, fmt.Errorf("Unable to load SMTP configuration. %v", err)
	}

	templateConfig := &TemplateConfig{}
	if err := config.Load(templateConfig, env.Lookup); err != nil {
		return c, fmt.Errorf("Unable to load Template configuration. %v", err)
	}

	clientConfig := &ClientConfig{}
	if err := config.Load(clientConfig, env.Lookup); err != nil {
		return c, fmt.Errorf("Unable to load invite client configuration. %v", err)
	}

	c.SMTP = smtpConfig
	c.TemplateConfig = templateConfig
	c.Client = clientConfig

	if c.SMTP.Port == 0 {
		c.SMTP.Port = defaultSMTPPort
	}

	if len(c.TemplateConfig.Subject) == 0 {
		c.TemplateConfig.Subject = defaultSubject
	}

	return c, nil
}

// ValidateConfig will validate that enough configuration is available
func (userinvite *UserInvite) ValidateConfig(c *Config) error {

	if len(c.TemplateConfig.HTMLTemplate) == 0 {
		c.TemplateConfig.HTMLTemplate = defaultHTMLTemplate
	}

	if len(c.TemplateConfig.PlainTextTemplate) == 0 {
		c.TemplateConfig.PlainTextTemplate = defaultPlainTextTemplate
	}

	err := userinvite.loadTemplates(c)
	if err != nil {
		return err
	}

	// Check SMTP Configuration
	if len(c.SMTP.Host) == 0 {
		return errors.New("SMTP Server Host is not configured")
	}

	if len(c.SMTP.FromAddress) == 0 {
		return errors.New("SMTP From Address is not configured")
	}

	return nil
}

func (userinvite *UserInvite) loadTemplates(c *Config) error {

	var err error
	c.SubjectTemplate, err = text.New("subject").Parse(c.TemplateConfig.Subject)
	if err != nil {
		log.Warn("Could not parse template for User Invite Subject")
		log.Warn(err)
	}

	textFile := path.Join(c.TemplateConfig.TemplateDir, c.TemplateConfig.PlainTextTemplate)
	log.Debugf("Loading plain text email template from: %s", textFile)
	textTmpl, err := text.ParseFiles(textFile)
	if err != nil {
		log.Warn("User Invite failed to load Plain Text template")
		return err
	}
	c.PlainTextTemplate = textTmpl

	htmlFile := path.Join(c.TemplateConfig.TemplateDir, c.TemplateConfig.HTMLTemplate)
	log.Debugf("Loading HTML email template from: %s", htmlFile)
	htmlTmpl, err := html.ParseFiles(htmlFile)
	if err == nil {
		c.HTMLTemplate = htmlTmpl
	}

	return nil
}
