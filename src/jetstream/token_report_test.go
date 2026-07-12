package main

import (
	"testing"
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
)

func TestCountDeadTokens(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	mk := func(expiry int64, refresh string) api.BackupTokenRecord {
		return api.BackupTokenRecord{TokenRecord: api.TokenRecord{TokenExpiry: expiry, RefreshToken: refresh}}
	}
	tokens := []api.BackupTokenRecord{
		mk(now.Unix()-1, ""),     // expired, no refresh → dead (incl. disposed-after-rejection rows)
		mk(now.Unix()-1, "r"),    // expired but renewable on use → NOT dead
		mk(0, ""),                // no known expiry → not counted
		mk(now.Unix()+3600, "r"), // healthy
	}
	if got := countDeadTokens(tokens, now); got != 1 {
		t.Errorf("got %d, want 1", got)
	}
}
