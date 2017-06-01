package main

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	log "github.com/Sirupsen/logrus"
)

// This is a one-off migration of VCS entries from Connected Code Engine endpoints
// Note: the code is kept separate and fairly standalone here so as not to pollute the rest with odd methods

// Join tokens and cnsis tables to retrieve Users Ids with Code Engine tokens
const listCodeEngineTokens = `SELECT t.user_guid, c.guid
                              FROM tokens t, cnsis c
                              WHERE t.cnsi_guid = c.guid AND c.cnsi_type = 'hce' AND t.token_type = 'cnsi'`

type CodeEngineConnection struct {
	UserId   string
	CnsiGuid string
}

// getConnectedCodeEngines - Query the DB to build a map of HCE guid to connected users' guid
func getConnectedCodeEngines(dcp *sql.DB) (map[string][]string, error) {

	rows, err := dcp.Query(listCodeEngineTokens)
	if err != nil {
		return nil, fmt.Errorf("Unable to retrieve Code Engine Tokens: %v", err)
	}
	defer rows.Close()

	if err = rows.Err(); err != nil {
		msg := "Unable to retrieve Code Engine Tokens: %v"
		log.Errorf(msg, err)
		return nil, fmt.Errorf(msg, err)
	}

	var codeEngineConnections []*CodeEngineConnection
	codeEngineConnections = make([]*CodeEngineConnection, 0)

	for rows.Next() {
		var (
			userId   string
			cnsiGuid string
		)

		err := rows.Scan(&userId, &cnsiGuid)
		if err != nil {
			log.Warnf("Unable to scan token record: %v - Skipping row", err)
			continue
		}

		codeEngineConnections = append(codeEngineConnections, &CodeEngineConnection{userId, cnsiGuid})
	}

	// For each unique Code Engine record, build an array of IDs for the connected users
	codeEngineTokens := make(map[string][]string)
	for _, cec := range codeEngineConnections {
		codeEngineTokens[cec.CnsiGuid] = append(codeEngineTokens[cec.CnsiGuid], cec.UserId)
	}

	return codeEngineTokens, nil
}

// migrateVcsFromCodeEngine - one-time auto register of VCS endpoints from connected Code Engines
func migrateVcsFromCodeEngine(p *portalProxy) error {

	migrationMarkerDir := "/hsc-upgrade-volume"
	if _, err := os.Stat(migrationMarkerDir); err != nil {
		migrationMarkerDir = "."
	}

	// Check we need to migrate
	migrationMarker := migrationMarkerDir + "/.vcs-migrated"
	if _, err := os.Stat(migrationMarker); err == nil {
		// Already migrated, nothing to do
		return nil
	}

	log.Infof("Migrating VCSes...")

	// Wait for the upgrade lock file to disappear
	upgradeLock := "/hsc-upgrade-volume/upgrade.lock"
	_, err := os.Stat(upgradeLock)
	if err == nil {
		log.Infof("Waiting for upgrade to complete...")
	}
	for err == nil {
		time.Sleep(1 * time.Second)
		_, err = os.Stat(upgradeLock)
	}

	log.Infof("Upgrade completed, proceeding")
	ceConnectedUsers, err := getConnectedCodeEngines(p.DatabaseConnectionPool)
	if err != nil {
		msg := "Unable to retrieve Code Engine connected users: %v"
		return fmt.Errorf(msg, err)
	}

	log.Infof("Migrating VCSes from %d Code Engine record(s)...", len(ceConnectedUsers))

	// Attempt to use each connection to talk to HCE until we find one that works
	for cnsiGuid, connections := range ceConnectedUsers {
		log.Infof("Auto-register VCSes from %s", cnsiGuid)
		for _, userId := range connections {
			log.Infof("Using connection from user %s to %s...", userId, cnsiGuid)
			err = p.autoRegisterCodeEngineVcs(userId, cnsiGuid)
			if err == nil {
				break
			}
			log.Warnf("Failed to import VCSes register using this connection %v", err)
		}
	}

	// Create the marker file
	_, err = os.Create(migrationMarker)
	if err != nil {
		msg := "Unable to create VCSes migration marker file: %v"
		log.Warnf(msg, err)
		return fmt.Errorf(msg, err)
	}

	log.Info("VCS migration completed")

	return nil
}
