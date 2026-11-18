package api

import "time"

// APIKey - represents API key DB entry
type APIKey struct {
	GUID     string     `json:"guid"`
	Secret   string     `json:"secret"`
	UserGUID string     `json:"user_guid"`
	Comment  string     `json:"comment"`
	LastUsed *time.Time `json:"last_used"`
	// ExpiresAt is nil for a key that never expires.
	ExpiresAt *time.Time `json:"expires_at"`
	// LastUsedRefused is true when the last use was refused (the key had expired).
	LastUsedRefused bool `json:"last_used_refused"`
}
