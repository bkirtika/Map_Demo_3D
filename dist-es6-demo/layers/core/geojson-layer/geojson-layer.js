var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

import { CompositeLayer, get } from '../../../lib';
import ScatterplotLayer from '../scatterplot-layer/scatterplot-layer';
import PathLayer from '../path-layer/path-layer';
// Use primitive layer to avoid "Composite Composite" layers for now
import SolidPolygonLayer from '../solid-polygon-layer/solid-polygon-layer';

import { getGeojsonFeatures, separateGeojsonFeatures } from './geojson';

var defaultLineColor = [0x0, 0x0, 0x0, 0xFF];
var defaultFillColor = [0x0, 0x0, 0x0, 0xFF];

var defaultProps = {
  stroked: true,
  filled: true,
  extruded: false,
  wireframe: false,

  lineWidthScale: 1,
  lineWidthMinPixels: 0,
  lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
  lineJointRounded: false,
  lineMiterLimit: 4,

  pointRadiusScale: 1,
  pointRadiusMinPixels: 0, //  min point radius in pixels
  pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER, // max point radius in pixels

  fp64: false,

  // Line and polygon outline color
  getLineColor: function getLineColor(f) {
    return get(f, 'properties.lineColor') || defaultLineColor;
  },
  // Point and polygon fill color
  getFillColor: function getFillColor(f) {
    return get(f, 'properties.fillColor') || defaultFillColor;
  },
  // Point radius
  getRadius: function getRadius(f) {
    return get(f, 'properties.radius') || get(f, 'properties.size') || 1;
  },
  // Line and polygon outline accessors
  getLineWidth: function getLineWidth(f) {
    return get(f, 'properties.lineWidth') || 1;
  },
  // Polygon extrusion accessor
  getElevation: function getElevation(f) {
    return get(f, 'properties.elevation') || 1000;
  },

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

var getCoordinates = function getCoordinates(f) {
  return get(f, 'geometry.coordinates');
};

var GeoJsonLayer = function (_CompositeLayer) {
  _inherits(GeoJsonLayer, _CompositeLayer);

  function GeoJsonLayer() {
    _classCallCheck(this, GeoJsonLayer);

    return _possibleConstructorReturn(this, (GeoJsonLayer.__proto__ || Object.getPrototypeOf(GeoJsonLayer)).apply(this, arguments));
  }

  _createClass(GeoJsonLayer, [{
    key: 'initializeState',
    value: function initializeState() {
      this.state = {
        features: {}
      };
    }
  }, {
    key: 'updateState',
    value: function updateState(_ref) {
      var oldProps = _ref.oldProps,
          props = _ref.props,
          changeFlags = _ref.changeFlags;

      if (changeFlags.dataChanged) {
        var data = this.props.data;

        var features = getGeojsonFeatures(data);
        this.state.features = separateGeojsonFeatures(features);
      }
    }
  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref2) {
      var info = _ref2.info;

      return Object.assign(info, {
        // override object with picked feature
        object: info.object && info.object.feature || info.object
      });
    }
  }, {
    key: 'renderLayers',
    value: function renderLayers() {
      var features = this.state.features;
      var pointFeatures = features.pointFeatures,
          lineFeatures = features.lineFeatures,
          polygonFeatures = features.polygonFeatures,
          polygonOutlineFeatures = features.polygonOutlineFeatures;

      // Layer composition props

      var _props = this.props,
          id = _props.id,
          stroked = _props.stroked,
          filled = _props.filled,
          extruded = _props.extruded,
          wireframe = _props.wireframe,
          lightSettings = _props.lightSettings;

      // Rendering props underlying layer

      var _props2 = this.props,
          lineWidthScale = _props2.lineWidthScale,
          lineWidthMinPixels = _props2.lineWidthMinPixels,
          lineWidthMaxPixels = _props2.lineWidthMaxPixels,
          lineJointRounded = _props2.lineJointRounded,
          lineMiterLimit = _props2.lineMiterLimit,
          pointRadiusScale = _props2.pointRadiusScale,
          pointRadiusMinPixels = _props2.pointRadiusMinPixels,
          pointRadiusMaxPixels = _props2.pointRadiusMaxPixels,
          fp64 = _props2.fp64;

      // Accessor props for underlying layers

      var _props3 = this.props,
          getLineColor = _props3.getLineColor,
          getFillColor = _props3.getFillColor,
          getRadius = _props3.getRadius,
          getLineWidth = _props3.getLineWidth,
          getElevation = _props3.getElevation,
          updateTriggers = _props3.updateTriggers;

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


      var drawPoints = pointFeatures && pointFeatures.length > 0;
      var drawLines = lineFeatures && lineFeatures.length > 0;
      var hasPolygonLines = polygonOutlineFeatures && polygonOutlineFeatures.length > 0;
      var hasPolygon = polygonFeatures && polygonFeatures.length > 0;

      // Filled Polygon Layer
      var polygonFillLayer = filled && hasPolygon && new SolidPolygonLayer({
        id: id + '-polygon-fill',
        data: polygonFeatures,
        extruded: extruded,
        wireframe: false,
        lightSettings: lightSettings,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPolygon: getCoordinates,
        getElevation: getElevation,
        getColor: getFillColor,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getFillColor
        }
      });

      var polygonWireframeLayer = wireframe && extruded && hasPolygon && new SolidPolygonLayer({
        id: id + '-polygon-wireframe',
        data: polygonFeatures,
        extruded: extruded,
        wireframe: true,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPolygon: getCoordinates,
        getElevation: getElevation,
        getColor: getLineColor,
        updateTriggers: {
          getElevation: updateTriggers.getElevation,
          getColor: updateTriggers.getLineColor
        }
      });

      var polygonLineLayer = !extruded && stroked && hasPolygonLines && new PathLayer({
        id: id + '-polygon-outline',
        data: polygonOutlineFeatures,
        widthScale: lineWidthScale,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels,
        rounded: lineJointRounded,
        miterLimit: lineMiterLimit,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPath: getCoordinates,
        getColor: getLineColor,
        getWidth: getLineWidth,
        updateTriggers: {
          getColor: updateTriggers.getLineColor,
          getWidth: updateTriggers.getLineWidth
        }
      });

      var pathLayer = drawLines && new PathLayer({
        id: id + '-line-paths',
        data: lineFeatures,
        widthScale: lineWidthScale,
        widthMinPixels: lineWidthMinPixels,
        widthMaxPixels: lineWidthMaxPixels,
        rounded: lineJointRounded,
        miterLimit: lineMiterLimit,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPath: getCoordinates,
        getColor: getLineColor,
        getWidth: getLineWidth,
        updateTriggers: {
          getColor: updateTriggers.getLineColor,
          getWidth: updateTriggers.getLineWidth
        }
      });

      var pointLayer = drawPoints && new ScatterplotLayer({
        id: id + '-points',
        data: pointFeatures,
        radiusScale: pointRadiusScale,
        radiusMinPixels: pointRadiusMinPixels,
        radiusMaxPixels: pointRadiusMaxPixels,
        fp64: fp64,
        opacity: opacity,
        pickable: pickable,
        visible: visible,
        getPolygonOffset: getPolygonOffset,
        projectionMode: projectionMode,
        positionOrigin: positionOrigin,
        modelMatrix: modelMatrix,
        getPosition: getCoordinates,
        getColor: getFillColor,
        getRadius: getRadius,
        updateTriggers: {
          getColor: updateTriggers.getFillColor,
          getRadius: updateTriggers.getRadius
        }
      });

      return [
      // If not extruded: flat fill layer is drawn below outlines
      !extruded && polygonFillLayer, polygonWireframeLayer, polygonLineLayer, pathLayer, pointLayer,
      // If extruded: draw fill layer last for correct blending behavior
      extruded && polygonFillLayer];
    }
  }]);

  return GeoJsonLayer;
}(CompositeLayer);

export default GeoJsonLayer;


GeoJsonLayer.layerName = 'GeoJsonLayer';
GeoJsonLayer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9nZW9qc29uLWxheWVyL2dlb2pzb24tbGF5ZXIuanMiXSwibmFtZXMiOlsiQ29tcG9zaXRlTGF5ZXIiLCJnZXQiLCJTY2F0dGVycGxvdExheWVyIiwiUGF0aExheWVyIiwiU29saWRQb2x5Z29uTGF5ZXIiLCJnZXRHZW9qc29uRmVhdHVyZXMiLCJzZXBhcmF0ZUdlb2pzb25GZWF0dXJlcyIsImRlZmF1bHRMaW5lQ29sb3IiLCJkZWZhdWx0RmlsbENvbG9yIiwiZGVmYXVsdFByb3BzIiwic3Ryb2tlZCIsImZpbGxlZCIsImV4dHJ1ZGVkIiwid2lyZWZyYW1lIiwibGluZVdpZHRoU2NhbGUiLCJsaW5lV2lkdGhNaW5QaXhlbHMiLCJsaW5lV2lkdGhNYXhQaXhlbHMiLCJOdW1iZXIiLCJNQVhfU0FGRV9JTlRFR0VSIiwibGluZUpvaW50Um91bmRlZCIsImxpbmVNaXRlckxpbWl0IiwicG9pbnRSYWRpdXNTY2FsZSIsInBvaW50UmFkaXVzTWluUGl4ZWxzIiwicG9pbnRSYWRpdXNNYXhQaXhlbHMiLCJmcDY0IiwiZ2V0TGluZUNvbG9yIiwiZiIsImdldEZpbGxDb2xvciIsImdldFJhZGl1cyIsImdldExpbmVXaWR0aCIsImdldEVsZXZhdGlvbiIsImxpZ2h0U2V0dGluZ3MiLCJsaWdodHNQb3NpdGlvbiIsImFtYmllbnRSYXRpbyIsImRpZmZ1c2VSYXRpbyIsInNwZWN1bGFyUmF0aW8iLCJsaWdodHNTdHJlbmd0aCIsIm51bWJlck9mTGlnaHRzIiwiZ2V0Q29vcmRpbmF0ZXMiLCJHZW9Kc29uTGF5ZXIiLCJzdGF0ZSIsImZlYXR1cmVzIiwib2xkUHJvcHMiLCJwcm9wcyIsImNoYW5nZUZsYWdzIiwiZGF0YUNoYW5nZWQiLCJkYXRhIiwiaW5mbyIsIk9iamVjdCIsImFzc2lnbiIsIm9iamVjdCIsImZlYXR1cmUiLCJwb2ludEZlYXR1cmVzIiwibGluZUZlYXR1cmVzIiwicG9seWdvbkZlYXR1cmVzIiwicG9seWdvbk91dGxpbmVGZWF0dXJlcyIsImlkIiwidXBkYXRlVHJpZ2dlcnMiLCJvcGFjaXR5IiwicGlja2FibGUiLCJ2aXNpYmxlIiwiZ2V0UG9seWdvbk9mZnNldCIsInBvc2l0aW9uT3JpZ2luIiwicHJvamVjdGlvbk1vZGUiLCJtb2RlbE1hdHJpeCIsImRyYXdQb2ludHMiLCJsZW5ndGgiLCJkcmF3TGluZXMiLCJoYXNQb2x5Z29uTGluZXMiLCJoYXNQb2x5Z29uIiwicG9seWdvbkZpbGxMYXllciIsImdldFBvbHlnb24iLCJnZXRDb2xvciIsInBvbHlnb25XaXJlZnJhbWVMYXllciIsInBvbHlnb25MaW5lTGF5ZXIiLCJ3aWR0aFNjYWxlIiwid2lkdGhNaW5QaXhlbHMiLCJ3aWR0aE1heFBpeGVscyIsInJvdW5kZWQiLCJtaXRlckxpbWl0IiwiZ2V0UGF0aCIsImdldFdpZHRoIiwicGF0aExheWVyIiwicG9pbnRMYXllciIsInJhZGl1c1NjYWxlIiwicmFkaXVzTWluUGl4ZWxzIiwicmFkaXVzTWF4UGl4ZWxzIiwiZ2V0UG9zaXRpb24iLCJsYXllck5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBUUEsY0FBUixFQUF3QkMsR0FBeEIsUUFBa0MsY0FBbEM7QUFDQSxPQUFPQyxnQkFBUCxNQUE2Qix3Q0FBN0I7QUFDQSxPQUFPQyxTQUFQLE1BQXNCLDBCQUF0QjtBQUNBO0FBQ0EsT0FBT0MsaUJBQVAsTUFBOEIsNENBQTlCOztBQUVBLFNBQVFDLGtCQUFSLEVBQTRCQyx1QkFBNUIsUUFBMEQsV0FBMUQ7O0FBRUEsSUFBTUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLElBQWhCLENBQXpCO0FBQ0EsSUFBTUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLElB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YUFBYTlCLFlBQWIsR0FBNEJBLFlBQTVCIiwiZmlsZSI6Imdlb2pzb24tbGF5ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtDb21wb3NpdGVMYXllciwgZ2V0fSBmcm9tICcuLi8uLi8uLi9saWInO1xuaW1wb3J0IFNjYXR0ZXJwbG90TGF5ZXIgZnJvbSAnLi4vc2NhdHRlcnBsb3QtbGF5ZXIvc2NhdHRlcnBsb3QtbGF5ZXInO1xuaW1wb3J0IFBhdGhMYXllciBmcm9tICcuLi9wYXRoLWxheWVyL3BhdGgtbGF5ZXInO1xuLy8gVXNlIHByaW1pdGl2ZSBsYXllciB0byBhdm9pZCBcIkNvbXBvc2l0ZSBDb21wb3NpdGVcIiBsYXllcnMgZm9yIG5vd1xuaW1wb3J0IFNvbGlkUG9seWdvbkxheWVyIGZyb20gJy4uL3NvbGlkLXBvbHlnb24tbGF5ZXIvc29saWQtcG9seWdvbi1sYXllcic7XG5cbmltcG9ydCB7Z2V0R2VvanNvbkZlYXR1cmVzLCBzZXBhcmF0ZUdlb2pzb25GZWF0dXJlc30gZnJvbSAnLi9nZW9qc29uJztcblxuY29uc3QgZGVmYXVsdExpbmVDb2xvciA9IFsweDAsIDB4MCwgMHgwLCAweEZGXTtcbmNvbnN0IGRlZmF1bHRGaWxsQ29sb3IgPSBbMHgwLCAweDAsIDB4MCwgMHhGRl07XG5cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgc3Ryb2tlZDogdHJ1ZSxcbiAgZmlsbGVkOiB0cnVlLFxuICBleHRydWRlZDogZmFsc2UsXG4gIHdpcmVmcmFtZTogZmFsc2UsXG5cbiAgbGluZVdpZHRoU2NhbGU6IDEsXG4gIGxpbmVXaWR0aE1pblBpeGVsczogMCxcbiAgbGluZVdpZHRoTWF4UGl4ZWxzOiBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUixcbiAgbGluZUpvaW50Um91bmRlZDogZmFsc2UsXG4gIGxpbmVNaXRlckxpbWl0OiA0LFxuXG4gIHBvaW50UmFkaXVzU2NhbGU6IDEsXG4gIHBvaW50UmFkaXVzTWluUGl4ZWxzOiAwLCAvLyAgbWluIHBvaW50IHJhZGl1cyBpbiBwaXhlbHNcbiAgcG9pbnRSYWRpdXNNYXhQaXhlbHM6IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLCAvLyBtYXggcG9pbnQgcmFkaXVzIGluIHBpeGVsc1xuXG4gIGZwNjQ6IGZhbHNlLFxuXG4gIC8vIExpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBjb2xvclxuICBnZXRMaW5lQ29sb3I6IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLmxpbmVDb2xvcicpIHx8IGRlZmF1bHRMaW5lQ29sb3IsXG4gIC8vIFBvaW50IGFuZCBwb2x5Z29uIGZpbGwgY29sb3JcbiAgZ2V0RmlsbENvbG9yOiBmID0+IGdldChmLCAncHJvcGVydGllcy5maWxsQ29sb3InKSB8fCBkZWZhdWx0RmlsbENvbG9yLFxuICAvLyBQb2ludCByYWRpdXNcbiAgZ2V0UmFkaXVzOiBmID0+IGdldChmLCAncHJvcGVydGllcy5yYWRpdXMnKSB8fCBnZXQoZiwgJ3Byb3BlcnRpZXMuc2l6ZScpIHx8IDEsXG4gIC8vIExpbmUgYW5kIHBvbHlnb24gb3V0bGluZSBhY2Nlc3NvcnNcbiAgZ2V0TGluZVdpZHRoOiBmID0+IGdldChmLCAncHJvcGVydGllcy5saW5lV2lkdGgnKSB8fCAxLFxuICAvLyBQb2x5Z29uIGV4dHJ1c2lvbiBhY2Nlc3NvclxuICBnZXRFbGV2YXRpb246IGYgPT4gZ2V0KGYsICdwcm9wZXJ0aWVzLmVsZXZhdGlvbicpIHx8IDEwMDAsXG5cbiAgLy8gT3B0aW9uYWwgc2V0dGluZ3MgZm9yICdsaWdodGluZycgc2hhZGVyIG1vZHVsZVxuICBsaWdodFNldHRpbmdzOiB7XG4gICAgbGlnaHRzUG9zaXRpb246IFstMTIyLjQ1LCAzNy43NSwgODAwMCwgLTEyMi4wLCAzOC4wMCwgNTAwMF0sXG4gICAgYW1iaWVudFJhdGlvOiAwLjA1LFxuICAgIGRpZmZ1c2VSYXRpbzogMC42LFxuICAgIHNwZWN1bGFyUmF0aW86IDAuOCxcbiAgICBsaWdodHNTdHJlbmd0aDogWzIuMCwgMC4wLCAwLjAsIDAuMF0sXG4gICAgbnVtYmVyT2ZMaWdodHM6IDJcbiAgfVxufTtcblxuY29uc3QgZ2V0Q29vcmRpbmF0ZXMgPSBmID0+IGdldChmLCAnZ2VvbWV0cnkuY29vcmRpbmF0ZXMnKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvSnNvbkxheWVyIGV4dGVuZHMgQ29tcG9zaXRlTGF5ZXIge1xuICBpbml0aWFsaXplU3RhdGUoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGZlYXR1cmVzOiB7fVxuICAgIH07XG4gIH1cblxuICB1cGRhdGVTdGF0ZSh7b2xkUHJvcHMsIHByb3BzLCBjaGFuZ2VGbGFnc30pIHtcbiAgICBpZiAoY2hhbmdlRmxhZ3MuZGF0YUNoYW5nZWQpIHtcbiAgICAgIGNvbnN0IHtkYXRhfSA9IHRoaXMucHJvcHM7XG4gICAgICBjb25zdCBmZWF0dXJlcyA9IGdldEdlb2pzb25GZWF0dXJlcyhkYXRhKTtcbiAgICAgIHRoaXMuc3RhdGUuZmVhdHVyZXMgPSBzZXBhcmF0ZUdlb2pzb25GZWF0dXJlcyhmZWF0dXJlcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0UGlja2luZ0luZm8oe2luZm99KSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oaW5mbywge1xuICAgICAgLy8gb3ZlcnJpZGUgb2JqZWN0IHdpdGggcGlja2VkIGZlYXR1cmVcbiAgICAgIG9iamVjdDogKGluZm8ub2JqZWN0ICYmIGluZm8ub2JqZWN0LmZlYXR1cmUpIHx8IGluZm8ub2JqZWN0XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXJMYXllcnMoKSB7XG4gICAgY29uc3Qge2ZlYXR1cmVzfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3Qge3BvaW50RmVhdHVyZXMsIGxpbmVGZWF0dXJlcywgcG9seWdvbkZlYXR1cmVzLCBwb2x5Z29uT3V0bGluZUZlYXR1cmVzfSA9IGZlYXR1cmVzO1xuXG4gICAgLy8gTGF5ZXIgY29tcG9zaXRpb24gcHJvcHNcbiAgICBjb25zdCB7aWQsIHN0cm9rZWQsIGZpbGxlZCwgZXh0cnVkZWQsIHdpcmVmcmFtZSwgbGlnaHRTZXR0aW5nc30gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gUmVuZGVyaW5nIHByb3BzIHVuZGVybHlpbmcgbGF5ZXJcbiAgICBjb25zdCB7bGluZVdpZHRoU2NhbGUsIGxpbmVXaWR0aE1pblBpeGVscywgbGluZVdpZHRoTWF4UGl4ZWxzLFxuICAgICAgbGluZUpvaW50Um91bmRlZCwgbGluZU1pdGVyTGltaXQsXG4gICAgICBwb2ludFJhZGl1c1NjYWxlLCBwb2ludFJhZGl1c01pblBpeGVscywgcG9pbnRSYWRpdXNNYXhQaXhlbHMsXG4gICAgICBmcDY0fSA9IHRoaXMucHJvcHM7XG5cbiAgICAvLyBBY2Nlc3NvciBwcm9wcyBmb3IgdW5kZXJseWluZyBsYXllcnNcbiAgICBjb25zdCB7Z2V0TGluZUNvbG9yLCBnZXRGaWxsQ29sb3IsIGdldFJhZGl1cyxcbiAgICAgIGdldExpbmVXaWR0aCwgZ2V0RWxldmF0aW9uLCB1cGRhdGVUcmlnZ2Vyc30gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gYmFzZSBsYXllciBwcm9wc1xuICAgIGNvbnN0IHtvcGFjaXR5LCBwaWNrYWJsZSwgdmlzaWJsZSwgZ2V0UG9seWdvbk9mZnNldH0gPSB0aGlzLnByb3BzO1xuXG4gICAgLy8gdmlld3BvcnQgcHJvcHNcbiAgICBjb25zdCB7cG9zaXRpb25PcmlnaW4sIHByb2plY3Rpb25Nb2RlLCBtb2RlbE1hdHJpeH0gPSB0aGlzLnByb3BzO1xuXG4gICAgY29uc3QgZHJhd1BvaW50cyA9IHBvaW50RmVhdHVyZXMgJiYgcG9pbnRGZWF0dXJlcy5sZW5ndGggPiAwO1xuICAgIGNvbnN0IGRyYXdMaW5lcyA9IGxpbmVGZWF0dXJlcyAmJiBsaW5lRmVhdHVyZXMubGVuZ3RoID4gMDtcbiAgICBjb25zdCBoYXNQb2x5Z29uTGluZXMgPSBwb2x5Z29uT3V0bGluZUZlYXR1cmVzICYmIHBvbHlnb25PdXRsaW5lRmVhdHVyZXMubGVuZ3RoID4gMDtcbiAgICBjb25zdCBoYXNQb2x5Z29uID0gcG9seWdvbkZlYXR1cmVzICYmIHBvbHlnb25GZWF0dXJlcy5sZW5ndGggPiAwO1xuXG4gICAgLy8gRmlsbGVkIFBvbHlnb24gTGF5ZXJcbiAgICBjb25zdCBwb2x5Z29uRmlsbExheWVyID0gZmlsbGVkICYmXG4gICAgICBoYXNQb2x5Z29uICYmXG4gICAgICBuZXcgU29saWRQb2x5Z29uTGF5ZXIoe1xuICAgICAgICBpZDogYCR7aWR9LXBvbHlnb24tZmlsbGAsXG4gICAgICAgIGRhdGE6IHBvbHlnb25GZWF0dXJlcyxcbiAgICAgICAgZXh0cnVkZWQsXG4gICAgICAgIHdpcmVmcmFtZTogZmFsc2UsXG4gICAgICAgIGxpZ2h0U2V0dGluZ3MsXG4gICAgICAgIGZwNjQsXG4gICAgICAgIG9wYWNpdHksXG4gICAgICAgIHBpY2thYmxlLFxuICAgICAgICB2aXNpYmxlLFxuICAgICAgICBnZXRQb2x5Z29uT2Zmc2V0LFxuICAgICAgICBwcm9qZWN0aW9uTW9kZSxcbiAgICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICAgIG1vZGVsTWF0cml4LFxuICAgICAgICBnZXRQb2x5Z29uOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgZ2V0RWxldmF0aW9uLFxuICAgICAgICBnZXRDb2xvcjogZ2V0RmlsbENvbG9yLFxuICAgICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICAgIGdldEVsZXZhdGlvbjogdXBkYXRlVHJpZ2dlcnMuZ2V0RWxldmF0aW9uLFxuICAgICAgICAgIGdldENvbG9yOiB1cGRhdGVUcmlnZ2Vycy5nZXRGaWxsQ29sb3JcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBjb25zdCBwb2x5Z29uV2lyZWZyYW1lTGF5ZXIgPSB3aXJlZnJhbWUgJiZcbiAgICAgIGV4dHJ1ZGVkICYmXG4gICAgICBoYXNQb2x5Z29uICYmXG4gICAgICBuZXcgU29saWRQb2x5Z29uTGF5ZXIoe1xuICAgICAgICBpZDogYCR7aWR9LXBvbHlnb24td2lyZWZyYW1lYCxcbiAgICAgICAgZGF0YTogcG9seWdvbkZlYXR1cmVzLFxuICAgICAgICBleHRydWRlZCxcbiAgICAgICAgd2lyZWZyYW1lOiB0cnVlLFxuICAgICAgICBmcDY0LFxuICAgICAgICBvcGFjaXR5LFxuICAgICAgICBwaWNrYWJsZSxcbiAgICAgICAgdmlzaWJsZSxcbiAgICAgICAgZ2V0UG9seWdvbk9mZnNldCxcbiAgICAgICAgcHJvamVjdGlvbk1vZGUsXG4gICAgICAgIHBvc2l0aW9uT3JpZ2luLFxuICAgICAgICBtb2RlbE1hdHJpeCxcbiAgICAgICAgZ2V0UG9seWdvbjogZ2V0Q29vcmRpbmF0ZXMsXG4gICAgICAgIGdldEVsZXZhdGlvbixcbiAgICAgICAgZ2V0Q29sb3I6IGdldExpbmVDb2xvcixcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRFbGV2YXRpb246IHVwZGF0ZVRyaWdnZXJzLmdldEVsZXZhdGlvbixcbiAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZUNvbG9yXG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgY29uc3QgcG9seWdvbkxpbmVMYXllciA9ICFleHRydWRlZCAmJlxuICAgICAgc3Ryb2tlZCAmJlxuICAgICAgaGFzUG9seWdvbkxpbmVzICYmXG4gICAgICBuZXcgUGF0aExheWVyKHtcbiAgICAgICAgaWQ6IGAke2lkfS1wb2x5Z29uLW91dGxpbmVgLFxuICAgICAgICBkYXRhOiBwb2x5Z29uT3V0bGluZUZlYXR1cmVzLFxuICAgICAgICB3aWR0aFNjYWxlOiBsaW5lV2lkdGhTY2FsZSxcbiAgICAgICAgd2lkdGhNaW5QaXhlbHM6IGxpbmVXaWR0aE1pblBpeGVscyxcbiAgICAgICAgd2lkdGhNYXhQaXhlbHM6IGxpbmVXaWR0aE1heFBpeGVscyxcbiAgICAgICAgcm91bmRlZDogbGluZUpvaW50Um91bmRlZCxcbiAgICAgICAgbWl0ZXJMaW1pdDogbGluZU1pdGVyTGltaXQsXG4gICAgICAgIGZwNjQsXG4gICAgICAgIG9wYWNpdHksXG4gICAgICAgIHBpY2thYmxlLFxuICAgICAgICB2aXNpYmxlLFxuICAgICAgICBnZXRQb2x5Z29uT2Zmc2V0LFxuICAgICAgICBwcm9qZWN0aW9uTW9kZSxcbiAgICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICAgIG1vZGVsTWF0cml4LFxuICAgICAgICBnZXRQYXRoOiBnZXRDb29yZGluYXRlcyxcbiAgICAgICAgZ2V0Q29sb3I6IGdldExpbmVDb2xvcixcbiAgICAgICAgZ2V0V2lkdGg6IGdldExpbmVXaWR0aCxcbiAgICAgICAgdXBkYXRlVHJpZ2dlcnM6IHtcbiAgICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZUNvbG9yLFxuICAgICAgICAgIGdldFdpZHRoOiB1cGRhdGVUcmlnZ2Vycy5nZXRMaW5lV2lkdGhcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICBjb25zdCBwYXRoTGF5ZXIgPSBkcmF3TGluZXMgJiYgbmV3IFBhdGhMYXllcih7XG4gICAgICBpZDogYCR7aWR9LWxpbmUtcGF0aHNgLFxuICAgICAgZGF0YTogbGluZUZlYXR1cmVzLFxuICAgICAgd2lkdGhTY2FsZTogbGluZVdpZHRoU2NhbGUsXG4gICAgICB3aWR0aE1pblBpeGVsczogbGluZVdpZHRoTWluUGl4ZWxzLFxuICAgICAgd2lkdGhNYXhQaXhlbHM6IGxpbmVXaWR0aE1heFBpeGVscyxcbiAgICAgIHJvdW5kZWQ6IGxpbmVKb2ludFJvdW5kZWQsXG4gICAgICBtaXRlckxpbWl0OiBsaW5lTWl0ZXJMaW1pdCxcbiAgICAgIGZwNjQsXG4gICAgICBvcGFjaXR5LFxuICAgICAgcGlja2FibGUsXG4gICAgICB2aXNpYmxlLFxuICAgICAgZ2V0UG9seWdvbk9mZnNldCxcbiAgICAgIHByb2plY3Rpb25Nb2RlLFxuICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICBtb2RlbE1hdHJpeCxcbiAgICAgIGdldFBhdGg6IGdldENvb3JkaW5hdGVzLFxuICAgICAgZ2V0Q29sb3I6IGdldExpbmVDb2xvcixcbiAgICAgIGdldFdpZHRoOiBnZXRMaW5lV2lkdGgsXG4gICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZUNvbG9yLFxuICAgICAgICBnZXRXaWR0aDogdXBkYXRlVHJpZ2dlcnMuZ2V0TGluZVdpZHRoXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBwb2ludExheWVyID0gZHJhd1BvaW50cyAmJiBuZXcgU2NhdHRlcnBsb3RMYXllcih7XG4gICAgICBpZDogYCR7aWR9LXBvaW50c2AsXG4gICAgICBkYXRhOiBwb2ludEZlYXR1cmVzLFxuICAgICAgcmFkaXVzU2NhbGU6IHBvaW50UmFkaXVzU2NhbGUsXG4gICAgICByYWRpdXNNaW5QaXhlbHM6IHBvaW50UmFkaXVzTWluUGl4ZWxzLFxuICAgICAgcmFkaXVzTWF4UGl4ZWxzOiBwb2ludFJhZGl1c01heFBpeGVscyxcbiAgICAgIGZwNjQsXG4gICAgICBvcGFjaXR5LFxuICAgICAgcGlja2FibGUsXG4gICAgICB2aXNpYmxlLFxuICAgICAgZ2V0UG9seWdvbk9mZnNldCxcbiAgICAgIHByb2plY3Rpb25Nb2RlLFxuICAgICAgcG9zaXRpb25PcmlnaW4sXG4gICAgICBtb2RlbE1hdHJpeCxcbiAgICAgIGdldFBvc2l0aW9uOiBnZXRDb29yZGluYXRlcyxcbiAgICAgIGdldENvbG9yOiBnZXRGaWxsQ29sb3IsXG4gICAgICBnZXRSYWRpdXMsXG4gICAgICB1cGRhdGVUcmlnZ2Vyczoge1xuICAgICAgICBnZXRDb2xvcjogdXBkYXRlVHJpZ2dlcnMuZ2V0RmlsbENvbG9yLFxuICAgICAgICBnZXRSYWRpdXM6IHVwZGF0ZVRyaWdnZXJzLmdldFJhZGl1c1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIC8vIElmIG5vdCBleHRydWRlZDogZmxhdCBmaWxsIGxheWVyIGlzIGRyYXduIGJlbG93IG91dGxpbmVzXG4gICAgICAhZXh0cnVkZWQgJiYgcG9seWdvbkZpbGxMYXllcixcbiAgICAgIHBvbHlnb25XaXJlZnJhbWVMYXllcixcbiAgICAgIHBvbHlnb25MaW5lTGF5ZXIsXG4gICAgICBwYXRoTGF5ZXIsXG4gICAgICBwb2ludExheWVyLFxuICAgICAgLy8gSWYgZXh0cnVkZWQ6IGRyYXcgZmlsbCBsYXllciBsYXN0IGZvciBjb3JyZWN0IGJsZW5kaW5nIGJlaGF2aW9yXG4gICAgICBleHRydWRlZCAmJiBwb2x5Z29uRmlsbExheWVyXG4gICAgXTtcbiAgfVxufVxuXG5HZW9Kc29uTGF5ZXIubGF5ZXJOYW1lID0gJ0dlb0pzb25MYXllcic7XG5HZW9Kc29uTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19