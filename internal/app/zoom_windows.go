//go:build windows

package app

import (
	"context"
	"errors"
	"reflect"
	"unsafe"
)

func unwrapReflectValue(val reflect.Value) (reflect.Value, error) {
	for val.Kind() == reflect.Interface || val.Kind() == reflect.Pointer {
		if val.IsNil() {
			return reflect.Value{}, errors.New("frontend is nil")
		}
		val = val.Elem()
	}
	return val, nil
}

// exportedReflectValue clears the read-only flag on values obtained via
// unexported fields so methods (e.g. PutZoomFactor) can be called.
func exportedReflectValue(v reflect.Value) reflect.Value {
	if v.CanInterface() {
		return v
	}
	if !v.CanAddr() {
		return v
	}
	return reflect.NewAt(v.Type(), unsafe.Pointer(v.UnsafeAddr())).Elem()
}

func applyWebViewZoom(ctx context.Context, factor float64) error {
	frontend := ctx.Value("frontend")
	if frontend == nil {
		return errors.New("frontend not available")
	}

	val, err := unwrapReflectValue(reflect.ValueOf(frontend))
	if err != nil {
		return err
	}

	chromiumField := val.FieldByName("chromium")
	if !chromiumField.IsValid() || chromiumField.IsNil() {
		return errors.New("chromium not available")
	}
	chromiumField = exportedReflectValue(chromiumField)

	method := chromiumField.MethodByName("PutZoomFactor")
	if !method.IsValid() {
		return errors.New("PutZoomFactor not found")
	}

	method.Call([]reflect.Value{reflect.ValueOf(factor)})
	return nil
}
