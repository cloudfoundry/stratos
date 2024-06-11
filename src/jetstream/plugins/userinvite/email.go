package userinvite

import (
	"bytes"
	"errors"
	"fmt"
	"net/smtp"
	"strings"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
	"github.com/domodwyer/mailyak"
	log "github.com/sirupsen/logrus"
)

// EmailTemplateParams is the supported params for the email templates
type EmailTemplateParams struct {
	InviteLink   string
	EmailAddress string
	EndpointName string
	EndpointURL  string
}

// SendEmail sends an invitation email to a user using the configured templates
func (invite *UserInvite) SendEmail(emailAddress, inviteLink string, endpoint api.CNSIRecord) error {
	log.Debugf("User Invite: Sending Email to: %s", emailAddress)
	mailHost := fmt.Sprintf("%s:%d", invite.Config.SMTP.Host, invite.Config.SMTP.Port)

	var auth smtp.Auth
	var err error
	if len(invite.Config.SMTP.Username) > 0 {
		auth = smtp.PlainAuth("", invite.Config.SMTP.Username, invite.Config.SMTP.Password, invite.Config.SMTP.Host)
	}
	mail := mailyak.New(mailHost, auth)

	// Set From address
	if err = invite.setFromAddress(mail); err != nil {
		return err
	}

	// Render templates (Plain Text and/or HTML)
	params := &EmailTemplateParams{
		InviteLink:   inviteLink,
		EmailAddress: emailAddress,
		EndpointName: endpoint.Name,
		EndpointURL:  endpoint.APIEndpoint.String(),
	}

	var templates = 0
	if invite.Config.PlainTextTemplate != nil {
		err = invite.Config.PlainTextTemplate.Execute(mail.Plain(), params)
		if err != nil {
			return err
		}
		templates = templates + 1
	}

	if invite.Config.HTMLTemplate != nil {
		err = invite.Config.HTMLTemplate.Execute(mail.HTML(), params)
		if err != nil {
			return err
		}
		templates = templates + 1
	}

	// Need at least one template (Text or HTML) in order to send the email
	if templates == 0 {
		return errors.New("User Invite: Can not send invitation email - no templates configured")
	}

	mail.To(emailAddress)

	// Set Email Subject
	if invite.Config.SubjectTemplate != nil {
		subject := new(bytes.Buffer)
		err := invite.Config.SubjectTemplate.Execute(subject, params)
		if err == nil {
			mail.Subject(subject.String())
		} else {
			log.Warnf("User Invite: Failed to render the Subject template: %s", err.Error())
		}
	}

	return mail.Send()
}

func (invite *UserInvite) setFromAddress(mail *mailyak.MailYak) error {
	from := invite.Config.SMTP.FromAddress
	parts := strings.Split(from, "<")
	if len(parts) != 2 {
		mail.From(strings.TrimSpace(parts[0]))
	} else {
		if strings.HasSuffix(parts[1], ">") {
			fromEmail := parts[1]
			fromEmail = fromEmail[:len(fromEmail)-1]
			mail.From(strings.TrimSpace(fromEmail))
			mail.FromName("\"" + strings.TrimSpace(parts[0]) + "\"")
		} else {
			return errors.New("Can not parse From address: " + from)
		}
	}
	return nil
}
