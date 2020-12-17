package kubernetes

import (
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

func (d *TokenStore) SaveAuthToken(userGUID string, tokenRecord interfaces.TokenRecord, encryptionKey []byte) error {
	return d.store.SaveAuthToken(userGUID, tokenRecord, encryptionKey)
}

func (d *TokenStore) FindCNSIToken(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {

	local, cfg, err := ListKubernetes()
	if err == nil {
		for _, cluster := range local {
			if cluster.GUID == cnsiGUID {
				user, ok := getKubeConfigUser(cfg, cluster)
				if ok {
					authInfo, err := getTokenFromAuthInfo(d.portalProxy, user)
					if err == nil {
						return *authInfo, err
					}
				}
			}
		}
	}

	return d.store.FindCNSIToken(cnsiGUID, userGUID, encryptionKey)
}

func (d *TokenStore) FindCNSITokenIncludeDisconnected(cnsiGUID string, userGUID string, encryptionKey []byte) (interfaces.TokenRecord, error) {

	token, err := d.FindCNSIToken(cnsiGUID, userGUID, encryptionKey)
	if err == nil {
		return token, err
	}

	return d.store.FindCNSITokenIncludeDisconnected(cnsiGUID, userGUID, encryptionKey)
}

func (d *TokenStore) FindAllCNSITokenBackup(cnsiGUID string, encryptionKey []byte) ([]interfaces.BackupTokenRecord, error) {
	return d.store.FindAllCNSITokenBackup(cnsiGUID, encryptionKey)
}

func (d *TokenStore) DeleteCNSIToken(cnsiGUID string, userGUID string) error {
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
	// if isLocalCloudFoundry(tokenRecord.TokenGUID) {
	// 	updates := make(map[string]string)
	// 	updates["AccessToken"] = fmt.Sprintf("bearer %s", tokenRecord.AuthToken)
	// 	updates["RefreshToken"] = tokenRecord.RefreshToken
	// 	return updateCFFIle(updates)
	// }
	return d.store.UpdateTokenAuth(userGUID, tokenRecord, encryptionKey)
}
