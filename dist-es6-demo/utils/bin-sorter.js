var _slicedToArray = function() {
    function sliceIterator(arr, i) {
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;
        try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) {
            _d = true;
            _e = err;
        } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } }
        return _arr;
    }
    return function(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };
}();

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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

// getValue takes an array of points returns a value to sort the bins on.
// by default it returns the number of points
// this is where to pass in a function to color the bins by
// avg/mean/max of specific value of the point
var defaultGetValue = function defaultGetValue(count) {
    return count;
};

var BinSorter = function() {
    function BinSorter() {
        var bins = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var getValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultGetValue;

        _classCallCheck(this, BinSorter);

        this.sortedBins = this.getSortedBins(bins, getValue);
        this.maxCount = this.getMaxCount();
        this.binMap = this.getBinMap();
    }

    /**
     * Get an array of object with sorted values and index of bins
     * @param {Array} bins
     * @param {Function} getValue
     * @return {Array} array of values and index lookup
     */


    _createClass(BinSorter, [{
        key: "getSortedBins",
        value: function getSortedBins(bins, getValue) {
            return bins.map(function(h, i) {
                return {
                    i: Number.isFinite(h.index) ? h.index : i,
                    value: getValue(h.count),
                    counts: h.count
                };
            }).sort(function(a, b) {
                return a.value - b.value;
            });
        }

        /**
         * Get range of values of all bins
         * @param {Number[]} range
         * @param {Number} range[0] - lower bound
         * @param {Number} range[1] - upper bound
         * @return {Array} array of new value range
         */

    }, {
        key: "getValueRange",
        value: function getValueRange(_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                lower = _ref2[0],
                upper = _ref2[1];

            var len = this.sortedBins.length;
            if (!len) {
                return [0, 0];
            }
            var lowerIdx = Math.ceil(lower / 100 * (len - 1));
            var upperIdx = Math.floor(upper / 100 * (len - 1));

            return [this.sortedBins[lowerIdx].value, this.sortedBins[upperIdx].value];
        }

        /**
         * Get ths max count of all bins
         * @return {Number | Boolean} max count
         */

    }, {
        key: "getMaxCount",
        value: function getMaxCount() {
            return Math.max.apply(null, this.sortedBins.map(function(b) {
                return b.counts;
            }));
        }

        /**
         * Get a mapping from cell/hexagon index to sorted bin
         * This is used to retrieve bin value for color calculation
         * @return {Object} bin index to sortedBins
         */

    }, {
        key: "getBinMap",
        value: function getBinMap() {
            return this.sortedBins.reduce(function(mapper, curr) {
                return Object.assign(mapper, _defineProperty({}, curr.i, curr));
            }, {});
        }
    }]);

    return BinSorter;
}();

export default BinSorter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9iaW4tc29ydGVyLmpzIl0sIm5hbWVzIjpbImRlZmF1bHRHZXRWYWx1ZSIsInBvaW50cyIsImxlbmd0aCIsIkJpblNvcnRlciIsImJpbnMiLCJnZXRWYWx1ZSIsInNvcnRlZEJpbnMiLCJnZXRTb3J0ZWRCaW5zIiwibWF4Q291bnQiLCJnZXRNYXhDb3VudCIsImJpbk1hcCIsImdldEJpbk1hcCIsIm1hcCIsImgiLCJpIiwiTnVtYmVyIiwiaXNGaW5pdGUiLCJpbmRleCIsInZhbHVlIiwiY291bnRzIiwic29ydCIsImEiLCJiIiwibG93ZXIiLCJ1cHBlciIsImxlbiIsImxvd2VySWR4IiwiTWF0aCIsImNlaWwiLCJ1cHBlcklkeCIsImZsb29yIiwibWF4IiwiYXBwbHkiLCJyZWR1Y2UiLCJtYXBwZXIiLCJjdXJyIiwiT2JqZWN0IiwiYXNzaWduIl0sIm1hcHBpbmdzIjoiOzs7Ozs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBTUEsa0JBQWtCLFNBQWxCQSxlQUFrQjtBQUFBLFNBQVVDLE9BQU9DLE1BQWpCO0FBQUEsQ0FBeEI7O0lBRXFCQyxTO0FBQ25CLHVCQUFtRDtBQUFBLFFBQXZDQyxJQUF1Qyx1RUFBaEMsRUFBZ0M7QUFBQSxRQUE1QkMsUUFBNEIsdUVBQWpCTCxlQUFpQjs7QUFBQTs7QUFDakQsU0FBS00sVUFBTCxHQUFrQixLQUFLQyxhQUFMLENBQW1CSCxJQUFuQixFQUF5QkMsUUFBekIsQ0FBbEI7QUFDQSxTQUFLRyxRQUFMLEdBQWdCLEtBQUtDLFdBQUwsRUFBaEI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsS0FBS0MsU0FBTCxFQUFkO0FBQ0Q7O0FBRUQ7Ozs7Ozs7Ozs7a0NBTWNQLEksRUFBTUMsUSxFQUFVO0FBQzVCLGFBQU9ELEtBQ0pRLEdBREksQ0FDQSxVQUFDQyxDQUFELEVBQUlDLENBQUo7QUFBQSxlQUFXO0FBQ2RBLGFBQUdDLE9BQU9DLFFBQVAsQ0FBZ0JILEVBQUVJLEtBQWxCLElBQTJCSixFQUFFSSxLQUE3QixHQUFxQ0gsQ0FEMUI7QUFFZEksaUJBQU9iLFNBQVNRLEVBQUVaLE1BQVgsQ0FGTztBQUdka0Isa0JBQVFOLEVBQUVaLE1BQUYsQ0FBU0M7QUFISCxTQUFYO0FBQUEsT0FEQSxFQU1Ka0IsSUFOSSxDQU1DLFVBQUNDLENBQUQsRUFBSUMsQ0FBSjtBQUFBLGVBQVVELEVBQUVILEtBQUYsR0FBVUksRUFBRUosS0FBdEI7QUFBQSxPQU5ELENBQVA7QUFPRDs7QUFFRDs7Ozs7Ozs7Ozt3Q0FPOEI7QUFBQTtBQUFBLFVBQWZLLEtBQWU7QUFBQSxVQUFSQyxLQUFROztBQUM1QixVQUFNQyxNQUFNLEtBQUtuQixVQUFMLENBQWdCSixNQUE1QjtBQUNBLFVBQUksQ0FBQ3VCLEdBQUwsRUFBVTtBQUNSLGVBQU8sQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFQO0FBQ0Q7QUFDRCxVQUFNQyxXQUFXQyxLQUFLQyxJQUFMLENBQVVMLFFBQVEsR0FBUixJQUFlRSxNQUFNLENBQXJCLENBQVYsQ0FBakI7QUFDQSxVQUFNSSxXQUFXRixLQUFLRyxLQUFMLENBQVdOLFFBQVEsR0FBUixJQUFlQyxNQUFNLENBQXJCLENBQVgsQ0FBakI7O0FBRUEsYUFBTyxDQUFDLEtBQUtuQixVQUFMLENBQWdCb0IsUUFBaEIsRUFBMEJSLEtBQTNCLEVBQWtDLEtBQUtaLFVBQUwsQ0FBZ0J1QixRQUFoQixFQUEwQlgsS0FBNUQsQ0FBUDtBQUNEOztBQUVEOzs7Ozs7O2tDQUljO0FBQ1osYUFBT1MsS0FBS0ksR0FBTCxDQUFTQyxLQUFULENBQWUsSUFBZixFQUFxQixLQUFLMUIsVUFBTCxDQUFnQk0sR0FBaEIsQ0FBb0I7QUFBQSxlQUFLVSxFQUFFSCxNQUFQO0FBQUEsT0FBcEIsQ0FBckIsQ0FBUDtBQUNEOztBQUVEOzs7Ozs7OztnQ0FLWTtBQUNWLGFBQU8sS0FBS2IsVUFBTCxDQUFnQjJCLE1BQWhCLENBQXVCLFVBQUNDLE1BQUQsRUFBU0MsSUFBVDtBQUFBLGVBQWtCQyxPQUFPQyxNQUFQLENBQWNILE1BQWQsc0JBQzdDQyxLQUFLckIsQ0FEd0MsRUFDcENxQixJQURvQyxFQUFsQjtBQUFBLE9BQXZCLEVBRUgsRUFGRyxDQUFQO0FBR0Q7Ozs7OztlQTFEa0JoQyxTIiwiZmlsZSI6ImJpbi1zb3J0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuLy8gZ2V0VmFsdWUgdGFrZXMgYW4gYXJyYXkgb2YgcG9pbnRzIHJldHVybnMgYSB2YWx1ZSB0byBzb3J0IHRoZSBiaW5zIG9uLlxuLy8gYnkgZGVmYXVsdCBpdCByZXR1cm5zIHRoZSBudW1iZXIgb2YgcG9pbnRzXG4vLyB0aGlzIGlzIHdoZXJlIHRvIHBhc3MgaW4gYSBmdW5jdGlvbiB0byBjb2xvciB0aGUgYmlucyBieVxuLy8gYXZnL21lYW4vbWF4IG9mIHNwZWNpZmljIHZhbHVlIG9mIHRoZSBwb2ludFxuY29uc3QgZGVmYXVsdEdldFZhbHVlID0gcG9pbnRzID0+IHBvaW50cy5sZW5ndGg7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJpblNvcnRlciB7XG4gIGNvbnN0cnVjdG9yKGJpbnMgPSBbXSwgZ2V0VmFsdWUgPSBkZWZhdWx0R2V0VmFsdWUpIHtcbiAgICB0aGlzLnNvcnRlZEJpbnMgPSB0aGlzLmdldFNvcnRlZEJpbnMoYmlucywgZ2V0VmFsdWUpO1xuICAgIHRoaXMubWF4Q291bnQgPSB0aGlzLmdldE1heENvdW50KCk7XG4gICAgdGhpcy5iaW5NYXAgPSB0aGlzLmdldEJpbk1hcCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBhcnJheSBvZiBvYmplY3Qgd2l0aCBzb3J0ZWQgdmFsdWVzIGFuZCBpbmRleCBvZiBiaW5zXG4gICAqIEBwYXJhbSB7QXJyYXl9IGJpbnNcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZ2V0VmFsdWVcbiAgICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIHZhbHVlcyBhbmQgaW5kZXggbG9va3VwXG4gICAqL1xuICBnZXRTb3J0ZWRCaW5zKGJpbnMsIGdldFZhbHVlKSB7XG4gICAgcmV0dXJuIGJpbnNcbiAgICAgIC5tYXAoKGgsIGkpID0+ICh7XG4gICAgICAgIGk6IE51bWJlci5pc0Zpbml0ZShoLmluZGV4KSA/IGguaW5kZXggOiBpLFxuICAgICAgICB2YWx1ZTogZ2V0VmFsdWUoaC5wb2ludHMpLFxuICAgICAgICBjb3VudHM6IGgucG9pbnRzLmxlbmd0aFxuICAgICAgfSkpXG4gICAgICAuc29ydCgoYSwgYikgPT4gYS52YWx1ZSAtIGIudmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCByYW5nZSBvZiB2YWx1ZXMgb2YgYWxsIGJpbnNcbiAgICogQHBhcmFtIHtOdW1iZXJbXX0gcmFuZ2VcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmdlWzBdIC0gbG93ZXIgYm91bmRcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHJhbmdlWzFdIC0gdXBwZXIgYm91bmRcbiAgICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIG5ldyB2YWx1ZSByYW5nZVxuICAgKi9cbiAgZ2V0VmFsdWVSYW5nZShbbG93ZXIsIHVwcGVyXSkge1xuICAgIGNvbnN0IGxlbiA9IHRoaXMuc29ydGVkQmlucy5sZW5ndGg7XG4gICAgaWYgKCFsZW4pIHtcbiAgICAgIHJldHVybiBbMCwgMF07XG4gICAgfVxuICAgIGNvbnN0IGxvd2VySWR4ID0gTWF0aC5jZWlsKGxvd2VyIC8gMTAwICogKGxlbiAtIDEpKTtcbiAgICBjb25zdCB1cHBlcklkeCA9IE1hdGguZmxvb3IodXBwZXIgLyAxMDAgKiAobGVuIC0gMSkpO1xuXG4gICAgcmV0dXJuIFt0aGlzLnNvcnRlZEJpbnNbbG93ZXJJZHhdLnZhbHVlLCB0aGlzLnNvcnRlZEJpbnNbdXBwZXJJZHhdLnZhbHVlXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhzIG1heCBjb3VudCBvZiBhbGwgYmluc1xuICAgKiBAcmV0dXJuIHtOdW1iZXIgfCBCb29sZWFufSBtYXggY291bnRcbiAgICovXG4gIGdldE1heENvdW50KCkge1xuICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCB0aGlzLnNvcnRlZEJpbnMubWFwKGIgPT4gYi5jb3VudHMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBtYXBwaW5nIGZyb20gY2VsbC9oZXhhZ29uIGluZGV4IHRvIHNvcnRlZCBiaW5cbiAgICogVGhpcyBpcyB1c2VkIHRvIHJldHJpZXZlIGJpbiB2YWx1ZSBmb3IgY29sb3IgY2FsY3VsYXRpb25cbiAgICogQHJldHVybiB7T2JqZWN0fSBiaW4gaW5kZXggdG8gc29ydGVkQmluc1xuICAgKi9cbiAgZ2V0QmluTWFwKCkge1xuICAgIHJldHVybiB0aGlzLnNvcnRlZEJpbnMucmVkdWNlKChtYXBwZXIsIGN1cnIpID0+IE9iamVjdC5hc3NpZ24obWFwcGVyLCB7XG4gICAgICBbY3Vyci5pXTogY3VyclxuICAgIH0pLCB7fSk7XG4gIH1cbn1cbiJdfQ==