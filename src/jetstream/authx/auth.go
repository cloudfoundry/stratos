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


type AuthInterface interface {

	Login() error
	Logout() error

	ConnectOAuth2(c echo.Context, cnsiRecord CNSIRecord) (*TokenRecord, error)
	InitEndpointTokenRecord(expiry int64, authTok string, refreshTok string, disconnect bool) TokenRecord

	RefreshOAuthToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t TokenRecord, err error)
	DoLoginToCNSI(c echo.Context, cnsiGUID string, systemSharedToken bool) (*LoginRes, error)
	DoLoginToCNSIwithConsoleUAAtoken(c echo.Context, theCNSIrecord CNSIRecord) error

	// UAA Token
	GetUAATokenRecord(userGUID string) (TokenRecord, error)
	RefreshUAAToken(userGUID string) (TokenRecord, error)

	GetUsername(userid string) (string, error)
	RefreshUAALogin(username, password string, store bool) error
	GetUserTokenInfo(tok string) (u *JWTUserTokenInfo, err error)
	GetUAAUser(userGUID string) (*ConnectedUser, error)

	// Tokens - lower-level access
	SaveEndpointToken(cnsiGUID string, userGUID string, tokenRecord TokenRecord) error
	DeleteEndpointToken(cnsiGUID string, userGUID string) error
}

type AuthImpl {
	AuthProviders          			map[string]interfaces.AuthProvider
	SSOLogin                        bool     `configName:"SSO_LOGIN"`
	SSOOptions                      string   `configName:"SSO_OPTIONS"`
	AuthEndpointType                string   `configName:"AUTH_ENDPOINT_TYPE"`
}

func NewAuthService(AuthEndpointType t) (*Auth, error) {
	switch t {
		case Local:
			auth := &LocalAuth{
				
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