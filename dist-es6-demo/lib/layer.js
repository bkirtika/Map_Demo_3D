var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

/* global window */
import { COORDINATE_SYSTEM, LIFECYCLE } from './constants';
import AttributeManager from './attribute-manager';
import Stats from './stats';
import { getDefaultProps, compareProps } from './props';
import { log, count } from './utils';
import { applyPropOverrides, removeLayerInSeer } from '../debug/seer-integration';
import { GL, withParameters } from 'luma.gl';
import assert from 'assert';

var LOG_PRIORITY_UPDATE = 1;

var EMPTY_ARRAY = [];
var noop = function noop() {};

/*
 * @param {string} props.id - layer name
 * @param {array}  props.data - array of data instances
 * @param {bool} props.opacity - opacity of the layer
 */
var defaultProps = {
  // data: Special handling for null, see below
  dataComparator: null,
  updateTriggers: {}, // Update triggers: a core change detection mechanism in deck.gl
  numInstances: undefined,

  visible: true,
  pickable: false,
  opacity: 0.8,

  onHover: noop,
  onClick: noop,

  projectionMode: COORDINATE_SYSTEM.LNGLAT,

  parameters: {},
  uniforms: {},
  framebuffer: null,

  animation: null, // Passed prop animation functions to evaluate props

  // Offset depth based on layer index to avoid z-fighting.
  // Negative values pull layer towards the camera
  // https://www.opengl.org/archives/resources/faq/technical/polygonoffset.htm
  getPolygonOffset: function getPolygonOffset(_ref) {
    var layerIndex = _ref.layerIndex;
    return [0, -layerIndex * 100];
  }
};

var counter = 0;

var Layer = function () {
  /**
   * @class
   * @param {object} props - See docs and defaults above
   */
  function Layer(props) {
    _classCallCheck(this, Layer);

    // If sublayer has static defaultProps member, getDefaultProps will return it
    var mergedDefaultProps = getDefaultProps(this);
    // Merge supplied props with pre-merged default props
    props = Object.assign({}, mergedDefaultProps, props);
    // Accept null as data - otherwise apps and layers need to add ugly checks
    // Use constant fallback so that data change is not triggered
    props.data = props.data || EMPTY_ARRAY;
    // Apply any overrides from the seer debug extension if it is active
    applyPropOverrides(props);
    // Props are immutable
    Object.freeze(props);

    // Define all members
    this.id = props.id; // The layer's id, used for matching with layers' from last render cyckle
    this.props = props; // Current props, a frozen object
    this.animatedProps = null; // Computing animated props requires layer manager state
    this.oldProps = null; // Props from last render used for change detection
    this.state = null; // Will be set to the shared layer state object during layer matching
    this.context = null; // Will reference layer manager's context, contains state shared by layers
    this.count = counter++; // Keep track of how many layer instances you are generating
    this.lifecycle = LIFECYCLE.NO_STATE; // Helps track and debug the life cycle of the layers
    // CompositeLayer members, need to be defined here because of the `Object.seal`
    this.parentLayer = null; // reference to the composite layer parent that rendered this layer
    this.oldSubLayers = []; // reference to sublayers rendered in the previous cycle
    // Seal the layer
    Object.seal(this);
  }

  _createClass(Layer, [{
    key: 'toString',
    value: function toString() {
      var className = this.constructor.layerName || this.constructor.name;
      return className !== this.props.id ? '<' + className + ':\'' + this.props.id + '\'>' : '<' + className + '>';
    }
  }, {
    key: 'initializeState',


    // //////////////////////////////////////////////////
    // LIFECYCLE METHODS, overridden by the layer subclasses

    // Called once to set up the initial state
    // App can create WebGL resources
    value: function initializeState() {
      throw new Error('Layer ' + this + ' has not defined initializeState');
    }

    // Let's layer control if updateState should be called

  }, {
    key: 'shouldUpdateState',
    value: function shouldUpdateState(_ref2) {
      var oldProps = _ref2.oldProps,
          props = _ref2.props,
          oldContext = _ref2.oldContext,
          context = _ref2.context,
          changeFlags = _ref2.changeFlags;

      return changeFlags.propsOrDataChanged;
    }

    // Default implementation, all attributes will be invalidated and updated
    // when data changes

  }, {
    key: 'updateState',
    value: function updateState(_ref3) {
      var oldProps = _ref3.oldProps,
          props = _ref3.props,
          oldContext = _ref3.oldContext,
          context = _ref3.context,
          changeFlags = _ref3.changeFlags;

      if (changeFlags.dataChanged) {
        this.invalidateAttribute('all');
      }
    }

    // Called once when layer is no longer matched and state will be discarded
    // App can destroy WebGL resources here

  }, {
    key: 'finalizeState',
    value: function finalizeState() {}

    // If state has a model, draw it with supplied uniforms

  }, {
    key: 'draw',
    value: function draw(_ref4) {
      var _ref4$uniforms = _ref4.uniforms,
          uniforms = _ref4$uniforms === undefined ? {} : _ref4$uniforms;

      if (this.state.model) {
        this.state.model.render(uniforms);
      }
    }

    // called to populate the info object that is passed to the event handler
    // @return null to cancel event

  }, {
    key: 'getPickingInfo',
    value: function getPickingInfo(_ref5) {
      var info = _ref5.info,
          mode = _ref5.mode;
      var color = info.color,
          index = info.index;


      if (index >= 0) {
        // If props.data is an indexable array, get the object
        if (Array.isArray(this.props.data)) {
          info.object = this.props.data[index];
        }
      }

      // TODO - move to the JS part of a shader picking shader package
      if (mode === 'hover') {
        var selectedPickingColor = new Float32Array(3);
        selectedPickingColor[0] = color[0];
        selectedPickingColor[1] = color[1];
        selectedPickingColor[2] = color[2];
        this.setUniforms({ selectedPickingColor: selectedPickingColor });
      }

      return info;
    }

    // END LIFECYCLE METHODS
    // //////////////////////////////////////////////////

    // Default implementation of attribute invalidation, can be redefine

  }, {
    key: 'invalidateAttribute',
    value: function invalidateAttribute() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'all';

      if (name === 'all') {
        this.state.attributeManager.invalidateAll();
      } else {
        this.state.attributeManager.invalidate(name);
      }
    }

    // Calls attribute manager to update any WebGL attributes, can be redefined

  }, {
    key: 'updateAttributes',
    value: function updateAttributes(props) {
      var _state = this.state,
          attributeManager = _state.attributeManager,
          model = _state.model;

      if (!attributeManager) {
        return;
      }

      // Figure out data length
      var numInstances = this.getNumInstances(props);

      attributeManager.update({
        data: props.data,
        numInstances: numInstances,
        props: props,
        buffers: props,
        context: this,
        // Don't worry about non-attribute props
        ignoreUnknownAttributes: true
      });

      if (model) {
        var changedAttributes = attributeManager.getChangedAttributes({ clearChangedFlags: true });
        model.setAttributes(changedAttributes);
      }
    }

    // Public API

    // Updates selected state members and marks the object for redraw

  }, {
    key: 'setState',
    value: function setState(updateObject) {
      Object.assign(this.state, updateObject);
      this.state.needsRedraw = true;
    }
  }, {
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      if (this.state) {
        this.state.needsRedraw = redraw;
      }
    }

    // PROJECTION METHODS

    /**
     * Projects a point with current map state (lat, lon, zoom, pitch, bearing)
     *
     * Note: Position conversion is done in shader, so in many cases there is no need
     * for this function
     * @param {Array|TypedArray} lngLat - long and lat values
     * @return {Array|TypedArray} - x, y coordinates
     */

  }, {
    key: 'project',
    value: function project(lngLat) {
      var viewport = this.context.viewport;

      assert(Array.isArray(lngLat), 'Layer.project needs [lng,lat]');
      return viewport.project(lngLat);
    }
  }, {
    key: 'unproject',
    value: function unproject(xy) {
      var viewport = this.context.viewport;

      assert(Array.isArray(xy), 'Layer.unproject needs [x,y]');
      return viewport.unproject(xy);
    }
  }, {
    key: 'projectFlat',
    value: function projectFlat(lngLat) {
      var viewport = this.context.viewport;

      assert(Array.isArray(lngLat), 'Layer.project needs [lng,lat]');
      return viewport.projectFlat(lngLat);
    }
  }, {
    key: 'unprojectFlat',
    value: function unprojectFlat(xy) {
      var viewport = this.context.viewport;

      assert(Array.isArray(xy), 'Layer.unproject needs [x,y]');
      return viewport.unprojectFlat(xy);
    }
  }, {
    key: 'screenToDevicePixels',
    value: function screenToDevicePixels(screenPixels) {
      var devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      return screenPixels * devicePixelRatio;
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @return {Array} - a black color
     */

  }, {
    key: 'nullPickingColor',
    value: function nullPickingColor() {
      return [0, 0, 0];
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @param {int} i - index to be decoded
     * @return {Array} - the decoded color
     */

  }, {
    key: 'encodePickingColor',
    value: function encodePickingColor(i) {
      return [i + 1 & 255, i + 1 >> 8 & 255, i + 1 >> 8 >> 8 & 255];
    }

    /**
     * Returns the picking color that doesn't match any subfeature
     * Use if some graphics do not belong to any pickable subfeature
     * @param {Uint8Array} color - color array to be decoded
     * @return {Array} - the decoded picking color
     */

  }, {
    key: 'decodePickingColor',
    value: function decodePickingColor(color) {
      assert(color instanceof Uint8Array);

      var _color = _slicedToArray(color, 3),
          i1 = _color[0],
          i2 = _color[1],
          i3 = _color[2];
      // 1 was added to seperate from no selection


      var index = i1 + i2 * 256 + i3 * 65536 - 1;
      return index;
    }
  }, {
    key: 'calculateInstancePickingColors',
    value: function calculateInstancePickingColors(attribute, _ref6) {
      var numInstances = _ref6.numInstances;
      var value = attribute.value,
          size = attribute.size;
      // add 1 to index to seperate from no selection

      for (var i = 0; i < numInstances; i++) {
        var pickingColor = this.encodePickingColor(i);
        value[i * size + 0] = pickingColor[0];
        value[i * size + 1] = pickingColor[1];
        value[i * size + 2] = pickingColor[2];
      }
    }

    // DATA ACCESS API
    // Data can use iterators and may not be random access

    // Use iteration (the only required capability on data) to get first element

  }, {
    key: 'getFirstObject',
    value: function getFirstObject() {
      var data = this.props.data;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          return object;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return null;
    }

    // INTERNAL METHODS

    // Deduces numer of instances. Intention is to support:
    // - Explicit setting of numInstances
    // - Auto-deduction for ES6 containers that define a size member
    // - Auto-deduction for Classic Arrays via the built-in length attribute
    // - Auto-deduction via arrays

  }, {
    key: 'getNumInstances',
    value: function getNumInstances(props) {
      props = props || this.props;

      // First check if the layer has set its own value
      if (this.state && this.state.numInstances !== undefined) {
        return this.state.numInstances;
      }

      // Check if app has provided an explicit value
      if (props.numInstances !== undefined) {
        return props.numInstances;
      }

      // Use container library to get a count for any ES6 container or object
      var _props = props,
          data = _props.data;

      return count(data);
    }

    // LAYER MANAGER API
    // Should only be called by the deck.gl LayerManager class

    // Called by layer manager when a new layer is found
    /* eslint-disable max-statements */

  }, {
    key: 'initializeLayer',
    value: function initializeLayer(updateParams) {
      assert(this.context.gl, 'Layer context missing gl');
      assert(!this.state, 'Layer missing state');

      this.state = {};
      this.state.stats = new Stats({ id: 'draw' });

      // Initialize state only once
      this.setState({
        attributeManager: new AttributeManager({ id: this.props.id }),
        model: null,
        needsRedraw: true,
        dataChanged: true
      });

      var attributeManager = this.state.attributeManager;
      // All instanced layers get instancePickingColors attribute by default
      // Their shaders can use it to render a picking scene
      // TODO - this slows down non instanced layers

      attributeManager.addInstanced({
        instancePickingColors: {
          type: GL.UNSIGNED_BYTE,
          size: 3,
          update: this.calculateInstancePickingColors
        }
      });

      // Call subclass lifecycle methods
      this.initializeState();
      this.updateState(updateParams);
      // End subclass lifecycle methods

      // Add any subclass attributes
      this.updateAttributes(this.props);
      this._updateBaseUniforms();

      var model = this.state.model;

      if (model) {
        model.setInstanceCount(this.getNumInstances());
        model.id = this.props.id;
        model.program.id = this.props.id + '-program';
        model.geometry.id = this.props.id + '-geometry';
        model.setAttributes(attributeManager.getAttributes());
      }
    }

    // Called by layer manager when existing layer is getting new props

  }, {
    key: 'updateLayer',
    value: function updateLayer(updateParams) {
      // Check for deprecated method
      if (this.shouldUpdate) {
        log.once(0, 'deck.gl v3 ' + this + ': "shouldUpdate" deprecated, renamed to "shouldUpdateState"');
      }

      // Call subclass lifecycle method
      var stateNeedsUpdate = this.shouldUpdateState(updateParams);
      // End lifecycle method

      if (stateNeedsUpdate) {
        // Call subclass lifecycle method
        this.updateState(updateParams);
        // End lifecycle method

        // Run the attribute updaters
        this.updateAttributes(updateParams.props);
        this._updateBaseUniforms();

        if (this.state.model) {
          this.state.model.setInstanceCount(this.getNumInstances());
        }
      }
    }
    /* eslint-enable max-statements */

    // Called by manager when layer is about to be disposed
    // Note: not guaranteed to be called on application shutdown

  }, {
    key: 'finalizeLayer',
    value: function finalizeLayer() {
      // Call subclass lifecycle method
      this.finalizeState();
      // End lifecycle method
      removeLayerInSeer(this.id);
    }

    // Calculates uniforms

  }, {
    key: 'drawLayer',
    value: function drawLayer(_ref7) {
      var _this = this;

      var _ref7$moduleParameter = _ref7.moduleParameters,
          moduleParameters = _ref7$moduleParameter === undefined ? null : _ref7$moduleParameter,
          _ref7$uniforms = _ref7.uniforms,
          uniforms = _ref7$uniforms === undefined ? {} : _ref7$uniforms,
          _ref7$parameters = _ref7.parameters,
          parameters = _ref7$parameters === undefined ? {} : _ref7$parameters;


      // TODO/ib - hack move to luma Model.draw
      if (moduleParameters && this.state.model) {
        this.state.model.updateModuleSettings(moduleParameters);
      }

      // Apply polygon offset to avoid z-fighting
      var getPolygonOffset = this.props.getPolygonOffset;

      var offsets = getPolygonOffset && getPolygonOffset(uniforms) || [0, 0];
      parameters.polygonOffset = offsets;

      // Call subclass lifecycle method
      withParameters(this.context.gl, parameters, function () {
        return _this.draw({ moduleParameters: moduleParameters, uniforms: uniforms, parameters: parameters });
      });
      // End lifecycle method
    }

    // {uniforms = {}, ...opts}

  }, {
    key: 'pickLayer',
    value: function pickLayer(opts) {
      // Call subclass lifecycle method
      return this.getPickingInfo(opts);
      // End lifecycle method
    }

    // Checks state of attributes and model
    // TODO - is attribute manager needed? - Model should be enough.

  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref8 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref8$clearRedrawFlag = _ref8.clearRedrawFlags,
          clearRedrawFlags = _ref8$clearRedrawFlag === undefined ? false : _ref8$clearRedrawFlag;

      // this method may be called by the render loop as soon a the layer
      // has been created, so guard against uninitialized state
      if (!this.state) {
        return false;
      }

      var redraw = false;
      redraw = redraw || this.state.needsRedraw;
      this.state.needsRedraw = this.state.needsRedraw && !clearRedrawFlags;

      var _state2 = this.state,
          attributeManager = _state2.attributeManager,
          model = _state2.model;

      redraw = redraw || attributeManager && attributeManager.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
      redraw = redraw || model && model.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });

      return redraw;
    }
  }, {
    key: 'diffProps',
    value: function diffProps(oldProps, newProps, context) {
      // First check if any props have changed (ignore props that will be examined separately)
      var propsChangedReason = compareProps({
        newProps: newProps,
        oldProps: oldProps,
        ignoreProps: { data: null, updateTriggers: null }
      });

      // Now check if any data related props have changed
      var dataChangedReason = this._diffDataProps(oldProps, newProps);

      var propsChanged = Boolean(propsChangedReason);
      var dataChanged = Boolean(dataChangedReason);
      var propsOrDataChanged = propsChanged || dataChanged;
      var viewportChanged = context.viewportChanged;
      var somethingChanged = propsChanged || dataChanged || viewportChanged;

      // Check update triggers to determine if any attributes need regeneration
      // Note - if data has changed, all attributes will need regeneration, so skip this step
      if (!dataChanged) {
        this._diffUpdateTriggers(oldProps, newProps);
      }

      // Trace what happened
      if (dataChanged) {
        log.log(LOG_PRIORITY_UPDATE, 'dataChanged: ' + dataChangedReason + ' in ' + this.id);
      } else if (propsChanged) {
        log.log(LOG_PRIORITY_UPDATE, 'propsChanged: ' + propsChangedReason + ' in ' + this.id);
      }

      return {
        propsChanged: propsChanged,
        dataChanged: dataChanged,
        propsOrDataChanged: propsOrDataChanged,
        viewportChanged: viewportChanged,
        somethingChanged: somethingChanged,
        reason: dataChangedReason || propsChangedReason || 'Viewport changed'
      };
    }

    // PRIVATE METHODS

    // The comparison of the data prop requires special handling
    // the dataComparator should be used if supplied

  }, {
    key: '_diffDataProps',
    value: function _diffDataProps(oldProps, newProps) {
      if (oldProps === null) {
        return 'oldProps is null, initial diff';
      }

      // Support optional app defined comparison of data
      var dataComparator = newProps.dataComparator;

      if (dataComparator) {
        if (!dataComparator(newProps.data, oldProps.data)) {
          return 'Data comparator detected a change';
        }
        // Otherwise, do a shallow equal on props
      } else if (newProps.data !== oldProps.data) {
        return 'A new data container was supplied';
      }

      return null;
    }

    // Checks if any update triggers have changed, and invalidate
    // attributes accordingly.
    /* eslint-disable max-statements */

  }, {
    key: '_diffUpdateTriggers',
    value: function _diffUpdateTriggers(oldProps, newProps) {
      // const {attributeManager} = this.state;
      // const updateTriggerMap = attributeManager.getUpdateTriggerMap();
      if (oldProps === null) {
        return true; // oldProps is null, initial diff
      }

      var change = false;

      for (var propName in newProps.updateTriggers) {
        var oldTriggers = oldProps.updateTriggers[propName] || {};
        var newTriggers = newProps.updateTriggers[propName] || {};
        var diffReason = compareProps({
          oldProps: oldTriggers,
          newProps: newTriggers,
          triggerName: propName
        });
        if (diffReason) {
          if (propName === 'all') {
            log.log(LOG_PRIORITY_UPDATE, 'updateTriggers invalidating all attributes: ' + diffReason);
            this.invalidateAttribute('all');
            change = true;
          } else {
            log.log(LOG_PRIORITY_UPDATE, 'updateTriggers invalidating attribute ' + propName + ': ' + diffReason);
            this.invalidateAttribute(propName);
            change = true;
          }
        }
      }

      return change;
    }
    /* eslint-enable max-statements */

  }, {
    key: '_checkRequiredProp',
    value: function _checkRequiredProp(propertyName, condition) {
      var value = this.props[propertyName];
      if (value === undefined) {
        throw new Error('Property ' + propertyName + ' undefined in layer ' + this);
      }
      if (condition && !condition(value)) {
        throw new Error('Bad property ' + propertyName + ' in layer ' + this);
      }
    }

    // Emits a warning if an old prop is used, optionally suggesting a replacement

  }, {
    key: '_checkRemovedProp',
    value: function _checkRemovedProp(oldProp) {
      var newProp = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      if (this.props[oldProp] !== undefined) {
        var layerName = this.constructor;
        var message = layerName + ' no longer accepts props.' + oldProp + ' in this version of deck.gl.';
        if (newProp) {
          message += '\nPlease use props.' + newProp + ' instead.';
        }
        log.once(0, message);
      }
    }
  }, {
    key: '_updateBaseUniforms',
    value: function _updateBaseUniforms() {
      this.setUniforms({
        // apply gamma to opacity to make it visually "linear"
        opacity: Math.pow(this.props.opacity, 1 / 2.2),
        ONE: 1.0
      });
    }

    // DEPRECATED METHODS

    // Updates selected state members and marks the object for redraw

  }, {
    key: 'setUniforms',
    value: function setUniforms(uniformMap) {
      if (this.state.model) {
        this.state.model.setUniforms(uniformMap);
      }
      // TODO - set needsRedraw on the model?
      this.state.needsRedraw = true;
      log(3, 'layer.setUniforms', uniformMap);
    }
  }, {
    key: 'stats',
    get: function get() {
      return this.state.stats;
    }
  }]);

  return Layer;
}();

export default Layer;


Layer.layerName = 'Layer';
Layer.propTypes = defaultProps;
Layer.defaultProps = defaultProps;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvbGF5ZXIuanMiXSwibmFtZXMiOlsiQ09PUkRJTkFURV9TWVNURU0iLCJMSUZFQ1lDTEUiLCJBdHRyaWJ1dGVNYW5hZ2VyIiwiU3RhdHMiLCJnZXREZWZhdWx0UHJvcHMiLCJjb21wYXJlUHJvcHMiLCJsb2ciLCJjb3VudCIsImFwcGx5UHJvcE92ZXJyaWRlcyIsInJlbW92ZUxheWVySW5TZWVyIiwiR0wiLCJ3aXRoUGFyYW1ldGVycyIsImFzc2VydCIsIkxPR19QUklPUklUWV9VUERBVEUiLCJFTVBUWV9BUlJBWSIsIm5vb3AiLCJkZWZhdWx0UHJvcHMiLCJkYXRhQ29tcGFyYXRvciIsInVwZGF0ZVRyaWdnZXJzIiwibnVtSW5zdGFuY2VzIiwidW5kZWZpbmVkIiwidmlzaWJsZSIsInBpY2thYmxlIiwib3BhY2l0eSIsIm9uSG92ZXIiLCJvbkNsaWNrIiwicHJvamVjdGlvbk1vZGUiLCJMTkdMQVQiLCJwYXJhbWV0ZXJzIiwidW5pZm9ybXMiLCJmcmFtZWJ1ZmZlciIsImFuaW1hdGlvbiIsImdldFBvbHlnb25PZmZzZXQiLCJsYXllckluZGV4IiwiY291bnRlciIsIkxheWVyIiwicHJvcHMiLCJtZXJnZWREZWZhdWx0UHJvcHMiLCJPYmplY3QiLCJhc3NpZ24iLCJkYXRhIiwiZnJlZXplIiwiaWQiLCJhbmltYXRlZFByb3BzIiwib2xkUHJvcHMiLCJzdGF0ZSIsImNvbnRleHQiLCJsaWZlY3ljbGUiLCJOT19TVEFURSIsInBhcmVudExheWVyIiwib2xkU3ViTGF5ZXJzIiwic2VhbCIsImNsYXNzTmFtZSIsImNvbnN0cnVjdG9yIiwibGF5ZXJOYW1lIiwibmFtZSIsIkVycm9yIiwib2xkQ29udGV4dCIsImNoYW5nZUZsYWdzIiwicHJvcHNPckRhdGFDaGFuZ2VkIiwiZGF0YUNoYW5nZWQiLCJpbnZhbGlkYXRlQXR0cmlidXRlIiwibW9kZWwiLCJyZW5kZXIiLCJpbmZvIiwibW9kZSIsImNvbG9yIiwiaW5kZXgiLCJBcnJheSIsImlzQXJyYXkiLCJvYmplY3QiLCJzZWxlY3RlZFBpY2tpbmdDb2xvciIsIkZsb2F0MzJBcnJheSIsInNldFVuaWZvcm1zIiwiYXR0cmlidXRlTWFuYWdlciIsImludmFsaWRhdGVBbGwiLCJpbnZhbGlkYXRlIiwiZ2V0TnVtSW5zdGFuY2VzIiwidXBkYXRlIiwiYnVmZmVycyIsImlnbm9yZVVua25vd25BdHRyaWJ1dGVzIiwiY2hhbmdlZEF0dHJpYnV0ZXMiLCJnZXRDaGFuZ2VkQXR0cmlidXRlcyIsImNsZWFyQ2hhbmdlZEZsYWdzIiwic2V0QXR0cmlidXRlcyIsInVwZGF0ZU9iamVjdCIsIm5lZWRzUmVkcmF3IiwicmVkcmF3IiwibG5nTGF0Iiwidmlld3BvcnQiLCJwcm9qZWN0IiwieHkiLCJ1bnByb2plY3QiLCJwcm9qZWN0RmxhdCIsInVucHJvamVjdEZsYXQiLCJzY3JlZW5QaXhlbHMiLCJkZXZpY2VQaXhlbFJhdGlvIiwid2luZG93IiwiaSIsIlVpbnQ4QXJyYXkiLCJpMSIsImkyIiwiaTMiLCJhdHRyaWJ1dGUiLCJ2YWx1ZSIsInNpemUiLCJwaWNraW5nQ29sb3IiLCJlbmNvZGVQaWNraW5nQ29sb3IiLCJ1cGRhdGVQYXJhbXMiLCJnbCIsInN0YXRzIiwic2V0U3RhdGUiLCJhZGRJbnN0YW5jZWQiLCJpbnN0YW5jZVBpY2tpbmdDb2xvcnMiLCJ0eXBlIiwiVU5TSUdORURfQllURSIsImNhbGN1bGF0ZUluc3RhbmNlUGlja2luZ0NvbG9ycyIsImluaXRpYWxpemVTdGF0ZSIsInVwZGF0ZVN0YXRlIiwidXBkYXRlQXR0cmlidXRlcyIsIl91cGRhdGVCYXNlVW5pZm9ybXMiLCJzZXRJbnN0YW5jZUNvdW50IiwicHJvZ3JhbSIsImdlb21ldHJ5IiwiZ2V0QXR0cmlidXRlcyIsInNob3VsZFVwZGF0ZSIsIm9uY2UiLCJzdGF0ZU5lZWRzVXBkYXRlIiwic2hvdWxkVXBkYXRlU3RhdGUiLCJmaW5hbGl6ZVN0YXRlIiwibW9kdWxlUGFyYW1ldGVycyIsInVwZGF0ZU1vZHVsZVNldHRpbmdzIiwib2Zmc2V0cyIsInBvbHlnb25PZmZzZXQiLCJkcmF3Iiwib3B0cyIsImdldFBpY2tpbmdJbmZvIiwiY2xlYXJSZWRyYXdGbGFncyIsImdldE5lZWRzUmVkcmF3IiwibmV3UHJvcHMiLCJwcm9wc0NoYW5nZWRSZWFzb24iLCJpZ25vcmVQcm9wcyIsImRhdGFDaGFuZ2VkUmVhc29uIiwiX2RpZmZEYXRhUHJvcHMiLCJwcm9wc0NoYW5nZWQiLCJCb29sZWFuIiwidmlld3BvcnRDaGFuZ2VkIiwic29tZXRoaW5nQ2hhbmdlZCIsIl9kaWZmVXBkYXRlVHJpZ2dlcnMiLCJyZWFzb24iLCJjaGFuZ2UiLCJwcm9wTmFtZSIsIm9sZFRyaWdnZXJzIiwibmV3VHJpZ2dlcnMiLCJkaWZmUmVhc29uIiwidHJpZ2dlck5hbWUiLCJwcm9wZXJ0eU5hbWUiLCJjb25kaXRpb24iLCJvbGRQcm9wIiwibmV3UHJvcCIsIm1lc3NhZ2UiLCJNYXRoIiwicG93IiwiT05FIiwidW5pZm9ybU1hcCIsInByb3BUeXBlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxTQUFRQSxpQkFBUixFQUEyQkMsU0FBM0IsUUFBMkMsYUFBM0M7QUFDQSxPQUFPQyxnQkFBUCxNQUE2QixxQkFBN0I7QUFDQSxPQUFPQyxLQUFQLE1BQWtCLFNBQWxCO0FBQ0EsU0FBUUMsZUFBUixFQUF5QkMsWUFBekIsUUFBNEMsU0FBNUM7QUFDQSxTQUFRQyxHQUFSLEVBQWFDLEtBQWIsUUFBeUIsU0FBekI7QUFDQSxTQUFRQyxrQkFBUixFQUE0QkMsaUJBQTVCLFFBQW9ELDJCQUFwRDtBQUNBLFNBQVFDLEVBQVIsRUFBWUMsY0FBWixRQUFpQyxTQUFqQztBQUNBLE9BQU9DLE1BQVAsTUFBbUIsUUFBbkI7O0FBRUEsSUFBTUMsc0JBQXNCLENBQTVCOztBQUVBLElBQU1DLGNBQWMsRUFBcEI7QUFD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bEI7QUFDRDs7Ozs7O2VBekNrQjNFLEs7OztBQThpQnJCQSxNQUFNbUIsU0FBTixHQUFrQixPQUFsQjtBQUNBbkIsTUFBTWtJLFNBQU4sR0FBa0JySixZQUFsQjtBQUNBbUIsTUFBTW5CLFlBQU4sR0FBcUJBLFlBQXJCIiwiZmlsZSI6ImxheWVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbi8qIGdsb2JhbCB3aW5kb3cgKi9cbmltcG9ydCB7Q09PUkRJTkFURV9TWVNURU0sIExJRkVDWUNMRX0gZnJvbSAnLi9jb25zdGFudHMnO1xuaW1wb3J0IEF0dHJpYnV0ZU1hbmFnZXIgZnJvbSAnLi9hdHRyaWJ1dGUtbWFuYWdlcic7XG5pbXBvcnQgU3RhdHMgZnJvbSAnLi9zdGF0cyc7XG5pbXBvcnQge2dldERlZmF1bHRQcm9wcywgY29tcGFyZVByb3BzfSBmcm9tICcuL3Byb3BzJztcbmltcG9ydCB7bG9nLCBjb3VudH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge2FwcGx5UHJvcE92ZXJyaWRlcywgcmVtb3ZlTGF5ZXJJblNlZXJ9IGZyb20gJy4uL2RlYnVnL3NlZXItaW50ZWdyYXRpb24nO1xuaW1wb3J0IHtHTCwgd2l0aFBhcmFtZXRlcnN9IGZyb20gJ2x1bWEuZ2wnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBMT0dfUFJJT1JJVFlfVVBEQVRFID0gMTtcblxuY29uc3QgRU1QVFlfQVJSQVkgPSBbXTtcbmNvbnN0IG5vb3AgPSAoKSA9PiB7fTtcblxuLypcbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wcy5pZCAtIGxheWVyIG5hbWVcbiAqIEBwYXJhbSB7YXJyYXl9ICBwcm9wcy5kYXRhIC0gYXJyYXkgb2YgZGF0YSBpbnN0YW5jZXNcbiAqIEBwYXJhbSB7Ym9vbH0gcHJvcHMub3BhY2l0eSAtIG9wYWNpdHkgb2YgdGhlIGxheWVyXG4gKi9cbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcbiAgLy8gZGF0YTogU3BlY2lhbCBoYW5kbGluZyBmb3IgbnVsbCwgc2VlIGJlbG93XG4gIGRhdGFDb21wYXJhdG9yOiBudWxsLFxuICB1cGRhdGVUcmlnZ2Vyczoge30sIC8vIFVwZGF0ZSB0cmlnZ2VyczogYSBjb3JlIGNoYW5nZSBkZXRlY3Rpb24gbWVjaGFuaXNtIGluIGRlY2suZ2xcbiAgbnVtSW5zdGFuY2VzOiB1bmRlZmluZWQsXG5cbiAgdmlzaWJsZTogdHJ1ZSxcbiAgcGlja2FibGU6IGZhbHNlLFxuICBvcGFjaXR5OiAwLjgsXG5cbiAgb25Ib3Zlcjogbm9vcCxcbiAgb25DbGljazogbm9vcCxcblxuICBwcm9qZWN0aW9uTW9kZTogQ09PUkRJTkFURV9TWVNURU0uTE5HTEFULFxuXG4gIHBhcmFtZXRlcnM6IHt9LFxuICB1bmlmb3Jtczoge30sXG4gIGZyYW1lYnVmZmVyOiBudWxsLFxuXG4gIGFuaW1hdGlvbjogbnVsbCwgLy8gUGFzc2VkIHByb3AgYW5pbWF0aW9uIGZ1bmN0aW9ucyB0byBldmFsdWF0ZSBwcm9wc1xuXG4gIC8vIE9mZnNldCBkZXB0aCBiYXNlZCBvbiBsYXllciBpbmRleCB0byBhdm9pZCB6LWZpZ2h0aW5nLlxuICAvLyBOZWdhdGl2ZSB2YWx1ZXMgcHVsbCBsYXllciB0b3dhcmRzIHRoZSBjYW1lcmFcbiAgLy8gaHR0cHM6Ly93d3cub3BlbmdsLm9yZy9hcmNoaXZlcy9yZXNvdXJjZXMvZmFxL3RlY2huaWNhbC9wb2x5Z29ub2Zmc2V0Lmh0bVxuICBnZXRQb2x5Z29uT2Zmc2V0OiAoe2xheWVySW5kZXh9KSA9PiBbMCwgLWxheWVySW5kZXggKiAxMDBdXG59O1xuXG5sZXQgY291bnRlciA9IDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExheWVyIHtcbiAgLyoqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge29iamVjdH0gcHJvcHMgLSBTZWUgZG9jcyBhbmQgZGVmYXVsdHMgYWJvdmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgLy8gSWYgc3VibGF5ZXIgaGFzIHN0YXRpYyBkZWZhdWx0UHJvcHMgbWVtYmVyLCBnZXREZWZhdWx0UHJvcHMgd2lsbCByZXR1cm4gaXRcbiAgICBjb25zdCBtZXJnZWREZWZhdWx0UHJvcHMgPSBnZXREZWZhdWx0UHJvcHModGhpcyk7XG4gICAgLy8gTWVyZ2Ugc3VwcGxpZWQgcHJvcHMgd2l0aCBwcmUtbWVyZ2VkIGRlZmF1bHQgcHJvcHNcbiAgICBwcm9wcyA9IE9iamVjdC5hc3NpZ24oe30sIG1lcmdlZERlZmF1bHRQcm9wcywgcHJvcHMpO1xuICAgIC8vIEFjY2VwdCBudWxsIGFzIGRhdGEgLSBvdGhlcndpc2UgYXBwcyBhbmQgbGF5ZXJzIG5lZWQgdG8gYWRkIHVnbHkgY2hlY2tzXG4gICAgLy8gVXNlIGNvbnN0YW50IGZhbGxiYWNrIHNvIHRoYXQgZGF0YSBjaGFuZ2UgaXMgbm90IHRyaWdnZXJlZFxuICAgIHByb3BzLmRhdGEgPSBwcm9wcy5kYXRhIHx8IEVNUFRZX0FSUkFZO1xuICAgIC8vIEFwcGx5IGFueSBvdmVycmlkZXMgZnJvbSB0aGUgc2VlciBkZWJ1ZyBleHRlbnNpb24gaWYgaXQgaXMgYWN0aXZlXG4gICAgYXBwbHlQcm9wT3ZlcnJpZGVzKHByb3BzKTtcbiAgICAvLyBQcm9wcyBhcmUgaW1tdXRhYmxlXG4gICAgT2JqZWN0LmZyZWV6ZShwcm9wcyk7XG5cbiAgICAvLyBEZWZpbmUgYWxsIG1lbWJlcnNcbiAgICB0aGlzLmlkID0gcHJvcHMuaWQ7IC8vIFRoZSBsYXllcidzIGlkLCB1c2VkIGZvciBtYXRjaGluZyB3aXRoIGxheWVycycgZnJvbSBsYXN0IHJlbmRlciBjeWNrbGVcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7IC8vIEN1cnJlbnQgcHJvcHMsIGEgZnJvemVuIG9iamVjdFxuICAgIHRoaXMuYW5pbWF0ZWRQcm9wcyA9IG51bGw7IC8vIENvbXB1dGluZyBhbmltYXRlZCBwcm9wcyByZXF1aXJlcyBsYXllciBtYW5hZ2VyIHN0YXRlXG4gICAgdGhpcy5vbGRQcm9wcyA9IG51bGw7IC8vIFByb3BzIGZyb20gbGFzdCByZW5kZXIgdXNlZCBmb3IgY2hhbmdlIGRldGVjdGlvblxuICAgIHRoaXMuc3RhdGUgPSBudWxsOyAvLyBXaWxsIGJlIHNldCB0byB0aGUgc2hhcmVkIGxheWVyIHN0YXRlIG9iamVjdCBkdXJpbmcgbGF5ZXIgbWF0Y2hpbmdcbiAgICB0aGlzLmNvbnRleHQgPSBudWxsOyAvLyBXaWxsIHJlZmVyZW5jZSBsYXllciBtYW5hZ2VyJ3MgY29udGV4dCwgY29udGFpbnMgc3RhdGUgc2hhcmVkIGJ5IGxheWVyc1xuICAgIHRoaXMuY291bnQgPSBjb3VudGVyKys7IC8vIEtlZXAgdHJhY2sgb2YgaG93IG1hbnkgbGF5ZXIgaW5zdGFuY2VzIHlvdSBhcmUgZ2VuZXJhdGluZ1xuICAgIHRoaXMubGlmZWN5Y2xlID0gTElGRUNZQ0xFLk5PX1NUQVRFOyAvLyBIZWxwcyB0cmFjayBhbmQgZGVidWcgdGhlIGxpZmUgY3ljbGUgb2YgdGhlIGxheWVyc1xuICAgIC8vIENvbXBvc2l0ZUxheWVyIG1lbWJlcnMsIG5lZWQgdG8gYmUgZGVmaW5lZCBoZXJlIGJlY2F1c2Ugb2YgdGhlIGBPYmplY3Quc2VhbGBcbiAgICB0aGlzLnBhcmVudExheWVyID0gbnVsbDsgLy8gcmVmZXJlbmNlIHRvIHRoZSBjb21wb3NpdGUgbGF5ZXIgcGFyZW50IHRoYXQgcmVuZGVyZWQgdGhpcyBsYXllclxuICAgIHRoaXMub2xkU3ViTGF5ZXJzID0gW107IC8vIHJlZmVyZW5jZSB0byBzdWJsYXllcnMgcmVuZGVyZWQgaW4gdGhlIHByZXZpb3VzIGN5Y2xlXG4gICAgLy8gU2VhbCB0aGUgbGF5ZXJcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IHRoaXMuY29uc3RydWN0b3IubGF5ZXJOYW1lIHx8IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgICByZXR1cm4gY2xhc3NOYW1lICE9PSB0aGlzLnByb3BzLmlkID8gYDwke2NsYXNzTmFtZX06JyR7dGhpcy5wcm9wcy5pZH0nPmAgOiBgPCR7Y2xhc3NOYW1lfT5gO1xuICB9XG5cbiAgZ2V0IHN0YXRzKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlLnN0YXRzO1xuICB9XG5cbiAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbiAgLy8gTElGRUNZQ0xFIE1FVEhPRFMsIG92ZXJyaWRkZW4gYnkgdGhlIGxheWVyIHN1YmNsYXNzZXNcblxuICAvLyBDYWxsZWQgb25jZSB0byBzZXQgdXAgdGhlIGluaXRpYWwgc3RhdGVcbiAgLy8gQXBwIGNhbiBjcmVhdGUgV2ViR0wgcmVzb3VyY2VzXG4gIGluaXRpYWxpemVTdGF0ZSgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYExheWVyICR7dGhpc30gaGFzIG5vdCBkZWZpbmVkIGluaXRpYWxpemVTdGF0ZWApO1xuICB9XG5cbiAgLy8gTGV0J3MgbGF5ZXIgY29udHJvbCBpZiB1cGRhdGVTdGF0ZSBzaG91bGQgYmUgY2FsbGVkXG4gIHNob3VsZFVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIG9sZENvbnRleHQsIGNvbnRleHQsIGNoYW5nZUZsYWdzfSkge1xuICAgIHJldHVybiBjaGFuZ2VGbGFncy5wcm9wc09yRGF0YUNoYW5nZWQ7XG4gIH1cblxuICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uLCBhbGwgYXR0cmlidXRlcyB3aWxsIGJlIGludmFsaWRhdGVkIGFuZCB1cGRhdGVkXG4gIC8vIHdoZW4gZGF0YSBjaGFuZ2VzXG4gIHVwZGF0ZVN0YXRlKHtvbGRQcm9wcywgcHJvcHMsIG9sZENvbnRleHQsIGNvbnRleHQsIGNoYW5nZUZsYWdzfSkge1xuICAgIGlmIChjaGFuZ2VGbGFncy5kYXRhQ2hhbmdlZCkge1xuICAgICAgdGhpcy5pbnZhbGlkYXRlQXR0cmlidXRlKCdhbGwnKTtcbiAgICB9XG4gIH1cblxuICAvLyBDYWxsZWQgb25jZSB3aGVuIGxheWVyIGlzIG5vIGxvbmdlciBtYXRjaGVkIGFuZCBzdGF0ZSB3aWxsIGJlIGRpc2NhcmRlZFxuICAvLyBBcHAgY2FuIGRlc3Ryb3kgV2ViR0wgcmVzb3VyY2VzIGhlcmVcbiAgZmluYWxpemVTdGF0ZSgpIHtcbiAgfVxuXG4gIC8vIElmIHN0YXRlIGhhcyBhIG1vZGVsLCBkcmF3IGl0IHdpdGggc3VwcGxpZWQgdW5pZm9ybXNcbiAgZHJhdyh7dW5pZm9ybXMgPSB7fX0pIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5tb2RlbCkge1xuICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5yZW5kZXIodW5pZm9ybXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNhbGxlZCB0byBwb3B1bGF0ZSB0aGUgaW5mbyBvYmplY3QgdGhhdCBpcyBwYXNzZWQgdG8gdGhlIGV2ZW50IGhhbmRsZXJcbiAgLy8gQHJldHVybiBudWxsIHRvIGNhbmNlbCBldmVudFxuICBnZXRQaWNraW5nSW5mbyh7aW5mbywgbW9kZX0pIHtcbiAgICBjb25zdCB7Y29sb3IsIGluZGV4fSA9IGluZm87XG5cbiAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgLy8gSWYgcHJvcHMuZGF0YSBpcyBhbiBpbmRleGFibGUgYXJyYXksIGdldCB0aGUgb2JqZWN0XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh0aGlzLnByb3BzLmRhdGEpKSB7XG4gICAgICAgIGluZm8ub2JqZWN0ID0gdGhpcy5wcm9wcy5kYXRhW2luZGV4XTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUT0RPIC0gbW92ZSB0byB0aGUgSlMgcGFydCBvZiBhIHNoYWRlciBwaWNraW5nIHNoYWRlciBwYWNrYWdlXG4gICAgaWYgKG1vZGUgPT09ICdob3ZlcicpIHtcbiAgICAgIGNvbnN0IHNlbGVjdGVkUGlja2luZ0NvbG9yID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgIHNlbGVjdGVkUGlja2luZ0NvbG9yWzBdID0gY29sb3JbMF07XG4gICAgICBzZWxlY3RlZFBpY2tpbmdDb2xvclsxXSA9IGNvbG9yWzFdO1xuICAgICAgc2VsZWN0ZWRQaWNraW5nQ29sb3JbMl0gPSBjb2xvclsyXTtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXMoe3NlbGVjdGVkUGlja2luZ0NvbG9yfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvLyBFTkQgTElGRUNZQ0xFIE1FVEhPRFNcbiAgLy8gLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGF0dHJpYnV0ZSBpbnZhbGlkYXRpb24sIGNhbiBiZSByZWRlZmluZVxuICBpbnZhbGlkYXRlQXR0cmlidXRlKG5hbWUgPSAnYWxsJykge1xuICAgIGlmIChuYW1lID09PSAnYWxsJykge1xuICAgICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGVBbGwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zdGF0ZS5hdHRyaWJ1dGVNYW5hZ2VyLmludmFsaWRhdGUobmFtZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbHMgYXR0cmlidXRlIG1hbmFnZXIgdG8gdXBkYXRlIGFueSBXZWJHTCBhdHRyaWJ1dGVzLCBjYW4gYmUgcmVkZWZpbmVkXG4gIHVwZGF0ZUF0dHJpYnV0ZXMocHJvcHMpIHtcbiAgICBjb25zdCB7YXR0cmlidXRlTWFuYWdlciwgbW9kZWx9ID0gdGhpcy5zdGF0ZTtcbiAgICBpZiAoIWF0dHJpYnV0ZU1hbmFnZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBGaWd1cmUgb3V0IGRhdGEgbGVuZ3RoXG4gICAgY29uc3QgbnVtSW5zdGFuY2VzID0gdGhpcy5nZXROdW1JbnN0YW5jZXMocHJvcHMpO1xuXG4gICAgYXR0cmlidXRlTWFuYWdlci51cGRhdGUoe1xuICAgICAgZGF0YTogcHJvcHMuZGF0YSxcbiAgICAgIG51bUluc3RhbmNlcyxcbiAgICAgIHByb3BzLFxuICAgICAgYnVmZmVyczogcHJvcHMsXG4gICAgICBjb250ZXh0OiB0aGlzLFxuICAgICAgLy8gRG9uJ3Qgd29ycnkgYWJvdXQgbm9uLWF0dHJpYnV0ZSBwcm9wc1xuICAgICAgaWdub3JlVW5rbm93bkF0dHJpYnV0ZXM6IHRydWVcbiAgICB9KTtcblxuICAgIGlmIChtb2RlbCkge1xuICAgICAgY29uc3QgY2hhbmdlZEF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVNYW5hZ2VyLmdldENoYW5nZWRBdHRyaWJ1dGVzKHtjbGVhckNoYW5nZWRGbGFnczogdHJ1ZX0pO1xuICAgICAgbW9kZWwuc2V0QXR0cmlidXRlcyhjaGFuZ2VkQXR0cmlidXRlcyk7XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljIEFQSVxuXG4gIC8vIFVwZGF0ZXMgc2VsZWN0ZWQgc3RhdGUgbWVtYmVycyBhbmQgbWFya3MgdGhlIG9iamVjdCBmb3IgcmVkcmF3XG4gIHNldFN0YXRlKHVwZGF0ZU9iamVjdCkge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5zdGF0ZSwgdXBkYXRlT2JqZWN0KTtcbiAgICB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgfVxuXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSkge1xuICAgICAgdGhpcy5zdGF0ZS5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICB9XG4gIH1cblxuICAvLyBQUk9KRUNUSU9OIE1FVEhPRFNcblxuICAvKipcbiAgICogUHJvamVjdHMgYSBwb2ludCB3aXRoIGN1cnJlbnQgbWFwIHN0YXRlIChsYXQsIGxvbiwgem9vbSwgcGl0Y2gsIGJlYXJpbmcpXG4gICAqXG4gICAqIE5vdGU6IFBvc2l0aW9uIGNvbnZlcnNpb24gaXMgZG9uZSBpbiBzaGFkZXIsIHNvIGluIG1hbnkgY2FzZXMgdGhlcmUgaXMgbm8gbmVlZFxuICAgKiBmb3IgdGhpcyBmdW5jdGlvblxuICAgKiBAcGFyYW0ge0FycmF5fFR5cGVkQXJyYXl9IGxuZ0xhdCAtIGxvbmcgYW5kIGxhdCB2YWx1ZXNcbiAgICogQHJldHVybiB7QXJyYXl8VHlwZWRBcnJheX0gLSB4LCB5IGNvb3JkaW5hdGVzXG4gICAqL1xuICBwcm9qZWN0KGxuZ0xhdCkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkobG5nTGF0KSwgJ0xheWVyLnByb2plY3QgbmVlZHMgW2xuZyxsYXRdJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnByb2plY3QobG5nTGF0KTtcbiAgfVxuXG4gIHVucHJvamVjdCh4eSkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoeHkpLCAnTGF5ZXIudW5wcm9qZWN0IG5lZWRzIFt4LHldJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnVucHJvamVjdCh4eSk7XG4gIH1cblxuICBwcm9qZWN0RmxhdChsbmdMYXQpIHtcbiAgICBjb25zdCB7dmlld3BvcnR9ID0gdGhpcy5jb250ZXh0O1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGxuZ0xhdCksICdMYXllci5wcm9qZWN0IG5lZWRzIFtsbmcsbGF0XScpO1xuICAgIHJldHVybiB2aWV3cG9ydC5wcm9qZWN0RmxhdChsbmdMYXQpO1xuICB9XG5cbiAgdW5wcm9qZWN0RmxhdCh4eSkge1xuICAgIGNvbnN0IHt2aWV3cG9ydH0gPSB0aGlzLmNvbnRleHQ7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoeHkpLCAnTGF5ZXIudW5wcm9qZWN0IG5lZWRzIFt4LHldJyk7XG4gICAgcmV0dXJuIHZpZXdwb3J0LnVucHJvamVjdEZsYXQoeHkpO1xuICB9XG5cbiAgc2NyZWVuVG9EZXZpY2VQaXhlbHMoc2NyZWVuUGl4ZWxzKSB7XG4gICAgY29uc3QgZGV2aWNlUGl4ZWxSYXRpbyA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnID9cbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIDogMTtcbiAgICByZXR1cm4gc2NyZWVuUGl4ZWxzICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIGEgYmxhY2sgY29sb3JcbiAgICovXG4gIG51bGxQaWNraW5nQ29sb3IoKSB7XG4gICAgcmV0dXJuIFswLCAwLCAwXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEBwYXJhbSB7aW50fSBpIC0gaW5kZXggdG8gYmUgZGVjb2RlZFxuICAgKiBAcmV0dXJuIHtBcnJheX0gLSB0aGUgZGVjb2RlZCBjb2xvclxuICAgKi9cbiAgZW5jb2RlUGlja2luZ0NvbG9yKGkpIHtcbiAgICByZXR1cm4gW1xuICAgICAgKGkgKyAxKSAmIDI1NSxcbiAgICAgICgoaSArIDEpID4+IDgpICYgMjU1LFxuICAgICAgKCgoaSArIDEpID4+IDgpID4+IDgpICYgMjU1XG4gICAgXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwaWNraW5nIGNvbG9yIHRoYXQgZG9lc24ndCBtYXRjaCBhbnkgc3ViZmVhdHVyZVxuICAgKiBVc2UgaWYgc29tZSBncmFwaGljcyBkbyBub3QgYmVsb25nIHRvIGFueSBwaWNrYWJsZSBzdWJmZWF0dXJlXG4gICAqIEBwYXJhbSB7VWludDhBcnJheX0gY29sb3IgLSBjb2xvciBhcnJheSB0byBiZSBkZWNvZGVkXG4gICAqIEByZXR1cm4ge0FycmF5fSAtIHRoZSBkZWNvZGVkIHBpY2tpbmcgY29sb3JcbiAgICovXG4gIGRlY29kZVBpY2tpbmdDb2xvcihjb2xvcikge1xuICAgIGFzc2VydChjb2xvciBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpO1xuICAgIGNvbnN0IFtpMSwgaTIsIGkzXSA9IGNvbG9yO1xuICAgIC8vIDEgd2FzIGFkZGVkIHRvIHNlcGVyYXRlIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgY29uc3QgaW5kZXggPSBpMSArIGkyICogMjU2ICsgaTMgKiA2NTUzNiAtIDE7XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG5cbiAgY2FsY3VsYXRlSW5zdGFuY2VQaWNraW5nQ29sb3JzKGF0dHJpYnV0ZSwge251bUluc3RhbmNlc30pIHtcbiAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgIC8vIGFkZCAxIHRvIGluZGV4IHRvIHNlcGVyYXRlIGZyb20gbm8gc2VsZWN0aW9uXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1JbnN0YW5jZXM7IGkrKykge1xuICAgICAgY29uc3QgcGlja2luZ0NvbG9yID0gdGhpcy5lbmNvZGVQaWNraW5nQ29sb3IoaSk7XG4gICAgICB2YWx1ZVtpICogc2l6ZSArIDBdID0gcGlja2luZ0NvbG9yWzBdO1xuICAgICAgdmFsdWVbaSAqIHNpemUgKyAxXSA9IHBpY2tpbmdDb2xvclsxXTtcbiAgICAgIHZhbHVlW2kgKiBzaXplICsgMl0gPSBwaWNraW5nQ29sb3JbMl07XG4gICAgfVxuICB9XG5cbiAgLy8gREFUQSBBQ0NFU1MgQVBJXG4gIC8vIERhdGEgY2FuIHVzZSBpdGVyYXRvcnMgYW5kIG1heSBub3QgYmUgcmFuZG9tIGFjY2Vzc1xuXG4gIC8vIFVzZSBpdGVyYXRpb24gKHRoZSBvbmx5IHJlcXVpcmVkIGNhcGFiaWxpdHkgb24gZGF0YSkgdG8gZ2V0IGZpcnN0IGVsZW1lbnRcbiAgZ2V0Rmlyc3RPYmplY3QoKSB7XG4gICAgY29uc3Qge2RhdGF9ID0gdGhpcy5wcm9wcztcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICByZXR1cm4gb2JqZWN0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIElOVEVSTkFMIE1FVEhPRFNcblxuICAvLyBEZWR1Y2VzIG51bWVyIG9mIGluc3RhbmNlcy4gSW50ZW50aW9uIGlzIHRvIHN1cHBvcnQ6XG4gIC8vIC0gRXhwbGljaXQgc2V0dGluZyBvZiBudW1JbnN0YW5jZXNcbiAgLy8gLSBBdXRvLWRlZHVjdGlvbiBmb3IgRVM2IGNvbnRhaW5lcnMgdGhhdCBkZWZpbmUgYSBzaXplIG1lbWJlclxuICAvLyAtIEF1dG8tZGVkdWN0aW9uIGZvciBDbGFzc2ljIEFycmF5cyB2aWEgdGhlIGJ1aWx0LWluIGxlbmd0aCBhdHRyaWJ1dGVcbiAgLy8gLSBBdXRvLWRlZHVjdGlvbiB2aWEgYXJyYXlzXG4gIGdldE51bUluc3RhbmNlcyhwcm9wcykge1xuICAgIHByb3BzID0gcHJvcHMgfHwgdGhpcy5wcm9wcztcblxuICAgIC8vIEZpcnN0IGNoZWNrIGlmIHRoZSBsYXllciBoYXMgc2V0IGl0cyBvd24gdmFsdWVcbiAgICBpZiAodGhpcy5zdGF0ZSAmJiB0aGlzLnN0YXRlLm51bUluc3RhbmNlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdGF0ZS5udW1JbnN0YW5jZXM7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgYXBwIGhhcyBwcm92aWRlZCBhbiBleHBsaWNpdCB2YWx1ZVxuICAgIGlmIChwcm9wcy5udW1JbnN0YW5jZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHByb3BzLm51bUluc3RhbmNlcztcbiAgICB9XG5cbiAgICAvLyBVc2UgY29udGFpbmVyIGxpYnJhcnkgdG8gZ2V0IGEgY291bnQgZm9yIGFueSBFUzYgY29udGFpbmVyIG9yIG9iamVjdFxuICAgIGNvbnN0IHtkYXRhfSA9IHByb3BzO1xuICAgIHJldHVybiBjb3VudChkYXRhKTtcbiAgfVxuXG4gIC8vIExBWUVSIE1BTkFHRVIgQVBJXG4gIC8vIFNob3VsZCBvbmx5IGJlIGNhbGxlZCBieSB0aGUgZGVjay5nbCBMYXllck1hbmFnZXIgY2xhc3NcblxuICAvLyBDYWxsZWQgYnkgbGF5ZXIgbWFuYWdlciB3aGVuIGEgbmV3IGxheWVyIGlzIGZvdW5kXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIGluaXRpYWxpemVMYXllcih1cGRhdGVQYXJhbXMpIHtcbiAgICBhc3NlcnQodGhpcy5jb250ZXh0LmdsLCAnTGF5ZXIgY29udGV4dCBtaXNzaW5nIGdsJyk7XG4gICAgYXNzZXJ0KCF0aGlzLnN0YXRlLCAnTGF5ZXIgbWlzc2luZyBzdGF0ZScpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHt9O1xuICAgIHRoaXMuc3RhdGUuc3RhdHMgPSBuZXcgU3RhdHMoe2lkOiAnZHJhdyd9KTtcblxuICAgIC8vIEluaXRpYWxpemUgc3RhdGUgb25seSBvbmNlXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBhdHRyaWJ1dGVNYW5hZ2VyOiBuZXcgQXR0cmlidXRlTWFuYWdlcih7aWQ6IHRoaXMucHJvcHMuaWR9KSxcbiAgICAgIG1vZGVsOiBudWxsLFxuICAgICAgbmVlZHNSZWRyYXc6IHRydWUsXG4gICAgICBkYXRhQ2hhbmdlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXJ9ID0gdGhpcy5zdGF0ZTtcbiAgICAvLyBBbGwgaW5zdGFuY2VkIGxheWVycyBnZXQgaW5zdGFuY2VQaWNraW5nQ29sb3JzIGF0dHJpYnV0ZSBieSBkZWZhdWx0XG4gICAgLy8gVGhlaXIgc2hhZGVycyBjYW4gdXNlIGl0IHRvIHJlbmRlciBhIHBpY2tpbmcgc2NlbmVcbiAgICAvLyBUT0RPIC0gdGhpcyBzbG93cyBkb3duIG5vbiBpbnN0YW5jZWQgbGF5ZXJzXG4gICAgYXR0cmlidXRlTWFuYWdlci5hZGRJbnN0YW5jZWQoe1xuICAgICAgaW5zdGFuY2VQaWNraW5nQ29sb3JzOiB7XG4gICAgICAgIHR5cGU6IEdMLlVOU0lHTkVEX0JZVEUsXG4gICAgICAgIHNpemU6IDMsXG4gICAgICAgIHVwZGF0ZTogdGhpcy5jYWxjdWxhdGVJbnN0YW5jZVBpY2tpbmdDb2xvcnNcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENhbGwgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZHNcbiAgICB0aGlzLmluaXRpYWxpemVTdGF0ZSgpO1xuICAgIHRoaXMudXBkYXRlU3RhdGUodXBkYXRlUGFyYW1zKTtcbiAgICAvLyBFbmQgc3ViY2xhc3MgbGlmZWN5Y2xlIG1ldGhvZHNcblxuICAgIC8vIEFkZCBhbnkgc3ViY2xhc3MgYXR0cmlidXRlc1xuICAgIHRoaXMudXBkYXRlQXR0cmlidXRlcyh0aGlzLnByb3BzKTtcbiAgICB0aGlzLl91cGRhdGVCYXNlVW5pZm9ybXMoKTtcblxuICAgIGNvbnN0IHttb2RlbH0gPSB0aGlzLnN0YXRlO1xuICAgIGlmIChtb2RlbCkge1xuICAgICAgbW9kZWwuc2V0SW5zdGFuY2VDb3VudCh0aGlzLmdldE51bUluc3RhbmNlcygpKTtcbiAgICAgIG1vZGVsLmlkID0gdGhpcy5wcm9wcy5pZDtcbiAgICAgIG1vZGVsLnByb2dyYW0uaWQgPSBgJHt0aGlzLnByb3BzLmlkfS1wcm9ncmFtYDtcbiAgICAgIG1vZGVsLmdlb21ldHJ5LmlkID0gYCR7dGhpcy5wcm9wcy5pZH0tZ2VvbWV0cnlgO1xuICAgICAgbW9kZWwuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVNYW5hZ2VyLmdldEF0dHJpYnV0ZXMoKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsbGVkIGJ5IGxheWVyIG1hbmFnZXIgd2hlbiBleGlzdGluZyBsYXllciBpcyBnZXR0aW5nIG5ldyBwcm9wc1xuICB1cGRhdGVMYXllcih1cGRhdGVQYXJhbXMpIHtcbiAgICAvLyBDaGVjayBmb3IgZGVwcmVjYXRlZCBtZXRob2RcbiAgICBpZiAodGhpcy5zaG91bGRVcGRhdGUpIHtcbiAgICAgIGxvZy5vbmNlKDAsIGBkZWNrLmdsIHYzICR7dGhpc306IFwic2hvdWxkVXBkYXRlXCIgZGVwcmVjYXRlZCwgcmVuYW1lZCB0byBcInNob3VsZFVwZGF0ZVN0YXRlXCJgKTtcbiAgICB9XG5cbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RcbiAgICBjb25zdCBzdGF0ZU5lZWRzVXBkYXRlID0gdGhpcy5zaG91bGRVcGRhdGVTdGF0ZSh1cGRhdGVQYXJhbXMpO1xuICAgIC8vIEVuZCBsaWZlY3ljbGUgbWV0aG9kXG5cbiAgICBpZiAoc3RhdGVOZWVkc1VwZGF0ZSkge1xuICAgICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgICB0aGlzLnVwZGF0ZVN0YXRlKHVwZGF0ZVBhcmFtcyk7XG4gICAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuXG4gICAgICAvLyBSdW4gdGhlIGF0dHJpYnV0ZSB1cGRhdGVyc1xuICAgICAgdGhpcy51cGRhdGVBdHRyaWJ1dGVzKHVwZGF0ZVBhcmFtcy5wcm9wcyk7XG4gICAgICB0aGlzLl91cGRhdGVCYXNlVW5pZm9ybXMoKTtcblxuICAgICAgaWYgKHRoaXMuc3RhdGUubW9kZWwpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5tb2RlbC5zZXRJbnN0YW5jZUNvdW50KHRoaXMuZ2V0TnVtSW5zdGFuY2VzKCkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgLy8gQ2FsbGVkIGJ5IG1hbmFnZXIgd2hlbiBsYXllciBpcyBhYm91dCB0byBiZSBkaXNwb3NlZFxuICAvLyBOb3RlOiBub3QgZ3VhcmFudGVlZCB0byBiZSBjYWxsZWQgb24gYXBwbGljYXRpb24gc2h1dGRvd25cbiAgZmluYWxpemVMYXllcigpIHtcbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RcbiAgICB0aGlzLmZpbmFsaXplU3RhdGUoKTtcbiAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuICAgIHJlbW92ZUxheWVySW5TZWVyKHRoaXMuaWQpO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB1bmlmb3Jtc1xuICBkcmF3TGF5ZXIoe21vZHVsZVBhcmFtZXRlcnMgPSBudWxsLCB1bmlmb3JtcyA9IHt9LCBwYXJhbWV0ZXJzID0ge319KSB7XG5cbiAgICAvLyBUT0RPL2liIC0gaGFjayBtb3ZlIHRvIGx1bWEgTW9kZWwuZHJhd1xuICAgIGlmIChtb2R1bGVQYXJhbWV0ZXJzICYmIHRoaXMuc3RhdGUubW9kZWwpIHtcbiAgICAgIHRoaXMuc3RhdGUubW9kZWwudXBkYXRlTW9kdWxlU2V0dGluZ3MobW9kdWxlUGFyYW1ldGVycyk7XG4gICAgfVxuXG4gICAgLy8gQXBwbHkgcG9seWdvbiBvZmZzZXQgdG8gYXZvaWQgei1maWdodGluZ1xuICAgIGNvbnN0IHtnZXRQb2x5Z29uT2Zmc2V0fSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3Qgb2Zmc2V0cyA9IGdldFBvbHlnb25PZmZzZXQgJiYgZ2V0UG9seWdvbk9mZnNldCh1bmlmb3JtcykgfHwgWzAsIDBdO1xuICAgIHBhcmFtZXRlcnMucG9seWdvbk9mZnNldCA9IG9mZnNldHM7XG5cbiAgICAvLyBDYWxsIHN1YmNsYXNzIGxpZmVjeWNsZSBtZXRob2RcbiAgICB3aXRoUGFyYW1ldGVycyh0aGlzLmNvbnRleHQuZ2wsXG4gICAgICBwYXJhbWV0ZXJzLFxuICAgICAgKCkgPT4gdGhpcy5kcmF3KHttb2R1bGVQYXJhbWV0ZXJzLCB1bmlmb3JtcywgcGFyYW1ldGVyc30pXG4gICAgKTtcbiAgICAvLyBFbmQgbGlmZWN5Y2xlIG1ldGhvZFxuICB9XG5cbiAgLy8ge3VuaWZvcm1zID0ge30sIC4uLm9wdHN9XG4gIHBpY2tMYXllcihvcHRzKSB7XG4gICAgLy8gQ2FsbCBzdWJjbGFzcyBsaWZlY3ljbGUgbWV0aG9kXG4gICAgcmV0dXJuIHRoaXMuZ2V0UGlja2luZ0luZm8ob3B0cyk7XG4gICAgLy8gRW5kIGxpZmVjeWNsZSBtZXRob2RcbiAgfVxuXG4gIC8vIENoZWNrcyBzdGF0ZSBvZiBhdHRyaWJ1dGVzIGFuZCBtb2RlbFxuICAvLyBUT0RPIC0gaXMgYXR0cmlidXRlIG1hbmFnZXIgbmVlZGVkPyAtIE1vZGVsIHNob3VsZCBiZSBlbm91Z2guXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICAvLyB0aGlzIG1ldGhvZCBtYXkgYmUgY2FsbGVkIGJ5IHRoZSByZW5kZXIgbG9vcCBhcyBzb29uIGEgdGhlIGxheWVyXG4gICAgLy8gaGFzIGJlZW4gY3JlYXRlZCwgc28gZ3VhcmQgYWdhaW5zdCB1bmluaXRpYWxpemVkIHN0YXRlXG4gICAgaWYgKCF0aGlzLnN0YXRlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHJlZHJhdyA9IGZhbHNlO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3O1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0aGlzLnN0YXRlLm5lZWRzUmVkcmF3ICYmICFjbGVhclJlZHJhd0ZsYWdzO1xuXG4gICAgY29uc3Qge2F0dHJpYnV0ZU1hbmFnZXIsIG1vZGVsfSA9IHRoaXMuc3RhdGU7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IChhdHRyaWJ1dGVNYW5hZ2VyICYmIGF0dHJpYnV0ZU1hbmFnZXIuZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3N9KSk7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IChtb2RlbCAmJiBtb2RlbC5nZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFnc30pKTtcblxuICAgIHJldHVybiByZWRyYXc7XG4gIH1cblxuICBkaWZmUHJvcHMob2xkUHJvcHMsIG5ld1Byb3BzLCBjb250ZXh0KSB7XG4gICAgLy8gRmlyc3QgY2hlY2sgaWYgYW55IHByb3BzIGhhdmUgY2hhbmdlZCAoaWdub3JlIHByb3BzIHRoYXQgd2lsbCBiZSBleGFtaW5lZCBzZXBhcmF0ZWx5KVxuICAgIGNvbnN0IHByb3BzQ2hhbmdlZFJlYXNvbiA9IGNvbXBhcmVQcm9wcyh7XG4gICAgICBuZXdQcm9wcyxcbiAgICAgIG9sZFByb3BzLFxuICAgICAgaWdub3JlUHJvcHM6IHtkYXRhOiBudWxsLCB1cGRhdGVUcmlnZ2VyczogbnVsbH1cbiAgICB9KTtcblxuICAgIC8vIE5vdyBjaGVjayBpZiBhbnkgZGF0YSByZWxhdGVkIHByb3BzIGhhdmUgY2hhbmdlZFxuICAgIGNvbnN0IGRhdGFDaGFuZ2VkUmVhc29uID0gdGhpcy5fZGlmZkRhdGFQcm9wcyhvbGRQcm9wcywgbmV3UHJvcHMpO1xuXG4gICAgY29uc3QgcHJvcHNDaGFuZ2VkID0gQm9vbGVhbihwcm9wc0NoYW5nZWRSZWFzb24pO1xuICAgIGNvbnN0IGRhdGFDaGFuZ2VkID0gQm9vbGVhbihkYXRhQ2hhbmdlZFJlYXNvbik7XG4gICAgY29uc3QgcHJvcHNPckRhdGFDaGFuZ2VkID0gcHJvcHNDaGFuZ2VkIHx8IGRhdGFDaGFuZ2VkO1xuICAgIGNvbnN0IHZpZXdwb3J0Q2hhbmdlZCA9IGNvbnRleHQudmlld3BvcnRDaGFuZ2VkO1xuICAgIGNvbnN0IHNvbWV0aGluZ0NoYW5nZWQgPSBwcm9wc0NoYW5nZWQgfHwgZGF0YUNoYW5nZWQgfHwgdmlld3BvcnRDaGFuZ2VkO1xuXG4gICAgLy8gQ2hlY2sgdXBkYXRlIHRyaWdnZXJzIHRvIGRldGVybWluZSBpZiBhbnkgYXR0cmlidXRlcyBuZWVkIHJlZ2VuZXJhdGlvblxuICAgIC8vIE5vdGUgLSBpZiBkYXRhIGhhcyBjaGFuZ2VkLCBhbGwgYXR0cmlidXRlcyB3aWxsIG5lZWQgcmVnZW5lcmF0aW9uLCBzbyBza2lwIHRoaXMgc3RlcFxuICAgIGlmICghZGF0YUNoYW5nZWQpIHtcbiAgICAgIHRoaXMuX2RpZmZVcGRhdGVUcmlnZ2VycyhvbGRQcm9wcywgbmV3UHJvcHMpO1xuICAgIH1cblxuICAgIC8vIFRyYWNlIHdoYXQgaGFwcGVuZWRcbiAgICBpZiAoZGF0YUNoYW5nZWQpIHtcbiAgICAgIGxvZy5sb2coTE9HX1BSSU9SSVRZX1VQREFURSwgYGRhdGFDaGFuZ2VkOiAke2RhdGFDaGFuZ2VkUmVhc29ufSBpbiAke3RoaXMuaWR9YCk7XG4gICAgfSBlbHNlIGlmIChwcm9wc0NoYW5nZWQpIHtcbiAgICAgIGxvZy5sb2coTE9HX1BSSU9SSVRZX1VQREFURSwgYHByb3BzQ2hhbmdlZDogJHtwcm9wc0NoYW5nZWRSZWFzb259IGluICR7dGhpcy5pZH1gKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJvcHNDaGFuZ2VkLFxuICAgICAgZGF0YUNoYW5nZWQsXG4gICAgICBwcm9wc09yRGF0YUNoYW5nZWQsXG4gICAgICB2aWV3cG9ydENoYW5nZWQsXG4gICAgICBzb21ldGhpbmdDaGFuZ2VkLFxuICAgICAgcmVhc29uOiBkYXRhQ2hhbmdlZFJlYXNvbiB8fCBwcm9wc0NoYW5nZWRSZWFzb24gfHwgJ1ZpZXdwb3J0IGNoYW5nZWQnXG4gICAgfTtcbiAgfVxuXG4gIC8vIFBSSVZBVEUgTUVUSE9EU1xuXG4gIC8vIFRoZSBjb21wYXJpc29uIG9mIHRoZSBkYXRhIHByb3AgcmVxdWlyZXMgc3BlY2lhbCBoYW5kbGluZ1xuICAvLyB0aGUgZGF0YUNvbXBhcmF0b3Igc2hvdWxkIGJlIHVzZWQgaWYgc3VwcGxpZWRcbiAgX2RpZmZEYXRhUHJvcHMob2xkUHJvcHMsIG5ld1Byb3BzKSB7XG4gICAgaWYgKG9sZFByb3BzID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gJ29sZFByb3BzIGlzIG51bGwsIGluaXRpYWwgZGlmZic7XG4gICAgfVxuXG4gICAgLy8gU3VwcG9ydCBvcHRpb25hbCBhcHAgZGVmaW5lZCBjb21wYXJpc29uIG9mIGRhdGFcbiAgICBjb25zdCB7ZGF0YUNvbXBhcmF0b3J9ID0gbmV3UHJvcHM7XG4gICAgaWYgKGRhdGFDb21wYXJhdG9yKSB7XG4gICAgICBpZiAoIWRhdGFDb21wYXJhdG9yKG5ld1Byb3BzLmRhdGEsIG9sZFByb3BzLmRhdGEpKSB7XG4gICAgICAgIHJldHVybiAnRGF0YSBjb21wYXJhdG9yIGRldGVjdGVkIGEgY2hhbmdlJztcbiAgICAgIH1cbiAgICAvLyBPdGhlcndpc2UsIGRvIGEgc2hhbGxvdyBlcXVhbCBvbiBwcm9wc1xuICAgIH0gZWxzZSBpZiAobmV3UHJvcHMuZGF0YSAhPT0gb2xkUHJvcHMuZGF0YSkge1xuICAgICAgcmV0dXJuICdBIG5ldyBkYXRhIGNvbnRhaW5lciB3YXMgc3VwcGxpZWQnO1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gQ2hlY2tzIGlmIGFueSB1cGRhdGUgdHJpZ2dlcnMgaGF2ZSBjaGFuZ2VkLCBhbmQgaW52YWxpZGF0ZVxuICAvLyBhdHRyaWJ1dGVzIGFjY29yZGluZ2x5LlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBfZGlmZlVwZGF0ZVRyaWdnZXJzKG9sZFByb3BzLCBuZXdQcm9wcykge1xuICAgIC8vIGNvbnN0IHthdHRyaWJ1dGVNYW5hZ2VyfSA9IHRoaXMuc3RhdGU7XG4gICAgLy8gY29uc3QgdXBkYXRlVHJpZ2dlck1hcCA9IGF0dHJpYnV0ZU1hbmFnZXIuZ2V0VXBkYXRlVHJpZ2dlck1hcCgpO1xuICAgIGlmIChvbGRQcm9wcyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7IC8vIG9sZFByb3BzIGlzIG51bGwsIGluaXRpYWwgZGlmZlxuICAgIH1cblxuICAgIGxldCBjaGFuZ2UgPSBmYWxzZTtcblxuICAgIGZvciAoY29uc3QgcHJvcE5hbWUgaW4gbmV3UHJvcHMudXBkYXRlVHJpZ2dlcnMpIHtcbiAgICAgIGNvbnN0IG9sZFRyaWdnZXJzID0gb2xkUHJvcHMudXBkYXRlVHJpZ2dlcnNbcHJvcE5hbWVdIHx8IHt9O1xuICAgICAgY29uc3QgbmV3VHJpZ2dlcnMgPSBuZXdQcm9wcy51cGRhdGVUcmlnZ2Vyc1twcm9wTmFtZV0gfHwge307XG4gICAgICBjb25zdCBkaWZmUmVhc29uID0gY29tcGFyZVByb3BzKHtcbiAgICAgICAgb2xkUHJvcHM6IG9sZFRyaWdnZXJzLFxuICAgICAgICBuZXdQcm9wczogbmV3VHJpZ2dlcnMsXG4gICAgICAgIHRyaWdnZXJOYW1lOiBwcm9wTmFtZVxuICAgICAgfSk7XG4gICAgICBpZiAoZGlmZlJlYXNvbikge1xuICAgICAgICBpZiAocHJvcE5hbWUgPT09ICdhbGwnKSB7XG4gICAgICAgICAgbG9nLmxvZyhMT0dfUFJJT1JJVFlfVVBEQVRFLFxuICAgICAgICAgICAgYHVwZGF0ZVRyaWdnZXJzIGludmFsaWRhdGluZyBhbGwgYXR0cmlidXRlczogJHtkaWZmUmVhc29ufWApO1xuICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZSgnYWxsJyk7XG4gICAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsb2cubG9nKExPR19QUklPUklUWV9VUERBVEUsXG4gICAgICAgICAgICBgdXBkYXRlVHJpZ2dlcnMgaW52YWxpZGF0aW5nIGF0dHJpYnV0ZSAke3Byb3BOYW1lfTogJHtkaWZmUmVhc29ufWApO1xuICAgICAgICAgIHRoaXMuaW52YWxpZGF0ZUF0dHJpYnV0ZShwcm9wTmFtZSk7XG4gICAgICAgICAgY2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjaGFuZ2U7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuXG4gIF9jaGVja1JlcXVpcmVkUHJvcChwcm9wZXJ0eU5hbWUsIGNvbmRpdGlvbikge1xuICAgIGNvbnN0IHZhbHVlID0gdGhpcy5wcm9wc1twcm9wZXJ0eU5hbWVdO1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFByb3BlcnR5ICR7cHJvcGVydHlOYW1lfSB1bmRlZmluZWQgaW4gbGF5ZXIgJHt0aGlzfWApO1xuICAgIH1cbiAgICBpZiAoY29uZGl0aW9uICYmICFjb25kaXRpb24odmFsdWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEJhZCBwcm9wZXJ0eSAke3Byb3BlcnR5TmFtZX0gaW4gbGF5ZXIgJHt0aGlzfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIEVtaXRzIGEgd2FybmluZyBpZiBhbiBvbGQgcHJvcCBpcyB1c2VkLCBvcHRpb25hbGx5IHN1Z2dlc3RpbmcgYSByZXBsYWNlbWVudFxuICBfY2hlY2tSZW1vdmVkUHJvcChvbGRQcm9wLCBuZXdQcm9wID0gbnVsbCkge1xuICAgIGlmICh0aGlzLnByb3BzW29sZFByb3BdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGxheWVyTmFtZSA9IHRoaXMuY29uc3RydWN0b3I7XG4gICAgICBsZXQgbWVzc2FnZSA9IGAke2xheWVyTmFtZX0gbm8gbG9uZ2VyIGFjY2VwdHMgcHJvcHMuJHtvbGRQcm9wfSBpbiB0aGlzIHZlcnNpb24gb2YgZGVjay5nbC5gO1xuICAgICAgaWYgKG5ld1Byb3ApIHtcbiAgICAgICAgbWVzc2FnZSArPSBgXFxuUGxlYXNlIHVzZSBwcm9wcy4ke25ld1Byb3B9IGluc3RlYWQuYDtcbiAgICAgIH1cbiAgICAgIGxvZy5vbmNlKDAsIG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVCYXNlVW5pZm9ybXMoKSB7XG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh7XG4gICAgICAvLyBhcHBseSBnYW1tYSB0byBvcGFjaXR5IHRvIG1ha2UgaXQgdmlzdWFsbHkgXCJsaW5lYXJcIlxuICAgICAgb3BhY2l0eTogTWF0aC5wb3codGhpcy5wcm9wcy5vcGFjaXR5LCAxIC8gMi4yKSxcbiAgICAgIE9ORTogMS4wXG4gICAgfSk7XG4gIH1cblxuICAvLyBERVBSRUNBVEVEIE1FVEhPRFNcblxuICAvLyBVcGRhdGVzIHNlbGVjdGVkIHN0YXRlIG1lbWJlcnMgYW5kIG1hcmtzIHRoZSBvYmplY3QgZm9yIHJlZHJhd1xuICBzZXRVbmlmb3Jtcyh1bmlmb3JtTWFwKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUubW9kZWwpIHtcbiAgICAgIHRoaXMuc3RhdGUubW9kZWwuc2V0VW5pZm9ybXModW5pZm9ybU1hcCk7XG4gICAgfVxuICAgIC8vIFRPRE8gLSBzZXQgbmVlZHNSZWRyYXcgb24gdGhlIG1vZGVsP1xuICAgIHRoaXMuc3RhdGUubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgIGxvZygzLCAnbGF5ZXIuc2V0VW5pZm9ybXMnLCB1bmlmb3JtTWFwKTtcbiAgfVxufVxuXG5MYXllci5sYXllck5hbWUgPSAnTGF5ZXInO1xuTGF5ZXIucHJvcFR5cGVzID0gZGVmYXVsdFByb3BzO1xuTGF5ZXIuZGVmYXVsdFByb3BzID0gZGVmYXVsdFByb3BzO1xuIl19