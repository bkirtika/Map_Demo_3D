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
var R_EARTH = 6378000;

/**
 * Calculate density grid from an array of points
 * @param {array} points
 * @param {number} cellSize - cell size in meters
 * @param {function} getPosition - position accessor
 * @returns {object} - grid data, cell dimension
 */
export function pointToDensityGridData(points, cellSize, getPosition) {
  var _pointsToGridHashing2 = _pointsToGridHashing(points, cellSize, getPosition),
      gridHash = _pointsToGridHashing2.gridHash,
      gridOffset = _pointsToGridHashing2.gridOffset;

  var layerData = _getGridLayerDataFromGridHash(gridHash, gridOffset);

  return {
    gridOffset: gridOffset,
    layerData: layerData
  };
}

/**
 * Project points into each cell, return a hash table of cells
 * @param {array} points
 * @param {number} cellSize - unit size in meters
 * @param {function} getPosition - position accessor
 * @returns {object} - grid hash and cell dimension
 */
function _pointsToGridHashing(points, cellSize, getPosition) {

  // find the geometric center of sample points
  var allLat = points.map(function (p) {
    return getPosition(p)[1];
  }).filter(Number.isFinite);

  var latMin = Math.min.apply(null, allLat);
  var latMax = Math.max.apply(null, allLat);
  var centerLat = (latMin + latMax) / 2;

  var gridOffset = _calculateGridLatLonOffset(cellSize, centerLat);

  if (gridOffset.xOffset <= 0 || gridOffset.yOffset <= 0) {
    return { gridHash: {}, gridOffset: gridOffset };
  }
  // calculate count per cell
  var gridHash = points.reduce(function (accu, pt) {
    var lat = getPosition(pt)[1];
    var lng = getPosition(pt)[0];

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return accu;
    }

    var latIdx = Math.floor((lat + 90) / gridOffset.yOffset);
    var lonIdx = Math.floor((lng + 180) / gridOffset.xOffset);
    var key = latIdx + '-' + lonIdx;

    accu[key] = accu[key] || { count: 0, points: [] };
    accu[key].count += 1;
    accu[key].points.push(pt);

    return accu;
  }, {});

  return { gridHash: gridHash, gridOffset: gridOffset };
}

function _getGridLayerDataFromGridHash(gridHash, gridOffset) {
  return Object.keys(gridHash).reduce(function (accu, key, i) {
    var idxs = key.split('-');
    var latIdx = parseInt(idxs[0], 10);
    var lonIdx = parseInt(idxs[1], 10);

    accu.push(Object.assign({
      index: i,
      position: [-180 + gridOffset.xOffset * lonIdx, -90 + gridOffset.yOffset * latIdx]
    }, gridHash[key]));

    return accu;
  }, []);
}

/**
 * calculate grid layer cell size in lat lon based on world unit size
 * and current latitude
 * @param {number} cellSize
 * @param {number} latitude
 * @returns {object} - lat delta and lon delta
 */
function _calculateGridLatLonOffset(cellSize, latitude) {
  var yOffset = _calculateLatOffset(cellSize);
  var xOffset = _calculateLonOffset(latitude, cellSize);
  return { yOffset: yOffset, xOffset: xOffset };
}

/**
 * with a given x-km change, calculate the increment of latitude
 * based on stackoverflow http://stackoverflow.com/questions/7477003
 * @param {number} dy - change in km
 * @return {number} - increment in latitude
 */
function _calculateLatOffset(dy) {
  return dy / R_EARTH * (180 / Math.PI);
}

/**
 * with a given x-km change, and current latitude
 * calculate the increment of longitude
 * based on stackoverflow http://stackoverflow.com/questions/7477003
 * @param {number} lat - latitude of current location (based on city)
 * @param {number} dx - change in km
 * @return {number} - increment in longitude
 */
function _calculateLonOffset(lat, dx) {
  return dx / R_EARTH * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9ncmlkLWxheWVyL2dyaWQtYWdncmVnYXRvci5qcyJdLCJuYW1lcyI6WyJSX0VBUlRIIiwicG9pbnRUb0RlbnNpdHlHcmlkRGF0YSIsInBvaW50cyIsImNlbGxTaXplIiwiZ2V0UG9zaXRpb24iLCJfcG9pbnRzVG9HcmlkSGFzaGluZyIsImdyaWRIYXNoIiwiZ3JpZE9mZnNldCIsImxheWVyRGF0YSIsIl9nZXRHcmlkTGF5ZXJEYXRhRnJvbUdyaWRIYXNoIiwiYWxsTGF0IiwibWFwIiwicCIsImZpbHRlciIsIk51bWJlciIsImlzRmluaXRlIiwibGF0TWluIiwiTWF0aCIsIm1pbiIsImFwcGx5IiwibGF0TWF4IiwibWF4IiwiY2VudGVyTGF0IiwiX2NhbGN1bGF0ZUdyaWRMYXRMb25PZmZzZXQiLCJ4T2Zmc2V0IiwieU9mZnNldCIsInJlZHVjZSIsImFjY3UiLCJwdCIsImxhdCIsImxuZyIsImxhdElkeCIsImZsb29yIiwibG9uSWR4Iiwia2V5IiwiY291bnQiLCJwdXNoIiwiT2JqZWN0Iiwia2V5cyIsImkiLCJpZHhzIiwic3BsaXQiLCJwYXJzZUludCIsImFzc2lnbiIsImluZGV4IiwicG9zaXRpb24iLCJsYXRpdHVkZSIsIl9jYWxjdWxhdGVMYXRPZmZzZXQiLCJfY2FsY3VsYXRlTG9uT2Zmc2V0IiwiZHkiLCJQSSIsImR4IiwiY29zIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQU1BLFVBQVUsT0FBaEI7O0FBRUE7Ozs7Ozs7QUFPQSxPQUFPLFNBQVNDLHNCQUFULENBQWdDQyxNQUFoQyxFQUF3Q0MsUUFBeEMsRUFBa0RDLFdBQWxELEVBQStEO0FBQUEsOEJBRXJDQyxxQkFBcUJILE1BQXJCLEVBQTZCQyxRQUE3QixFQUF1Q0MsV0FBdkMs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T0wsQ0FEZTtBQUV0Qk0sZ0JBQVUsQ0FDUixDQUFDLEdBQUQsR0FBT3RDLFdBQVdpQixPQUFYLEdBQXFCUyxNQURwQixFQUVSLENBQUMsRUFBRCxHQUFNMUIsV0FBV2tCLE9BQVgsR0FBcUJNLE1BRm5CO0FBRlksS0FBZCxFQU1QekIsU0FBUzRCLEdBQVQsQ0FOTyxDQUFWOztBQVFBLFdBQU9QLElBQVA7QUFDRCxHQWRNLEVBY0osRUFkSSxDQUFQO0FBZUQ7O0FBRUQ7Ozs7Ozs7QUFPQSxTQUFTSiwwQkFBVCxDQUFvQ3BCLFFBQXBDLEVBQThDMkMsUUFBOUMsRUFBd0Q7QUFDdEQsTUFBTXJCLFVBQVVzQixvQkFBb0I1QyxRQUFwQixDQUFoQjtBQUNBLE1BQU1xQixVQUFVd0Isb0JBQW9CRixRQUFwQixFQUE4QjNDLFFBQTlCLENBQWhCO0FBQ0EsU0FBTyxFQUFDc0IsZ0JBQUQsRUFBVUQsZ0JBQVYsRUFBUDtBQUNEOztBQUVEOzs7Ozs7QUFNQSxTQUFTdUIsbUJBQVQsQ0FBNkJFLEVBQTdCLEVBQWlDO0FBQy9CLFNBQVFBLEtBQUtqRCxPQUFOLElBQWtCLE1BQU1pQixLQUFLaUMsRUFBN0IsQ0FBUDtBQUNEOztBQUVEOzs7Ozs7OztBQVFBLFNBQVNGLG1CQUFULENBQTZCbkIsR0FBN0IsRUFBa0NzQixFQUFsQyxFQUFzQztBQUNwQyxTQUFRQSxLQUFLbkQsT0FBTixJQUFrQixNQUFNaUIsS0FBS2lDLEVBQTdCLElBQW1DakMsS0FBS21DLEdBQUwsQ0FBU3ZCLE1BQU1aLEtBQUtpQyxFQUFYLEdBQWdCLEdBQXpCLENBQTFDO0FBQ0QiLCJmaWxlIjoiZ3JpZC1hZ2dyZWdhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5jb25zdCBSX0VBUlRIID0gNjM3ODAwMDtcblxuLyoqXG4gKiBDYWxjdWxhdGUgZGVuc2l0eSBncmlkIGZyb20gYW4gYXJyYXkgb2YgcG9pbnRzXG4gKiBAcGFyYW0ge2FycmF5fSBwb2ludHNcbiAqIEBwYXJhbSB7bnVtYmVyfSBjZWxsU2l6ZSAtIGNlbGwgc2l6ZSBpbiBtZXRlcnNcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGdldFBvc2l0aW9uIC0gcG9zaXRpb24gYWNjZXNzb3JcbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gZ3JpZCBkYXRhLCBjZWxsIGRpbWVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gcG9pbnRUb0RlbnNpdHlHcmlkRGF0YShwb2ludHMsIGNlbGxTaXplLCBnZXRQb3NpdGlvbikge1xuXG4gIGNvbnN0IHtncmlkSGFzaCwgZ3JpZE9mZnNldH0gPSBfcG9pbnRzVG9HcmlkSGFzaGluZyhwb2ludHMsIGNlbGxTaXplLCBnZXRQb3NpdGlvbik7XG4gIGNvbnN0IGxheWVyRGF0YSA9IF9nZXRHcmlkTGF5ZXJEYXRhRnJvbUdyaWRIYXNoKGdyaWRIYXNoLCBncmlkT2Zmc2V0KTtcblxuICByZXR1cm4ge1xuICAgIGdyaWRPZmZzZXQsXG4gICAgbGF5ZXJEYXRhXG4gIH07XG59XG5cbi8qKlxuICogUHJvamVjdCBwb2ludHMgaW50byBlYWNoIGNlbGwsIHJldHVybiBhIGhhc2ggdGFibGUgb2YgY2VsbHNcbiAqIEBwYXJhbSB7YXJyYXl9IHBvaW50c1xuICogQHBhcmFtIHtudW1iZXJ9IGNlbGxTaXplIC0gdW5pdCBzaXplIGluIG1ldGVyc1xuICogQHBhcmFtIHtmdW5jdGlvbn0gZ2V0UG9zaXRpb24gLSBwb3NpdGlvbiBhY2Nlc3NvclxuICogQHJldHVybnMge29iamVjdH0gLSBncmlkIGhhc2ggYW5kIGNlbGwgZGltZW5zaW9uXG4gKi9cbmZ1bmN0aW9uIF9wb2ludHNUb0dyaWRIYXNoaW5nKHBvaW50cywgY2VsbFNpemUsIGdldFBvc2l0aW9uKSB7XG5cbiAgLy8gZmluZCB0aGUgZ2VvbWV0cmljIGNlbnRlciBvZiBzYW1wbGUgcG9pbnRzXG4gIGNvbnN0IGFsbExhdCA9IHBvaW50c1xuICAgIC5tYXAocCA9PiBnZXRQb3NpdGlvbihwKVsxXSlcbiAgICAuZmlsdGVyKE51bWJlci5pc0Zpbml0ZSk7XG5cbiAgY29uc3QgbGF0TWluID0gTWF0aC5taW4uYXBwbHkobnVsbCwgYWxsTGF0KTtcbiAgY29uc3QgbGF0TWF4ID0gTWF0aC5tYXguYXBwbHkobnVsbCwgYWxsTGF0KTtcbiAgY29uc3QgY2VudGVyTGF0ID0gKGxhdE1pbiArIGxhdE1heCkgLyAyO1xuXG4gIGNvbnN0IGdyaWRPZmZzZXQgPSBfY2FsY3VsYXRlR3JpZExhdExvbk9mZnNldChjZWxsU2l6ZSwgY2VudGVyTGF0KTtcblxuICBpZiAoZ3JpZE9mZnNldC54T2Zmc2V0IDw9IDAgfHwgZ3JpZE9mZnNldC55T2Zmc2V0IDw9IDApIHtcbiAgICByZXR1cm4ge2dyaWRIYXNoOiB7fSwgZ3JpZE9mZnNldH07XG4gIH1cbiAgLy8gY2FsY3VsYXRlIGNvdW50IHBlciBjZWxsXG4gIGNvbnN0IGdyaWRIYXNoID0gcG9pbnRzLnJlZHVjZSgoYWNjdSwgcHQpID0+IHtcbiAgICBjb25zdCBsYXQgPSBnZXRQb3NpdGlvbihwdClbMV07XG4gICAgY29uc3QgbG5nID0gZ2V0UG9zaXRpb24ocHQpWzBdO1xuXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUobGF0KSB8fCAhTnVtYmVyLmlzRmluaXRlKGxuZykpIHtcbiAgICAgIHJldHVybiBhY2N1O1xuICAgIH1cblxuICAgIGNvbnN0IGxhdElkeCA9IE1hdGguZmxvb3IoKGxhdCArIDkwKSAvIGdyaWRPZmZzZXQueU9mZnNldCk7XG4gICAgY29uc3QgbG9uSWR4ID0gTWF0aC5mbG9vcigobG5nICsgMTgwKSAvIGdyaWRPZmZzZXQueE9mZnNldCk7XG4gICAgY29uc3Qga2V5ID0gYCR7bGF0SWR4fS0ke2xvbklkeH1gO1xuXG4gICAgYWNjdVtrZXldID0gYWNjdVtrZXldIHx8IHtjb3VudDogMCwgcG9pbnRzOiBbXX07XG4gICAgYWNjdVtrZXldLmNvdW50ICs9IDE7XG4gICAgYWNjdVtrZXldLnBvaW50cy5wdXNoKHB0KTtcblxuICAgIHJldHVybiBhY2N1O1xuICB9LCB7fSk7XG5cbiAgcmV0dXJuIHtncmlkSGFzaCwgZ3JpZE9mZnNldH07XG59XG5cbmZ1bmN0aW9uIF9nZXRHcmlkTGF5ZXJEYXRhRnJvbUdyaWRIYXNoKGdyaWRIYXNoLCBncmlkT2Zmc2V0KSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhncmlkSGFzaCkucmVkdWNlKChhY2N1LCBrZXksIGkpID0+IHtcbiAgICBjb25zdCBpZHhzID0ga2V5LnNwbGl0KCctJyk7XG4gICAgY29uc3QgbGF0SWR4ID0gcGFyc2VJbnQoaWR4c1swXSwgMTApO1xuICAgIGNvbnN0IGxvbklkeCA9IHBhcnNlSW50KGlkeHNbMV0sIDEwKTtcblxuICAgIGFjY3UucHVzaChPYmplY3QuYXNzaWduKHtcbiAgICAgIGluZGV4OiBpLFxuICAgICAgcG9zaXRpb246IFtcbiAgICAgICAgLTE4MCArIGdyaWRPZmZzZXQueE9mZnNldCAqIGxvbklkeCxcbiAgICAgICAgLTkwICsgZ3JpZE9mZnNldC55T2Zmc2V0ICogbGF0SWR4XG4gICAgICBdXG4gICAgfSwgZ3JpZEhhc2hba2V5XSkpO1xuXG4gICAgcmV0dXJuIGFjY3U7XG4gIH0sIFtdKTtcbn1cblxuLyoqXG4gKiBjYWxjdWxhdGUgZ3JpZCBsYXllciBjZWxsIHNpemUgaW4gbGF0IGxvbiBiYXNlZCBvbiB3b3JsZCB1bml0IHNpemVcbiAqIGFuZCBjdXJyZW50IGxhdGl0dWRlXG4gKiBAcGFyYW0ge251bWJlcn0gY2VsbFNpemVcbiAqIEBwYXJhbSB7bnVtYmVyfSBsYXRpdHVkZVxuICogQHJldHVybnMge29iamVjdH0gLSBsYXQgZGVsdGEgYW5kIGxvbiBkZWx0YVxuICovXG5mdW5jdGlvbiBfY2FsY3VsYXRlR3JpZExhdExvbk9mZnNldChjZWxsU2l6ZSwgbGF0aXR1ZGUpIHtcbiAgY29uc3QgeU9mZnNldCA9IF9jYWxjdWxhdGVMYXRPZmZzZXQoY2VsbFNpemUpO1xuICBjb25zdCB4T2Zmc2V0ID0gX2NhbGN1bGF0ZUxvbk9mZnNldChsYXRpdHVkZSwgY2VsbFNpemUpO1xuICByZXR1cm4ge3lPZmZzZXQsIHhPZmZzZXR9O1xufVxuXG4vKipcbiAqIHdpdGggYSBnaXZlbiB4LWttIGNoYW5nZSwgY2FsY3VsYXRlIHRoZSBpbmNyZW1lbnQgb2YgbGF0aXR1ZGVcbiAqIGJhc2VkIG9uIHN0YWNrb3ZlcmZsb3cgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy83NDc3MDAzXG4gKiBAcGFyYW0ge251bWJlcn0gZHkgLSBjaGFuZ2UgaW4ga21cbiAqIEByZXR1cm4ge251bWJlcn0gLSBpbmNyZW1lbnQgaW4gbGF0aXR1ZGVcbiAqL1xuZnVuY3Rpb24gX2NhbGN1bGF0ZUxhdE9mZnNldChkeSkge1xuICByZXR1cm4gKGR5IC8gUl9FQVJUSCkgKiAoMTgwIC8gTWF0aC5QSSk7XG59XG5cbi8qKlxuICogd2l0aCBhIGdpdmVuIHgta20gY2hhbmdlLCBhbmQgY3VycmVudCBsYXRpdHVkZVxuICogY2FsY3VsYXRlIHRoZSBpbmNyZW1lbnQgb2YgbG9uZ2l0dWRlXG4gKiBiYXNlZCBvbiBzdGFja292ZXJmbG93IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNzQ3NzAwM1xuICogQHBhcmFtIHtudW1iZXJ9IGxhdCAtIGxhdGl0dWRlIG9mIGN1cnJlbnQgbG9jYXRpb24gKGJhc2VkIG9uIGNpdHkpXG4gKiBAcGFyYW0ge251bWJlcn0gZHggLSBjaGFuZ2UgaW4ga21cbiAqIEByZXR1cm4ge251bWJlcn0gLSBpbmNyZW1lbnQgaW4gbG9uZ2l0dWRlXG4gKi9cbmZ1bmN0aW9uIF9jYWxjdWxhdGVMb25PZmZzZXQobGF0LCBkeCkge1xuICByZXR1cm4gKGR4IC8gUl9FQVJUSCkgKiAoMTgwIC8gTWF0aC5QSSkgLyBNYXRoLmNvcyhsYXQgKiBNYXRoLlBJIC8gMTgwKTtcbn1cbiJdfQ==