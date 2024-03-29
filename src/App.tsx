/**
 * Libs
 */

import * as LeafletUtils from "./leaflet";
import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Reducer from "./reducer";
// import { Link } from 'react-router-dom';

/**
 * UI
 */

import "./styles.scss";
import Loader from "./components/Loader";
import LayerSelectorPopup from "./components/LayerSelectorPopup";
import { useState } from "react";
// import { Link } from "react-router-dom";

/**
 * Assets
 */

import KadasterImg from "./assets/LogoKadaster.png";
import logo from "./assets/geovisitor.png";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import * as sBP from "./helpers/searchByPoint";

let _debug: any = (window as any)._debug || {};
(window as any)._debug = _debug;
const App: React.FC = () => {
  const [state, dispatch] = React.useReducer(
    Reducer.reducer,
    Reducer.initialState
  );

  //Set state in window for debugging

  _debug.state = state;
  _debug.dispatch = dispatch;

  /**
   * Effect that runs on-mount only
   */

  React.useEffect(() => {
    console.log();
    LeafletUtils.init({
      onZoomChange: (zoom) => {
        dispatch({ type: "zoomChange", value: zoom });
      },
      onContextSearch: (ctx) => {
        dispatch({ type: "coordinate_search_start", value: ctx });
      },
      onClick: (el) => {
        dispatch({ type: "selectObject", value: el });
      },
      onLayersClick: (info) => {
        dispatch({ type: "clickLayer", value: info });
      },
    });

    return () => {};
  }, []);

  /**
     * Trigger context query
     //  */

  React.useEffect(() => {
    if (state.coordinateQuery) {
      sBP
        .getFromCoordinates(
          state.coordinateQuery.lat,
          state.coordinateQuery.lng
        )
        .then((res) => {
          dispatch({ type: "coordinate_search_success", results: res as any });
        })
        .catch(() => {
          dispatch({ type: "coordinate_search_error" });
        });
    }
  }, [state.coordinateQuery]);

  /**
     * Trigger search
     //  */
  //useEffect is hook in react Mariam change save in variable and move to

  React.useEffect(() => {
    if (state.textSearchQuery && state.textSearchQuery.endpoint) {
      sBP
        .getFromTextSearch(state.textSearchQuery.endpoint)
        .then((res) => {
          dispatch({ type: "search_success", results: res as any });
        })
        .catch(() => {
          dispatch({ type: "search_error" });
        });
    }
  }, [state.textSearchQuery]);

  React.useEffect(() => {
    console.log(state.searchResults[0]);
    dispatch({
      type: "resetProperties",
      value: Object.keys(state.searchResults[0] || {}),
    });
  }, [state.searchResults]);

  React.useEffect(() => {
    if (state.selectedObject) {
      try {
        LeafletUtils.updateMap({
          selectedObject: state.selectedObject,
          updateZoom: false,
        });
      } catch {}
    } else {
      try {
        LeafletUtils.updateMap({
          updateZoom: false,
          searchResults: state.searchResults,
          properties: state.properties,
        });
      } catch (e) {}
    }
  }, [state.searchResults, state.properties, state.selectedObject]); // [state.searchResults, state.selectedObject] afetr any changes, function recall happens for states

  /**
   * Update leaflet when clustering setting changes
   */

  React.useEffect(() => {
    LeafletUtils.toggleClustering(state.mapClustered);
    LeafletUtils.updateMap({
      searchResults: state.searchResults,
      properties: state.properties,
      selectedObject: state.selectedObject,
      updateZoom: false,
    });
  }, [state.mapClustered, state.properties]);

  /**
   * input API
   */
  const [endpoint, setEndpoint] = useState(
    "https://api.data.pldn.nl/queries/Mariam/Query-46/run"
  );
  return (
    <section className="App">
      <div className="headerInfo">
        <div className="headerEtc">
          {/* <div onClick={() => dispatch({ type: "reset" })}> */}
          <div className="header">
            <img src={logo} width="150" height="100" alt="geovisitor logo" />
            <p>
              <a
                href="https://labs.kadaster.nl/demonstrators/"
                target="_blank"
                rel="noreferrer noopener"
              >
                <img
                  src={KadasterImg}
                  height="80"
                  style={{ marginBottom: "center" }}
                  alt="kadaster logo"
                />{" "}
              </a>
            </p>

            <div className="ldWizardLink">
              <a
                href="https://labs.kadaster.nl/demonstrators/geodatawizard/"
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: "black" }}
              >
                Go to Geodata Wizard
              </a>
            </div>
            <div className="help">
              <a
                href="https://labs.kadaster.nl/demonstrators/"
                target="_blank"
                rel="noreferrer noopener"
                style={{ color: "black" }}
              >
                Help
              </a>
            </div>
          </div>
          {/* </div> */}
        </div>
        <div className="searchBar">
          <div className="infoContainer">
            <div className="apiContainer">
              <span>Endpoint</span>
              <input
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              ></input>
            </div>
          </div>
          <button
            onClick={() =>
              dispatch({ type: "search_start", value: { endpoint: endpoint } })
            }
          >
            Go
          </button>
        </div>
        <div className="list" style={{ overflow: "auto" }}>
          <ul className="properties-list">
            {Object.entries(state.properties).map(([k, v]) => (
              <li
                key={k}
                className={"property " + (v ? "selected" : "")}
                onClick={() =>
                  dispatch({
                    type: "setProperties",
                    value: { ...state.properties, [k]: !state.properties[k] },
                  })
                } //three dots is for spread operators or rest parameters. It allows an array expression or string or anything which can be iterating to be expanded in places where zero or more arguments for function calls or elements for array are expected.
              >
                {k}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className={state.isFetching ? "mapHolderLoading" : "mapHolder"}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Loader loading={state.isFetching} />
        <div id="map" />
      </div>
      <LayerSelectorPopup
        handleClose={() => dispatch({ type: "closeClickedLayer" })}
        handleClick={(el) => {
          dispatch({ type: "selectObject", value: el });
        }}
        options={state.clickedLayer}
      />
      <ToastContainer />
    </section>
  );
};

export default App;
