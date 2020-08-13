package userinfo

import (
	"net/http"
)

// Provider manages user info for a provider
type Provider interface {
	GetUserInfo(id string) (int, []byte, *http.Header, error)
	UpdateUserInfo(*uaaUser) (int, error)
	UpdatePassword(id string, info *passwordChangeInfo) (int, error)
}

type uaaUserEmail struct {
	Value string `json:"value"`
}

type uaaUserName struct {
	FamilyName string `json:"familyName"`
	GivenName  string `json:"givenName"`
}

type uaaUserGroup struct {
	Display string `json:"display"`
}

type uaaUser struct {
	Raw      []byte
	ID       string         `json:"id"`
	Username string         `json:"userName"`
	Emails   []uaaUserEmail `json:"emails"`
	Name     uaaUserName    `json:"name"`
	Origin   string         `json:"origin"`
	Groups   []uaaUserGroup `json:"groups"`
	Meta     struct {
		Version int `json:"version"`
	} `json:"meta"`
}

type passwordChangeInfo struct {
	Raw         []byte
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"password"`
}
