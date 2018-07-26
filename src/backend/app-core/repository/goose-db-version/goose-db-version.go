package goosedbversion

// GooseDBVersionRecord - the version record in the database that Goose reads/writes
type GooseDBVersionRecord struct {
	VersionID int64 `json:"version_id"`
}

// Repository - the repository required to talk to this table of data
type Repository interface {
	GetCurrentVersion() (GooseDBVersionRecord, error)
}
