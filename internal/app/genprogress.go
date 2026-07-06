package app

import (
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const genProgressEvent = "gen:progress"

// GenProgressPayload is sent to the frontend during multi-file gen.exe operations.
type GenProgressPayload struct {
	Current int    `json:"current"`
	Total   int    `json:"total"`
	Label   string `json:"label"`
}

func (a *App) emitGenProgress(current, total int, label string) {
	if a.ctx == nil || total <= 1 {
		return
	}
	runtime.EventsEmit(a.ctx, genProgressEvent, GenProgressPayload{
		Current: current,
		Total:   total,
		Label:   label,
	})
}
