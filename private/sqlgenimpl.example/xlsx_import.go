//go:build sqlgen_xlsx_import

package sqlgenimpl

import (
	"errors"
	// _ "embed"
)

// xlsx 雛形を同梱する例:
//
//	//go:embed templates/*.xlsx
//	var templateFS embed.FS

type xlsxImportGen struct{}

func newXlsxImportGen() xlsxImportGen { return xlsxImportGen{} }

func (xlsxImportGen) Generate(xlsx []byte) ([]byte, string, error) {
	_ = xlsx
	return nil, "", errors.New("xlsxImportGen: not implemented")
}
