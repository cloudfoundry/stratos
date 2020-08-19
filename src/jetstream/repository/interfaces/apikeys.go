package interfaces

import "time"

// APIKey - represents API key DB entry
type APIKey struct {
	GUID     string     `json:"guid"`
	Secret   string     `json:"secret"`
	UserGUID string     `json:"user_guid"`
	Comment  string     `json:"comment"`
	LastUsed *time.Time `json:"last_used"`
}
