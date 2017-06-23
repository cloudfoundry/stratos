package interfaces

import (
	"net/http"

	"github.com/gorilla/sessions"
	"github.com/labstack/echo"
)

type PortalProxy interface {
	GetHttpClient(skipSSLValidation bool) http.Client
	RegisterEndpoint(c echo.Context, fetchInfo InfoFunc) error

	DoRegisterEndpoint(cnsiName string, apiEndpoint string, skipSSLValidation bool, fetchInfo InfoFunc) (CNSIRecord, error)

	GetEndpointTypeSpec(typeName string) (EndpointPlugin, error)
	GetSession(c echo.Context) (*sessions.Session, error)
	GetSessionValue(c echo.Context, key string) (interface{}, error)
	SaveSession(c echo.Context, session *sessions.Session) error

	RefreshToken(skipSSLValidation bool, cnsiGUID, userGUID, client, clientSecret, tokenEndpoint string) (t TokenRecord, err error)
	DoLoginToCNSI(c echo.Context, cnsiGUID string) (*LoginRes, error)
	// Expose internal portal proxy records to extensions
	GetCNSIRecord(guid string) (CNSIRecord, error)
	GetCNSITokenRecord(cnsiGUID string, userGUID string) (TokenRecord, bool)
	GetSessionStringValue(c echo.Context, key string) (string, error)
    GetCNSIUser(cnsiGUID string, userGUID string) (*ConnectedUser, bool)
	GetConfig() *PortalConfig

	GetClientId(cnsiType string) (string, error)
}
