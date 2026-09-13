package cfappssh

import (
	"testing"

	"github.com/stretchr/testify/require"
)

// Rows and Cols arrive as JSON from the browser over the websocket and were
// converted straight to uint32 with no validation, so a negative value wrapped
// to a huge one (-1 becomes 4294967295) and a large one truncated once
// multiplied by the 8-pixel cell size. Clamp instead, so the window-change
// request sent onward always describes a plausible terminal.
func TestWindowDimensionsClampsOutOfRangeValues(t *testing.T) {
	cases := []struct {
		name       string
		rows, cols int
		wantRows   uint32
		wantCols   uint32
	}{
		{"ordinary terminal", 24, 80, 24, 80},
		{"negative rows", -1, 80, 1, 80},
		{"negative cols", 24, -1, 24, 1},
		{"zero rows", 0, 80, 1, 80},
		{"absurdly large", 1 << 20, 1 << 20, maxTerminalDimension, maxTerminalDimension},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rows, cols := windowDimensions(tc.rows, tc.cols)
			require.Equal(t, tc.wantRows, rows)
			require.Equal(t, tc.wantCols, cols)
		})
	}
}

// The pixel size is the cell count times 8; clamping the count first is what
// keeps that multiplication from overflowing uint32.
func TestWindowDimensionsPixelSizeCannotOverflow(t *testing.T) {
	rows, cols := windowDimensions(1<<20, 1<<20)
	require.LessOrEqual(t, uint64(cols)*8, uint64(^uint32(0)))
	require.LessOrEqual(t, uint64(rows)*8, uint64(^uint32(0)))
}
