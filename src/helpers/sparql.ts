//@ts-check
import * as wellKnown from "wellknown";// Well-known text (WKT) is a text markup language for representing vector geometry objects.
import _ from "lodash";
// import App {useState, useEffect} from "./App";
import { SingleObject } from "../reducer";
// import { StatisticValue } from "semantic-ui-react";
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
/*
export type BindingValue =
    | {
    type: "uri";
    value: string;
}
    | {
    type: "literal";
    value: string;
    "xml:lang"?: string;
    datatype?: string;
}
    | { type: "bnode"; value: string };
*/
export type BindingValue =
    // | {
    //     type: "uri";
    //     value: string;
    // }
    // | {
    //     type: "typed-literal";
    //     value: string;
    // }
    // | {
    //     type: number; 
    //     value: string
    // }
    // | {
    //     type: "typed-literal"; 
    //     value: string
    // }
    // | {
    //     type: "literal"; 
    //     value: string
    // }
    | {
        type: "literal"; 
        value: string
    }
    | {
        type: "literal"; 
        value: string
    };

/**
 * Convert the sparql json results into a Result.js array
 * @param results
 */
export async function queryResourcesDescriptions(lat: string, lng: string, iris: string[]): Promise<SingleObject[]> {
    let res = await runQuery(lat, lng);

    //The sparql results for 1 iri may span multiple rows. So, group them
    const groupedByIri = _.groupBy(res.results.bindings, b => b.person.value); //s is the iri variable name
    return iris
        .map(iri => {
            const bindings = groupedByIri[iri];
            if (!bindings) return undefined;
            const firstBinding = bindings[0];
            let geoJson: any;

            if (firstBinding.geo) {
                let wktJson = bindings[0].geo.value;
                geoJson = wellKnown.parse(wktJson);
            }
            return {
                person: iri,
                geo: geoJson,

                /*
                shapeTooltip: firstBinding.shapeTooltip.value,
                types: _.uniq(bindings.map(b => b.type.value)),
                shape: geoJson,
                shapeColor: bindings.filter(b => !!b.shapeColor?.value)[0]?.shapeColor?.value
                */
            };
        })
        .filter(i => !!i);
}

// export async function searchResourcesDescriptions(postcode: string, housenumber: string, iris: string[]): Promise<SingleObject[]> {
// let res = await searchQuery(postcode, housenumber);

export async function searchResourcesDescriptions( res:SparqlResults): Promise<SingleObject[]> {
        // let res = await searchQuery();   

    //The sparql results for 1 iri may span multiple rows. So, group them
                                                          
    const groupedByIri = _.groupBy(res.results.bindings, b => b.person.value); //s is the iri variable name
    return res.results.bindings.map(b => b.person.value)
        .map(iri => {
            const bindings = groupedByIri[iri];
            if (!bindings) return undefined;
            const firstBinding = bindings[0];
            let geoJson: any;

            //Bagshap
            if (firstBinding.geo) {
                let wktJson = bindings[0].geo.value;
                geoJson = wellKnown.parse(wktJson);
            }
            return {
                person: iri,
                geo: geoJson,
                /*
                shapeTooltip: firstBinding.shapeTooltip.value,
                types: _.uniq(bindings.map(b => b.type.value)),
                shape: geoJson,
                shapeColor: bindings.filter(b => !!b.shapeColor?.value)[0]?.shapeColor?.value
                */
            };
        })
        .filter(i => !!i);
}

/**
 * 
 * @param lat 
 * @param long 
 * @param precisie 
 */
export async function runQuery(lat: string, long: string): Promise<SparqlResults> {
    const sparqlApi = 'https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerTest/run';
    let sufUrl = '?lat=' + lat + '&long=' + long;
    let runApi = sparqlApi + sufUrl;
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
// export async function searchQuery(postcode: string, housenumber: string): Promise<SparqlResults> {
//     const searchApi = 'https://api.labs.kadaster.nl/queries/jiarong-li/PandviewerSearch/run';
//     let sufUrl = '?postcode=' + postcode + '&huisnummer=' + housenumber;
//     let runApi = searchApi + sufUrl;
//     const result = await fetch(runApi, {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json",
//             Accept: "application/sparql-results+json"
//         },
//     });
//     if (result.status > 300) {
//         throw new Error("Request with response " + result.status);
//     }
//     return JSON.parse(await result.text());
// }
// mariam


export async function searchQuery(endpoint:string): Promise<SparqlResults> {
    // const searchApi = 'https://api.data.pldn.nl/queries/Mariam/Query-1/run';
    // let sufUrl = '?geo=' + geo; + '&person=' + person; // this appending sth and condition to URL
    // let runApi = searchApi;
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

    return JSON.parse(await result.text());
}
//const [pcode, setPcode]
//'https://api.data.pldn.nl/queries/Mariam/Query-1/run'
//"https://api.data.pldn.nl/queries/Mariam/Query-3/run"

