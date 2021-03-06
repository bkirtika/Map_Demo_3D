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

import { hexbin } from 'd3-hexbin';

/**
 * Use d3-hexbin to performs hexagonal binning from geo points to hexagons
 * @param {Array} data - array of points
 * @param {Number} radius - hexagon radius in meter
 * @param {function} getPosition - get points lon lat
 * @param {Object} viewport - current viewport object

 * @return {Object} - hexagons and countRange
 */
export function pointToHexbin(_ref, viewport) {
    var data = _ref.data,
        radius = _ref.radius,
        getPosition = _ref.getPosition;

    // get hexagon radius in mercator world unit
    var radiusInPixel = getRadiusInPixel(radius, viewport);

    // add world space coordinates to points
    var screenPoints = data.map(function(pt) {
        return Object.assign({
            screenCoord: viewport.projectFlat(getPosition(pt))
        }, pt);
    });

    var newHexbin = hexbin().radius(radiusInPixel).x(function(d) {
        return d.screenCoord[0];
    }).y(function(d) {
        return d.screenCoord[1];
    });

    var hexagonBins = newHexbin(screenPoints);

    return {
        hexagons: hexagonBins.map(function(hex, index) {
            return {
                centroid: viewport.unprojectFlat([hex.x, hex.y]),
                points: hex,
                index: index
            };
        })
    };
}

/**
 * Get radius in mercator world space coordinates from meter
 * @param {Number} radius - in meter
 * @param {Object} viewport - current viewport object

 * @return {Number} radius in mercator world spcae coordinates
 */
export function getRadiusInPixel(radius, viewport) {
    var _viewport$getDistance = viewport.getDistanceScales(),
        pixelsPerMeter = _viewport$getDistance.pixelsPerMeter;

    // x, y distance should be the same


    return radius * pixelsPerMeter[0];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9oZXhhZ29uLWxheWVyL2hleGFnb24tYWdncmVnYXRvci5qcyJdLCJuYW1lcyI6WyJoZXhiaW4iLCJwb2ludFRvSGV4YmluIiwidmlld3BvcnQiLCJkYXRhIiwicmFkaXVzIiwiZ2V0UG9zaXRpb24iLCJyYWRpdXNJblBpeGVsIiwiZ2V0UmFkaXVzSW5QaXhlbCIsInNjcmVlblBvaW50cyIsIm1hcCIsIk9iamVjdCIsImFzc2lnbiIsInNjcmVlbkNvb3JkIiwicHJvamVjdEZsYXQiLCJwdCIsIm5ld0hleGJpbiIsIngiLCJkIiwieSIsImhleGFnb25CaW5zIiwiaGV4YWdvbnMiLCJoZXgiLCJpbmRleCIsImNlbnRyb2lkIiwidW5wcm9qZWN0RmxhdCIsInBvaW50cyIsImdldERpc3RhbmNlU2NhbGVzIiwicGl4ZWxzUGVyTWV0ZXIiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFNBQVFBLE1BQVIsUUFBcUIsV0FBckI7O0FBRUE7Ozs7Ozs7OztBQVNBLE9BQU8sU0FBU0MsYUFBVCxPQUFvREMsUUFBcEQsRUFBOEQ7QUFBQSxNQUF0Q0MsSUFBc0MsUUFBdENBLElBQXNDO0FBQUEsTUFBaENDLE1BQWdDLFFBQWhDQSxNQUFnQztBQUFBLE1BQXhCQyxXQUF3QixRQUF4QkEsV0FBd0I7O0FBQ25FO0FBQ0EsTUFBTUMsZ0JBQWdCQyxpQkFBaUJILE1BQWpCLEVBQXlCRixRQUF6QixDQUF0Qjs7QUFFQTtBQUNBLE1BQU1NLGVBQWVMLEtBQUtNLEdBQUwsQ0FBUztBQUFBLFdBQU1DLE9BQU9DLE1BQVAsQ0FBYztBQUNoREMsbUJBQWFWLFNBQVNXLFdBQVQsQ0FBcUJSLFlBQVlTLEVBQVosQ0FBckI7QUFEbUMsS0FBZCxFQUVqQ0EsRUFGaUMsQ0FBTjtBQUFBLEdBQVQsQ0FBckI7O0FBSUEsTUFBTUMsWUFBWWYsU0FDZkksTUFEZSxDQUNSRSxhQURRLEVBRWZVLENBRmUsQ0FFYjtBQUFBLFdBQUtDLEVBQUVMLFdBQUYsQ0FBYyxDQUFkLENBQUw7QUFBQSxHQUZhLEVBR2ZNLENBSGUsQ0FHYjtBQUFBLFdBQUtELEVBQUVMLFdBQUYsQ0FBYyxDQUFkLENBQUw7QUFBQSxHQUhhLENBQWxCOztBQUtBLE1BQU1PLGNBQWNKLFVBQVVQLFlBQVYsQ0FBcEI7O0FBRUEsU0FBTztBQUNMWSxjQUFVRCxZQUFZVixHQUFaLENBQWdCLFVBQUNZLEdBQUQsRUFBTUMsS0FBTjtBQUFBLGFBQWlCO0FBQ3pDQyxrQkFBVXJCLFNBQVNzQixhQUFULENBQXVCLENBQUNILElBQUlMLENBQUwsRUFBUUssSUFBSUgsQ0FBWixDQUF2QixDQUQrQjtBQUV6Q08sZ0JBQVFKLEdBRmlDO0FBR3pDQztBQUh5QyxPQUFqQjtBQUFBLEtBQWhCO0FBREwsR0FBUDtBQU9EOztBQUVEOzs7Ozs7O0FBT0EsT0FBTyxTQUFTZixnQkFBVCxDQUEwQkgsTUFBMUIsRUFBa0NGLFFBQWxDLEVBQTRDO0FBQUEsOEJBRXhCQSxTQUFTd0IsaUJBQVQsRUFGd0I7QUFBQSxNQUUxQ0MsY0FGMEMseUJBRTFDQSxjQUYwQzs7QUFJakQ7OztBQUNBLFNBQU92QixTQUFTdUIsZUFBZSxDQUFmLENBQWhCO0FBQ0QiLCJmaWxlIjoiaGV4YWdvbi1hZ2dyZWdhdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSAyMDE1IC0gMjAxNyBVYmVyIFRlY2hub2xvZ2llcywgSW5jLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbi8vIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbi8vIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbi8vIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbi8vIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbi8vIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4vLyBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4vLyBUSEUgU09GVFdBUkUuXG5cbmltcG9ydCB7aGV4YmlufSBmcm9tICdkMy1oZXhiaW4nO1xuXG4vKipcbiAqIFVzZSBkMy1oZXhiaW4gdG8gcGVyZm9ybXMgaGV4YWdvbmFsIGJpbm5pbmcgZnJvbSBnZW8gcG9pbnRzIHRvIGhleGFnb25zXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIC0gYXJyYXkgb2YgcG9pbnRzXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIC0gaGV4YWdvbiByYWRpdXMgaW4gbWV0ZXJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGdldFBvc2l0aW9uIC0gZ2V0IHBvaW50cyBsb24gbGF0XG4gKiBAcGFyYW0ge09iamVjdH0gdmlld3BvcnQgLSBjdXJyZW50IHZpZXdwb3J0IG9iamVjdFxuXG4gKiBAcmV0dXJuIHtPYmplY3R9IC0gaGV4YWdvbnMgYW5kIGNvdW50UmFuZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBvaW50VG9IZXhiaW4oe2RhdGEsIHJhZGl1cywgZ2V0UG9zaXRpb259LCB2aWV3cG9ydCkge1xuICAvLyBnZXQgaGV4YWdvbiByYWRpdXMgaW4gbWVyY2F0b3Igd29ybGQgdW5pdFxuICBjb25zdCByYWRpdXNJblBpeGVsID0gZ2V0UmFkaXVzSW5QaXhlbChyYWRpdXMsIHZpZXdwb3J0KTtcblxuICAvLyBhZGQgd29ybGQgc3BhY2UgY29vcmRpbmF0ZXMgdG8gcG9pbnRzXG4gIGNvbnN0IHNjcmVlblBvaW50cyA9IGRhdGEubWFwKHB0ID0+IE9iamVjdC5hc3NpZ24oe1xuICAgIHNjcmVlbkNvb3JkOiB2aWV3cG9ydC5wcm9qZWN0RmxhdChnZXRQb3NpdGlvbihwdCkpXG4gIH0sIHB0KSk7XG5cbiAgY29uc3QgbmV3SGV4YmluID0gaGV4YmluKClcbiAgICAucmFkaXVzKHJhZGl1c0luUGl4ZWwpXG4gICAgLngoZCA9PiBkLnNjcmVlbkNvb3JkWzBdKVxuICAgIC55KGQgPT4gZC5zY3JlZW5Db29yZFsxXSk7XG5cbiAgY29uc3QgaGV4YWdvbkJpbnMgPSBuZXdIZXhiaW4oc2NyZWVuUG9pbnRzKTtcblxuICByZXR1cm4ge1xuICAgIGhleGFnb25zOiBoZXhhZ29uQmlucy5tYXAoKGhleCwgaW5kZXgpID0+ICh7XG4gICAgICBjZW50cm9pZDogdmlld3BvcnQudW5wcm9qZWN0RmxhdChbaGV4LngsIGhleC55XSksXG4gICAgICBwb2ludHM6IGhleCxcbiAgICAgIGluZGV4XG4gICAgfSkpXG4gIH07XG59XG5cbi8qKlxuICogR2V0IHJhZGl1cyBpbiBtZXJjYXRvciB3b3JsZCBzcGFjZSBjb29yZGluYXRlcyBmcm9tIG1ldGVyXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIC0gaW4gbWV0ZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSB2aWV3cG9ydCAtIGN1cnJlbnQgdmlld3BvcnQgb2JqZWN0XG5cbiAqIEByZXR1cm4ge051bWJlcn0gcmFkaXVzIGluIG1lcmNhdG9yIHdvcmxkIHNwY2FlIGNvb3JkaW5hdGVzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRSYWRpdXNJblBpeGVsKHJhZGl1cywgdmlld3BvcnQpIHtcblxuICBjb25zdCB7cGl4ZWxzUGVyTWV0ZXJ9ID0gdmlld3BvcnQuZ2V0RGlzdGFuY2VTY2FsZXMoKTtcblxuICAvLyB4LCB5IGRpc3RhbmNlIHNob3VsZCBiZSB0aGUgc2FtZVxuICByZXR1cm4gcmFkaXVzICogcGl4ZWxzUGVyTWV0ZXJbMF07XG59XG4iXX0=