var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

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

// Linear scale maps continuous domain to continuous range
export function linearScale(domain, range, value) {

  return (value - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]) + range[0];
}

// Quantize scale is similar to linear scales,
// except it uses a discrete rather than continuous range
export function quantizeScale(domain, range, value) {
  var step = (domain[1] - domain[0]) / range.length;
  var idx = Math.floor((value - domain[0]) / step);
  var clampIdx = Math.max(Math.min(idx, range.length - 1), 0);

  return range[clampIdx];
}

export function clamp(_ref, value) {
  var _ref2 = _slicedToArray(_ref, 2),
      min = _ref2[0],
      max = _ref2[1];

  return Math.min(max, Math.max(min, value));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlscy9zY2FsZS11dGlscy5qcyJdLCJuYW1lcyI6WyJsaW5lYXJTY2FsZSIsImRvbWFpbiIsInJhbmdlIiwidmFsdWUiLCJxdWFudGl6ZVNjYWxlIiwic3RlcCIsImxlbmd0aCIsImlkeCIsIk1hdGgiLCJmbG9vciIsImNsYW1wSWR4IiwibWF4IiwibWluIiwiY2xhbXAiXSwibWFwcGluZ3MiOiI7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxPQUFPLFNBQVNBLFdBQVQsQ0FBcUJDLE1BQXJCLEVBQTZCQyxLQUE3QixFQUFvQ0MsS0FBcEMsRUFBMkM7O0FBRWhELFNBQU8sQ0FBQ0EsUUFBUUYsT0FBTyxDQUFQLENBQVQsS0FBdUJBLE9BQU8sQ0FBUCxJQUFZQSxPQUFPLENBQVAsQ0FBbkMsS0FBaURDLE1BQU0sQ0FBTixJQUFXQSxNQUFNLENBQU4sQ0FBNUQsSUFBd0VBLE1BQU0sQ0FBTixDQUEvRTtBQUNEOztBQUVEO0FBQ0E7QUFDQSxPQUFPLFNBQVNFLGFBQVQsQ0FBdUJILE1BQXZCLEVBQStCQyxLQUEvQixFQUFzQ0MsS0FBdEMsRUFBNkM7QUFDbEQsTUFBTUUsT0FBTyxDQUFDSixPQUFPLENBQVAsSUFBWUEsT0FBTyxDQUFQLENBQWIsSUFBMEJDLE1BQU1JLE1BQTdDO0FBQ0EsTUFBTUMsTUFBTUMsS0FBS0MsS0FBTCxDQUFXLENBQUNOLFFBQVFGLE9BQU8sQ0FBUCxDQUFULElBQXNCSSxJQUFqQyxDQUFaO0FBQ0EsTUFBTUssV0FBV0YsS0FBS0csR0FBTCxDQUFTSCxLQUFLSSxHQUFMLENBQVNMLEdBQVQsRUFBY0wsTUFBTUksTUFBTixHQUFlLENBQTdCLENBQVQsRUFBMEMsQ0FBMUMsQ0FBakI7O0FBRUEsU0FBT0osTUFBTVEsUUFBTixDQUFQO0FBQ0Q7O0FBRUQsT0FBTyxTQUFTRyxLQUFULE9BQTJCVixLQUEzQixFQUFrQztBQUFBO0FBQUEsTUFBbEJTLEdBQWtCO0FBQUEsTUFBYkQsR0FBYTs7QUFDdkMsU0FBT0gsS0FBS0ksR0FBTCxDQUFTRCxHQUFULEVBQWNILEtBQUtHLEdBQUwsQ0FBU0MsR0FBVCxFQUFjVCxLQUFkLENBQWQsQ0FBUDtBQUNEIiwiZmlsZSI6InNjYWxlLXV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbi8vIExpbmVhciBzY2FsZSBtYXBzIGNvbnRpbnVvdXMgZG9tYWluIHRvIGNvbnRpbnVvdXMgcmFuZ2VcbmV4cG9ydCBmdW5jdGlvbiBsaW5lYXJTY2FsZShkb21haW4sIHJhbmdlLCB2YWx1ZSkge1xuXG4gIHJldHVybiAodmFsdWUgLSBkb21haW5bMF0pIC8gKGRvbWFpblsxXSAtIGRvbWFpblswXSkgKiAocmFuZ2VbMV0gLSByYW5nZVswXSkgKyByYW5nZVswXTtcbn1cblxuLy8gUXVhbnRpemUgc2NhbGUgaXMgc2ltaWxhciB0byBsaW5lYXIgc2NhbGVzLFxuLy8gZXhjZXB0IGl0IHVzZXMgYSBkaXNjcmV0ZSByYXRoZXIgdGhhbiBjb250aW51b3VzIHJhbmdlXG5leHBvcnQgZnVuY3Rpb24gcXVhbnRpemVTY2FsZShkb21haW4sIHJhbmdlLCB2YWx1ZSkge1xuICBjb25zdCBzdGVwID0gKGRvbWFpblsxXSAtIGRvbWFpblswXSkgLyByYW5nZS5sZW5ndGg7XG4gIGNvbnN0IGlkeCA9IE1hdGguZmxvb3IoKHZhbHVlIC0gZG9tYWluWzBdKSAvIHN0ZXApO1xuICBjb25zdCBjbGFtcElkeCA9IE1hdGgubWF4KE1hdGgubWluKGlkeCwgcmFuZ2UubGVuZ3RoIC0gMSksIDApO1xuXG4gIHJldHVybiByYW5nZVtjbGFtcElkeF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGFtcChbbWluLCBtYXhdLCB2YWx1ZSkge1xuICByZXR1cm4gTWF0aC5taW4obWF4LCBNYXRoLm1heChtaW4sIHZhbHVlKSk7XG59XG4iXX0=