package main

import (
	"errors"

	"github.com/labstack/echo"

	uuid "github.com/satori/go.uuid"
	log "github.com/sirupsen/logrus"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/local_users"
)

func (p *portalProxy) AddLocalUser(c echo.Context) (string, error) {
	log.Debug("AddLocalUser")

	username := c.FormValue("username")
	password := c.FormValue("password")
	scope    := c.FormValue("scope")
	email    := c.FormValue("email")

	if len(username) == 0 || len(password) == 0 || len(scope) == 0 {
		return "", errors.New("Needs username, password and scope")
	}
	
	localUsersRepo, err := local_users.NewPgsqlLocalUsersRepository(p.DatabaseConnectionPool)
	if err != nil {
		log.Errorf("Database error getting repo for local users: %v", err)
		return "", err
	}


	//Hash the password
	passwordHash, err := p.HashPassword(password)
	if err != nil {
		log.Errorf("Error hashing user password: %v", err)
		return "", err
	}
	log.Infof("Generated password hash: %s", passwordHash)
	//generate a user GUID
	userGUID := uuid.NewV4().String()


	err = localUsersRepo.AddLocalUser(userGUID, passwordHash, username, email, scope)
	if err != nil {
		log.Errorf("Error adding local user %v", err)
		return "", err
	}

	return userGUID, nil
}