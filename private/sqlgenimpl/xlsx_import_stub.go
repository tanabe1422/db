//go:build !sqlgen_xlsx_import

package sqlgenimpl

import "errors"

type xlsxImportGen struct{}

func newXlsxImportGen() xlsxImportGen { return xlsxImportGen{} }

func (xlsxImportGen) Generate(xlsx []byte) ([]byte, string, error) {
	_ = xlsx
	return nil, "", errors.New("xlsxImportGen: not implemented (add private/sqlgenimpl/xlsx_import.go)")
}
