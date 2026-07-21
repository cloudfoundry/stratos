/* Gorilla Sessions backend for SQLite.

Copyright (c) 2013 Contributors. See the list of contributors in the CONTRIBUTORS file for details.

This software is licensed under a MIT style license available in the LICENSE file.

Vendored verbatim from github.com/nwmac/sqlitestore (unmaintained since 2018)
with one change: the blank `_ "github.com/mattn/go-sqlite3"` import was removed.
mattn/go-sqlite3 is cgo-only and became a runtime stub in the CGO_ENABLED=0
release binaries. The "sqlite3" driver is now registered by the pure-Go
ncruces/go-sqlite3 driver (see datastore.go); Stratos only ever calls
NewSqliteStoreFromConnection with the already-open *sql.DB, so no driver
import is needed here.
*/
package sqlitestore

import (
	"database/sql"
	"encoding/gob"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"
)

type SqliteStore struct {
	db         *sql.DB
	stmtInsert *sql.Stmt
	stmtDelete *sql.Stmt
	stmtUpdate *sql.Stmt
	stmtSelect *sql.Stmt

	Codecs  []securecookie.Codec
	Options *sessions.Options
	table   string
}

type sessionRow struct {
	id         string
	data       string
	createdOn  time.Time
	modifiedOn time.Time
	expiresOn  time.Time
}

func init() {
	gob.Register(time.Time{})
}

func NewSqliteStore(endpoint string, tableName string, path string, maxAge int, keyPairs ...[]byte) (*SqliteStore, error) {
	db, err := sql.Open("sqlite3", endpoint)
	if err != nil {
		return nil, err
	}

	return NewSqliteStoreFromConnection(db, tableName, path, maxAge, keyPairs...)
}

func NewSqliteStoreFromConnection(db *sql.DB, tableName string, path string, maxAge int, keyPairs ...[]byte) (*SqliteStore, error) {
	// Make sure table name is enclosed.
	tableName = "`" + strings.Trim(tableName, "`") + "`"

	cTableQ := "CREATE TABLE IF NOT EXISTS " +
		tableName + " (id INTEGER PRIMARY KEY, " +
		"session_data LONGBLOB, " +
		"created_on TIMESTAMP DEFAULT 0, " +
		"modified_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
		"expires_on TIMESTAMP DEFAULT 0);"
	if _, err := db.Exec(cTableQ); err != nil {
		return nil, err
	}

	insQ := "INSERT INTO " + tableName +
		"(id, session_data, created_on, modified_on, expires_on) VALUES (NULL, ?, ?, ?, ?)"
	stmtInsert, stmtErr := db.Prepare(insQ)
	if stmtErr != nil {
		return nil, stmtErr
	}

	delQ := "DELETE FROM " + tableName + " WHERE id = ?"
	stmtDelete, stmtErr := db.Prepare(delQ)
	if stmtErr != nil {
		return nil, stmtErr
	}

	updQ := "UPDATE " + tableName + " SET session_data = ?, created_on = ?, expires_on = ? " +
		"WHERE id = ?"
	stmtUpdate, stmtErr := db.Prepare(updQ)
	if stmtErr != nil {
		return nil, stmtErr
	}

	selQ := "SELECT id, session_data, created_on, modified_on, expires_on from " +
		tableName + " WHERE id = ?"
	stmtSelect, stmtErr := db.Prepare(selQ)
	if stmtErr != nil {
		return nil, stmtErr
	}

	return &SqliteStore{
		db:         db,
		stmtInsert: stmtInsert,
		stmtDelete: stmtDelete,
		stmtUpdate: stmtUpdate,
		stmtSelect: stmtSelect,
		Codecs:     securecookie.CodecsFromPairs(keyPairs...),
		Options: &sessions.Options{
			Path:   path,
			MaxAge: maxAge,
		},
		table: tableName,
	}, nil
}

func (m *SqliteStore) Close() {
	m.stmtSelect.Close()
	m.stmtUpdate.Close()
	m.stmtDelete.Close()
	m.stmtInsert.Close()
	m.db.Close()
}

func (m *SqliteStore) Get(r *http.Request, name string) (*sessions.Session, error) {
	return sessions.GetRegistry(r).Get(m, name)
}

func (m *SqliteStore) New(r *http.Request, name string) (*sessions.Session, error) {
	session := sessions.NewSession(m, name)
	session.Options = &sessions.Options{
		Domain:   m.Options.Domain,
		HttpOnly: m.Options.HttpOnly,
		MaxAge:   m.Options.MaxAge,
		Path:     m.Options.Path,
		Secure:   m.Options.Secure,
	}
	session.IsNew = true
	var err error
	if cook, errCookie := r.Cookie(name); errCookie == nil {
		err = securecookie.DecodeMulti(name, cook.Value, &session.ID, m.Codecs...)
		if err == nil {
			err = m.load(session)
			if err == nil {
				session.IsNew = false
			} else {
				err = nil
			}
		}
	}
	return session, err
}

func (m *SqliteStore) Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {
	var err error
	if session.ID == "" {
		if err = m.insert(session); err != nil {
			return err
		}
	} else if err = m.save(session); err != nil {
		return err
	}
	encoded, err := securecookie.EncodeMulti(session.Name(), session.ID, m.Codecs...)
	if err != nil {
		return err
	}
	// NOTE: Stratos serves the console over HTTPS and requires secure session
	// cookies (initSessionStore sets Options.Secure = true for every provider).
	// Set Secure on the emitted cookie directly so the guarantee is local to
	// the store and not dependent on the caller's configuration.
	cookie := sessions.NewCookie(session.Name(), encoded, session.Options)
	cookie.Secure = true
	http.SetCookie(w, cookie)
	return nil
}

func filterValues(values map[interface{}]interface{}) map[interface{}]interface{} {
	var filteredValues = make(map[interface{}]interface{})
	for k, v := range values {
		filteredValues[k] = v
	}

	delete(filteredValues, "created_on")
	delete(filteredValues, "expires_on")
	delete(filteredValues, "modified_on")
	return filteredValues
}

func (m *SqliteStore) insert(session *sessions.Session) error {
	var createdOn time.Time
	var modifiedOn time.Time
	var expiresOn time.Time
	crOn := session.Values["created_on"]
	if crOn == nil {
		createdOn = time.Now()
	} else {
		createdOn = crOn.(time.Time)
	}
	modifiedOn = createdOn
	exOn := session.Values["expires_on"]
	if exOn == nil {
		expiresOn = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
	} else {
		expiresOn = exOn.(time.Time)
	}
	encoded, encErr := securecookie.EncodeMulti(session.Name(), filterValues(session.Values), m.Codecs...)
	if encErr != nil {
		return encErr
	}
	res, insErr := m.stmtInsert.Exec(encoded, createdOn, modifiedOn, expiresOn)
	if insErr != nil {
		return insErr
	}
	lastInserted, lInsErr := res.LastInsertId()
	if lInsErr != nil {
		return lInsErr
	}
	session.ID = fmt.Sprintf("%d", lastInserted)
	return nil
}

func (m *SqliteStore) Delete(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {

	// Set cookie to expire.
	options := *session.Options
	options.MaxAge = -1
	// NOTE: keep the expiring cookie secure too — see Save above.
	cookie := sessions.NewCookie(session.Name(), "", &options)
	cookie.Secure = true
	http.SetCookie(w, cookie)
	// Clear session values.
	for k := range session.Values {
		delete(session.Values, k)
	}

	_, delErr := m.stmtDelete.Exec(session.ID)
	if delErr != nil {
		return delErr
	}
	return nil
}

func (m *SqliteStore) save(session *sessions.Session) error {
	if session.IsNew == true {
		return m.insert(session)
	}
	var createdOn time.Time
	var expiresOn time.Time
	crOn := session.Values["created_on"]
	if crOn == nil {
		createdOn = time.Now()
	} else {
		createdOn = crOn.(time.Time)
	}

	exOn := session.Values["expires_on"]
	if exOn == nil {
		expiresOn = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
		log.Print("nil")
	} else {
		expiresOn = exOn.(time.Time)
		if expiresOn.Sub(time.Now().Add(time.Second*time.Duration(session.Options.MaxAge))) < 0 {
			expiresOn = time.Now().Add(time.Second * time.Duration(session.Options.MaxAge))
		}
	}

	encoded, encErr := securecookie.EncodeMulti(session.Name(), filterValues(session.Values), m.Codecs...)
	if encErr != nil {
		return encErr
	}
	_, updErr := m.stmtUpdate.Exec(encoded, createdOn, expiresOn, session.ID)
	if updErr != nil {
		return updErr
	}
	return nil
}

func (m *SqliteStore) load(session *sessions.Session) error {
	row := m.stmtSelect.QueryRow(session.ID)
	sess := sessionRow{}
	scanErr := row.Scan(&sess.id, &sess.data, &sess.createdOn, &sess.modifiedOn, &sess.expiresOn)
	if scanErr != nil {
		return scanErr
	}
	if sess.expiresOn.Sub(time.Now()) < 0 {
		log.Printf("Session expired on %s, but it is %s now.", sess.expiresOn, time.Now())
		return errors.New("Session expired")
	}
	err := securecookie.DecodeMulti(session.Name(), sess.data, &session.Values, m.Codecs...)
	if err != nil {
		return err
	}
	session.Values["created_on"] = sess.createdOn
	session.Values["modified_on"] = sess.modifiedOn
	session.Values["expires_on"] = sess.expiresOn
	return nil

}
