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

export default "#define SHADER_NAME choropleth-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec4 colors;\nattribute vec3 pickingColors;\n\nuniform float opacity;\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// PICKING\nuniform float pickingEnabled;\nvarying vec4 vPickingColor;\nvoid picking_setPickColor(vec3 pickingColor) {\n  vPickingColor = vec4(pickingColor,  1.);\n}\nvec4 picking_setNormalAndPickColors(vec4 color, vec3 pickingColor) {\n  vec4 pickingColor4 = vec4(pickingColor.rgb, 1.);\n  vPickingColor = mix(color, pickingColor4, pickingEnabled);\n  return vPickingColor;\n}\n\n// PICKING\n// vec4 getColor(vec4 color, float opacity, vec3 pickingColor, float renderPickingBuffer) {\n//   vec4 color4 = vec4(color.xyz / 255., color.w / 255. * opacity);\n//   vec4 pickingColor4 = vec4(pickingColor / 255., 1.);\n//   return mix(color4, pickingColor4, renderPickingBuffer);\n// }\n\nvoid main(void) {\n\n  vec4 color = vec4(colors.rgb, colors.a * opacity) / 255.;\n\n  picking_setNormalAndPickColors(\n    color,\n    pickingColors / 255.\n  );\n\n  vec3 p = project_position(positions);\n  gl_Position = project_to_clipspace(vec4(p, 1.));\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvZGVwcmVjYXRlZC9jaG9yb3BsZXRoLWxheWVyL2Nob3JvcGxldGgtbGF5ZXItdmVydGV4Lmdsc2wuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEiLCJmaWxlIjoiY2hvcm9wbGV0aC1sYXllci12ZXJ0ZXguZ2xzbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5leHBvcnQgZGVmYXVsdCBgXFxcbiNkZWZpbmUgU0hBREVSX05BTUUgY2hvcm9wbGV0aC1sYXllci12ZXJ0ZXgtc2hhZGVyXG5cbmF0dHJpYnV0ZSB2ZWMzIHBvc2l0aW9ucztcbmF0dHJpYnV0ZSB2ZWM0IGNvbG9ycztcbmF0dHJpYnV0ZSB2ZWMzIHBpY2tpbmdDb2xvcnM7XG5cbnVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbnVuaWZvcm0gZmxvYXQgcmVuZGVyUGlja2luZ0J1ZmZlcjtcbnVuaWZvcm0gdmVjMyBzZWxlY3RlZFBpY2tpbmdDb2xvcjtcblxuLy8gUElDS0lOR1xudW5pZm9ybSBmbG9hdCBwaWNraW5nRW5hYmxlZDtcbnZhcnlpbmcgdmVjNCB2UGlja2luZ0NvbG9yO1xudm9pZCBwaWNraW5nX3NldFBpY2tDb2xvcih2ZWMzIHBpY2tpbmdDb2xvcikge1xuICB2UGlja2luZ0NvbG9yID0gdmVjNChwaWNraW5nQ29sb3IsICAxLik7XG59XG52ZWM0IHBpY2tpbmdfc2V0Tm9ybWFsQW5kUGlja0NvbG9ycyh2ZWM0IGNvbG9yLCB2ZWMzIHBpY2tpbmdDb2xvcikge1xuICB2ZWM0IHBpY2tpbmdDb2xvcjQgPSB2ZWM0KHBpY2tpbmdDb2xvci5yZ2IsIDEuKTtcbiAgdlBpY2tpbmdDb2xvciA9IG1peChjb2xvciwgcGlja2luZ0NvbG9yNCwgcGlja2luZ0VuYWJsZWQpO1xuICByZXR1cm4gdlBpY2tpbmdDb2xvcjtcbn1cblxuLy8gUElDS0lOR1xuLy8gdmVjNCBnZXRDb2xvcih2ZWM0IGNvbG9yLCBmbG9hdCBvcGFjaXR5LCB2ZWMzIHBpY2tpbmdDb2xvciwgZmxvYXQgcmVuZGVyUGlja2luZ0J1ZmZlcikge1xuLy8gICB2ZWM0IGNvbG9yNCA9IHZlYzQoY29sb3IueHl6IC8gMjU1LiwgY29sb3IudyAvIDI1NS4gKiBvcGFjaXR5KTtcbi8vICAgdmVjNCBwaWNraW5nQ29sb3I0ID0gdmVjNChwaWNraW5nQ29sb3IgLyAyNTUuLCAxLik7XG4vLyAgIHJldHVybiBtaXgoY29sb3I0LCBwaWNraW5nQ29sb3I0LCByZW5kZXJQaWNraW5nQnVmZmVyKTtcbi8vIH1cblxudm9pZCBtYWluKHZvaWQpIHtcblxuICB2ZWM0IGNvbG9yID0gdmVjNChjb2xvcnMucmdiLCBjb2xvcnMuYSAqIG9wYWNpdHkpIC8gMjU1LjtcblxuICBwaWNraW5nX3NldE5vcm1hbEFuZFBpY2tDb2xvcnMoXG4gICAgY29sb3IsXG4gICAgcGlja2luZ0NvbG9ycyAvIDI1NS5cbiAgKTtcblxuICB2ZWMzIHAgPSBwcm9qZWN0X3Bvc2l0aW9uKHBvc2l0aW9ucyk7XG4gIGdsX1Bvc2l0aW9uID0gcHJvamVjdF90b19jbGlwc3BhY2UodmVjNChwLCAxLikpO1xufVxuYDtcbiJdfQ==