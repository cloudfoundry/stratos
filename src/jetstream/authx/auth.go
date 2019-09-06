package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/cnsis"

	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/localusers"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/tokens"

	"golang.org/x/crypto/bcrypt"
)


type Auth interface {

	Login(c echo.Context)
	Logout(c echo.Context)
	
}

func NewAuth(AuthEndpointType t, *portalProxy p) (*Auth, error) {
	switch t {
		case Local:
			auth := &LocalAuth{
				databaseConnectionPool : p.DatabaseConnectionPool
				localUserScope         : p.Config.ConsoleConfig.LocalUserScope
				p                      *portalProxyImpl
			}
		case Remote:
			auth := &UAAAuth{

			}
		case default:
			err := errors.New("Invalid auth endpoint type")
			return null, err

		return auth, nil
	}
}


//Init the auth service startup

Auth *authService
authService, err := NewAuth(authEndpointType, p)

portalProxy.AuthService, err := NewAuth(authEndpointType, portalProxy)