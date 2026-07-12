package main

import (
	"time"

	"github.com/cloudfoundry/stratos/src/jetstream/api"
	log "github.com/sirupsen/logrus"
)

// countDeadTokens counts stored connected tokens that need user
// re-authentication: past expiry with no refresh token to renew from.
// Rows disposed after a witnessed UAA rejection land in the same shape
// (refresh cleared, expiry floored). A token past expiry that still has a
// refresh token is renewable on use and is not dead; zero expiry means no
// known expiry — not counted.
func countDeadTokens(tokens []api.BackupTokenRecord, now time.Time) int {
	dead := 0
	for _, t := range tokens {
		if t.TokenRecord.RefreshToken == "" && t.TokenRecord.TokenExpiry > 0 &&
			time.Unix(t.TokenRecord.TokenExpiry, 0).Before(now) {
			dead++
		}
	}
	return dead
}

// reportDeadTokensAtBoot logs the arrival report for operators: how many
// stored endpoint connections already need user re-authentication. Counts
// only — never token material.
func (p *portalProxy) reportDeadTokensAtBoot() {
	tokenRepo, err := p.GetStoreFactory().TokenStore()
	if err != nil {
		log.Warnf("token boot report skipped: %v", err)
		return
	}
	tokens, err := tokenRepo.ListAllEnabledConnectedCNSITokens(p.Config.EncryptionKeyInBytes)
	if err != nil {
		log.Warnf("token boot report skipped: %v", err)
		return
	}
	if dead := countDeadTokens(tokens, time.Now()); dead > 0 {
		log.Infof("Endpoint tokens needing user re-authentication: %d of %d connected", dead, len(tokens))
	}
}
