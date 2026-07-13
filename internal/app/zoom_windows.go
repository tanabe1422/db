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

// findChromiumHost walks Wails frontend shapes:
// production: *windows.Frontend{chromium}
// wails dev:  *devserver.DevWebServer{Frontend: *windows.Frontend{chromium}}
func findChromiumHost(val reflect.Value, depth int) (chromium reflect.Value, invoke reflect.Value, err error) {
	if depth > 6 {
		return reflect.Value{}, reflect.Value{}, errors.New("chromium not available")
	}

	val, err = unwrapReflectValue(val)
	if err != nil {
		return reflect.Value{}, reflect.Value{}, err
	}
	if val.Kind() != reflect.Struct {
		return reflect.Value{}, reflect.Value{}, errors.New("frontend is not a struct")
	}

	chromiumField := val.FieldByName("chromium")
	if chromiumField.IsValid() && !chromiumField.IsNil() {
		chromium = exportedReflectValue(chromiumField)
		if mainWindow := val.FieldByName("mainWindow"); mainWindow.IsValid() && !mainWindow.IsNil() {
			mainWindow = exportedReflectValue(mainWindow)
			if method := mainWindow.MethodByName("Invoke"); method.IsValid() {
				invoke = method
			}
		}
		return chromium, invoke, nil
	}

	t := val.Type()
	for i := 0; i < val.NumField(); i++ {
		fieldType := t.Field(i)
		field := val.Field(i)
		if field.Kind() != reflect.Interface && field.Kind() != reflect.Pointer {
			continue
		}
		if field.IsNil() {
			continue
		}
		if fieldType.Name != "Frontend" && !fieldType.Anonymous {
			continue
		}
		field = exportedReflectValue(field)
		chromium, invoke, err = findChromiumHost(field, depth+1)
		if err == nil {
			return chromium, invoke, nil
		}
	}

	return reflect.Value{}, reflect.Value{}, errors.New("chromium not available")
}

func applyWebViewZoom(ctx context.Context, factor float64) error {
	frontend := ctx.Value("frontend")
	if frontend == nil {
		return errors.New("frontend not available")
	}

	chromium, invoke, err := findChromiumHost(reflect.ValueOf(frontend), 0)
	if err != nil {
		return err
	}

	method := chromium.MethodByName("PutZoomFactor")
	if !method.IsValid() {
		return errors.New("PutZoomFactor not found")
	}

	call := func() {
		method.Call([]reflect.Value{reflect.ValueOf(factor)})
	}
	if invoke.IsValid() {
		invoke.Call([]reflect.Value{reflect.ValueOf(call)})
		return nil
	}
	call()
	return nil
}
