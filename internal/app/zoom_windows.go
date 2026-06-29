//go:build windows

package app

import (
	"context"
	"errors"
	"reflect"
)

func applyWebViewZoom(ctx context.Context, factor float64) error {
	frontend := ctx.Value("frontend")
	if frontend == nil {
		return errors.New("frontend not available")
	}

	val := reflect.ValueOf(frontend)
	if val.Kind() == reflect.Pointer {
		if val.IsNil() {
			return errors.New("frontend is nil")
		}
		val = val.Elem()
	}

	chromiumField := val.FieldByName("chromium")
	if !chromiumField.IsValid() || chromiumField.IsNil() {
		return errors.New("chromium not available")
	}

	method := chromiumField.MethodByName("PutZoomFactor")
	if !method.IsValid() {
		return errors.New("PutZoomFactor not found")
	}

	method.Call([]reflect.Value{reflect.ValueOf(factor)})
	return nil
}
