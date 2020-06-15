"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.cacheFetchedTypes = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../store"));

const cacheFetchedTypes = async () => {
  const state = _store.default.getState();

  const {
    fetchedTypes
  } = state.remoteSchema;
  const {
    helpers
  } = state.gatsbyApi;
  await helpers.cache.set(`previously-fetched-types`, Array.from([...fetchedTypes]));
};

exports.cacheFetchedTypes = cacheFetchedTypes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdGVwcy9pbmdlc3QtcmVtb3RlLXNjaGVtYS9jYWNoZS1mZXRjaGVkLXR5cGVzLmpzIl0sIm5hbWVzIjpbImNhY2hlRmV0Y2hlZFR5cGVzIiwic3RhdGUiLCJzdG9yZSIsImdldFN0YXRlIiwiZmV0Y2hlZFR5cGVzIiwicmVtb3RlU2NoZW1hIiwiaGVscGVycyIsImdhdHNieUFwaSIsImNhY2hlIiwic2V0IiwiQXJyYXkiLCJmcm9tIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDTyxNQUFNQSxpQkFBaUIsR0FBRyxZQUFZO0FBQzNDLFFBQU1DLEtBQUssR0FBR0MsZUFBTUMsUUFBTixFQUFkOztBQUNBLFFBQU07QUFBRUMsSUFBQUE7QUFBRixNQUFtQkgsS0FBSyxDQUFDSSxZQUEvQjtBQUNBLFFBQU07QUFBRUMsSUFBQUE7QUFBRixNQUFjTCxLQUFLLENBQUNNLFNBQTFCO0FBRUEsUUFBTUQsT0FBTyxDQUFDRSxLQUFSLENBQWNDLEdBQWQsQ0FDSCwwQkFERyxFQUVKQyxLQUFLLENBQUNDLElBQU4sQ0FBVyxDQUFDLEdBQUdQLFlBQUosQ0FBWCxDQUZJLENBQU47QUFJRCxDQVRNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0b3JlIGZyb20gXCJ+L3N0b3JlXCJcbmV4cG9ydCBjb25zdCBjYWNoZUZldGNoZWRUeXBlcyA9IGFzeW5jICgpID0+IHtcbiAgY29uc3Qgc3RhdGUgPSBzdG9yZS5nZXRTdGF0ZSgpXG4gIGNvbnN0IHsgZmV0Y2hlZFR5cGVzIH0gPSBzdGF0ZS5yZW1vdGVTY2hlbWFcbiAgY29uc3QgeyBoZWxwZXJzIH0gPSBzdGF0ZS5nYXRzYnlBcGlcblxuICBhd2FpdCBoZWxwZXJzLmNhY2hlLnNldChcbiAgICBgcHJldmlvdXNseS1mZXRjaGVkLXR5cGVzYCxcbiAgICBBcnJheS5mcm9tKFsuLi5mZXRjaGVkVHlwZXNdKVxuICApXG59XG4iXX0=