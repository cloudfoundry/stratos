package sessiondata

import (
	"time"

	log "github.com/sirupsen/logrus"
)

var defaultInterval = time.Minute * 5

// Cleanup runs a background goroutine every interval that deletes expired
// sessions from the database.
//
// The design is based on https://github.com/yosssi/boltstore
func (m *SessionDataRepository) Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{}) {
	if interval <= 0 {
		interval = defaultInterval
	}

	quit, done := make(chan struct{}), make(chan struct{})
	go m.cleanup(interval, quit, done)
	return quit, done
}

// StopCleanup stops the background cleanup from running.
func (m *SessionDataRepository) StopCleanup(quit chan<- struct{}, done <-chan struct{}) {
	quit <- struct{}{}
	<-done
}

// cleanup deletes expired sessions at set intervals.
func (m *SessionDataRepository) cleanup(interval time.Duration, quit <-chan struct{}, done chan<- struct{}) {
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
			err := m.deleteExpired()
			if err != nil {
				log.Printf("SessionDataRepository: unable to delete expired sessions: %v", err)
			}
		}
	}
}

// deleteExpired will delete session values when the session expires
func (c *SessionDataRepository) deleteExpired() error {
	log.Debug("Expiring session data")
	_, err := c.db.Exec(expireSessionData)
	if err != nil {
		return err
	}
	_, err = c.db.Exec(deleteSessionData)
	return err
}
