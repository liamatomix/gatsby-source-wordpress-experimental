"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getGatsbyApi = exports.getHelpers = exports.getPluginOptions = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../store"));

const getPluginOptions = () => _store.default.getState().gatsbyApi.pluginOptions;

exports.getPluginOptions = getPluginOptions;

const getHelpers = () => _store.default.getState().gatsbyApi.helpers;

exports.getHelpers = getHelpers;

const getGatsbyApi = () => _store.default.getState().gatsbyApi;

exports.getGatsbyApi = getGatsbyApi;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlscy9nZXQtZ2F0c2J5LWFwaS5qcyJdLCJuYW1lcyI6WyJnZXRQbHVnaW5PcHRpb25zIiwic3RvcmUiLCJnZXRTdGF0ZSIsImdhdHNieUFwaSIsInBsdWdpbk9wdGlvbnMiLCJnZXRIZWxwZXJzIiwiaGVscGVycyIsImdldEdhdHNieUFwaSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRU8sTUFBTUEsZ0JBQWdCLEdBQUcsTUFBTUMsZUFBTUMsUUFBTixHQUFpQkMsU0FBakIsQ0FBMkJDLGFBQTFEOzs7O0FBQ0EsTUFBTUMsVUFBVSxHQUFHLE1BQU1KLGVBQU1DLFFBQU4sR0FBaUJDLFNBQWpCLENBQTJCRyxPQUFwRDs7OztBQUNBLE1BQU1DLFlBQVksR0FBRyxNQUFNTixlQUFNQyxRQUFOLEdBQWlCQyxTQUE1QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5cbmV4cG9ydCBjb25zdCBnZXRQbHVnaW5PcHRpb25zID0gKCkgPT4gc3RvcmUuZ2V0U3RhdGUoKS5nYXRzYnlBcGkucGx1Z2luT3B0aW9uc1xuZXhwb3J0IGNvbnN0IGdldEhlbHBlcnMgPSAoKSA9PiBzdG9yZS5nZXRTdGF0ZSgpLmdhdHNieUFwaS5oZWxwZXJzXG5leHBvcnQgY29uc3QgZ2V0R2F0c2J5QXBpID0gKCkgPT4gc3RvcmUuZ2V0U3RhdGUoKS5nYXRzYnlBcGlcbiJdfQ==