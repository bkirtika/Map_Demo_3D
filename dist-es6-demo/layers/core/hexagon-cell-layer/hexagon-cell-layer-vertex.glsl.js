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

export default "\n#define SHADER_NAME hexagon-cell-layer-vertex-shader\n\nattribute vec3 positions;\nattribute vec3 normals;\n\nattribute vec3 instancePositions;\nattribute vec4 instanceColors;\nattribute vec3 instancePickingColors;\n\n// Picking uniforms\n// Set to 1.0 if rendering picking buffer, 0.0 if rendering for display\nuniform float renderPickingBuffer;\nuniform vec3 selectedPickingColor;\n\n// Custom uniforms\nuniform float opacity;\nuniform float radius;\nuniform float angle;\nuniform float extruded;\nuniform float coverage;\nuniform float elevationScale;\n\n// Result\nvarying vec4 vColor;\n\n// A magic number to scale elevation so that 1 unit approximate to 1 meter.\n#define ELEVATION_SCALE 0.8\n\n// whether is point picked\nfloat isPicked(vec3 pickingColors, vec3 selectedColor) {\n return float(pickingColors.x == selectedColor.x\n && pickingColors.y == selectedColor.y\n && pickingColors.z == selectedColor.z);\n}\n\nvoid main(void) {\n\n  // rotate primitive position and normal\n  mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n\n  vec2 rPos = rotationMatrix * positions.xz;\n  vec2 rNorm = rotationMatrix * normals.xz;\n\n  vec3 rotatedPositions = vec3(rPos.x, positions.y, rPos.y);\n  vec3 rotatedNormals = vec3(rNorm.x, normals.y, rNorm.y);\n\n  // calculate elevation, if 3d not enabled set to 0\n  // cylindar gemoetry height are between -0.5 to 0.5, transform it to between 0, 1\n  float elevation = 0.0;\n\n  if (extruded > 0.5) {\n    elevation = project_scale(instancePositions.z * (positions.y + 0.5) *\n      ELEVATION_SCALE * elevationScale);\n  }\n\n  float dotRadius = radius * mix(coverage, 0.0, float(instanceColors.a == 0.0));\n  // // project center of hexagon\n\n  vec4 centroidPosition = vec4(project_position(instancePositions.xy), elevation, 0.0);\n\n  vec4 position_worldspace = centroidPosition + vec4(vec2(rotatedPositions.xz * dotRadius), 0., 1.);\n\n  gl_Position = project_to_clipspace(position_worldspace);\n\n  // render display\n  if (renderPickingBuffer < 0.5) {\n\n    // TODO: we should allow the user to specify the color for \"selected element\"\n    // check whether hexagon is currently picked.\n    float selected = isPicked(instancePickingColors, selectedPickingColor);\n\n    // Light calculations\n    // Worldspace is the linear space after Mercator projection\n\n    vec3 normals_worldspace = rotatedNormals;\n\n    float lightWeight = 1.0;\n\n    if (extruded > 0.5) {\n      lightWeight = getLightWeight(\n        position_worldspace.xyz, // the w component is always 1.0\n        normals_worldspace\n      );\n    }\n\n    vec3 lightWeightedColor = lightWeight * instanceColors.rgb;\n\n    // Color: Either opacity-multiplied instance color, or picking color\n    vec4 color = vec4(lightWeightedColor, opacity * instanceColors.a) / 255.0;\n\n    vColor = color;\n\n  } else {\n\n    vec4 pickingColor = vec4(instancePickingColors / 255.0, 1.0);\n    vColor = pickingColor;\n\n  }\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9oZXhhZ29uLWNlbGwtbGF5ZXIvaGV4YWdvbi1jZWxsLWxheWVyLXZlcnRleC5nbHNsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwiZmlsZSI6ImhleGFnb24tY2VsbC1sYXllci12ZXJ0ZXguZ2xzbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5leHBvcnQgZGVmYXVsdCBgXFxcblxuI2RlZmluZSBTSEFERVJfTkFNRSBoZXhhZ29uLWNlbGwtbGF5ZXItdmVydGV4LXNoYWRlclxuXG5hdHRyaWJ1dGUgdmVjMyBwb3NpdGlvbnM7XG5hdHRyaWJ1dGUgdmVjMyBub3JtYWxzO1xuXG5hdHRyaWJ1dGUgdmVjMyBpbnN0YW5jZVBvc2l0aW9ucztcbmF0dHJpYnV0ZSB2ZWM0IGluc3RhbmNlQ29sb3JzO1xuYXR0cmlidXRlIHZlYzMgaW5zdGFuY2VQaWNraW5nQ29sb3JzO1xuXG4vLyBQaWNraW5nIHVuaWZvcm1zXG4vLyBTZXQgdG8gMS4wIGlmIHJlbmRlcmluZyBwaWNraW5nIGJ1ZmZlciwgMC4wIGlmIHJlbmRlcmluZyBmb3IgZGlzcGxheVxudW5pZm9ybSBmbG9hdCByZW5kZXJQaWNraW5nQnVmZmVyO1xudW5pZm9ybSB2ZWMzIHNlbGVjdGVkUGlja2luZ0NvbG9yO1xuXG4vLyBDdXN0b20gdW5pZm9ybXNcbnVuaWZvcm0gZmxvYXQgb3BhY2l0eTtcbnVuaWZvcm0gZmxvYXQgcmFkaXVzO1xudW5pZm9ybSBmbG9hdCBhbmdsZTtcbnVuaWZvcm0gZmxvYXQgZXh0cnVkZWQ7XG51bmlmb3JtIGZsb2F0IGNvdmVyYWdlO1xudW5pZm9ybSBmbG9hdCBlbGV2YXRpb25TY2FsZTtcblxuLy8gUmVzdWx0XG52YXJ5aW5nIHZlYzQgdkNvbG9yO1xuXG4vLyBBIG1hZ2ljIG51bWJlciB0byBzY2FsZSBlbGV2YXRpb24gc28gdGhhdCAxIHVuaXQgYXBwcm94aW1hdGUgdG8gMSBtZXRlci5cbiNkZWZpbmUgRUxFVkFUSU9OX1NDQUxFIDAuOFxuXG4vLyB3aGV0aGVyIGlzIHBvaW50IHBpY2tlZFxuZmxvYXQgaXNQaWNrZWQodmVjMyBwaWNraW5nQ29sb3JzLCB2ZWMzIHNlbGVjdGVkQ29sb3IpIHtcbiByZXR1cm4gZmxvYXQocGlja2luZ0NvbG9ycy54ID09IHNlbGVjdGVkQ29sb3IueFxuICYmIHBpY2tpbmdDb2xvcnMueSA9PSBzZWxlY3RlZENvbG9yLnlcbiAmJiBwaWNraW5nQ29sb3JzLnogPT0gc2VsZWN0ZWRDb2xvci56KTtcbn1cblxudm9pZCBtYWluKHZvaWQpIHtcblxuICAvLyByb3RhdGUgcHJpbWl0aXZlIHBvc2l0aW9uIGFuZCBub3JtYWxcbiAgbWF0MiByb3RhdGlvbk1hdHJpeCA9IG1hdDIoY29zKGFuZ2xlKSwgLXNpbihhbmdsZSksIHNpbihhbmdsZSksIGNvcyhhbmdsZSkpO1xuXG4gIHZlYzIgclBvcyA9IHJvdGF0aW9uTWF0cml4ICogcG9zaXRpb25zLnh6O1xuICB2ZWMyIHJOb3JtID0gcm90YXRpb25NYXRyaXggKiBub3JtYWxzLnh6O1xuXG4gIHZlYzMgcm90YXRlZFBvc2l0aW9ucyA9IHZlYzMoclBvcy54LCBwb3NpdGlvbnMueSwgclBvcy55KTtcbiAgdmVjMyByb3RhdGVkTm9ybWFscyA9IHZlYzMock5vcm0ueCwgbm9ybWFscy55LCByTm9ybS55KTtcblxuICAvLyBjYWxjdWxhdGUgZWxldmF0aW9uLCBpZiAzZCBub3QgZW5hYmxlZCBzZXQgdG8gMFxuICAvLyBjeWxpbmRhciBnZW1vZXRyeSBoZWlnaHQgYXJlIGJldHdlZW4gLTAuNSB0byAwLjUsIHRyYW5zZm9ybSBpdCB0byBiZXR3ZWVuIDAsIDFcbiAgZmxvYXQgZWxldmF0aW9uID0gMC4wO1xuXG4gIGlmIChleHRydWRlZCA+IDAuNSkge1xuICAgIGVsZXZhdGlvbiA9IHByb2plY3Rfc2NhbGUoaW5zdGFuY2VQb3NpdGlvbnMueiAqIChwb3NpdGlvbnMueSArIDAuNSkgKlxuICAgICAgRUxFVkFUSU9OX1NDQUxFICogZWxldmF0aW9uU2NhbGUpO1xuICB9XG5cbiAgZmxvYXQgZG90UmFkaXVzID0gcmFkaXVzICogbWl4KGNvdmVyYWdlLCAwLjAsIGZsb2F0KGluc3RhbmNlQ29sb3JzLmEgPT0gMC4wKSk7XG4gIC8vIC8vIHByb2plY3QgY2VudGVyIG9mIGhleGFnb25cblxuICB2ZWM0IGNlbnRyb2lkUG9zaXRpb24gPSB2ZWM0KHByb2plY3RfcG9zaXRpb24oaW5zdGFuY2VQb3NpdGlvbnMueHkpLCBlbGV2YXRpb24sIDAuMCk7XG5cbiAgdmVjNCBwb3NpdGlvbl93b3JsZHNwYWNlID0gY2VudHJvaWRQb3NpdGlvbiArIHZlYzQodmVjMihyb3RhdGVkUG9zaXRpb25zLnh6ICogZG90UmFkaXVzKSwgMC4sIDEuKTtcblxuICBnbF9Qb3NpdGlvbiA9IHByb2plY3RfdG9fY2xpcHNwYWNlKHBvc2l0aW9uX3dvcmxkc3BhY2UpO1xuXG4gIC8vIHJlbmRlciBkaXNwbGF5XG4gIGlmIChyZW5kZXJQaWNraW5nQnVmZmVyIDwgMC41KSB7XG5cbiAgICAvLyBUT0RPOiB3ZSBzaG91bGQgYWxsb3cgdGhlIHVzZXIgdG8gc3BlY2lmeSB0aGUgY29sb3IgZm9yIFwic2VsZWN0ZWQgZWxlbWVudFwiXG4gICAgLy8gY2hlY2sgd2hldGhlciBoZXhhZ29uIGlzIGN1cnJlbnRseSBwaWNrZWQuXG4gICAgZmxvYXQgc2VsZWN0ZWQgPSBpc1BpY2tlZChpbnN0YW5jZVBpY2tpbmdDb2xvcnMsIHNlbGVjdGVkUGlja2luZ0NvbG9yKTtcblxuICAgIC8vIExpZ2h0IGNhbGN1bGF0aW9uc1xuICAgIC8vIFdvcmxkc3BhY2UgaXMgdGhlIGxpbmVhciBzcGFjZSBhZnRlciBNZXJjYXRvciBwcm9qZWN0aW9uXG5cbiAgICB2ZWMzIG5vcm1hbHNfd29ybGRzcGFjZSA9IHJvdGF0ZWROb3JtYWxzO1xuXG4gICAgZmxvYXQgbGlnaHRXZWlnaHQgPSAxLjA7XG5cbiAgICBpZiAoZXh0cnVkZWQgPiAwLjUpIHtcbiAgICAgIGxpZ2h0V2VpZ2h0ID0gZ2V0TGlnaHRXZWlnaHQoXG4gICAgICAgIHBvc2l0aW9uX3dvcmxkc3BhY2UueHl6LCAvLyB0aGUgdyBjb21wb25lbnQgaXMgYWx3YXlzIDEuMFxuICAgICAgICBub3JtYWxzX3dvcmxkc3BhY2VcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmVjMyBsaWdodFdlaWdodGVkQ29sb3IgPSBsaWdodFdlaWdodCAqIGluc3RhbmNlQ29sb3JzLnJnYjtcblxuICAgIC8vIENvbG9yOiBFaXRoZXIgb3BhY2l0eS1tdWx0aXBsaWVkIGluc3RhbmNlIGNvbG9yLCBvciBwaWNraW5nIGNvbG9yXG4gICAgdmVjNCBjb2xvciA9IHZlYzQobGlnaHRXZWlnaHRlZENvbG9yLCBvcGFjaXR5ICogaW5zdGFuY2VDb2xvcnMuYSkgLyAyNTUuMDtcblxuICAgIHZDb2xvciA9IGNvbG9yO1xuXG4gIH0gZWxzZSB7XG5cbiAgICB2ZWM0IHBpY2tpbmdDb2xvciA9IHZlYzQoaW5zdGFuY2VQaWNraW5nQ29sb3JzIC8gMjU1LjAsIDEuMCk7XG4gICAgdkNvbG9yID0gcGlja2luZ0NvbG9yO1xuXG4gIH1cbn1cbmA7XG4iXX0=