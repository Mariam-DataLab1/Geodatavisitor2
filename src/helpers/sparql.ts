//@ts-check
import * as wellKnown from "wellknown";// Well-known text (WKT) is a text markup language for representing vector geometry objects.
import _ from "lodash";
import { SingleObject } from "../reducer";

//Sparql query api
// const coordSearchApi = 'https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerTest/run'; //The coordinate search APi
//const textSearchApi = 'https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerSearch/run'; //The text search api

export interface SparqlResults {
    head: Head;
    results: {
        bindings: Binding[];
    };
}
export interface Head {
    vars: string[];
}
export interface Binding {
    [varname: string]: BindingValue;
}

export type BindingValue =
    | {
        type: "uri";
        value: string;
    }
    | {
        type: number; 
        value: string
    }
    | {
        type: "literal"; 
        value: string
    };

/**
 * Convert the sparql json results of the coordinate query into a Result.js array
 *  Convert the geometry format from wkt to geoJson.
 * @param results
 */
export async function queryResourcesDescriptions(lat: string, lng: string, iris: string[]): Promise<SingleObject[]> {
    let res = await runQuery(lat, lng);

    // The sparql results for 1 iri may span multiple rows. So, group them
    const groupedByIri = _.groupBy(res.results.bindings, b => b.sub.value); //s is the iri variable name
    return iris
        .map(iri => {
            const bindings = groupedByIri[iri];
            if (!bindings) return undefined;
            const firstBinding = bindings[0];
            let geoJson: any;
            // In this case there is only one record of the result, so it uses 'firstBinding'. In other case it should be modified.
         //bagShape
            if (firstBinding.geo) {
                let wktJson = bindings[0].geo.value;//bagShape
                geoJson = wellKnown.parse(wktJson);
            }
            return {

                sub: iri,//bag
                geo: geoJson,// bagShape
                address: firstBinding.address.value,
                bouwjaar: firstBinding.bouwjaar.value,
                status: firstBinding.status.value,
                brt: firstBinding.brt.value,
                brtName: firstBinding.brtName.value,
                brtTypeName: firstBinding.brtTypeName.value,
                bgt: firstBinding.bgt.value,
                bgtStatus: firstBinding.bgtStatus.value
            };
        })
        .filter(i => !!i);
}
/**
 * Convert the sparql json results of the text search into a Result.js array
 */
export async function searchResourcesDescriptions( res:SparqlResults): Promise<SingleObject[]> {

    //The sparql results for 1 iri may span multiple rows. So, group them
    
    const groupedByIri = _.groupBy(res.results.bindings, b => b.sub.value); //s is the iri variable name
    return Object.entries(groupedByIri).map(([iri, bindings]: [iri: string, bindings: Array<Binding>]) => {
        if (!bindings) return undefined;
            let subHost = new URL(iri).host
            let geoJson: any = null
            let properties: any = {}
            for(let binding of bindings) {
                let propName = ''
                
                try {
                    if(new URL(binding.pred.value).host === subHost) {
                        propName = binding.pred.value.split('/').slice(-1)[0]
                    }
                } catch (error) {}
                
                let value = binding.obj.value
                if(/^POLYGON\(\(.*\)\)$/i.test(value)) {
                    geoJson = wellKnown.parse(value)
                } else if(propName) {
                    properties[propName] = value
                }
            }
            return {
                sub: iri,
                geo: geoJson,
                ...properties

            };
    }).filter(i => i);
}

/**
 * Get the coordinate query result from the api
 * @param lat 
 * @param long 
 */
export async function runQuery(lat: string, long: string): Promise<SparqlResults> {
    // const sparqlApi = 'https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerTest/run';
    let sufUrl = '?lat=' + lat + '&long=' + long;
    let runApi = sufUrl; // + sparqlApi 
    const result = await fetch(runApi, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/sparql-results+json"
        },

    });
    if (result.status > 300) {
        throw new Error("Request with response " + result.status);
    }

    return JSON.parse(await result.text());

}

/**
 * Get the text search result from the api
 * @param endpoint 
 * @returns 
 */

export async function searchQuery(endpoint:string): Promise<SparqlResults> {
    const result = await fetch(endpoint, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/sparql-results+json"
        },
    });
    if (result.status > 300) {
        throw new Error("Request with response " + result.status);
    }

    return result.json();
}


//polygon
// https://api.data.pldn.nl/queries/Mariam/Query-15/run
// https://api.data.pldn.nl/queries/Mariam/Query-16/run   it works with address
// https://api.data.pldn.nl/queries/Mariam/Query-17/run  it is pilot emotion and costs

// Zero query 
// https://api.data.pldn.nl/queries/Mariam/Query-29/run
// https://api.data.pldn.nl/queries/Mariam/Query-30/run
// https://api.data.pldn.nl/queries/Mariam/Query-32/run

// npm run dev