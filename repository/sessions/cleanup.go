package sessioncleanup

import (
	"database/sql"
	"log"
	"time"
)

var defaultInterval = time.Minute * 5

// SessionStoreCleanup - Session Store Cleanup helper
type SessionStoreCleanup struct {
	DbPool *sql.DB
}

func NewSessionStoreCleanup(db *sql.DB) (*SessionStoreCleanup, error) {
	return &SessionStoreCleanup{
		DbPool: db,
	}, nil
}

// Cleanup runs a background goroutine every interval that deletes expired
// sessions from the database.
//
// The design is based on https://github.com/yosssi/boltstore
func (db *SessionStoreCleanup) Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{}) {
	if interval <= 0 {
		interval = defaultInterval
	}

	quit, done := make(chan struct{}), make(chan struct{})
	go db.cleanup(interval, quit, done)
	return quit, done
}

// StopCleanup stops the background cleanup from running.
func (db *SessionStoreCleanup) StopCleanup(quit chan<- struct{}, done <-chan struct{}) {
	quit <- struct{}{}
	<-done
}

// cleanup deletes expired sessions at set intervals.
func (db *SessionStoreCleanup) cleanup(interval time.Duration, quit <-chan struct{}, done chan<- struct{}) {
	ticker := time.NewTicker(interval)

	defer func() {
		ticker.Stop()
	}()

	for {
		select {
		case <-quit:
			// Handle the quit signal.
			done <- struct{}{}
			return
		case <-ticker.C:
			// Delete expired sessions on each tick.
			err := db.deleteExpired()
			if err != nil {
				log.Printf("pgstore: unable to delete expired sessions: %v", err)
			}
		}
	}
}

// deleteExpired deletes expired sessions from the database.
func (db *SessionStoreCleanup) deleteExpired() error {
	_, err := db.DbPool.Exec("DELETE FROM http_sessions WHERE expires_on < now()")
	return err
}
