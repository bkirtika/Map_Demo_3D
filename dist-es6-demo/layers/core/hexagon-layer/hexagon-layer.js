var _createClass = function() {
    function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor); } } return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); }
    subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { CompositeLayer } from '../../../lib';
import HexagonCellLayer from '../hexagon-cell-layer/hexagon-cell-layer';
import { log } from '../../../lib/utils';

import { quantizeScale, linearScale } from '../../../utils/scale-utils';
import { defaultColorRange } from '../../../utils/color-utils';
import { pointToHexbin } from './hexagon-aggregator';

import BinSorter from '../../../utils/bin-sorter';

var defaultProps = {
    colorDomain: null,
    colorRange: defaultColorRange,
    getColorValue: function getColorValue(points) {
        return points.length;
    },
    elevationDomain: null,
    elevationRange: [0, 1000],
    elevationScale: 1,
    lowerPercentile: 0,
    upperPercentile: 100,
    radius: 1000,
    coverage: 1,
    extruded: false,
    hexagonAggregator: pointToHexbin,
    getPosition: function getPosition(x) {
        return x.position;
    },
    fp64: false,
    // Optional settings for 'lighting' shader module
    lightSettings: {
        lightsPosition: [-122.45, 37.75, 8000, -122.0, 38.00, 5000],
        ambientRatio: 0.05,
        diffuseRatio: 0.6,
        specularRatio: 0.8,
        lightsStrength: [2.0, 0.0, 0.0, 0.0],
        numberOfLights: 2
    }
};

var HexagonLayer = function(_CompositeLayer) {
    _inherits(HexagonLayer, _CompositeLayer);

    function HexagonLayer(props) {
        _classCallCheck(this, HexagonLayer);

        if (!props.hexagonAggregator && !props.radius) {
            log.once(0, 'HexagonLayer: Default hexagonAggregator requires radius prop to be set, ' + 'Now using 1000 meter as default');

            props.radius = defaultProps.radius;
        }

        if (Number.isFinite(props.upperPercentile) && (props.upperPercentile > 100 || props.upperPercentile < 0)) {
            log.once(0, 'HexagonLayer: upperPercentile should be between 0 and 100. ' + 'Assign to 100 by default');

            props.upperPercentile = defaultProps.upperPercentile;
        }

        if (Number.isFinite(props.lowerPercentile) && (props.lowerPercentile > 100 || props.lowerPercentile < 0)) {
            log.once(0, 'HexagonLayer: lowerPercentile should be between 0 and 100. ' + 'Assign to 0 by default');

            props.lowerPercentile = defaultProps.upperPercentile;
        }

        if (props.lowerPercentile >= props.upperPercentile) {
            log.once(0, 'HexagonLayer: lowerPercentile should not be bigger than ' + 'upperPercentile. Assign to 0 by default');

            props.lowerPercentile = defaultProps.lowerPercentile;
        }

        return _possibleConstructorReturn(this, (HexagonLayer.__proto__ || Object.getPrototypeOf(HexagonLayer)).call(this, props));
    }

    _createClass(HexagonLayer, [{
        key: 'initializeState',
        value: function initializeState() {
            this.state = {
                hexagons: [],
                hexagonVertices: null,
                sortedBins: null,
                valueDomain: null
            };
        }
    }, {
        key: 'shouldUpdateState',
        value: function shouldUpdateState(_ref) {
            var changeFlags = _ref.changeFlags;

            return changeFlags.somethingChanged;
        }
    }, {
        key: 'updateState',
        value: function updateState(_ref2) {
            var oldProps = _ref2.oldProps,
                props = _ref2.props,
                changeFlags = _ref2.changeFlags;

            if (changeFlags.dataChanged || this.needsReProjectPoints(oldProps, props)) {
                // project data into hexagons, and get sortedBins
                this.getHexagons();
                this.getSortedBins();

                // this needs sortedBins to be set
                this.getValueDomain();
            } else if (this.needsReSortBins(oldProps, props)) {

                this.getSortedBins();
                this.getValueDomain();
            } else if (this.needsRecalculateColorDomain(oldProps, props)) {

                this.getValueDomain();
            }
        }
    }, {
        key: 'needsReProjectPoints',
        value: function needsReProjectPoints(oldProps, props) {
            return oldProps.radius !== props.radius || oldProps.hexagonAggregator !== props.hexagonAggregator;
        }
    }, {
        key: 'needsRecalculateColorDomain',
        value: function needsRecalculateColorDomain(oldProps, props) {
            return oldProps.lowerPercentile !== props.lowerPercentile || oldProps.upperPercentile !== props.upperPercentile;
        }
    }, {
        key: 'needsReSortBins',
        value: function needsReSortBins(oldProps, props) {
            return oldProps.getColorValue !== props.getColorValue;
        }
    }, {
        key: 'getHexagons',
        value: function getHexagons() {
            var hexagonAggregator = this.props.hexagonAggregator;
            var viewport = this.context.viewport;

            var _hexagonAggregator = hexagonAggregator(this.props, viewport),
                hexagons = _hexagonAggregator.hexagons,
                hexagonVertices = _hexagonAggregator.hexagonVertices;

            this.setState({ hexagons: hexagons, hexagonVertices: hexagonVertices });
        }
    }, {
        key: 'getSortedBins',
        value: function getSortedBins() {
            var sortedBins = new BinSorter(this.state.hexagons || [], this.props.getColorValue);
            this.setState({ sortedBins: sortedBins });
        }
    }, {
        key: 'getPickingInfo',
        value: function getPickingInfo(_ref3) {
            var info = _ref3.info;

            var pickedCell = info.picked && info.index > -1 ? this.state.hexagons[info.index] : null;

            return Object.assign(info, {
                picked: Boolean(pickedCell),
                // override object with picked cell
                object: pickedCell
            });
        }
    }, {
        key: 'getUpdateTriggers',
        value: function getUpdateTriggers() {
            return {
                getColor: {
                    colorRange: this.props.colorRange,
                    colorDomain: this.props.colorDomain,
                    getColorValue: this.props.getColorValue,
                    lowerPercentile: this.props.lowerPercentile,
                    upperPercentile: this.props.upperPercentile
                },
                getElevation: {
                    elevationRange: this.props.elevationRange,
                    elevationDomain: this.props.elevationDomain
                }
            };
        }
    }, {
        key: 'getValueDomain',
        value: function getValueDomain() {
            var _props = this.props,
                lowerPercentile = _props.lowerPercentile,
                upperPercentile = _props.upperPercentile;


            this.state.valueDomain = this.state.sortedBins.getValueRange([lowerPercentile, upperPercentile]);
        }
    }, {
        key: '_onGetSublayerColor',
        value: function _onGetSublayerColor(cell) {
            var colorRange = this.props.colorRange;
            var _state = this.state,
                valueDomain = _state.valueDomain,
                sortedBins = _state.sortedBins;

            var value = sortedBins.binMap[cell.index] && sortedBins.binMap[cell.index].value;

            var colorDomain = this.props.colorDomain || valueDomain;
            var color = quantizeScale(colorDomain, colorRange, value);

            // if cell value is outside domain, set alpha to 0
            var alpha = value >= valueDomain[0] && value <= valueDomain[1] ? Number.isFinite(color[3]) ? color[3] : 255 : 0;

            // add final alpha to color
            color[3] = alpha;

            return color;
        }
    }, {
        key: '_onGetSublayerElevation',
        value: function _onGetSublayerElevation(cell) {
            var _props2 = this.props,
                elevationDomain = _props2.elevationDomain,
                elevationRange = _props2.elevationRange;
            var sortedBins = this.state.sortedBins;

            // elevation is based on counts, it is not affected by percentile

            var domain = elevationDomain || [0, sortedBins.maxCount];
            return linearScale(domain, elevationRange, cell.points.length);
        }
    }, {
        key: 'getSubLayerProps',
        value: function getSubLayerProps() {
            // for subclassing, override this method to return
            // customized sub layer props
            var _props3 = this.props,
                id = _props3.id,
                radius = _props3.radius,
                elevationScale = _props3.elevationScale,
                extruded = _props3.extruded,
                coverage = _props3.coverage,
                lightSettings = _props3.lightSettings,
                fp64 = _props3.fp64;

            // base layer props

            var _props4 = this.props,
                opacity = _props4.opacity,
                pickable = _props4.pickable,
                visible = _props4.visible,
                getPolygonOffset = _props4.getPolygonOffset;

            // viewport props

            var _props5 = this.props,
                positionOrigin = _props5.positionOrigin,
                projectionMode = _props5.projectionMode,
                modelMatrix = _props5.modelMatrix;

            // return props to the sublayer constructor

            return {
                id: id + '-hexagon-cell',
                data: this.state.hexagons,
                hexagonVertices: this.state.hexagonVertices,
                radius: radius,
                elevationScale: elevationScale,
                angle: Math.PI,
                extruded: extruded,
                coverage: coverage,
                lightSettings: lightSettings,
                fp64: fp64,
                opacity: opacity,
                pickable: pickable,
                visible: visible,
                getPolygonOffset: getPolygonOffset,
                projectionMode: projectionMode,
                positionOrigin: positionOrigin,
                modelMatrix: modelMatrix,
                getColor: this._onGetSublayerColor.bind(this),
                getElevation: this._onGetSublayerElevation.bind(this),
                updateTriggers: this.getUpdateTriggers()
            };
        }
    }, {
        key: 'getSubLayerClass',
        value: function getSubLayerClass() {
            // for subclassing, override this method to return
            // customized sub layer class
            return HexagonCellLayer;
        }
    }, {
        key: 'renderLayers',
        value: function renderLayers() {
            var SubLayerClass = this.getSubLayerClass();

            return new SubLayerClass(this.getSubLayerProps());
        }
    }]);

    return HexagonLayer;
}(CompositeLayer);

export default HexagonLayer;


HexagonLayer.layerName = 'HexagonLayer';
HexagonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9oZXhhZ29uLWxheWVyL2hleGFnb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zaXRlTGF5ZXIiLCJIZXhhZ29uQ2VsbExheWVyIiwibG9nIiwicXVhbnRpemVTY2FsZSIsImxpbmVhclNjYWxlIiwiZGVmYXVsdENvbG9yUmFuZ2UiLCJwb2ludFRvSGV4YmluIiwiQmluU29ydGVyIiwiZGVmYXVsdFByb3BzIiwiY29sb3JEb21haW4iLCJjb2xvclJhbmdlIiwiZ2V0Q29sb3JWYWx1ZSIsInBvaW50cyIsImxlbmd0aCIsImVsZXZhdGlvbkRvbWFpbiIsImVsZXZhdGlvblJhbmdlIiwiZWxldmF0aW9uU2NhbGUiLCJsb3dlclBlcmNlbnRpbGUiLCJ1cHBlclBlcmNlbnRpbGUiLCJyYWRpdXMiLCJjb3ZlcmFnZSIsImV4dHJ1ZGVkIiwiaGV4YWdvbkFnZ3JlZ2F0b3IiLCJnZXRQb3NpdGlvbiIsIngiLCJwb3NpdGlvbiIsImZwNjQiLCJsaWdodFNldHRpbmdzIiwibGlnaHRzUG9zaXRpb24iLCJhbWJpZW50UmF0aW8iLCJkaWZmdXNlUmF0aW8iLCJzcGVjdWxhclJhdGlvIiwibGlnaHRzU3RyZW5ndGgiLCJudW1iZXJPZkxpZ2h0cyIsIkhleGFnb25MYXllciIsInByb3BzIiwib25jZSIsIk51bWJlciIsImlzRmluaXRlIiwic3RhdGUiLCJoZXhhZ29ucyIsImhleGFnb25WZXJ0aWNlcyIsInNvcnRlZEJpbnMiLCJ2YWx1ZURvbWFpbiIsImNoYW5nZUZsYWdzIiwic29tZXRoaW5nQ2hhbmdlZCIsIm9sZFByb3BzIiwiZGF0YUNoYW5nZWQiLCJuZWVkc1JlUHJvamVjdFBvaW50cyIsImdldEhleGFnb25zIiwiZ2V0U29ydGVkQmlucyIsImdldFZhbHVlRG9tYWluIiwibmVlZHNSZVNvcnRCaW5zIiwibmVlZHNSZWNhbGN1bGF0ZUNvbG9yRG9tYWluIiwidmlld3BvcnQiLCJjb250ZXh0Iiwic2V0U3RhdGUiLCJpbmZvIiwicGlja2VkQ2VsbCIsInBpY2tlZCIsImluZGV4IiwiT2JqZWN0IiwiYXNzaWduIiwiQm9vbGVhbiIsIm9iamVjdCIsImdldENvbG9yIiwiZ2V0RWxldmF0aW9uIiwiZ2V0VmFsdWVSYW5nZSIsImNlbGwiLCJ2YWx1ZSIsImJpbk1hcCIsImNvbG9yIiwiYWxwaGEiLCJkb21haW4iLCJtYXhDb3VudCIsImlkIiwib3BhY2l0eSIsInBpY2thYmxlIiwidmlzaWJsZSIsImdldFBvbHlnb25PZmZzZXQiLCJwb3NpdGlvbk9yaWdpbiIsInByb2plY3Rpb25Nb2RlIiwibW9kZWxNYXRyaXgiLCJkYXRhIiwiYW5nbGUiLCJNYXRoIiwiUEkiLCJfb25HZXRTdWJsYXllckNvbG9yIiwiYmluZCIsIl9vbkdldFN1YmxheWVyRWxldmF0aW9uIiwidXBkYXRlVHJpZ2dlcnMiLCJnZXRVcGRhdGVUcmlnZ2VycyIsIlN1YkxheWVyQ2xhc3MiLCJnZXRTdWJMYXllckNsYXNzIiwiZ2V0U3ViTGF5ZXJQcm9wcyIsImxheWVyTmFtZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxTQUFRQSxjQUFSLFFBQTZCLGNBQTdCO0FBQ0EsT0FBT0MsZ0JBQVAsTUFBNkIsMENBQTdCO0FBQ0EsU0FBUUMsR0FBUixRQUFrQixvQkFBbEI7O0FBRUEsU0FBUUMsYUFBUixFQUF1QkMsV0FBdkIsUUFBeUMsNEJBQXpDO0FBQ0EsU0FBUUMsaUJBQVIsUUFBZ0MsNEJBQWhDO0FBQ0EsU0FBUUMsYUFBUixRQUE0QixzQkFBNUI7O0FBRUEsT0FBT0MsU0FBUCxNQUFzQiwyQkFBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsZUFBYSxJQURNO0FBRW5CQyxjQUFZTCxpQkFGTztBQUduQk0saUJBQWU7QUFBQSxXQUFVQyxPQUFPQyxNQUFqQjtBQUFBLEdBSEk7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QUFPLElBQUlELGFBQUosQ0FDTCxLQUFLRSxnQkFBTCxFQURLLENBQVA7QUFHRDs7OztFQTNNdUM5RixjOztlQUFyQmtDLFk7OztBQThNckJBLGFBQWE2RCxTQUFiLEdBQXlCLGNBQXpCO0FBQ0E3RCxhQUFhMUIsWUFBYixHQUE0QkEsWUFBNUIiLCJmaWxlIjoiaGV4YWdvbi1sYXllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5pbXBvcnQge0NvbXBvc2l0ZUxheWVyfSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IEhleGFnb25DZWxsTGF5ZXIgZnJvbSAnLi4vaGV4YWdvbi1jZWxsLWxheWVyL2hleGFnb24tY2VsbC1sYXllcic7XG5pbXBvcnQge2xvZ30gZnJvbSAnLi4vLi4vLi4vbGliL3V0aWxzJztcblxuaW1wb3J0IHtxdWFudGl6ZVNjYWxlLCBsaW5lYXJTY2FsZX0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvc2NhbGUtdXRpbHMnO1xuaW1wb3J0IHtkZWZhdWx0Q29sb3JSYW5nZX0gZnJvbSAnLi4vLi4vLi4vdXRpbHMvY29sb3ItdXRpbHMnO1xuaW1wb3J0IHtwb2ludFRvSGV4YmlufSBmcm9tICcuL2hleGFnb24tYWdncmVnYXRvcic7XG5cbmltcG9ydCBCaW5Tb3J0ZXIgZnJvbSAnLi4vLi4vLi4vdXRpbHMvYmluLXNvcnRlcic7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgY29sb3JEb21haW46IG51bGwsXG4gIGNvbG9yUmFuZ2U6IGRlZmF1bHRDb2xvclJhbmdlLFxuICBnZXRDb2xvclZhbHVlOiBwb2ludHMgPT4gcG9pbnRzLmxlbmd0aCxcbiAgZWxldmF0aW9uRG9tYWluOiBudWxsLFxuICBlbGV2YXRpb25SYW5nZTogWzAsIDEwMDBdLFxuICBlbGV2YXRpb25TY2FsZTogMSxcbiAgbG93ZXJQZXJjZW50aWxlOiAwLFxuICB1cHBlclBlcmNlbnRpbGU6IDEwMCxcbiAgcmFkaXVzOiAxMDAwLFxuICBjb3ZlcmFnZTogMSxcbiAgZXh0cnVkZWQ6IGZhbHNlLFxuICBoZXhhZ29uQWdncmVnYXRvcjogcG9pbnRUb0hleGJpbixcbiAgZ2V0UG9zaXRpb246IHggPT4geC5wb3NpdGlvbixcbiAgZnA2NDogZmFsc2UsXG4gIC8vIE9wdGlvbmFsIHNldHRpbmdzIGZvciAnbGlnaHRpbmcnIHNoYWRlciBtb2R1bGVcbiAgbGlnaHRTZXR0aW5nczoge1xuICAgIGxpZ2h0c1Bvc2l0aW9uOiBbLTEyMi40NSwgMzcuNzUsIDgwMDAsIC0xMjIuMCwgMzguMDAsIDUwMDBdLFxuICAgIGFtYmllbnRSYXRpbzogMC4wNSxcbiAgICBkaWZmdXNlUmF0aW86IDAuNixcbiAgICBzcGVjdWxhclJhdGlvOiAwLjgsXG4gICAgbGlnaHRzU3RyZW5ndGg6IFsyLjAsIDAuMCwgMC4wLCAwLjBdLFxuICAgIG51bWJlck9mTGlnaHRzOiAyXG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhleGFnb25MYXllciBleHRlbmRzIENvbXBvc2l0ZUxheWVyIHtcbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBpZiAoIXByb3BzLmhleGFnb25BZ2dyZWdhdG9yICYmICFwcm9wcy5yYWRpdXMpIHtcbiAgICAgIGxvZy5vbmNlKDAsICdIZXhhZ29uTGF5ZXI6IERlZmF1bHQgaGV4YWdvbkFnZ3JlZ2F0b3IgcmVxdWlyZXMgcmFkaXVzIHByb3AgdG8gYmUgc2V0LCAnICtcbiAgICAgICAgJ05vdyB1c2luZyAxMDAwIG1ldGVyIGFzIGRlZmF1bHQnKTtcblxuICAgICAgcHJvcHMucmFkaXVzID0gZGVmYXVsdFByb3BzLnJhZGl1cztcbiAgICB9XG5cbiAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHByb3BzLnVwcGVyUGVyY2VudGlsZSkgJiZcbiAgICAgIChwcm9wcy51cHBlclBlcmNlbnRpbGUgPiAxMDAgfHwgcHJvcHMudXBwZXJQZXJjZW50aWxlIDwgMCkpIHtcbiAgICAgIGxvZy5vbmNlKDAsICdIZXhhZ29uTGF5ZXI6IHVwcGVyUGVyY2VudGlsZSBzaG91bGQgYmUgYmV0d2VlbiAwIGFuZCAxMDAuICcgK1xuICAgICAgICAnQXNzaWduIHRvIDEwMCBieSBkZWZhdWx0Jyk7XG5cbiAgICAgIHByb3BzLnVwcGVyUGVyY2VudGlsZSA9IGRlZmF1bHRQcm9wcy51cHBlclBlcmNlbnRpbGU7XG4gICAgfVxuXG4gICAgaWYgKE51bWJlci5pc0Zpbml0ZShwcm9wcy5sb3dlclBlcmNlbnRpbGUpICYmXG4gICAgICAocHJvcHMubG93ZXJQZXJjZW50aWxlID4gMTAwIHx8IHByb3BzLmxvd2VyUGVyY2VudGlsZSA8IDApKSB7XG4gICAgICBsb2cub25jZSgwLCAnSGV4YWdvbkxheWVyOiBsb3dlclBlcmNlbnRpbGUgc2hvdWxkIGJlIGJldHdlZW4gMCBhbmQgMTAwLiAnICtcbiAgICAgICAgJ0Fzc2lnbiB0byAwIGJ5IGRlZmF1bHQnKTtcblxuICAgICAgcHJvcHMubG93ZXJQZXJjZW50aWxlID0gZGVmYXVsdFByb3BzLnVwcGVyUGVyY2VudGlsZTtcbiAgICB9XG5cbiAgICBpZiAocHJvcHMubG93ZXJQZXJjZW50aWxlID49IHByb3BzLnVwcGVyUGVyY2VudGlsZSkge1xuICAgICAgbG9nLm9uY2UoMCwgJ0hleGFnb25MYXllcjogbG93ZXJQZXJjZW50aWxlIHNob3VsZCBub3QgYmUgYmlnZ2VyIHRoYW4gJyArXG4gICAgICAgICd1cHBlclBlcmNlbnRpbGUuIEFzc2lnbiB0byAwIGJ5IGRlZmF1bHQnKTtcblxuICAgICAgcHJvcHMubG93ZXJQZXJjZW50aWxlID0gZGVmYXVsdFByb3BzLmxvd2VyUGVyY2VudGlsZTtcbiAgICB9XG5cbiAgICBzdXBlcihwcm9wcyk7XG4gIH1cblxuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGhleGFnb25zOiBbXSxcbiAgICAgIGhleGFnb25WZXJ0aWNlczogbnVsbCxcbiAgICAgIHNvcnRlZEJpbnM6IG51bGwsXG4gICAgICB2YWx1ZURvbWFpbjogbnVsbFxuICAgIH07XG4gIH1cblxuICBzaG91bGRVcGRhdGVTdGF0ZSh7Y2hhbmdlRmxhZ3N9KSB7XG4gICAgcmV0dXJuIGNoYW5nZUZsYWdzLnNvbWV0aGluZ0NoYW5nZWQ7XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHwgdGhpcy5uZWVkc1JlUHJvamVjdFBvaW50cyhvbGRQcm9wcywgcHJvcHMpKSB7XG4gICAgICAvLyBwcm9qZWN0IGRhdGEgaW50byBoZXhhZ29ucywgYW5kIGdldCBzb3J0ZWRCaW5zXG4gICAgICB0aGlzLmdldEhleGFnb25zKCk7XG4gICAgICB0aGlzLmdldFNvcnRlZEJpbnMoKTtcblxuICAgICAgLy8gdGhpcyBuZWVkcyBzb3J0ZWRCaW5zIHRvIGJlIHNldFxuICAgICAgdGhpcy5nZXRWYWx1ZURvbWFpbigpO1xuXG4gICAgfSBlbHNlIGlmICh0aGlzLm5lZWRzUmVTb3J0QmlucyhvbGRQcm9wcywgcHJvcHMpKSB7XG5cbiAgICAgIHRoaXMuZ2V0U29ydGVkQmlucygpO1xuICAgICAgdGhpcy5nZXRWYWx1ZURvbWFpbigpO1xuXG4gICAgfSBlbHNlIGlmICh0aGlzLm5lZWRzUmVjYWxjdWxhdGVDb2xvckRvbWFpbihvbGRQcm9wcywgcHJvcHMpKSB7XG5cbiAgICAgIHRoaXMuZ2V0VmFsdWVEb21haW4oKTtcbiAgICB9XG4gIH1cblxuICBuZWVkc1JlUHJvamVjdFBvaW50cyhvbGRQcm9wcywgcHJvcHMpIHtcbiAgICByZXR1cm4gb2xkUHJvcHMucmFkaXVzICE9PSBwcm9wcy5yYWRpdXMgfHxcbiAgICAgIG9sZFByb3BzLmhleGFnb25BZ2dyZWdhdG9yICE9PSBwcm9wcy5oZXhhZ29uQWdncmVnYXRvcjtcbiAgfVxuXG4gIG5lZWRzUmVjYWxjdWxhdGVDb2xvckRvbWFpbihvbGRQcm9wcywgcHJvcHMpIHtcbiAgICByZXR1cm4gb2xkUHJvcHMubG93ZXJQZXJjZW50aWxlICE9PSBwcm9wcy5sb3dlclBlcmNlbnRpbGUgfHxcbiAgICAgIG9sZFByb3BzLnVwcGVyUGVyY2VudGlsZSAhPT0gcHJvcHMudXBwZXJQZXJjZW50aWxlO1xuICB9XG5cbiAgbmVlZHNSZVNvcnRCaW5zKG9sZFByb3BzLCBwcm9wcykge1xuICAgIHJldHVybiBvbGRQcm9wcy5nZXRDb2xvclZhbHVlICE9PSBwcm9wcy5nZXRDb2xvclZhbHVlO1xuICB9XG5cbiAgZ2V0SGV4YWdvbnMoKSB7XG4gICAgY29uc3Qge2hleGFnb25BZ2dyZWdhdG9yfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge3ZpZXdwb3J0fSA9IHRoaXMuY29udGV4dDtcbiAgICBjb25zdCB7aGV4YWdvbnMsIGhleGFnb25WZXJ0aWNlc30gPSBoZXhhZ29uQWdncmVnYXRvcih0aGlzLnByb3BzLCB2aWV3cG9ydCk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7aGV4YWdvbnMsIGhleGFnb25WZXJ0aWNlc30pO1xuICB9XG5cbiAgZ2V0U29ydGVkQmlucygpIHtcbiAgICBjb25zdCBzb3J0ZWRCaW5zID0gbmV3IEJpblNvcnRlcih0aGlzLnN0YXRlLmhleGFnb25zIHx8IFtdLCB0aGlzLnByb3BzLmdldENvbG9yVmFsdWUpO1xuICAgIHRoaXMuc2V0U3RhdGUoe3NvcnRlZEJpbnN9KTtcbiAgfVxuXG4gIGdldFBpY2tpbmdJbmZvKHtpbmZvfSkge1xuICAgIGNvbnN0IHBpY2tlZENlbGwgPSBpbmZvLnBpY2tlZCAmJiBpbmZvLmluZGV4ID4gLTEgP1xuICAgICAgdGhpcy5zdGF0ZS5oZXhhZ29uc1tpbmZvLmluZGV4XSA6IG51bGw7XG5cbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihpbmZvLCB7XG4gICAgICBwaWNrZWQ6IEJvb2xlYW4ocGlja2VkQ2VsbCksXG4gICAgICAvLyBvdmVycmlkZSBvYmplY3Qgd2l0aCBwaWNrZWQgY2VsbFxuICAgICAgb2JqZWN0OiBwaWNrZWRDZWxsXG4gICAgfSk7XG4gIH1cblxuICBnZXRVcGRhdGVUcmlnZ2VycygpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZ2V0Q29sb3I6IHtcbiAgICAgICAgY29sb3JSYW5nZTogdGhpcy5wcm9wcy5jb2xvclJhbmdlLFxuICAgICAgICBjb2xvckRvbWFpbjogdGhpcy5wcm9wcy5jb2xvckRvbWFpbixcbiAgICAgICAgZ2V0Q29sb3JWYWx1ZTogdGhpcy5wcm9wcy5nZXRDb2xvclZhbHVlLFxuICAgICAgICBsb3dlclBlcmNlbnRpbGU6IHRoaXMucHJvcHMubG93ZXJQZXJjZW50aWxlLFxuICAgICAgICB1cHBlclBlcmNlbnRpbGU6IHRoaXMucHJvcHMudXBwZXJQZXJjZW50aWxlXG4gICAgICB9LFxuICAgICAgZ2V0RWxldmF0aW9uOiB7XG4gICAgICAgIGVsZXZhdGlvblJhbmdlOiB0aGlzLnByb3BzLmVsZXZhdGlvblJhbmdlLFxuICAgICAgICBlbGV2YXRpb25Eb21haW46IHRoaXMucHJvcHMuZWxldmF0aW9uRG9tYWluXG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGdldFZhbHVlRG9tYWluKCkge1xuICAgIGNvbnN0IHtsb3dlclBlcmNlbnRpbGUsIHVwcGVyUGVyY2VudGlsZX0gPSB0aGlzLnByb3BzO1xuXG4gICAgdGhpcy5zdGF0ZS52YWx1ZURvbWFpbiA9IHRoaXMuc3RhdGUuc29ydGVkQmluc1xuICAgICAgLmdldFZhbHVlUmFuZ2UoW2xvd2VyUGVyY2VudGlsZSwgdXBwZXJQZXJjZW50aWxlXSk7XG4gIH1cblxuICBfb25HZXRTdWJsYXllckNvbG9yKGNlbGwpIHtcbiAgICBjb25zdCB7Y29sb3JSYW5nZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZURvbWFpbiwgc29ydGVkQmluc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHZhbHVlID0gc29ydGVkQmlucy5iaW5NYXBbY2VsbC5pbmRleF0gJiYgc29ydGVkQmlucy5iaW5NYXBbY2VsbC5pbmRleF0udmFsdWU7XG5cbiAgICBjb25zdCBjb2xvckRvbWFpbiA9IHRoaXMucHJvcHMuY29sb3JEb21haW4gfHwgdmFsdWVEb21haW47XG4gICAgY29uc3QgY29sb3IgPSBxdWFudGl6ZVNjYWxlKGNvbG9yRG9tYWluLCBjb2xvclJhbmdlLCB2YWx1ZSk7XG5cbiAgICAvLyBpZiBjZWxsIHZhbHVlIGlzIG91dHNpZGUgZG9tYWluLCBzZXQgYWxwaGEgdG8gMFxuICAgIGNvbnN0IGFscGhhID0gdmFsdWUgPj0gdmFsdWVEb21haW5bMF0gJiYgdmFsdWUgPD0gdmFsdWVEb21haW5bMV0gP1xuICAgICAgKE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IDI1NSkgOiAwO1xuXG4gICAgLy8gYWRkIGZpbmFsIGFscGhhIHRvIGNvbG9yXG4gICAgY29sb3JbM10gPSBhbHBoYTtcblxuICAgIHJldHVybiBjb2xvcjtcbiAgfVxuXG4gIF9vbkdldFN1YmxheWVyRWxldmF0aW9uKGNlbGwpIHtcbiAgICBjb25zdCB7ZWxldmF0aW9uRG9tYWluLCBlbGV2YXRpb25SYW5nZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtzb3J0ZWRCaW5zfSA9IHRoaXMuc3RhdGU7XG5cbiAgICAvLyBlbGV2YXRpb24gaXMgYmFzZWQgb24gY291bnRzLCBpdCBpcyBub3QgYWZmZWN0ZWQgYnkgcGVyY2VudGlsZVxuICAgIGNvbnN0IGRvbWFpbiA9IGVsZXZhdGlvbkRvbWFpbiB8fCBbMCwgc29ydGVkQmlucy5tYXhDb3VudF07XG4gICAgcmV0dXJuIGxpbmVhclNjYWxlKGRvbWFpbiwgZWxldmF0aW9uUmFuZ2UsIGNlbGwucG9pbnRzLmxlbmd0aCk7XG4gIH1cblxuICBnZXRTdWJMYXllclByb3BzKCkge1xuICAgIC8vIGZvciBzdWJjbGFzc2luZywgb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gcmV0dXJuXG4gICAgLy8gY3VzdG9taXplZCBzdWIgbGF5ZXIgcHJvcHNcbiAgICBjb25zdCB7aWQsIHJhZGl1cywgZWxldmF0aW9uU2NhbGUsIGV4dHJ1ZGVkLCBjb3ZlcmFnZSwgbGlnaHRTZXR0aW5ncywgZnA2NH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gYmFzZSBsYXllciBwcm9wc1xuICAgIGNvbnN0IHtvcGFjaXR5LCBwaWNrYWJsZSwgdmlzaWJsZSwgZ2V0UG9seWdvbk9mZnNldH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gdmlld3BvcnQgcHJvcHNcbiAgICBjb25zdCB7cG9zaXRpb25PcmlnaW4sIHByb2plY3Rpb25Nb2RlLCBtb2RlbE1hdHJpeH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gcmV0dXJuIHByb3BzIHRvIHRoZSBzdWJsYXllciBjb25zdHJ1Y3RvclxuICAgIHJldHVybiB7XG4gICAgICBpZDogYCR7aWR9LWhleGFnb24tY2VsbGAsXG4gICAgICBkYXRhOiB0aGlzLnN0YXRlLmhleGFnb25zLFxuICAgICAgaGV4YWdvblZlcnRpY2VzOiB0aGlzLnN0YXRlLmhleGFnb25WZXJ0aWNlcyxcbiAgICAgIHJhZGl1cyxcbiAgICAgIGVsZXZhdGlvblNjYWxlLFxuICAgICAgYW5nbGU6IE1hdGguUEksXG4gICAgICBleHRydWRlZCxcbiAgICAgIGNvdmVyYWdlLFxuICAgICAgbGlnaHRTZXR0aW5ncyxcbiAgICAgIGZwNjQsXG4gICAgICBvcGFjaXR5LFxuICAgICAgcGlja2FibGUsXG4gICAgICB2aXNpYmxlLFxuICAgICAgZ2V0UG9seWdvbk9mZnNldCxcbiAgICAgIHByb2plY3Rpb25Nb2RlLFxuICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICBtb2RlbE1hdHJpeCxcbiAgICAgIGdldENvbG9yOiB0aGlzLl9vbkdldFN1YmxheWVyQ29sb3IuYmluZCh0aGlzKSxcbiAgICAgIGdldEVsZXZhdGlvbjogdGhpcy5fb25HZXRTdWJsYXllckVsZXZhdGlvbi5iaW5kKHRoaXMpLFxuICAgICAgdXBkYXRlVHJpZ2dlcnM6IHRoaXMuZ2V0VXBkYXRlVHJpZ2dlcnMoKVxuICAgIH07XG4gIH1cblxuICBnZXRTdWJMYXllckNsYXNzKCkge1xuICAgIC8vIGZvciBzdWJjbGFzc2luZywgb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gcmV0dXJuXG4gICAgLy8gY3VzdG9taXplZCBzdWIgbGF5ZXIgY2xhc3NcbiAgICByZXR1cm4gSGV4YWdvbkNlbGxMYXllcjtcbiAgfVxuXG4gIHJlbmRlckxheWVycygpIHtcbiAgICBjb25zdCBTdWJMYXllckNsYXNzID0gdGhpcy5nZXRTdWJMYXllckNsYXNzKCk7XG5cbiAgICByZXR1cm4gbmV3IFN1YkxheWVyQ2xhc3MoXG4gICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoKVxuICAgICk7XG4gIH1cbn1cblxuSGV4YWdvbkxheWVyLmxheWVyTmFtZSA9ICdIZXhhZ29uTGF5ZXInO1xuSGV4YWdvbkxheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==