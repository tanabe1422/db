//go:build !sqlgen_xlsx_export

package sqlgenimpl

import "errors"

type xlsxExportGen struct{}

func newXlsxExportGen() xlsxExportGen { return xlsxExportGen{} }

func (xlsxExportGen) Generate(tableJSON []byte) ([]byte, string, error) {
	_ = tableJSON
	return nil, "", errors.New("xlsxExportGen: not implemented (add private/sqlgenimpl/xlsx_export.go)")
}
