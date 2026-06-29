package app

import "math"

const (
	zoomBase      = 1.2
	minZoomLevel  = -4
	maxZoomLevel  = 6
	minZoomFactor = 0.5
	maxZoomFactor = 3.0
)

func zoomLevelToFactor(level float64) float64 {
	return math.Pow(zoomBase, level)
}

func clampZoomLevel(level float64) float64 {
	if level < minZoomLevel {
		return minZoomLevel
	}
	if level > maxZoomLevel {
		return maxZoomLevel
	}
	return math.Round(level*1000) / 1000
}

func clampZoomFactor(factor float64) float64 {
	if factor < minZoomFactor {
		return minZoomFactor
	}
	if factor > maxZoomFactor {
		return maxZoomFactor
	}
	return factor
}

// SetZoomLevel applies VS Code-style window zoom (factor = 1.2^level).
func (a *App) SetZoomLevel(level float64) (float64, error) {
	level = clampZoomLevel(level)
	factor := clampZoomFactor(zoomLevelToFactor(level))
	if a.ctx != nil {
		if err := applyWebViewZoom(a.ctx, factor); err != nil {
			return 0, err
		}
	}
	return level, nil
}
