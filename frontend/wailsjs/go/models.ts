export namespace config {
	
	export class Auth {
	    apiKey: string;
	    privateKey: string;
	
	    static createFrom(source: any = {}) {
	        return new Auth(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.apiKey = source["apiKey"];
	        this.privateKey = source["privateKey"];
	    }
	}
	export class TLS {
	    enabled: boolean;
	    clientCertPath: string;
	    clientKeyPath: string;
	    serverCACertPath: string;
	    skipVerify: boolean;
	
	    static createFrom(source: any = {}) {
	        return new TLS(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.clientCertPath = source["clientCertPath"];
	        this.clientKeyPath = source["clientKeyPath"];
	        this.serverCACertPath = source["serverCACertPath"];
	        this.skipVerify = source["skipVerify"];
	    }
	}
	export class Environment {
	    id: string;
	    name: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new Environment(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.url = source["url"];
	    }
	}
	export class General {
	    posId: string;
	    mid: string;
	    trxIdLen: number;
	
	    static createFrom(source: any = {}) {
	        return new General(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.posId = source["posId"];
	        this.mid = source["mid"];
	        this.trxIdLen = source["trxIdLen"];
	    }
	}
	export class Config {
	    general: General;
	    customEnvironments: Environment[];
	    activeEnvironmentId: string;
	    auth: Auth;
	    tls: TLS;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.general = this.convertValues(source["general"], General);
	        this.customEnvironments = this.convertValues(source["customEnvironments"], Environment);
	        this.activeEnvironmentId = source["activeEnvironmentId"];
	        this.auth = this.convertValues(source["auth"], Auth);
	        this.tls = this.convertValues(source["tls"], TLS);
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

export namespace ecr {
	
	export class FieldOption {
	    Label: string;
	    Value: string;
	
	    static createFrom(source: any = {}) {
	        return new FieldOption(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Label = source["Label"];
	        this.Value = source["Value"];
	    }
	}
	export class Field {
	    Key: string;
	    Label: string;
	    Type: string;
	    Placeholder: string;
	    Options: FieldOption[];
	    Default: string;
	
	    static createFrom(source: any = {}) {
	        return new Field(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Key = source["Key"];
	        this.Label = source["Label"];
	        this.Type = source["Type"];
	        this.Placeholder = source["Placeholder"];
	        this.Options = this.convertValues(source["Options"], FieldOption);
	        this.Default = source["Default"];
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
	
	export class TransactionType {
	    ID: string;
	    Label: string;
	    Fields: Field[];
	
	    static createFrom(source: any = {}) {
	        return new TransactionType(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Label = source["Label"];
	        this.Fields = this.convertValues(source["Fields"], Field);
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
	export class Mode {
	    ID: string;
	    Label: string;
	    TransactionTypes: TransactionType[];
	
	    static createFrom(source: any = {}) {
	        return new Mode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Label = source["Label"];
	        this.TransactionTypes = this.convertValues(source["TransactionTypes"], TransactionType);
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

export namespace edc {
	
	export class Device {
	    edc_id: string;
	
	    static createFrom(source: any = {}) {
	        return new Device(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.edc_id = source["edc_id"];
	    }
	}

}

export namespace main {
	
	export class PairRequest {
	    edcId: string;
	    pairCode: string;
	
	    static createFrom(source: any = {}) {
	        return new PairRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.edcId = source["edcId"];
	        this.pairCode = source["pairCode"];
	    }
	}
	export class SendTransactionRequest {
	    edcId: string;
	    transactionType: ecr.TransactionType;
	    dataField: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new SendTransactionRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.edcId = source["edcId"];
	        this.transactionType = this.convertValues(source["transactionType"], ecr.TransactionType);
	        this.dataField = source["dataField"];
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
	export class UnpairRequest {
	    edcId: string;
	
	    static createFrom(source: any = {}) {
	        return new UnpairRequest(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.edcId = source["edcId"];
	    }
	}

}

