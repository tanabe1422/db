package tabledef

import "strings"

type ValidationError struct {
	Path    string `json:"path"`
	Message string `json:"message"`
}

type ValidationErrors []ValidationError

func (e ValidationErrors) Error() string {
	if len(e) == 0 {
		return ""
	}
	messages := make([]string, len(e))
	for i, err := range e {
		if err.Path != "" {
			messages[i] = err.Path + ": " + err.Message
		} else {
			messages[i] = err.Message
		}
	}
	return strings.Join(messages, "; ")
}
