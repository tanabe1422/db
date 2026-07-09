//go:build windows

package app

import (
	"context"
	"reflect"
	"testing"
)

type fakeChromium struct {
	factor float64
	calls  int
}

func (c *fakeChromium) PutZoomFactor(factor float64) {
	c.factor = factor
	c.calls++
}

// Mirrors wails windows.Frontend: unexported chromium field.
type fakeFrontend struct {
	chromium *fakeChromium
}

func TestUnwrapReflectValue_InterfaceThenPointer(t *testing.T) {
	chromium := &fakeChromium{}
	concrete := &fakeFrontend{chromium: chromium}

	var boxed any = concrete
	ifaceVal := reflect.ValueOf(&boxed).Elem()
	if ifaceVal.Kind() != reflect.Interface {
		t.Fatalf("setup: want Interface, got %v", ifaceVal.Kind())
	}

	got, err := unwrapReflectValue(ifaceVal)
	if err != nil {
		t.Fatalf("unwrapReflectValue: %v", err)
	}
	if got.Kind() != reflect.Struct {
		t.Fatalf("want Struct after unwrap, got %v", got.Kind())
	}
	field := got.FieldByName("chromium")
	if !field.IsValid() || field.IsNil() {
		t.Fatal("chromium field missing after unwrap")
	}
}

func TestApplyWebViewZoom_UnexportedChromiumField(t *testing.T) {
	chromium := &fakeChromium{}
	// Same shape as ctx.Value("frontend"): any holding *Frontend
	ctx := context.WithValue(context.Background(), "frontend", &fakeFrontend{chromium: chromium})

	if err := applyWebViewZoom(ctx, 1.44); err != nil {
		t.Fatalf("applyWebViewZoom: %v", err)
	}
	if chromium.calls != 1 || chromium.factor != 1.44 {
		t.Fatalf("PutZoomFactor not applied: calls=%d factor=%v", chromium.calls, chromium.factor)
	}
}

func TestApplyWebViewZoom_ViaBoxedInterface(t *testing.T) {
	chromium := &fakeChromium{}
	var frontend any = &fakeFrontend{chromium: chromium}
	ctx := context.WithValue(context.Background(), "frontend", frontend)

	if err := applyWebViewZoom(ctx, 1.2); err != nil {
		t.Fatalf("applyWebViewZoom: %v", err)
	}
	if chromium.calls != 1 || chromium.factor != 1.2 {
		t.Fatalf("PutZoomFactor not applied: calls=%d factor=%v", chromium.calls, chromium.factor)
	}
}

func TestApplyWebViewZoom_MissingFrontend(t *testing.T) {
	err := applyWebViewZoom(context.Background(), 1.2)
	if err == nil {
		t.Fatal("expected error when frontend missing")
	}
}
