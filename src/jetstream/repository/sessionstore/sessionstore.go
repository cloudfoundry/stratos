// Package sessionstore is the single Gorilla session store for all three
// database providers (GH #5733). It replaces antonlindstrom/pgstore, the
// 2017 cf-stratos/mysqlstore fork and the vendored sqlitestore with one
// implementation over the shared *sql.DB, using the same ModifySQLStatement
// dialect handling as the rest of jetstream.
//
// The sessions table is created by migration 20260808120000, not here, and
// is named "sessions" on every provider. The primary key stays an integer:
// api.SessionDataStore.IsValidSession takes an int, session_data joins via
// CAST(id AS varchar), and the Kubernetes terminal round-trips the id
// through a pod annotation with strconv.Atoi. A future move to a
// non-sequential session id replaces lastInsertedID/session.ID handling
// here plus those three call sites, and nothing else.
package sessionstore

import (
	"database/sql"
	"encoding/gob"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/securecookie"
	"github.com/gorilla/sessions"

	"github.com/cloudfoundry/stratos/src/jetstream/datastore"
)

func init() {
	gob.Register(time.Time{})
}

// timestampKeys are mirrored into session.Values from the table columns on
// load (handleSessionExpiryHeader reads "expires_on") and filtered back out
// before encoding, so they are stored once, in the columns.
var timestampKeys = []string{"created_on", "modified_on", "expires_on"}

// Store implements gorilla/sessions.Store plus the Cleanup lifecycle the
// jetstream HttpSessionStore interface expects.
type Store struct {
	db       *sql.DB
	provider string

	stmtInsert  string
	stmtUpdate  string
	stmtSelect  string
	stmtDelete  string
	stmtExpired string

	Codecs  []securecookie.Codec
	Options *sessions.Options
}

// New creates a session store on the already-open connection pool. The pool
// stays owned by the caller — Close on the store does not close it.
func New(db *sql.DB, databaseProvider string, path string, maxAge int, keyPairs ...[]byte) (*Store, error) {
	if db == nil {
		return nil, errors.New("sessionstore: nil database connection")
	}
	mod := func(stmt string) string { return datastore.ModifySQLStatement(stmt, databaseProvider) }
	return &Store{
		db:          db,
		provider:    databaseProvider,
		stmtInsert:  mod(`INSERT INTO sessions (session_data, created_on, modified_on, expires_on) VALUES ($1, $2, $3, $4)`),
		stmtUpdate:  mod(`UPDATE sessions SET session_data = $1, modified_on = $2, expires_on = $3 WHERE id = $4`),
		stmtSelect:  mod(`SELECT session_data, created_on, modified_on, expires_on FROM sessions WHERE id = $1`),
		stmtDelete:  mod(`DELETE FROM sessions WHERE id = $1`),
		stmtExpired: mod(`DELETE FROM sessions WHERE expires_on < $1`),
		Codecs:      securecookie.CodecsFromPairs(keyPairs...),
		Options: &sessions.Options{
			Path:   path,
			MaxAge: maxAge,
		},
	}, nil
}

// Get returns a session from the request registry, caching it per request.
func (s *Store) Get(r *http.Request, name string) (*sessions.Session, error) {
	return sessions.GetRegistry(r).Get(s, name)
}

// New returns a session for the request: the stored one when the cookie
// decodes and the row is live, a fresh one otherwise.
func (s *Store) New(r *http.Request, name string) (*sessions.Session, error) {
	session := sessions.NewSession(s, name)
	opts := *s.Options
	session.Options = &opts
	session.IsNew = true

	cookie, err := r.Cookie(name)
	if err != nil {
		return session, nil
	}
	if err := securecookie.DecodeMulti(name, cookie.Value, &session.ID, s.Codecs...); err != nil {
		return session, nil
	}
	if err := s.load(session); err == nil {
		session.IsNew = false
	}
	return session, nil
}

// Save persists the session and writes the cookie. A negative MaxAge
// destroys the session: row deleted, cookie expired — the pgstore contract
// clearSession (logout) relies on; the old MySQL and SQLite stores left the
// row valid until natural expiry.
func (s *Store) Save(r *http.Request, w http.ResponseWriter, session *sessions.Session) error {
	if session.Options.MaxAge < 0 {
		if session.ID != "" {
			if _, err := s.db.Exec(s.stmtDelete, session.ID); err != nil {
				return fmt.Errorf("sessionstore: unable to delete session: %v", err)
			}
		}
		for k := range session.Values {
			delete(session.Values, k)
		}
		s.setCookie(w, session, "")
		return nil
	}

	var err error
	if session.ID == "" {
		err = s.insert(session)
	} else {
		err = s.update(session)
	}
	if err != nil {
		return err
	}

	encoded, err := securecookie.EncodeMulti(session.Name(), session.ID, s.Codecs...)
	if err != nil {
		return err
	}
	s.setCookie(w, session, encoded)
	return nil
}

// setCookie emits the session cookie. Stratos serves the console over HTTPS
// and requires secure session cookies (initSessionStore sets Options.Secure
// for every provider); forcing it here keeps the guarantee local to the
// store rather than dependent on the caller's configuration.
func (s *Store) setCookie(w http.ResponseWriter, session *sessions.Session, value string) {
	opts := *session.Options
	if value == "" {
		opts.MaxAge = -1
	}
	cookie := sessions.NewCookie(session.Name(), value, &opts)
	cookie.Secure = true
	http.SetCookie(w, cookie)
}

// expiresOn resolves the row expiry: jetstream's SaveSession sets
// Values["expires_on"] before every save; fall back to now+MaxAge when a
// caller saved without it. All times are stored in UTC so the one SQL-side
// comparison (deleteExpired) is well-ordered on every provider.
func (s *Store) expiresOn(session *sessions.Session, now time.Time) time.Time {
	if exOn, ok := session.Values["expires_on"].(time.Time); ok {
		return exOn.UTC()
	}
	return now.Add(time.Second * time.Duration(session.Options.MaxAge))
}

func (s *Store) encode(session *sessions.Session) (string, error) {
	values := make(map[interface{}]interface{}, len(session.Values))
	for k, v := range session.Values {
		values[k] = v
	}
	for _, k := range timestampKeys {
		delete(values, k)
	}
	return securecookie.EncodeMulti(session.Name(), values, s.Codecs...)
}

func (s *Store) insert(session *sessions.Session) error {
	now := time.Now().UTC()
	expires := s.expiresOn(session, now)
	data, err := s.encode(session)
	if err != nil {
		return err
	}

	// lib/pq has no LastInsertId support; the id comes back via RETURNING.
	if s.provider == datastore.PGSQL {
		var id int64
		if err := s.db.QueryRow(s.stmtInsert+" RETURNING id", data, now, now, expires).Scan(&id); err != nil {
			return fmt.Errorf("sessionstore: unable to insert session: %v", err)
		}
		session.ID = fmt.Sprintf("%d", id)
		return nil
	}

	res, err := s.db.Exec(s.stmtInsert, data, now, now, expires)
	if err != nil {
		return fmt.Errorf("sessionstore: unable to insert session: %v", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return err
	}
	session.ID = fmt.Sprintf("%d", id)
	return nil
}

func (s *Store) update(session *sessions.Session) error {
	now := time.Now().UTC()
	expires := s.expiresOn(session, now)
	data, err := s.encode(session)
	if err != nil {
		return err
	}
	if _, err := s.db.Exec(s.stmtUpdate, data, now, expires, session.ID); err != nil {
		return fmt.Errorf("sessionstore: unable to update session: %v", err)
	}
	return nil
}

func (s *Store) load(session *sessions.Session) error {
	var (
		data                             string
		createdOn, modifiedOn, expiresOn time.Time
	)
	err := s.db.QueryRow(s.stmtSelect, session.ID).Scan(&data, &createdOn, &modifiedOn, &expiresOn)
	if err != nil {
		return err
	}
	if expiresOn.Before(time.Now()) {
		return errors.New("sessionstore: session expired")
	}
	if err := securecookie.DecodeMulti(session.Name(), data, &session.Values, s.Codecs...); err != nil {
		return err
	}
	session.Values["created_on"] = createdOn
	session.Values["modified_on"] = modifiedOn
	session.Values["expires_on"] = expiresOn
	return nil
}

// Close satisfies HttpSessionStore. The connection pool is shared and owned
// by main, which closes it itself — unlike the old stores, there is nothing
// of ours to release here.
func (s *Store) Close() {}
