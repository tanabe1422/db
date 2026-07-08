package tabledef

type TableDefinition struct {
	SchemaVersion     int                `json:"schemaVersion"`
	Name              string             `json:"name"`
	NameJa            string             `json:"nameJa,omitempty"`
	Description       string             `json:"description,omitempty"`
	PrimaryKey        []string           `json:"primaryKey,omitempty"`
	Columns           []Column           `json:"columns"`
	Indexes           []Index            `json:"indexes,omitempty"`
	UniqueIndexes     []Index            `json:"uniqueIndexes,omitempty"`
	UniqueConstraints []UniqueConstraint `json:"uniqueConstraints,omitempty"`
}

type Column struct {
	Name         string        `json:"name"`
	NameJa       string        `json:"nameJa,omitempty"`
	DataType     string        `json:"dataType"`
	NotNull      bool          `json:"notNull,omitempty"`
	DefaultValue string        `json:"defaultValue,omitempty"`
	Length       *ColumnLength `json:"length,omitempty"`
	Precision    *int          `json:"precision,omitempty"`
	Scale        *int          `json:"scale,omitempty"`
	Unique       bool          `json:"unique,omitempty"`
	Identity     bool          `json:"identity,omitempty"`
}

type UniqueConstraint struct {
	Columns []string `json:"columns"`
}

type Index struct {
	Keys    []IndexKey `json:"keys"`
	Include []string   `json:"include,omitempty"`
}

type IndexKey struct {
	Column string `json:"column"`
	Order  string `json:"order,omitempty"`
}
