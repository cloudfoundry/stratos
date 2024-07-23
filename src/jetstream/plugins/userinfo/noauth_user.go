package userinfo

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
)

// NoAuthUserInfo is a plugin for no authentication
type NoAuthUserInfo struct {
	portalProxy api.PortalProxy
}

// InitNoAuthUserInfo creates a new no auth user info provider
func InitNoAuthUserInfo(portalProxy api.PortalProxy) Provider {
	return &NoAuthUserInfo{portalProxy: portalProxy}
}

// GetUserInfo gets info for the specified user
func (userInfo *NoAuthUserInfo) GetUserInfo(id string) (int, []byte, *http.Header, error) {

	uaaUser := &uaaUser{
		ID:       id,
		Origin:   "noauth",
		Username: api.DefaultAdminUserName,
	}

	emails := make([]uaaUserEmail, 0)
	uaaUser.Emails = emails

	uaaUser.Name.GivenName = "Admin"
	uaaUser.Name.FamilyName = "User"

	groups := make([]uaaUserGroup, 0)
	uaaUser.Groups = groups

	uaaUser.Meta.Version = 0

	jsonString, err := json.Marshal(uaaUser)
	if err != nil {
		return 500, nil, nil, err
	}

	return 200, jsonString, nil, nil
}

// UpdateUserInfo updates the user's info
func (userInfo *NoAuthUserInfo) UpdateUserInfo(profile *uaaUser) (int, error) {
	return 0, errors.New("Update not supported")
}

// UpdatePassword updates the user's password
func (userInfo *NoAuthUserInfo) UpdatePassword(id string, passwordInfo *passwordChangeInfo) (int, error) {
	return 0, errors.New("Update not supported")
}
