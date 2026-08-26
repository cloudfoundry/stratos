package sessionstore

import (
	"log/slog"
	"time"
)

var defaultInterval = time.Minute * 5

// Cleanup runs a background goroutine that deletes expired sessions from the
// database every interval. Returns the channels StopCleanup needs.
func (s *Store) Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{}) {
	if interval <= 0 {
		interval = defaultInterval
	}

	quit, done := make(chan struct{}), make(chan struct{})
	go s.cleanup(interval, quit, done)
	return quit, done
}

// StopCleanup stops the background cleanup goroutine.
func (s *Store) StopCleanup(quit chan<- struct{}, done <-chan struct{}) {
	quit <- struct{}{}
	<-done
}

func (s *Store) cleanup(interval time.Duration, quit <-chan struct{}, done chan<- struct{}) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-quit:
			done <- struct{}{}
			return
		case <-ticker.C:
			if err := s.deleteExpired(); err != nil {
				slog.Warn("sessionstore: unable to delete expired sessions", "error", err)
			}
		}
	}
}

func (s *Store) deleteExpired() error {
	_, err := s.db.Exec(s.stmtExpired, time.Now().UTC())
	return err
}
