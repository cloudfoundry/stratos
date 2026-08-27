package cloudfoundry

import "testing"

// The paging overrides used to be read by a package-level initialiser, which
// runs before main installs the slog handler: the two lines reporting the
// resolved values were emitted by slog's default logger in the standard log
// package's format, so a LOG_TO_JSON deployment got two unparseable records
// on every boot. They are read from Init instead, through
// resolvePagingConfig.
func TestResolvePagingConfigAppliesTheEnvironment(t *testing.T) {
	original, originalMax := fullPagePerRequest, maxParallelPages
	t.Cleanup(func() { fullPagePerRequest, maxParallelPages = original, originalMax })

	// Nothing may consult the environment before resolvePagingConfig runs, so
	// setting it now must not move the values on its own.
	t.Setenv("STRATOS_CF_PER_PAGE", "250")
	t.Setenv("STRATOS_CF_MAX_PARALLEL_PAGES", "9")
	if fullPagePerRequest != original || maxParallelPages != originalMax {
		t.Fatalf("values changed without resolvePagingConfig: %d, %d", fullPagePerRequest, maxParallelPages)
	}

	resolvePagingConfig()
	if fullPagePerRequest != 250 {
		t.Errorf("fullPagePerRequest = %d, want 250", fullPagePerRequest)
	}
	if maxParallelPages != 9 {
		t.Errorf("maxParallelPages = %d, want 9", maxParallelPages)
	}
}

func TestResolvePagingConfigKeepsTheDefaultOnBadInput(t *testing.T) {
	original, originalMax := fullPagePerRequest, maxParallelPages
	t.Cleanup(func() { fullPagePerRequest, maxParallelPages = original, originalMax })

	t.Setenv("STRATOS_CF_PER_PAGE", "not-a-number")
	t.Setenv("STRATOS_CF_MAX_PARALLEL_PAGES", "0")

	resolvePagingConfig()
	if fullPagePerRequest != defaultPerPage {
		t.Errorf("fullPagePerRequest = %d, want the default %d", fullPagePerRequest, defaultPerPage)
	}
	if maxParallelPages != defaultMaxParallelPages {
		t.Errorf("maxParallelPages = %d, want the default %d", maxParallelPages, defaultMaxParallelPages)
	}
}
