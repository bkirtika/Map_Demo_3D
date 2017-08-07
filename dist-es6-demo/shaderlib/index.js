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

import { fp32, fp64 } from 'luma.gl';

import project from '../shaderlib/project/project';
import project64 from '../shaderlib/project64/project64';
import lighting from '../shaderlib/lighting/lighting';

import { registerShaderModules, setDefaultShaderModules } from 'luma.gl';

registerShaderModules([fp32, fp64, project, project64, lighting]);

setDefaultShaderModules([project]);

export { fp32, fp64, project, project64, lighting };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zaGFkZXJsaWIvaW5kZXguanMiXSwibmFtZXMiOlsiZnAzMiIsImZwNjQiLCJwcm9qZWN0IiwicHJvamVjdDY0IiwibGlnaHRpbmciLCJyZWdpc3RlclNoYWRlck1vZHVsZXMiLCJzZXREZWZhdWx0U2hhZGVyTW9kdWxlcyJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsU0FBUUEsSUFBUixFQUFjQyxJQUFkLFFBQXlCLFNBQXpCOztBQUVBLE9BQU9DLE9BQVAsTUFBb0IsOEJBQXBCO0FBQ0EsT0FBT0MsU0FBUCxNQUFzQixrQ0FBdEI7QUFDQSxPQUFPQyxRQUFQLE1BQXFCLGdDQUFyQjs7QUFFQSxTQUFRQyxxQkFBUixFQUErQkMsdUJBQS9CLFFBQTZELFNBQTdEOztBQUVBRCxzQkFBc0IsQ0FDcEJMLElBRG9CLEVBQ2RDLElBRGMsRUFFcEJDLE9BRm9CLEVBRVhDLFNBRlcsRUFHcEJDLFFBSG9CLENBQXRCOztBQU1BRSx3QkFBd0IsQ0FBQ0osT0FBRCxDQUF4Qjs7QUFFQSxTQUNFRixJQURGLEVBQ1FDLElBRFIsRUFFRUMsT0FGRixFQUVXQyxTQUZYLEVBR0VDLFFBSEYiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIDIwMTUgLSAyMDE3IFViZXIgVGVjaG5vbG9naWVzLCBJbmMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuLy8gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuLy8gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuLy8gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4vLyBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbi8vIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuLy8gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuLy8gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbi8vIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbi8vIFRIRSBTT0ZUV0FSRS5cblxuaW1wb3J0IHtmcDMyLCBmcDY0fSBmcm9tICdsdW1hLmdsJztcblxuaW1wb3J0IHByb2plY3QgZnJvbSAnLi4vc2hhZGVybGliL3Byb2plY3QvcHJvamVjdCc7XG5pbXBvcnQgcHJvamVjdDY0IGZyb20gJy4uL3NoYWRlcmxpYi9wcm9qZWN0NjQvcHJvamVjdDY0JztcbmltcG9ydCBsaWdodGluZyBmcm9tICcuLi9zaGFkZXJsaWIvbGlnaHRpbmcvbGlnaHRpbmcnO1xuXG5pbXBvcnQge3JlZ2lzdGVyU2hhZGVyTW9kdWxlcywgc2V0RGVmYXVsdFNoYWRlck1vZHVsZXN9IGZyb20gJ2x1bWEuZ2wnO1xuXG5yZWdpc3RlclNoYWRlck1vZHVsZXMoW1xuICBmcDMyLCBmcDY0LFxuICBwcm9qZWN0LCBwcm9qZWN0NjQsXG4gIGxpZ2h0aW5nXG5dKTtcblxuc2V0RGVmYXVsdFNoYWRlck1vZHVsZXMoW3Byb2plY3RdKTtcblxuZXhwb3J0IHtcbiAgZnAzMiwgZnA2NCxcbiAgcHJvamVjdCwgcHJvamVjdDY0LFxuICBsaWdodGluZ1xufTtcbiJdfQ==