package tabledef

import (
	"encoding/json"
	"fmt"
)

type ColumnLength struct {
	Number *int
	Max    bool
}

func (l ColumnLength) MarshalJSON() ([]byte, error) {
	if l.Max {
		return json.Marshal("max")
	}
	if l.Number != nil {
		return json.Marshal(*l.Number)
	}
	return json.Marshal(nil)
}

func (l *ColumnLength) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		return nil
	}

	var asString string
	if err := json.Unmarshal(data, &asString); err == nil {
		if asString == "max" {
			l.Max = true
			l.Number = nil
			return nil
		}
		return fmt.Errorf("invalid length value %q", asString)
	}

	var asInt int
	if err := json.Unmarshal(data, &asInt); err != nil {
		return err
	}
	if asInt < 1 {
		return fmt.Errorf("length must be at least 1")
	}
	l.Number = &asInt
	l.Max = false
	return nil
}

func intLength(v int) *ColumnLength {
	return &ColumnLength{Number: &v}
}

func maxLength() *ColumnLength {
	return &ColumnLength{Max: true}
}
