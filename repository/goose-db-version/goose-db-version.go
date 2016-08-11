package goosedbversion

type GooseDBVersionRecord struct {
	VersionID int64 `json:"version_id"`
}

type Repository interface {
	GetCurrentVersion() (GooseDBVersionRecord, error)
}
