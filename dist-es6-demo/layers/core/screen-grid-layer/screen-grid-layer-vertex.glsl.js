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

export default "#define SHADER_NAME screen-grid-layer-vertex-shader\n\nattribute vec3 vertices;\nattribute vec3 instancePositions;\nattribute float instanceCount;\nattribute vec3 instancePickingColors;\n\nuniform float maxCount;\nuniform float opacity;\nuniform vec4 minColor;\nuniform vec4 maxColor;\nuniform float renderPickingBuffer;\nuniform vec3 cellScale;\nuniform vec3 selectedPickingColor;\n\nvarying vec4 vColor;\n\nvoid main(void) {\n  vec4 color = mix(minColor, maxColor, instanceCount / maxCount) / 255.;\n\n  vColor = mix(\n    vec4(color.rgb, color.a * opacity),\n    vec4(instancePickingColors / 255., 1.),\n    renderPickingBuffer\n  );\n\n  gl_Position = vec4(instancePositions + vertices * cellScale, 1.);\n}\n";
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9sYXllcnMvY29yZS9zY3JlZW4tZ3JpZC1sYXllci9zY3JlZW4tZ3JpZC1sYXllci12ZXJ0ZXguZ2xzbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSIsImZpbGUiOiJzY3JlZW4tZ3JpZC1sYXllci12ZXJ0ZXguZ2xzbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAoYykgMjAxNSAtIDIwMTcgVWJlciBUZWNobm9sb2dpZXMsIEluYy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4vLyBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4vLyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4vLyBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbi8vIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbi8vIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4vLyBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuLy8gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuLy8gVEhFIFNPRlRXQVJFLlxuXG5leHBvcnQgZGVmYXVsdCBgXFxcbiNkZWZpbmUgU0hBREVSX05BTUUgc2NyZWVuLWdyaWQtbGF5ZXItdmVydGV4LXNoYWRlclxuXG5hdHRyaWJ1dGUgdmVjMyB2ZXJ0aWNlcztcbmF0dHJpYnV0ZSB2ZWMzIGluc3RhbmNlUG9zaXRpb25zO1xuYXR0cmlidXRlIGZsb2F0IGluc3RhbmNlQ291bnQ7XG5hdHRyaWJ1dGUgdmVjMyBpbnN0YW5jZVBpY2tpbmdDb2xvcnM7XG5cbnVuaWZvcm0gZmxvYXQgbWF4Q291bnQ7XG51bmlmb3JtIGZsb2F0IG9wYWNpdHk7XG51bmlmb3JtIHZlYzQgbWluQ29sb3I7XG51bmlmb3JtIHZlYzQgbWF4Q29sb3I7XG51bmlmb3JtIGZsb2F0IHJlbmRlclBpY2tpbmdCdWZmZXI7XG51bmlmb3JtIHZlYzMgY2VsbFNjYWxlO1xudW5pZm9ybSB2ZWMzIHNlbGVjdGVkUGlja2luZ0NvbG9yO1xuXG52YXJ5aW5nIHZlYzQgdkNvbG9yO1xuXG52b2lkIG1haW4odm9pZCkge1xuICB2ZWM0IGNvbG9yID0gbWl4KG1pbkNvbG9yLCBtYXhDb2xvciwgaW5zdGFuY2VDb3VudCAvIG1heENvdW50KSAvIDI1NS47XG5cbiAgdkNvbG9yID0gbWl4KFxuICAgIHZlYzQoY29sb3IucmdiLCBjb2xvci5hICogb3BhY2l0eSksXG4gICAgdmVjNChpbnN0YW5jZVBpY2tpbmdDb2xvcnMgLyAyNTUuLCAxLiksXG4gICAgcmVuZGVyUGlja2luZ0J1ZmZlclxuICApO1xuXG4gIGdsX1Bvc2l0aW9uID0gdmVjNChpbnN0YW5jZVBvc2l0aW9ucyArIHZlcnRpY2VzICogY2VsbFNjYWxlLCAxLik7XG59XG5gO1xuIl19