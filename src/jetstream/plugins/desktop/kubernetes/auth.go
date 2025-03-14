package kubernetes

import (
	"errors"
	"io/ioutil"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes/auth"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
)

func getTokenFromAuthInfo(jetstream api.PortalProxy, authInfo *clientcmdapi.AuthInfo) (*api.TokenRecord, error) {

	if len(authInfo.ClientCertificateData) > 0 && len(authInfo.ClientKeyData) > 0 {
		return getTokenFromCert(jetstream, authInfo)
	}

	if len(authInfo.ClientCertificate) > 0 && len(authInfo.ClientKey) > 0 {
		return getTokenFromCertFiles(jetstream, authInfo)
	}

	return nil, errors.New("Can not handle this type of auth")

}

func getTokenFromCert(jetstream api.PortalProxy, authInfo *clientcmdapi.AuthInfo) (*api.TokenRecord, error) {

	kubeCertAuth := auth.KubeCertificate{
		Certificate:    string(authInfo.ClientCertificateData),
		CertificateKey: string(authInfo.ClientKeyData),
	}

	return handleCert(jetstream, kubeCertAuth)
}

func getTokenFromCertFiles(jetstream api.PortalProxy, authInfo *clientcmdapi.AuthInfo) (*api.TokenRecord, error) {

	cert, err := ioutil.ReadFile(authInfo.ClientCertificate)
	if err != nil {
		return nil, err
	}

	key, err := ioutil.ReadFile(authInfo.ClientKey)
	if err != nil {
		return nil, err
	}

	kubeCertAuth := auth.KubeCertificate{
		Certificate:    string(cert),
		CertificateKey: string(key),
	}

	return handleCert(jetstream, kubeCertAuth)
}

func handleCert(jetstream api.PortalProxy, kubeCertAuth auth.KubeCertificate) (*api.TokenRecord, error) {

	jsonString, err := kubeCertAuth.GetJSON()
	if err != nil {
		return nil, err
	}

	// Refresh token isn't required since the AccessToken will never expire
	refreshToken := jsonString
	accessToken := jsonString

	// Tokens lasts forever
	expiry := time.Now().Local().Add(time.Hour * time.Duration(100000))
	disconnected := false
	tokenRecord := jetstream.InitEndpointTokenRecord(expiry.Unix(), accessToken, refreshToken, disconnected)

	// TODO: Export
	tokenRecord.AuthType = "kube-cert-auth"
	return &tokenRecord, nil
}

// kubeCertAuth.Certificate = string(cert)
// kubeCertAuth.
// return kubeCertAuth, nil

// }

// func (c *CertKubeAuth) FetchToken(cnsiRecord api.CNSIRecord, ec echo.Context) (*api.TokenRecord, *api.CNSIRecord, error) {
// log.Debug("Kube Certs - FetchToken")

// kubeCertAuth, err := c.extractCerts(ec)
// if err != nil {
// 	return nil, nil, errors.New("Unable to find required certificate and certificate key")
// }

// }
