package cnsis

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"

	"github.com/cloudfoundry-incubator/stratos/src/jetstream/datastore"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/crypto"
	"github.com/cloudfoundry-incubator/stratos/src/jetstream/repository/interfaces"
	log "github.com/sirupsen/logrus"
)

var listCNSIs = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, client_id, client_secret, sso_allowed
							FROM cnsis`

var listCNSIsByUser = `SELECT c.guid, c.name, c.cnsi_type, c.api_endpoint, c.doppler_logging_endpoint, t.user_guid, t.token_expiry, c.skip_ssl_validation, t.disconnected, t.meta_data
										FROM cnsis c, tokens t
										WHERE c.guid = t.cnsi_guid AND t.token_type=$1 AND t.user_guid=$2 AND t.disconnected = '0'`

var findCNSI = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, client_id, client_secret, sso_allowed
						FROM cnsis
						WHERE guid=$1`

var findCNSIByAPIEndpoint = `SELECT guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, client_id, client_secret, sso_allowed
						FROM cnsis
						WHERE api_endpoint=$1`

var saveCNSI = `INSERT INTO cnsis (guid, name, cnsi_type, api_endpoint, auth_endpoint, token_endpoint, doppler_logging_endpoint, skip_ssl_validation, client_id, client_secret, sso_allowed)
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

var deleteCNSI = `DELETE FROM cnsis WHERE guid = $1`

// Just update the SSO Allowed state for now
var updateCNSI = `UPDATE cnsis SET sso_allowed = $1 WHERE guid = $2`

// PostgresCNSIRepository is a PostgreSQL-backed CNSI repository
type PostgresCNSIRepository struct {
	db *sql.DB
}

// NewPostgresCNSIRepository will create a new instance of the PostgresCNSIRepository
func NewPostgresCNSIRepository(dcp *sql.DB) (Repository, error) {
	return &PostgresCNSIRepository{db: dcp}, nil
}

// InitRepositoryProvider - One time init for the given DB Provider
func InitRepositoryProvider(databaseProvider string) {
	// Modify the database statements if needed, for the given database type
	listCNSIs = datastore.ModifySQLStatement(listCNSIs, databaseProvider)
	listCNSIsByUser = datastore.ModifySQLStatement(listCNSIsByUser, databaseProvider)
	findCNSI = datastore.ModifySQLStatement(findCNSI, databaseProvider)
	findCNSIByAPIEndpoint = datastore.ModifySQLStatement(findCNSIByAPIEndpoint, databaseProvider)
	saveCNSI = datastore.ModifySQLStatement(saveCNSI, databaseProvider)
	deleteCNSI = datastore.ModifySQLStatement(deleteCNSI, databaseProvider)
	updateCNSI = datastore.ModifySQLStatement(updateCNSI, databaseProvider)
}

// List - Returns a list of CNSI Records
func (p *PostgresCNSIRepository) List(encryptionKey []byte) ([]*interfaces.CNSIRecord, error) {
	log.Debug("List")
	rows, err := p.db.Query(listCNSIs)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}
	defer rows.Close()

	var cnsiList []*interfaces.CNSIRecord
	cnsiList = make([]*interfaces.CNSIRecord, 0)

	for rows.Next() {
		var (
			pCNSIType              string
			pURL                   string
			cipherTextClientSecret []byte
		)

		cnsi := new(interfaces.CNSIRecord)

		err := rows.Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL, &cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint, &cnsi.DopplerLoggingEndpoint, &cnsi.SkipSSLValidation, &cnsi.ClientId, &cipherTextClientSecret, &cnsi.SSOAllowed)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan CNSI records: %v", err)
		}

		cnsi.CNSIType = pCNSIType

		if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
			return nil, fmt.Errorf("Unable to parse API Endpoint: %v", err)
		}

		if len(cipherTextClientSecret) > 0 {
			plaintextClientSecret, err := crypto.DecryptToken(encryptionKey, cipherTextClientSecret)
			if err != nil {
				return nil, err
			}
			cnsi.ClientSecret = plaintextClientSecret
		} else {
			// Empty secret means there was none, so set the plain text to an empty string
			cnsi.ClientSecret = ""
		}

		cnsiList = append(cnsiList, cnsi)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List CNSI records: %v", err)
	}

	// rows.Close()

	return cnsiList, nil
}

// ListByUser - Returns a list of CNSIs registered by a user
func (p *PostgresCNSIRepository) ListByUser(userGUID string) ([]*interfaces.ConnectedEndpoint, error) {
	log.Debug("ListByUser")
	rows, err := p.db.Query(listCNSIsByUser, "cnsi", userGUID)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve CNSI records: %v", err)
	}
	defer rows.Close()

	var clusterList []*interfaces.ConnectedEndpoint
	clusterList = make([]*interfaces.ConnectedEndpoint, 0)

	for rows.Next() {
		var (
			pCNSIType    string
			pURL         string
			disconnected bool
		)

		cluster := new(interfaces.ConnectedEndpoint)
		err := rows.Scan(&cluster.GUID, &cluster.Name, &pCNSIType, &pURL, &cluster.DopplerLoggingEndpoint, &cluster.Account, &cluster.TokenExpiry, &cluster.SkipSSLValidation, &disconnected, &cluster.TokenMetadata)
		if err != nil {
			return nil, fmt.Errorf("Unable to scan cluster records: %v", err)
		}

		cluster.CNSIType = pCNSIType

		if cluster.APIEndpoint, err = url.Parse(pURL); err != nil {
			return nil, fmt.Errorf("Unable to parse API Endpoint: %v", err)
		}

		// rows.Close()

		clusterList = append(clusterList, cluster)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("Unable to List cluster records: %v", err)
	}

	return clusterList, nil
}

// Find - Returns a single CNSI Record
func (p *PostgresCNSIRepository) Find(guid string, encryptionKey []byte) (interfaces.CNSIRecord, error) {
	log.Debug("Find")
	return p.findBy(findCNSI, guid, encryptionKey)
}

// FindByAPIEndpoint - Returns a single CNSI Record
func (p *PostgresCNSIRepository) FindByAPIEndpoint(endpoint string, encryptionKey []byte) (interfaces.CNSIRecord, error) {
	log.Debug("FindByAPIEndpoint")
	return p.findBy(findCNSIByAPIEndpoint, endpoint, encryptionKey)
}

// FindBy - Returns a single CNSI Record found using the given query looking for match
func (p *PostgresCNSIRepository) findBy(query, match string, encryptionKey []byte) (interfaces.CNSIRecord, error) {
	var (
		pCNSIType              string
		pURL                   string
		cipherTextClientSecret []byte
	)

	cnsi := new(interfaces.CNSIRecord)

	err := p.db.QueryRow(query, match).Scan(&cnsi.GUID, &cnsi.Name, &pCNSIType, &pURL,
		&cnsi.AuthorizationEndpoint, &cnsi.TokenEndpoint, &cnsi.DopplerLoggingEndpoint, &cnsi.SkipSSLValidation, &cnsi.ClientId, &cipherTextClientSecret, &cnsi.SSOAllowed)

	switch {
	case err == sql.ErrNoRows:
		return interfaces.CNSIRecord{}, errors.New("No match for that Endpoint")
	case err != nil:
		return interfaces.CNSIRecord{}, fmt.Errorf("Error trying to Find CNSI record: %v", err)
	default:
		// do nothing
	}

	cnsi.CNSIType = pCNSIType

	if cnsi.APIEndpoint, err = url.Parse(pURL); err != nil {
		return interfaces.CNSIRecord{}, fmt.Errorf("Unable to parse API Endpoint: %v", err)
	}

	if len(cipherTextClientSecret) > 0 {
		plaintextClientSecret, err := crypto.DecryptToken(encryptionKey, cipherTextClientSecret)
		if err != nil {
			return interfaces.CNSIRecord{}, err
		}
		cnsi.ClientSecret = plaintextClientSecret
	} else {
		// Empty secret means there was none, so set the plain text to an empty string
		cnsi.ClientSecret = ""
	}

	return *cnsi, nil
}

// Save will persist a CNSI Record to a datastore
func (p *PostgresCNSIRepository) Save(guid string, cnsi interfaces.CNSIRecord, encryptionKey []byte) error {
	log.Debug("Save")
	cipherTextClientSecret, err := crypto.EncryptToken(encryptionKey, cnsi.ClientSecret)
	if err != nil {
		return err
	}
	if _, err := p.db.Exec(saveCNSI, guid, cnsi.Name, fmt.Sprintf("%s", cnsi.CNSIType),
		fmt.Sprintf("%s", cnsi.APIEndpoint), cnsi.AuthorizationEndpoint, cnsi.TokenEndpoint, cnsi.DopplerLoggingEndpoint, cnsi.SkipSSLValidation,
		cnsi.ClientId, cipherTextClientSecret, cnsi.SSOAllowed); err != nil {
		return fmt.Errorf("Unable to Save CNSI record: %v", err)
	}

	return nil
}

// Delete will delete a CNSI Record from the datastore
func (p *PostgresCNSIRepository) Delete(guid string) error {
	log.Debug("Delete")
	if _, err := p.db.Exec(deleteCNSI, guid); err != nil {
		return fmt.Errorf("Unable to Delete CNSI record: %v", err)
	}

	return nil
}

// UpdateCNSI - Update an endpoint's SSO permitted state
func (p *PostgresCNSIRepository) Update(guid string, ssoAllowed bool) error {
	log.Debug("UpdateCNSI")

	if guid == "" {
		msg := "Unable to update Endpoint without a valid guid."
		log.Debug(msg)
		return errors.New(msg)
	}

	var err error

	result, err := p.db.Exec(updateCNSI, ssoAllowed, guid)
	if err != nil {
		msg := "Unable to UPDATE endpoint: %v"
		log.Debugf(msg, err)
		return fmt.Errorf(msg, err)
	}

	rowsUpdates, err := result.RowsAffected()
	if err != nil {
		return errors.New("Unable to UPDATE endpoint: could not determine number of rows that were updated")
	}

	if rowsUpdates < 1 {
		return errors.New("Unable to UPDATE endpoint: no rows were updated")
	}

	if rowsUpdates > 1 {
		log.Warn("UPDATE endpoint: More than 1 row was updated (expected only 1)")
	}

	log.Debug("Endpoint UPDATE complete")

	return nil
}
