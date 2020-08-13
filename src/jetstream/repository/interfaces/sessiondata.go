package interfaces

import (
	"time"
)

type SessionDataStore interface {
	GetValues(session, group string) (map[string]string, error)
	// SetValues replaces existing values for the group (deletes them first)
	SetValues(session, group string, values map[string]string, autoExpire bool) error
	DeleteValues(session, group string) error

	IsValidSession(id int) (bool, error)

	// Cleanup runs a background goroutine every interval that deletes expired sessions from the database
	Cleanup(interval time.Duration) (chan<- struct{}, <-chan struct{})
	
	// StopCleanup stops the background cleanup from running
	StopCleanup(quit chan<- struct{}, done <-chan struct{})


}
