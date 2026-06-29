package app

import "testing"

func TestZoomLevelToFactor(t *testing.T) {
	tests := []struct {
		level  float64
		factor float64
	}{
		{0, 1},
		{1, 1.2},
		{-1, 1 / 1.2},
		{2, 1.44},
	}

	for _, tt := range tests {
		got := zoomLevelToFactor(tt.level)
		diff := got - tt.factor
		if diff < -0.0001 || diff > 0.0001 {
			t.Fatalf("zoomLevelToFactor(%v) = %v, want %v", tt.level, got, tt.factor)
		}
	}
}

func TestClampZoomLevel(t *testing.T) {
	if clampZoomLevel(-10) != minZoomLevel {
		t.Fatalf("expected min level clamp")
	}
	if clampZoomLevel(10) != maxZoomLevel {
		t.Fatalf("expected max level clamp")
	}
}
