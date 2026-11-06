package main

import (
	"errors"
	"log/slog"

	"github.com/google/uuid"
	"github.com/labstack/echo/v5"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	"github.com/cloudfoundry/stratos/src/jetstream/crypto"
	"github.com/cloudfoundry/stratos/src/jetstream/repository/localusers"
)

func (p *portalProxy) FindUserGUID(c *echo.Context) (string, error) {
	username := c.FormValue("username")

	if len(username) == 0 {
		return "", errors.New("needs username")
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		slog.Error("database error getting the repo for local users", "error", err)
		return "", err
	}

	guid, err := localUsersRepo.FindUserGUID(username)
	if err != nil {
		slog.Error("error finding the user GUID", "username", username, "error", err)
		return "", err
	}

	return guid, nil
}

func (p *portalProxy) AddLocalUser(c *echo.Context) (string, error) {
	slog.Debug("AddLocalUser")

	username := c.FormValue("username")
	password := c.FormValue("password")
	scope := c.FormValue("scope")
	email := c.FormValue("email")

	if len(username) == 0 || len(password) == 0 || len(scope) == 0 {
		return "", errors.New("needs username, password and scope")
	}

	//Generate a user GUID and hash the password
	userGUID := uuid.New().String()
	passwordHash, err := crypto.HashPassword(password)
	if err != nil {
		slog.Error("error hashing the user password", "username", username, "error", err)
		return "", err
	}

	localUsersRepo, err := localusers.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		slog.Error("database error getting the repo for local users", "error", err)
	} else {
		user := api.LocalUser{UserGUID: userGUID, PasswordHash: passwordHash, Username: username, Email: email, Scope: scope}
		err = localUsersRepo.AddLocalUser(user)
		if err != nil {
			slog.Error("error adding the local user", "user", userGUID, "username", username, "error", err)
			return "", err
		}
	}
	return userGUID, nil
}
