//go:build !windows

package app

import "context"

func applyWebViewZoom(_ context.Context, _ float64) error {
	return nil
}
