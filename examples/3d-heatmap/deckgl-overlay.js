/* global window */
import React, { Component } from 'react';
import ReactMapGL from 'react-map-gl';
import DeckGL, { HexagonLayer, GridCellLayer, GridLayer } from 'deck.gl';

const LIGHT_SETTINGS = {
    lightsPosition: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
    ambientRatio: 0.4,
    diffuseRatio: 0.6,
    specularRatio: 0.2,
    lightsStrength: [0.8, 0.0, 0.8, 0.0],
    numberOfLights: 2
};

const Grid_LIGHT_SETTINGS = {
    lightsPosition: [-122.45, 37.66, 8000, -122, 38, 8000],
    ambientRatio: 0.3,
    diffuseRatio: 0.6,
    specularRatio: 0.4,
    lightsStrength: [1, 0, 0.8, 0],
    numberOfLights: 2
};

const colorRange = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
];

const elevationScale = { min: 1, max: 50 };

const defaultProps = {
    radius: 1000,
    upperPercentile: 100,
    coverage: 1
};

export default class DeckGLOverlay extends Component {

    static get defaultColorRange() {
        return colorRange;
    }

    static get defaultViewport() {
        return {
            longitude: -122.4157267858730052,
            latitude: 37.232395363869415,
            zoom: 7.6,
            minZoom: 9,
            maxZoom: 15,
            pitch: 40.5,
            bearing: -27.396674584323023
        };
    }

    constructor(props) {
        super(props);
        this.startAnimationTimer = null;
        this.intervalTimer = null;
        this.state = {
            elevationScale: elevationScale.min
        };

        this._startAnimate = this._startAnimate.bind(this);
        this._animateHeight = this._animateHeight.bind(this);

    }

    componentDidMount() {
        this._animate();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data.length !== this.props.data.length) {
            this._animate();
        }
    }

    componentWillUnmount() {
        this._stopAnimate();
    }

    _animate() {
        this._stopAnimate();

        // wait 1.5 secs to start animation so that all data are loaded
        this.startAnimationTimer = window.setTimeout(this._startAnimate, 1500);
    }

    _startAnimate() {
        this.intervalTimer = window.setInterval(this._animateHeight, 20);
    }

    _stopAnimate() {
        window.clearTimeout(this.startAnimationTimer);
        window.clearTimeout(this.intervalTimer);
    }

    _animateHeight() {
        if (this.state.elevationScale === elevationScale.max) {
            this._stopAnimate();
        } else {
            this.setState({ elevationScale: this.state.elevationScale + 1 });
        }
    }

    _initialize(gl) {
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }

    render() {
        const { viewport, data, radius, coverage, upperPercentile } = this.props;

        if (!data) {
            return null;
        }

        const GridCellLayerExample = {
            layer: GridCellLayer,
            propTypes: {
                cellSize: { type: 'number', min: 0, max: 1000 }
            },
            props: {
                id: 'gridCellLayer',
                data: [{
                        "value": 0.15789473684210525,
                        "position": [-122.42572433273307, 37.7791106607217]
                    },
                    {
                        "value": 0.35526315789473684,
                        "position": [-122.42004303456184, 37.770127314921595]
                    }
                ],
                cellSize: 500,
                extruded: true,
                pickable: true,
                opacity: 1,
                getColor: g => [245, 166, get(g, 'value') * 255, 255],
                getElevation: h => get(h, 'value') * 5000,
                lightSettings: LIGHT_SETTINGS
            }
        };


        const Gridlayers = [
            new GridLayer({
                id: 'grid-layer',
                colorRange,
                coverage,
                data,
                cellSize: 500,
                extruded: true,
                getPosition: d => d.COORDINATES,
                pickable: true,
                opacity: 1,
                getColor: g => [245, 166, get(g, 'value') * 255, 255],
                getElevation: h => get(h, 'value') * 5000,
                elevationScale: 2,
                lightSettings: LIGHT_SETTINGS
            })
        ];



        const layers = [
            new HexagonLayer({
                id: 'heatmap',
                colorRange,
                coverage,
                data,
                elevationRange: [0, 3000],
                elevationScale: this.state.elevationScale,
                extruded: true,
                getPosition: d => d,
                lightSettings: LIGHT_SETTINGS,
                onHover: this.props.onHover,
                opacity: 1,
                pickable: Boolean(this.props.onHover),
                radius,
                upperPercentile
            })
        ];

        return <DeckGL {...viewport }
        layers = {
            Gridlayers
        }
        onWebGLInitialized = { this._initialize }
        />;
    }
}

DeckGLOverlay.displayName = 'DeckGLOverlay';
DeckGLOverlay.defaultProps = defaultProps;