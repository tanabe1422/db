package sqlgenimpl

import "db-gui/internal/sqlgen"

func init() {
	sqlgen.RegisterCreateScript(func() (sqlgen.CreateScriptGenerator, error) {
		return newCreateScriptGen(), nil
	})
	sqlgen.RegisterMigrateScript(func() (sqlgen.MigrateScriptGenerator, error) {
		return newMigrateScriptGen(), nil
	})
	sqlgen.RegisterXlsxImport(func() (sqlgen.XlsxImportGenerator, error) {
		return newXlsxImportGen(), nil
	})
	sqlgen.RegisterXlsxExport(func() (sqlgen.XlsxExportGenerator, error) {
		return newXlsxExportGen(), nil
	})
}
