"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getQueryInfoByTypeName = exports.getQueryInfoBySingleFieldName = exports.getTypeInfoBySingleName = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../store"));

const getTypeInfoBySingleName = singleName => {
  const {
    typeMap
  } = _store.default.getState().remoteSchema;

  const rootField = typeMap.get(`RootQuery`).fields.find(field => field.name === singleName);
  const typeName = rootField.type.name || rootField.type.ofType.name;
  const type = typeMap.get(typeName);
  return type;
};

exports.getTypeInfoBySingleName = getTypeInfoBySingleName;

const getQueryInfoBySingleFieldName = singleName => {
  const {
    nodeQueries
  } = _store.default.getState().remoteSchema;

  const queryInfo = Object.values(nodeQueries).find(q => q.typeInfo.singularName === singleName);
  return queryInfo;
};

exports.getQueryInfoBySingleFieldName = getQueryInfoBySingleFieldName;

const getQueryInfoByTypeName = typeName => {
  const {
    nodeQueries
  } = _store.default.getState().remoteSchema;

  const queryInfo = Object.values(nodeQueries).find(q => q.typeInfo.nodesTypeName === typeName);
  return queryInfo;
};

exports.getQueryInfoByTypeName = getQueryInfoByTypeName;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdGVwcy9zb3VyY2Utbm9kZXMvaGVscGVycy5qcyJdLCJuYW1lcyI6WyJnZXRUeXBlSW5mb0J5U2luZ2xlTmFtZSIsInNpbmdsZU5hbWUiLCJ0eXBlTWFwIiwic3RvcmUiLCJnZXRTdGF0ZSIsInJlbW90ZVNjaGVtYSIsInJvb3RGaWVsZCIsImdldCIsImZpZWxkcyIsImZpbmQiLCJmaWVsZCIsIm5hbWUiLCJ0eXBlTmFtZSIsInR5cGUiLCJvZlR5cGUiLCJnZXRRdWVyeUluZm9CeVNpbmdsZUZpZWxkTmFtZSIsIm5vZGVRdWVyaWVzIiwicXVlcnlJbmZvIiwiT2JqZWN0IiwidmFsdWVzIiwicSIsInR5cGVJbmZvIiwic2luZ3VsYXJOYW1lIiwiZ2V0UXVlcnlJbmZvQnlUeXBlTmFtZSIsIm5vZGVzVHlwZU5hbWUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUVPLE1BQU1BLHVCQUF1QixHQUFJQyxVQUFELElBQWdCO0FBQ3JELFFBQU07QUFBRUMsSUFBQUE7QUFBRixNQUFjQyxlQUFNQyxRQUFOLEdBQWlCQyxZQUFyQzs7QUFFQSxRQUFNQyxTQUFTLEdBQUdKLE9BQU8sQ0FDdEJLLEdBRGUsQ0FDVixXQURVLEVBRWZDLE1BRmUsQ0FFUkMsSUFGUSxDQUVGQyxLQUFELElBQVdBLEtBQUssQ0FBQ0MsSUFBTixLQUFlVixVQUZ2QixDQUFsQjtBQUlBLFFBQU1XLFFBQVEsR0FBR04sU0FBUyxDQUFDTyxJQUFWLENBQWVGLElBQWYsSUFBdUJMLFNBQVMsQ0FBQ08sSUFBVixDQUFlQyxNQUFmLENBQXNCSCxJQUE5RDtBQUVBLFFBQU1FLElBQUksR0FBR1gsT0FBTyxDQUFDSyxHQUFSLENBQVlLLFFBQVosQ0FBYjtBQUVBLFNBQU9DLElBQVA7QUFDRCxDQVpNOzs7O0FBY0EsTUFBTUUsNkJBQTZCLEdBQUlkLFVBQUQsSUFBZ0I7QUFDM0QsUUFBTTtBQUFFZSxJQUFBQTtBQUFGLE1BQWtCYixlQUFNQyxRQUFOLEdBQWlCQyxZQUF6Qzs7QUFFQSxRQUFNWSxTQUFTLEdBQUdDLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjSCxXQUFkLEVBQTJCUCxJQUEzQixDQUNmVyxDQUFELElBQU9BLENBQUMsQ0FBQ0MsUUFBRixDQUFXQyxZQUFYLEtBQTRCckIsVUFEbkIsQ0FBbEI7QUFJQSxTQUFPZ0IsU0FBUDtBQUNELENBUk07Ozs7QUFVQSxNQUFNTSxzQkFBc0IsR0FBSVgsUUFBRCxJQUFjO0FBQ2xELFFBQU07QUFBRUksSUFBQUE7QUFBRixNQUFrQmIsZUFBTUMsUUFBTixHQUFpQkMsWUFBekM7O0FBRUEsUUFBTVksU0FBUyxHQUFHQyxNQUFNLENBQUNDLE1BQVAsQ0FBY0gsV0FBZCxFQUEyQlAsSUFBM0IsQ0FDZlcsQ0FBRCxJQUFPQSxDQUFDLENBQUNDLFFBQUYsQ0FBV0csYUFBWCxLQUE2QlosUUFEcEIsQ0FBbEI7QUFJQSxTQUFPSyxTQUFQO0FBQ0QsQ0FSTSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5cbmV4cG9ydCBjb25zdCBnZXRUeXBlSW5mb0J5U2luZ2xlTmFtZSA9IChzaW5nbGVOYW1lKSA9PiB7XG4gIGNvbnN0IHsgdHlwZU1hcCB9ID0gc3RvcmUuZ2V0U3RhdGUoKS5yZW1vdGVTY2hlbWFcblxuICBjb25zdCByb290RmllbGQgPSB0eXBlTWFwXG4gICAgLmdldChgUm9vdFF1ZXJ5YClcbiAgICAuZmllbGRzLmZpbmQoKGZpZWxkKSA9PiBmaWVsZC5uYW1lID09PSBzaW5nbGVOYW1lKVxuXG4gIGNvbnN0IHR5cGVOYW1lID0gcm9vdEZpZWxkLnR5cGUubmFtZSB8fCByb290RmllbGQudHlwZS5vZlR5cGUubmFtZVxuXG4gIGNvbnN0IHR5cGUgPSB0eXBlTWFwLmdldCh0eXBlTmFtZSlcblxuICByZXR1cm4gdHlwZVxufVxuXG5leHBvcnQgY29uc3QgZ2V0UXVlcnlJbmZvQnlTaW5nbGVGaWVsZE5hbWUgPSAoc2luZ2xlTmFtZSkgPT4ge1xuICBjb25zdCB7IG5vZGVRdWVyaWVzIH0gPSBzdG9yZS5nZXRTdGF0ZSgpLnJlbW90ZVNjaGVtYVxuXG4gIGNvbnN0IHF1ZXJ5SW5mbyA9IE9iamVjdC52YWx1ZXMobm9kZVF1ZXJpZXMpLmZpbmQoXG4gICAgKHEpID0+IHEudHlwZUluZm8uc2luZ3VsYXJOYW1lID09PSBzaW5nbGVOYW1lXG4gIClcblxuICByZXR1cm4gcXVlcnlJbmZvXG59XG5cbmV4cG9ydCBjb25zdCBnZXRRdWVyeUluZm9CeVR5cGVOYW1lID0gKHR5cGVOYW1lKSA9PiB7XG4gIGNvbnN0IHsgbm9kZVF1ZXJpZXMgfSA9IHN0b3JlLmdldFN0YXRlKCkucmVtb3RlU2NoZW1hXG5cbiAgY29uc3QgcXVlcnlJbmZvID0gT2JqZWN0LnZhbHVlcyhub2RlUXVlcmllcykuZmluZChcbiAgICAocSkgPT4gcS50eXBlSW5mby5ub2Rlc1R5cGVOYW1lID09PSB0eXBlTmFtZVxuICApXG5cbiAgcmV0dXJuIHF1ZXJ5SW5mb1xufVxuIl19