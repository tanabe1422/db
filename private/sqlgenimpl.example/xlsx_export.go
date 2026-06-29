//go:build sqlgen_xlsx_export

package sqlgenimpl

import (
	"errors"
	// _ "embed"
)

// xlsx 雛形を同梱する例:
//
//	//go:embed templates/*.xlsx
//	var templateFS embed.FS

type xlsxExportGen struct{}

func newXlsxExportGen() xlsxExportGen { return xlsxExportGen{} }

func (xlsxExportGen) Generate(tableJSON []byte) ([]byte, string, error) {
	_ = tableJSON
	return nil, "", errors.New("xlsxExportGen: not implemented")
}
