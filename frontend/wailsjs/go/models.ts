export namespace app {
	
	export class AISetupResult {
	    schemaWritten: boolean;
	    cursorRuleWritten: boolean;
	    claudeMdWritten: boolean;
	    vscodeSettingsWritten: boolean;
	    tableJsonPatched: number;
	    tableJsonSkipped: number;
	    tableJsonFailed: number;
	    warnings: string[];
	
	    static createFrom(source: any = {}) {
	        return new AISetupResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.schemaWritten = source["schemaWritten"];
	        this.cursorRuleWritten = source["cursorRuleWritten"];
	        this.claudeMdWritten = source["claudeMdWritten"];
	        this.vscodeSettingsWritten = source["vscodeSettingsWritten"];
	        this.tableJsonPatched = source["tableJsonPatched"];
	        this.tableJsonSkipped = source["tableJsonSkipped"];
	        this.tableJsonFailed = source["tableJsonFailed"];
	        this.warnings = source["warnings"];
	    }
	}
	export class FileStat {
	    modTimeUnixNano: number;
	    size: number;
	
	    static createFrom(source: any = {}) {
	        return new FileStat(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.modTimeUnixNano = source["modTimeUnixNano"];
	        this.size = source["size"];
	    }
	}
	export class LaunchAction {
	    type: string;
	    paths?: string[];
	    label?: string;
	    left?: string;
	    right?: string;
	
	    static createFrom(source: any = {}) {
	        return new LaunchAction(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.type = source["type"];
	        this.paths = source["paths"];
	        this.label = source["label"];
	        this.left = source["left"];
	        this.right = source["right"];
	    }
	}
	export class ScriptResult {
	    sql: string;
	    relPath: string;
	
	    static createFrom(source: any = {}) {
	        return new ScriptResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sql = source["sql"];
	        this.relPath = source["relPath"];
	    }
	}
	export class XlsxImportFailure {
	    sourcePath: string;
	    message: string;
	
	    static createFrom(source: any = {}) {
	        return new XlsxImportFailure(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.sourcePath = source["sourcePath"];
	        this.message = source["message"];
	    }
	}
	export class XlsxImportResult {
	    imported: number;
	    failures: XlsxImportFailure[];
	
	    static createFrom(source: any = {}) {
	        return new XlsxImportResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.imported = source["imported"];
	        this.failures = this.convertValues(source["failures"], XlsxImportFailure);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace config {
	
	export class Settings {
	    directories: string[];
	    activeDirectory: string;
	
	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.directories = source["directories"];
	        this.activeDirectory = source["activeDirectory"];
	    }
	}

}

export namespace git {
	
	export class Commit {
	    hash: string;
	    shortHash: string;
	    subject: string;
	    date: string;
	
	    static createFrom(source: any = {}) {
	        return new Commit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.shortHash = source["shortHash"];
	        this.subject = source["subject"];
	        this.date = source["date"];
	    }
	}
	export class RepoInfo {
	    isRepo: boolean;
	    repoRoot: string;
	
	    static createFrom(source: any = {}) {
	        return new RepoInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isRepo = source["isRepo"];
	        this.repoRoot = source["repoRoot"];
	    }
	}

}

export namespace options {
	
	export class SecondInstanceData {
	    Args: string[];
	    WorkingDirectory: string;
	
	    static createFrom(source: any = {}) {
	        return new SecondInstanceData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Args = source["Args"];
	        this.WorkingDirectory = source["WorkingDirectory"];
	    }
	}

}

export namespace scanner {
	
	export class TreeNode {
	    name: string;
	    path: string;
	    isDir: boolean;
	    children: TreeNode[];
	
	    static createFrom(source: any = {}) {
	        return new TreeNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.isDir = source["isDir"];
	        this.children = this.convertValues(source["children"], TreeNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

