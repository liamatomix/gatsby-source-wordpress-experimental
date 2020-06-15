"use strict";

exports.__esModule = true;
exports.genericDownloadMessage = exports.supportedWpPluginVersions = void 0;

require("source-map-support/register");

// this doesn't indicate which versions actually work,
// it indicates which versions we will actually support AND which versions work.
const supportedWpPluginVersions = {
  WPGraphQL: {
    version: `~0.9.1`,
    reason: `WPGraphQL 0.9.0 isn't supported because menu item relay id's changed from nav_menu:id to term:id in 0.9.1.\nUsing WPGatsby 0.4.0 and WPGraphQL 0.9.0 would lead to inconsistent cache invalidation for menus.\nThis doesn't mean you're on WPGraphQL 0.9.0, but explains why the minimum version is 0.9.1`
  },
  WPGatsby: {
    version: `~0.4.0`,
    reason: `WPGatsby 0.4.0 supports WPGraphQL 0.9.1`
  }
}; // @todo replace this link with another once we're out of alpha

exports.supportedWpPluginVersions = supportedWpPluginVersions;
const genericDownloadMessage = `\n\n\tVisit https://github.com/wp-graphql/wp-graphql/releases and https://github.com/gatsbyjs/wp-gatsby/releases\n\tto download versions of WPGatsby and WPGraphL that satisfy these requirements.`;
exports.genericDownloadMessage = genericDownloadMessage;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9zdXBwb3J0ZWQtcmVtb3RlLXBsdWdpbi12ZXJzaW9ucy5qcyJdLCJuYW1lcyI6WyJzdXBwb3J0ZWRXcFBsdWdpblZlcnNpb25zIiwiV1BHcmFwaFFMIiwidmVyc2lvbiIsInJlYXNvbiIsIldQR2F0c2J5IiwiZ2VuZXJpY0Rvd25sb2FkTWVzc2FnZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBO0FBQ0E7QUFDQSxNQUFNQSx5QkFBeUIsR0FBRztBQUNoQ0MsRUFBQUEsU0FBUyxFQUFFO0FBQ1RDLElBQUFBLE9BQU8sRUFBRyxRQUREO0FBRVRDLElBQUFBLE1BQU0sRUFBRztBQUZBLEdBRHFCO0FBS2hDQyxFQUFBQSxRQUFRLEVBQUU7QUFDUkYsSUFBQUEsT0FBTyxFQUFHLFFBREY7QUFFUkMsSUFBQUEsTUFBTSxFQUFHO0FBRkQ7QUFMc0IsQ0FBbEMsQyxDQVdBOzs7QUFDQSxNQUFNRSxzQkFBc0IsR0FBSSxvTUFBaEMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyB0aGlzIGRvZXNuJ3QgaW5kaWNhdGUgd2hpY2ggdmVyc2lvbnMgYWN0dWFsbHkgd29yayxcbi8vIGl0IGluZGljYXRlcyB3aGljaCB2ZXJzaW9ucyB3ZSB3aWxsIGFjdHVhbGx5IHN1cHBvcnQgQU5EIHdoaWNoIHZlcnNpb25zIHdvcmsuXG5jb25zdCBzdXBwb3J0ZWRXcFBsdWdpblZlcnNpb25zID0ge1xuICBXUEdyYXBoUUw6IHtcbiAgICB2ZXJzaW9uOiBgfjAuOS4xYCxcbiAgICByZWFzb246IGBXUEdyYXBoUUwgMC45LjAgaXNuJ3Qgc3VwcG9ydGVkIGJlY2F1c2UgbWVudSBpdGVtIHJlbGF5IGlkJ3MgY2hhbmdlZCBmcm9tIG5hdl9tZW51OmlkIHRvIHRlcm06aWQgaW4gMC45LjEuXFxuVXNpbmcgV1BHYXRzYnkgMC40LjAgYW5kIFdQR3JhcGhRTCAwLjkuMCB3b3VsZCBsZWFkIHRvIGluY29uc2lzdGVudCBjYWNoZSBpbnZhbGlkYXRpb24gZm9yIG1lbnVzLlxcblRoaXMgZG9lc24ndCBtZWFuIHlvdSdyZSBvbiBXUEdyYXBoUUwgMC45LjAsIGJ1dCBleHBsYWlucyB3aHkgdGhlIG1pbmltdW0gdmVyc2lvbiBpcyAwLjkuMWAsXG4gIH0sXG4gIFdQR2F0c2J5OiB7XG4gICAgdmVyc2lvbjogYH4wLjQuMGAsXG4gICAgcmVhc29uOiBgV1BHYXRzYnkgMC40LjAgc3VwcG9ydHMgV1BHcmFwaFFMIDAuOS4xYCxcbiAgfSxcbn1cblxuLy8gQHRvZG8gcmVwbGFjZSB0aGlzIGxpbmsgd2l0aCBhbm90aGVyIG9uY2Ugd2UncmUgb3V0IG9mIGFscGhhXG5jb25zdCBnZW5lcmljRG93bmxvYWRNZXNzYWdlID0gYFxcblxcblxcdFZpc2l0IGh0dHBzOi8vZ2l0aHViLmNvbS93cC1ncmFwaHFsL3dwLWdyYXBocWwvcmVsZWFzZXMgYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9nYXRzYnlqcy93cC1nYXRzYnkvcmVsZWFzZXNcXG5cXHR0byBkb3dubG9hZCB2ZXJzaW9ucyBvZiBXUEdhdHNieSBhbmQgV1BHcmFwaEwgdGhhdCBzYXRpc2Z5IHRoZXNlIHJlcXVpcmVtZW50cy5gXG5cbmV4cG9ydCB7IHN1cHBvcnRlZFdwUGx1Z2luVmVyc2lvbnMsIGdlbmVyaWNEb3dubG9hZE1lc3NhZ2UgfVxuIl19