var _createClass = function() {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }
    return function(Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; };
}();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); }
    subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

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
import GridCellLayer from '../grid-cell-layer/grid-cell-layer';

import { pointToDensityGridData } from './grid-aggregator';
import { linearScale, quantizeScale } from '../../../utils/scale-utils';
import { defaultColorRange } from '../../../utils/color-utils';

import BinSorter from '../../../utils/bin-sorter';

var defaultProps = {
    cellSize: 1000,
    colorRange: defaultColorRange,
    colorDomain: null,
    elevationRange: [0, 1000],
    elevationDomain: null,
    elevationScale: 1,
    lowerPercentile: 0,
    upperPercentile: 100,
    coverage: 1,
    getPosition: function getPosition(x) {
        return x.position;
    },
    getColorValue: function getColorValue(counts) {
        return counts;
    },
    extruded: false,
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

var GridLayer = function(_CompositeLayer) {
    _inherits(GridLayer, _CompositeLayer);

    function GridLayer() {
        _classCallCheck(this, GridLayer);

        return _possibleConstructorReturn(this, (GridLayer.__proto__ || Object.getPrototypeOf(GridLayer)).apply(this, arguments));
    }

    _createClass(GridLayer, [{
        key: 'initializeState',
        value: function initializeState() {
            this.state = {
                layerData: [],
                sortedBins: null,
                valueDomain: null
            };
        }
    }, {
        key: 'updateState',
        value: function updateState(_ref) {
            var oldProps = _ref.oldProps,
                props = _ref.props,
                changeFlags = _ref.changeFlags;

            if (changeFlags.dataChanged || this.needsReProjectPoints(oldProps, props)) {
                // project data into hexagons, and get sortedBins
                this.getLayerData();
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
            return oldProps.cellSize !== props.cellSize;
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
        key: 'getLayerData',
        value: function getLayerData() {
            var _props = this.props,
                data = _props.data,
                cellSize = _props.cellSize,
                getPosition = _props.getPosition;

            var layerData = data;

            this.setState({ layerData: layerData });
        }
    }, {
        key: 'getSortedBins',
        value: function getSortedBins() {
            var sortedBins = new BinSorter(this.state.layerData || [], this.props.getColorValue);
            this.setState({ sortedBins: sortedBins });
        }
    }, {
        key: 'getValueDomain',
        value: function getValueDomain() {
            var _props2 = this.props,
                lowerPercentile = _props2.lowerPercentile,
                upperPercentile = _props2.upperPercentile;


            this.state.valueDomain = this.state.sortedBins.getValueRange([lowerPercentile, upperPercentile]);
            // this.state.valueDomain = [1, 2];
        }
    }, {
        key: 'getPickingInfo',
        value: function getPickingInfo(_ref2) {
            var info = _ref2.info;

            var pickedCell = info.picked && info.index > -1 ? this.state.layerData[info.index] : null;

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
        key: '_onGetSublayerColor',
        value: function _onGetSublayerColor(cell) {
            return cell.color;
        }
    }, {
        key: '_onGetSublayerElevation',
        value: function _onGetSublayerElevation(cell) {
            var _props3 = this.props,
                elevationDomain = _props3.elevationDomain,
                elevationRange = _props3.elevationRange;
            var sortedBins = this.state.sortedBins;

            // elevation is based on counts, it is not affected by percentile

            var domain = elevationDomain || [0, sortedBins.maxCount];
            return linearScale(domain, elevationRange, cell.count);
        }
    }, {
        key: 'getSubLayerProps',
        value: function getSubLayerProps() {
            // for subclassing, override this method to return
            // customized sub layer props
            var _props4 = this.props,
                id = _props4.id,
                elevationScale = _props4.elevationScale,
                fp64 = _props4.fp64,
                extruded = _props4.extruded,
                cellSize = _props4.cellSize,
                coverage = _props4.coverage,
                lightSettings = _props4.lightSettings;

            // base layer props

            var _props5 = this.props,
                opacity = _props5.opacity,
                pickable = _props5.pickable,
                visible = _props5.visible,
                getPolygonOffset = _props5.getPolygonOffset;

            // viewport props

            var _props6 = this.props,
                positionOrigin = _props6.positionOrigin,
                projectionMode = _props6.projectionMode,
                modelMatrix = _props6.modelMatrix;

            // return props to the sublayer constructor

            return {
                id: id + '-grid-cell',
                data: this.state.layerData,
                cellSize: cellSize,
                coverage: coverage,
                lightSettings: lightSettings,
                elevationScale: elevationScale,
                extruded: extruded,
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
                getPosition: function getPosition(d) {
                    return d.position;
                },
                updateTriggers: this.getUpdateTriggers()
            };
        }
    }, {
        key: 'getSubLayerClass',
        value: function getSubLayerClass() {
            // for subclassing, override this method to return
            // customized sub layer class
            return GridCellLayer;
        }
    }, {
        key: 'renderLayers',
        value: function renderLayers() {
            var SubLayerClass = this.getSubLayerClass();

            return new SubLayerClass(this.getSubLayerProps());
        }
    }]);

    return GridLayer;
}(CompositeLayer);

export default GridLayer;


GridLayer.layerName = 'GridLayer';
GridLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9ncmlkLWxheWVyL2dyaWQtbGF5ZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zaXRlTGF5ZXIiLCJHcmlkQ2VsbExheWVyIiwicG9pbnRUb0RlbnNpdHlHcmlkRGF0YSIsImxpbmVhclNjYWxlIiwicXVhbnRpemVTY2FsZSIsImRlZmF1bHRDb2xvclJhbmdlIiwiQmluU29ydGVyIiwiZGVmYXVsdFByb3BzIiwiY2VsbFNpemUiLCJjb2xvclJhbmdlIiwiY29sb3JEb21haW4iLCJlbGV2YXRpb25SYW5nZSIsImVsZXZhdGlvbkRvbWFpbiIsImVsZXZhdGlvblNjYWxlIiwibG93ZXJQZXJjZW50aWxlIiwidXBwZXJQZXJjZW50aWxlIiwiY292ZXJhZ2UiLCJnZXRQb3NpdGlvbiIsIngiLCJwb3NpdGlvbiIsImdldENvbG9yVmFsdWUiLCJwb2ludHMiLCJsZW5ndGgiLCJleHRydWRlZCIsImZwNjQiLCJsaWdodFNldHRpbmdzIiwibGlnaHRzUG9zaXRpb24iLCJhbWJpZW50UmF0aW8iLCJkaWZmdXNlUmF0aW8iLCJzcGVjdWxhclJhdGlvIiwibGlnaHRzU3RyZW5ndGgiLCJudW1iZXJPZkxpZ2h0cyIsIkdyaWRMYXllciIsInN0YXRlIiwibGF5ZXJEYXRhIiwic29ydGVkQmlucyIsInZhbHVlRG9tYWluIiwib2xkUHJvcHMiLCJwcm9wcyIsImNoYW5nZUZsYWdzIiwiZGF0YUNoYW5nZWQiLCJuZWVkc1JlUHJvamVjdFBvaW50cyIsImdldExheWVyRGF0YSIsImdldFNvcnRlZEJpbnMiLCJnZXRWYWx1ZURvbWFpbiIsIm5lZWRzUmVTb3J0QmlucyIsIm5lZWRzUmVjYWxjdWxhdGVDb2xvckRvbWFpbiIsImRhdGEiLCJzZXRTdGF0ZSIsImdldFZhbHVlUmFuZ2UiLCJpbmZvIiwicGlja2VkQ2VsbCIsInBpY2tlZCIsImluZGV4IiwiT2JqZWN0IiwiYXNzaWduIiwiQm9vbGVhbiIsIm9iamVjdCIsImdldENvbG9yIiwiZ2V0RWxldmF0aW9uIiwiY2VsbCIsInZhbHVlIiwiYmluTWFwIiwiY29sb3IiLCJhbHBoYSIsIk51bWJlciIsImlzRmluaXRlIiwiZG9tYWluIiwibWF4Q291bnQiLCJpZCIsIm9wYWNpdHkiLCJwaWNrYWJsZSIsInZpc2libGUiLCJnZXRQb2x5Z29uT2Zmc2V0IiwicG9zaXRpb25PcmlnaW4iLCJwcm9qZWN0aW9uTW9kZSIsIm1vZGVsTWF0cml4IiwiX29uR2V0U3VibGF5ZXJDb2xvciIsImJpbmQiLCJfb25HZXRTdWJsYXllckVsZXZhdGlvbiIsImQiLCJ1cGRhdGVUcmlnZ2VycyIsImdldFVwZGF0ZVRyaWdnZXJzIiwiU3ViTGF5ZXJDbGFzcyIsImdldFN1YkxheWVyQ2xhc3MiLCJnZXRTdWJMYXllclByb3BzIiwibGF5ZXJOYW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVFBLGNBQVIsUUFBNkIsY0FBN0I7QUFDQSxPQUFPQyxhQUFQLE1BQTBCLG9DQUExQjs7QUFFQSxTQUFRQyxzQkFBUixRQUFxQyxtQkFBckM7QUFDQSxTQUFRQyxXQUFSLEVBQXFCQyxhQUFyQixRQUF5Qyw0QkFBekM7QUFDQSxTQUFRQyxpQkFBUixRQUFnQyw0QkFBaEM7O0FBRUEsT0FBT0MsU0FBUCxNQUFzQiwyQkFBdEI7O0FBRUEsSUFBTUMsZUFBZTtBQUNuQkMsWUFBVSxJQURTO0FBRW5CQyxjQUFZSixpQkFGTztBQUduQkssZUFBYSxJQUhNO0FBSW5CQyxrQkFBZ0IsQ0FBQyxDQUFELEVBQUksSUFBSixDQUpHO0FBS25CQyxtQkFBaUIsSUFMRTtBQU1uQkMsa0JBQWdCLENBTkc7QUFPbkJDLG1CQUFpQixDQVBFO0FBUW5CQyxtQkFBaUIsR0FSRTtBQVNuQkMsWUFBVSxDQVRTO0FBVW5CQyxlQUFhO0FBQUEsV0FBS0MsRUFBRUMsUUFB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Ly8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7Q29tcG9zaXRlTGF5ZXJ9IGZyb20gJy4uLy4uLy4uL2xpYic7XG5pbXBvcnQgR3JpZENlbGxMYXllciBmcm9tICcuLi9ncmlkLWNlbGwtbGF5ZXIvZ3JpZC1jZWxsLWxheWVyJztcblxuaW1wb3J0IHtwb2ludFRvRGVuc2l0eUdyaWREYXRhfSBmcm9tICcuL2dyaWQtYWdncmVnYXRvcic7XG5pbXBvcnQge2xpbmVhclNjYWxlLCBxdWFudGl6ZVNjYWxlfSBmcm9tICcuLi8uLi8uLi91dGlscy9zY2FsZS11dGlscyc7XG5pbXBvcnQge2RlZmF1bHRDb2xvclJhbmdlfSBmcm9tICcuLi8uLi8uLi91dGlscy9jb2xvci11dGlscyc7XG5cbmltcG9ydCBCaW5Tb3J0ZXIgZnJvbSAnLi4vLi4vLi4vdXRpbHMvYmluLXNvcnRlcic7XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgY2VsbFNpemU6IDEwMDAsXG4gIGNvbG9yUmFuZ2U6IGRlZmF1bHRDb2xvclJhbmdlLFxuICBjb2xvckRvbWFpbjogbnVsbCxcbiAgZWxldmF0aW9uUmFuZ2U6IFswLCAxMDAwXSxcbiAgZWxldmF0aW9uRG9tYWluOiBudWxsLFxuICBlbGV2YXRpb25TY2FsZTogMSxcbiAgbG93ZXJQZXJjZW50aWxlOiAwLFxuICB1cHBlclBlcmNlbnRpbGU6IDEwMCxcbiAgY292ZXJhZ2U6IDEsXG4gIGdldFBvc2l0aW9uOiB4ID0+IHgucG9zaXRpb24sXG4gIGdldENvbG9yVmFsdWU6IHBvaW50cyA9PiBwb2ludHMubGVuZ3RoLFxuICBleHRydWRlZDogZmFsc2UsXG4gIGZwNjQ6IGZhbHNlLFxuICAvLyBPcHRpb25hbCBzZXR0aW5ncyBmb3IgJ2xpZ2h0aW5nJyBzaGFkZXIgbW9kdWxlXG4gIGxpZ2h0U2V0dGluZ3M6IHtcbiAgICBsaWdodHNQb3NpdGlvbjogWy0xMjIuNDUsIDM3Ljc1LCA4MDAwLCAtMTIyLjAsIDM4LjAwLCA1MDAwXSxcbiAgICBhbWJpZW50UmF0aW86IDAuMDUsXG4gICAgZGlmZnVzZVJhdGlvOiAwLjYsXG4gICAgc3BlY3VsYXJSYXRpbzogMC44LFxuICAgIGxpZ2h0c1N0cmVuZ3RoOiBbMi4wLCAwLjAsIDAuMCwgMC4wXSxcbiAgICBudW1iZXJPZkxpZ2h0czogMlxuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHcmlkTGF5ZXIgZXh0ZW5kcyBDb21wb3NpdGVMYXllciB7XG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgbGF5ZXJEYXRhOiBbXSxcbiAgICAgIHNvcnRlZEJpbnM6IG51bGwsXG4gICAgICB2YWx1ZURvbWFpbjogbnVsbFxuICAgIH07XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQgfHwgdGhpcy5uZWVkc1JlUHJvamVjdFBvaW50cyhvbGRQcm9wcywgcHJvcHMpKSB7XG4gICAgICAvLyBwcm9qZWN0IGRhdGEgaW50byBoZXhhZ29ucywgYW5kIGdldCBzb3J0ZWRCaW5zXG4gICAgICB0aGlzLmdldExheWVyRGF0YSgpO1xuICAgICAgdGhpcy5nZXRTb3J0ZWRCaW5zKCk7XG5cbiAgICAgIC8vIHRoaXMgbmVlZHMgc29ydGVkQmlucyB0byBiZSBzZXRcbiAgICAgIHRoaXMuZ2V0VmFsdWVEb21haW4oKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubmVlZHNSZVNvcnRCaW5zKG9sZFByb3BzLCBwcm9wcykpIHtcblxuICAgICAgdGhpcy5nZXRTb3J0ZWRCaW5zKCk7XG4gICAgICB0aGlzLmdldFZhbHVlRG9tYWluKCk7XG5cbiAgICB9IGVsc2UgaWYgKHRoaXMubmVlZHNSZWNhbGN1bGF0ZUNvbG9yRG9tYWluKG9sZFByb3BzLCBwcm9wcykpIHtcblxuICAgICAgdGhpcy5nZXRWYWx1ZURvbWFpbigpO1xuICAgIH1cbiAgfVxuXG4gIG5lZWRzUmVQcm9qZWN0UG9pbnRzKG9sZFByb3BzLCBwcm9wcykge1xuICAgIHJldHVybiBvbGRQcm9wcy5jZWxsU2l6ZSAhPT0gcHJvcHMuY2VsbFNpemU7XG4gIH1cblxuICBuZWVkc1JlY2FsY3VsYXRlQ29sb3JEb21haW4ob2xkUHJvcHMsIHByb3BzKSB7XG4gICAgcmV0dXJuIG9sZFByb3BzLmxvd2VyUGVyY2VudGlsZSAhPT0gcHJvcHMubG93ZXJQZXJjZW50aWxlIHx8XG4gICAgICBvbGRQcm9wcy51cHBlclBlcmNlbnRpbGUgIT09IHByb3BzLnVwcGVyUGVyY2VudGlsZTtcbiAgfVxuXG4gIG5lZWRzUmVTb3J0QmlucyhvbGRQcm9wcywgcHJvcHMpIHtcbiAgICByZXR1cm4gb2xkUHJvcHMuZ2V0Q29sb3JWYWx1ZSAhPT0gcHJvcHMuZ2V0Q29sb3JWYWx1ZTtcbiAgfVxuXG4gIGdldExheWVyRGF0YSgpIHtcbiAgICBjb25zdCB7ZGF0YSwgY2VsbFNpemUsIGdldFBvc2l0aW9ufSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qge2xheWVyRGF0YX0gPSBwb2ludFRvRGVuc2l0eUdyaWREYXRhKGRhdGEsIGNlbGxTaXplLCBnZXRQb3NpdGlvbik7XG5cbiAgICB0aGlzLnNldFN0YXRlKHtsYXllckRhdGF9KTtcbiAgfVxuXG4gIGdldFNvcnRlZEJpbnMoKSB7XG4gICAgY29uc3Qgc29ydGVkQmlucyA9IG5ldyBCaW5Tb3J0ZXIodGhpcy5zdGF0ZS5sYXllckRhdGEgfHwgW10sIHRoaXMucHJvcHMuZ2V0Q29sb3JWYWx1ZSk7XG4gICAgdGhpcy5zZXRTdGF0ZSh7c29ydGVkQmluc30pO1xuICB9XG5cbiAgZ2V0VmFsdWVEb21haW4oKSB7XG4gICAgY29uc3Qge2xvd2VyUGVyY2VudGlsZSwgdXBwZXJQZXJjZW50aWxlfSA9IHRoaXMucHJvcHM7XG5cbiAgICB0aGlzLnN0YXRlLnZhbHVlRG9tYWluID0gdGhpcy5zdGF0ZS5zb3J0ZWRCaW5zXG4gICAgICAuZ2V0VmFsdWVSYW5nZShbbG93ZXJQZXJjZW50aWxlLCB1cHBlclBlcmNlbnRpbGVdKTtcbiAgfVxuXG4gIGdldFBpY2tpbmdJbmZvKHtpbmZvfSkge1xuICAgIGNvbnN0IHBpY2tlZENlbGwgPSBpbmZvLnBpY2tlZCAmJiBpbmZvLmluZGV4ID4gLTEgP1xuICAgICAgdGhpcy5zdGF0ZS5sYXllckRhdGFbaW5mby5pbmRleF0gOiBudWxsO1xuXG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oaW5mbywge1xuICAgICAgcGlja2VkOiBCb29sZWFuKHBpY2tlZENlbGwpLFxuICAgICAgLy8gb3ZlcnJpZGUgb2JqZWN0IHdpdGggcGlja2VkIGNlbGxcbiAgICAgIG9iamVjdDogcGlja2VkQ2VsbFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0VXBkYXRlVHJpZ2dlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGdldENvbG9yOiB7XG4gICAgICAgIGNvbG9yUmFuZ2U6IHRoaXMucHJvcHMuY29sb3JSYW5nZSxcbiAgICAgICAgY29sb3JEb21haW46IHRoaXMucHJvcHMuY29sb3JEb21haW4sXG4gICAgICAgIGdldENvbG9yVmFsdWU6IHRoaXMucHJvcHMuZ2V0Q29sb3JWYWx1ZSxcbiAgICAgICAgbG93ZXJQZXJjZW50aWxlOiB0aGlzLnByb3BzLmxvd2VyUGVyY2VudGlsZSxcbiAgICAgICAgdXBwZXJQZXJjZW50aWxlOiB0aGlzLnByb3BzLnVwcGVyUGVyY2VudGlsZVxuICAgICAgfSxcbiAgICAgIGdldEVsZXZhdGlvbjoge1xuICAgICAgICBlbGV2YXRpb25SYW5nZTogdGhpcy5wcm9wcy5lbGV2YXRpb25SYW5nZSxcbiAgICAgICAgZWxldmF0aW9uRG9tYWluOiB0aGlzLnByb3BzLmVsZXZhdGlvbkRvbWFpblxuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBfb25HZXRTdWJsYXllckNvbG9yKGNlbGwpIHtcbiAgICBjb25zdCB7Y29sb3JSYW5nZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHt2YWx1ZURvbWFpbiwgc29ydGVkQmluc30gPSB0aGlzLnN0YXRlO1xuICAgIGNvbnN0IHZhbHVlID0gc29ydGVkQmlucy5iaW5NYXBbY2VsbC5pbmRleF0gJiYgc29ydGVkQmlucy5iaW5NYXBbY2VsbC5pbmRleF0udmFsdWU7XG5cbiAgICBjb25zdCBjb2xvckRvbWFpbiA9IHRoaXMucHJvcHMuY29sb3JEb21haW4gfHwgdmFsdWVEb21haW47XG4gICAgY29uc3QgY29sb3IgPSBxdWFudGl6ZVNjYWxlKGNvbG9yRG9tYWluLCBjb2xvclJhbmdlLCB2YWx1ZSk7XG5cbiAgICAvLyBpZiBjZWxsIHZhbHVlIGlzIG91dHNpZGUgZG9tYWluLCBzZXQgYWxwaGEgdG8gMFxuICAgIGNvbnN0IGFscGhhID0gdmFsdWUgPj0gdmFsdWVEb21haW5bMF0gJiYgdmFsdWUgPD0gdmFsdWVEb21haW5bMV0gP1xuICAgICAgKE51bWJlci5pc0Zpbml0ZShjb2xvclszXSkgPyBjb2xvclszXSA6IDI1NSkgOiAwO1xuXG4gICAgLy8gYWRkIGZpbmFsIGFscGhhIHRvIGNvbG9yXG4gICAgY29sb3JbM10gPSBhbHBoYTtcblxuICAgIHJldHVybiBjb2xvcjtcbiAgfVxuXG4gIF9vbkdldFN1YmxheWVyRWxldmF0aW9uKGNlbGwpIHtcbiAgICBjb25zdCB7ZWxldmF0aW9uRG9tYWluLCBlbGV2YXRpb25SYW5nZX0gPSB0aGlzLnByb3BzO1xuICAgIGNvbnN0IHtzb3J0ZWRCaW5zfSA9IHRoaXMuc3RhdGU7XG5cbiAgICAvLyBlbGV2YXRpb24gaXMgYmFzZWQgb24gY291bnRzLCBpdCBpcyBub3QgYWZmZWN0ZWQgYnkgcGVyY2VudGlsZVxuICAgIGNvbnN0IGRvbWFpbiA9IGVsZXZhdGlvbkRvbWFpbiB8fCBbMCwgc29ydGVkQmlucy5tYXhDb3VudF07XG4gICAgcmV0dXJuIGxpbmVhclNjYWxlKGRvbWFpbiwgZWxldmF0aW9uUmFuZ2UsIGNlbGwucG9pbnRzLmxlbmd0aCk7XG4gIH1cblxuICBnZXRTdWJMYXllclByb3BzKCkge1xuICAgIC8vIGZvciBzdWJjbGFzc2luZywgb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gcmV0dXJuXG4gICAgLy8gY3VzdG9taXplZCBzdWIgbGF5ZXIgcHJvcHNcbiAgICBjb25zdCB7aWQsIGVsZXZhdGlvblNjYWxlLCBmcDY0LCBleHRydWRlZCwgY2VsbFNpemUsIGNvdmVyYWdlLCBsaWdodFNldHRpbmdzfSA9IHRoaXMucHJvcHM7XG5cbiAgICAvLyBiYXNlIGxheWVyIHByb3BzXG4gICAgY29uc3Qge29wYWNpdHksIHBpY2thYmxlLCB2aXNpYmxlLCBnZXRQb2x5Z29uT2Zmc2V0fSA9IHRoaXMucHJvcHM7XG5cbiAgICAvLyB2aWV3cG9ydCBwcm9wc1xuICAgIGNvbnN0IHtwb3NpdGlvbk9yaWdpbiwgcHJvamVjdGlvbk1vZGUsIG1vZGVsTWF0cml4fSA9IHRoaXMucHJvcHM7XG5cbiAgICAvLyByZXR1cm4gcHJvcHMgdG8gdGhlIHN1YmxheWVyIGNvbnN0cnVjdG9yXG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiBgJHtpZH0tZ3JpZC1jZWxsYCxcbiAgICAgIGRhdGE6IHRoaXMuc3RhdGUubGF5ZXJEYXRhLFxuICAgICAgY2VsbFNpemUsXG4gICAgICBjb3ZlcmFnZSxcbiAgICAgIGxpZ2h0U2V0dGluZ3MsXG4gICAgICBlbGV2YXRpb25TY2FsZSxcbiAgICAgIGV4dHJ1ZGVkLFxuICAgICAgZnA2NCxcbiAgICAgIG9wYWNpdHksXG4gICAgICBwaWNrYWJsZSxcbiAgICAgIHZpc2libGUsXG4gICAgICBnZXRQb2x5Z29uT2Zmc2V0LFxuICAgICAgcHJvamVjdGlvbk1vZGUsXG4gICAgICBwb3NpdGlvbk9yaWdpbixcbiAgICAgIG1vZGVsTWF0cml4LFxuICAgICAgZ2V0Q29sb3I6IHRoaXMuX29uR2V0U3VibGF5ZXJDb2xvci5iaW5kKHRoaXMpLFxuICAgICAgZ2V0RWxldmF0aW9uOiB0aGlzLl9vbkdldFN1YmxheWVyRWxldmF0aW9uLmJpbmQodGhpcyksXG4gICAgICBnZXRQb3NpdGlvbjogZCA9PiBkLnBvc2l0aW9uLFxuICAgICAgdXBkYXRlVHJpZ2dlcnM6IHRoaXMuZ2V0VXBkYXRlVHJpZ2dlcnMoKVxuICAgIH07XG4gIH1cblxuICBnZXRTdWJMYXllckNsYXNzKCkge1xuICAgIC8vIGZvciBzdWJjbGFzc2luZywgb3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gcmV0dXJuXG4gICAgLy8gY3VzdG9taXplZCBzdWIgbGF5ZXIgY2xhc3NcbiAgICByZXR1cm4gR3JpZENlbGxMYXllcjtcbiAgfVxuXG4gIHJlbmRlckxheWVycygpIHtcbiAgICBjb25zdCBTdWJMYXllckNsYXNzID0gdGhpcy5nZXRTdWJMYXllckNsYXNzKCk7XG5cbiAgICByZXR1cm4gbmV3IFN1YkxheWVyQ2xhc3MoXG4gICAgICB0aGlzLmdldFN1YkxheWVyUHJvcHMoKVxuICAgICk7XG4gIH1cbn1cblxuR3JpZExheWVyLmxheWVyTmFtZSA9ICdHcmlkTGF5ZXInO1xuR3JpZExheWVyLmRlZmF1bHRQcm9wcyA9IGRlZmF1bHRQcm9wcztcbiJdfQ==