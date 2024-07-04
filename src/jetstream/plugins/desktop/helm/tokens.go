package helm

import (
	"github.com/cloudfoundry-community/stratos/src/jetstream/api"
)

// TokenStore is a token store that combines local tokens with the usual database stored tokens
type TokenStore struct {
	portalProxy api.PortalProxy
	store       api.TokenRepository
}

func (d *TokenStore) FindAuthToken(userGUID string, encryptionKey []byte) (api.TokenRecord, error) {
	return d.store.FindAuthToken(userGUID, encryptionKey)
}

func (d *TokenStore) SaveAuthToken(userGUID string, tokenRecord api.TokenRecord, encryptionKey []byte) error {
	return d.store.SaveAuthToken(userGUID, tokenRecord, encryptionKey)
}

func (d *TokenStore) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (api.TokenRecord, error) {
	return d.store.FindCNSIToken(cnsiGUID, userGUID, encryptionKey)
}

func (d *TokenStore) FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (api.TokenRecord, error) {

	token, err := d.FindCNSIToken(cnsiGUID, userGUID, encryptionKey)
	if err == nil {
		return token, err
	}

	return d.store.FindCNSITokenIncludeDisconnected(cnsiGUID, userGUID, encryptionKey)
}

func (d *TokenStore) FindAllCNSITokenBackup(cnsiGUID string, encryptionKey []byte) ([]api.BackupTokenRecord, error) {
	return d.store.FindAllCNSITokenBackup(cnsiGUID, encryptionKey)
}

func (d *TokenStore) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
	return d.store.DeleteCNSIToken(cnsiGUID, userGUID)
}

func (d *TokenStore) DeleteCNSITokens(cnsiGUID string) error {
	return d.store.DeleteCNSITokens(cnsiGUID)
}

func (d *TokenStore) SaveCNSIToken(cnsiGUID string, userGUID string, tokenRecord api.TokenRecord, encryptionKey []byte) error {
	return d.store.SaveCNSIToken(cnsiGUID, userGUID, tokenRecord, encryptionKey)
}

// UpdateTokenAuth will update a token's auth data
func (d *TokenStore) UpdateTokenAuth(userGUID string, tokenRecord api.TokenRecord, encryptionKey []byte) error {
	// if isLocalCloudFoundry(tokenRecord.TokenGUID) {
	// 	updates := make(map[string]string)
	// 	updates["AccessToken"] = fmt.Sprintf("bearer %s", tokenRecord.AuthToken)
	// 	updates["RefreshToken"] = tokenRecord.RefreshToken
	// 	return updateCFFIle(updates)
	// }
	return d.store.UpdateTokenAuth(userGUID, tokenRecord, encryptionKey)
}
