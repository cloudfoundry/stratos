package userinfo

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/api"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
)

// LocalUserInfo is a plugin to fetch user info
type LocalUserInfo struct {
	portalProxy api.PortalProxy
}

// InitLocalUserInfo creates a new local user info provider
func InitLocalUserInfo(portalProxy api.PortalProxy) Provider {
	return &LocalUserInfo{portalProxy: portalProxy}
}

// GetUserInfo gets info for the specified user
func (userInfo *LocalUserInfo) GetUserInfo(id string) (int, []byte, *http.Header, error) {

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(userInfo.portalProxy.GetDatabaseConnection())
	if err != nil {
		return 500, nil, nil, err
	}

	user, err := localUsersRepo.FindUser(id)
	if err != nil {
		return 500, nil, nil, err
	}

	uaaUser := &uaaUser{
		ID:       id,
		Origin:   "local",
		Username: user.Username,
	}

	emails := make([]uaaUserEmail, 1)
	emails[0] = uaaUserEmail{Value: user.Email}
	uaaUser.Emails = emails

	uaaUser.Name.GivenName = user.GivenName
	uaaUser.Name.FamilyName = user.FamilyName

	groups := make([]uaaUserGroup, 2)
	groups[0] = uaaUserGroup{Display: user.Scope}
	groups[1] = uaaUserGroup{Display: "password.write"}
	uaaUser.Groups = groups

	uaaUser.Meta.Version = 0

	jsonString, err := json.Marshal(uaaUser)
	if err != nil {
		return 500, nil, nil, err
	}

	return 200, jsonString, nil, nil
}

// UpdateUserInfo updates the user's info
func (userInfo *LocalUserInfo) UpdateUserInfo(profile *uaaUser) (int, error) {

	// Fetch the user, make updates and save
	id := profile.ID
	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(userInfo.portalProxy.GetDatabaseConnection())
	if err != nil {
		return 500, err
	}

	user, err := localUsersRepo.FindUser(id)
	if err != nil {
		return 500, err
	}

	hash, err := localUsersRepo.FindPasswordHash(id)
	if err != nil {
		return 500, err
	}

	user.PasswordHash = hash

	if len(profile.Emails) == 1 {
		email := profile.Emails[0]
		if len(email.Value) > 0 {
			user.Email = email.Value
		}
	}

	user.GivenName = profile.Name.GivenName
	user.FamilyName = profile.Name.FamilyName

	err = localUsersRepo.UpdateLocalUser(user)
	if err != nil {
		return 500, err
	}

	return 200, nil
}

// UpdatePassword updates the user's password
func (userInfo *LocalUserInfo) UpdatePassword(id string, passwordInfo *passwordChangeInfo) (int, error) {

	// Fetch the user, make updates and save
	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(userInfo.portalProxy.GetDatabaseConnection())
	if err != nil {
		return 500, err
	}

	user, err := localUsersRepo.FindUser(id)
	if err != nil {
		return 500, err
	}

	hash, err := localUsersRepo.FindPasswordHash(id)
	if err != nil {
		return 500, err
	}

	// Check old password is correct
	err = bcrypt.CompareHashAndPassword(hash, []byte(passwordInfo.OldPassword))
	if err != nil {
		// Old password is incorrect
		return 500, api.NewHTTPShadowError(
			http.StatusBadRequest,
			"Current password is incorrect",
			"Current password is incorrect: %v", err,
		)
	}

	passwordHash, err := HashPassword(passwordInfo.NewPassword)
	if err != nil {
		return 500, err
	}

	user.PasswordHash = passwordHash

	err = localUsersRepo.UpdateLocalUser(user)
	if err != nil {
		return 500, err
	}
	return 200, nil
}

//HashPassword accepts a plaintext password string and generates a salted hash
func HashPassword(password string) ([]byte, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return bytes, err
}
