package desktop

import (
	"fmt"
	"strings"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
)

// TokenStore is a token store that combines local tokens with the usual database stored tokens
type TokenStore struct {
	portalProxy interfaces.PortalProxy
	store       interfaces.TokenRepository
}

func (d *TokenStore) FindAuthToken(userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	return d.store.FindAuthToken(userGUID, encryptionKey)
}

func (d *TokenStore) ListAuthToken(encryptionKey []byte) ([]interfaces.TokenRecord, error) {
	return d.store.ListAuthToken(encryptionKey)
}

func (d *TokenStore) SaveAuthToken(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error {
	return d.store.SaveAuthToken(userGUID, tokenRecord, encryptionKey)
}

func (d *TokenStore) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {

	// Main method that we need to override to get the token for the given endpoint
	local, err := ListCloudFoundry()
	if err == nil {
		if len(local) == 1 && local[0].GUID == cnsiGUID {
			cfg, _, err := readCFFile()
			if err == nil {
				u, err := d.portalProxy.GetUserTokenInfo(cfg.AccessToken)
				if err == nil {
					authToken := cfg.AccessToken
					if strings.HasPrefix(authToken, "bearer ") {
						authToken = authToken[7:]
					}
					return interfaces.TokenRecord{
						TokenGUID:      cnsiGUID,
						AuthToken:      authToken,
						RefreshToken:   cfg.RefreshToken,
						TokenExpiry:    u.TokenExpiry,
						Disconnected:   false,
						AuthType:       "OAuth2",
						Metadata:       "",
						SystemShared:   false,
						LinkedGUID:     "",
						Certificate:    "",
						CertificateKey: "",
					}, nil
				}
			}
		}
	}

	return d.store.FindCNSIToken(cnsiGUID, userGUID, encryptionKey)
}

func (d *TokenStore) FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {
	// Main method that we need to override to get the token for the given endpoint
	if IsLocalCloudFoundry(cnsiGUID) {
		return d.FindCNSIToken(cnsiGUID, userGUID, encryptionKey)
	}

	return d.store.FindCNSITokenIncludeDisconnected(cnsiGUID, userGUID, encryptionKey)
}

func (d *TokenStore) FindAllCNSITokenBackup(cnsiGUID string, encryptionKey []byte) ([]interfaces.BackupTokenRecord, error) {
	return d.store.FindAllCNSITokenBackup(cnsiGUID, encryptionKey)
}

func (d *TokenStore) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
	if IsLocalCloudFoundry(cnsiGUID) {
		updates := make(map[string]string)
		updates["AccessToken"] = ""
		updates["RefreshToken"] = ""
		return updateCFFIle(updates)
	}
	return d.store.DeleteCNSIToken(cnsiGUID, userGUID)
}

func (d *TokenStore) DeleteCNSITokens(cnsiGUID string) error {
	return d.store.DeleteCNSITokens(cnsiGUID)
}

func (d *TokenStore) SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error {
	return d.store.SaveCNSIToken(cnsiGUID, userGUID, tokenRecord, encryptionKey)
}

// UpdateTokenAuth will update a token's auth data
func (d *TokenStore) UpdateTokenAuth(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error {
	if IsLocalCloudFoundry(tokenRecord.TokenGUID) {
		updates := make(map[string]string)
		updates["AccessToken"] = fmt.Sprintf("bearer %s", tokenRecord.AuthToken)
		updates["RefreshToken"] = tokenRecord.RefreshToken
		return updateCFFIle(updates)
	}
	return d.store.UpdateTokenAuth(userGUID, tokenRecord, encryptionKey)
}
