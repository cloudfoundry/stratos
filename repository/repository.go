package repository

import "fmt"

// DatabaseError for anything else
type DatabaseError struct {
	InnerError error
}

func (e *DatabaseError) Error() string {
	return fmt.Sprintf("Error interacting with database. Inner error was: %v", e.InnerError)
}
