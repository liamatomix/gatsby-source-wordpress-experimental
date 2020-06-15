"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.filterTypeDefinition = exports.getTypeSettingsByType = exports.typeIsASupportedScalar = exports.typeIsABuiltInScalar = exports.fieldOfTypeWasFetched = exports.findTypeKind = exports.findTypeName = exports.buildTypeName = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../store"));

var _typeFilters = require("./type-filters");

var _getGatsbyApi = require("../../utils/get-gatsby-api");

/**
 * This function namespaces typenames with a prefix
 */
const buildTypeName = name => {
  if (!name || typeof name !== `string`) {
    return null;
  }

  const {
    schema: {
      typePrefix: prefix
    }
  } = (0, _getGatsbyApi.getPluginOptions)(); // this is for our namespace type on the root { wp { ...fields } }

  if (name === prefix) {
    return name;
  }

  return prefix + name;
};
/**
 * Find the first type name of a Type definition pulled via introspection
 * @param {object} type
 */


exports.buildTypeName = buildTypeName;

const findTypeName = type => {
  var _type$ofType, _type$ofType2, _type$ofType2$ofType, _type$ofType3, _type$ofType3$ofType, _type$ofType3$ofType$;

  return (type === null || type === void 0 ? void 0 : type.name) || (type === null || type === void 0 ? void 0 : (_type$ofType = type.ofType) === null || _type$ofType === void 0 ? void 0 : _type$ofType.name) || (type === null || type === void 0 ? void 0 : (_type$ofType2 = type.ofType) === null || _type$ofType2 === void 0 ? void 0 : (_type$ofType2$ofType = _type$ofType2.ofType) === null || _type$ofType2$ofType === void 0 ? void 0 : _type$ofType2$ofType.name) || (type === null || type === void 0 ? void 0 : (_type$ofType3 = type.ofType) === null || _type$ofType3 === void 0 ? void 0 : (_type$ofType3$ofType = _type$ofType3.ofType) === null || _type$ofType3$ofType === void 0 ? void 0 : (_type$ofType3$ofType$ = _type$ofType3$ofType.ofType) === null || _type$ofType3$ofType$ === void 0 ? void 0 : _type$ofType3$ofType$.name);
};
/**
 * Find the first type kind of a Type definition pulled via introspection
 * @param {object} type
 */


exports.findTypeName = findTypeName;

const findTypeKind = type => {
  var _type$ofType4, _type$ofType5, _type$ofType5$ofType, _type$ofType6, _type$ofType6$ofType, _type$ofType6$ofType$;

  return (type === null || type === void 0 ? void 0 : type.kind) || (type === null || type === void 0 ? void 0 : (_type$ofType4 = type.ofType) === null || _type$ofType4 === void 0 ? void 0 : _type$ofType4.kind) || (type === null || type === void 0 ? void 0 : (_type$ofType5 = type.ofType) === null || _type$ofType5 === void 0 ? void 0 : (_type$ofType5$ofType = _type$ofType5.ofType) === null || _type$ofType5$ofType === void 0 ? void 0 : _type$ofType5$ofType.kind) || (type === null || type === void 0 ? void 0 : (_type$ofType6 = type.ofType) === null || _type$ofType6 === void 0 ? void 0 : (_type$ofType6$ofType = _type$ofType6.ofType) === null || _type$ofType6$ofType === void 0 ? void 0 : (_type$ofType6$ofType$ = _type$ofType6$ofType.ofType) === null || _type$ofType6$ofType$ === void 0 ? void 0 : _type$ofType6$ofType$.kind);
};

exports.findTypeKind = findTypeKind;

const fieldOfTypeWasFetched = type => {
  const {
    fetchedTypes
  } = _store.default.getState().remoteSchema;

  const typeName = findTypeName(type);
  const typeWasFetched = !!fetchedTypes.get(typeName);
  return typeWasFetched;
};

exports.fieldOfTypeWasFetched = fieldOfTypeWasFetched;
const supportedScalars = [`Int`, `Float`, `String`, `Boolean`, `ID`, `Date`, `JSON`];

const typeIsABuiltInScalar = type => // @todo the next function and this one are redundant.
// see the next todo on how to fix the issue. If that todo is resolved, these functions will be identical. :(
supportedScalars.includes(findTypeName(type));

exports.typeIsABuiltInScalar = typeIsABuiltInScalar;

const typeIsASupportedScalar = type => {
  if (findTypeKind(type) !== `SCALAR`) {
    // @todo returning true here seems wrong since a type that is not a scalar can't be a supported scalar... so there is some other logic elsewhere that is wrong
    // making this return false causes errors in the schema
    return true;
  }

  return supportedScalars.includes(findTypeName(type));
}; // retrieves plugin settings for the provided type


exports.typeIsASupportedScalar = typeIsASupportedScalar;

const getTypeSettingsByType = type => {
  if (!type) {
    return {};
  } // the plugin options object containing every type setting


  const allTypeSettings = _store.default.getState().gatsbyApi.pluginOptions.type; // the type.__all plugin option which is applied to every type setting


  const __allTypeSetting = allTypeSettings.__all || {};

  const typeName = findTypeName(type);
  const typeSettings = allTypeSettings[typeName];

  if (typeSettings) {
    return Object.assign({}, __allTypeSetting, typeSettings);
  }

  return __allTypeSetting;
};
/**
 * This is used to filter the automatically generated type definitions before they're added to the schema customization api.
 */


exports.getTypeSettingsByType = getTypeSettingsByType;

const filterTypeDefinition = (typeDefinition, typeBuilderApi, typeKind) => {
  const filters = _typeFilters.typeDefinitionFilters.filter(filter => [typeBuilderApi.type.name, `__all`].includes(filter.typeName));

  if (filters === null || filters === void 0 ? void 0 : filters.length) {
    filters.forEach(filter => {
      if (filter && typeof filter.typeDef === `function`) {
        typeDefinition = filter.typeDef(typeDefinition, typeBuilderApi, typeKind);
      }
    });
  }

  return typeDefinition;
};

exports.filterTypeDefinition = filterTypeDefinition;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vaGVscGVycy5qcyJdLCJuYW1lcyI6WyJidWlsZFR5cGVOYW1lIiwibmFtZSIsInNjaGVtYSIsInR5cGVQcmVmaXgiLCJwcmVmaXgiLCJmaW5kVHlwZU5hbWUiLCJ0eXBlIiwib2ZUeXBlIiwiZmluZFR5cGVLaW5kIiwia2luZCIsImZpZWxkT2ZUeXBlV2FzRmV0Y2hlZCIsImZldGNoZWRUeXBlcyIsInN0b3JlIiwiZ2V0U3RhdGUiLCJyZW1vdGVTY2hlbWEiLCJ0eXBlTmFtZSIsInR5cGVXYXNGZXRjaGVkIiwiZ2V0Iiwic3VwcG9ydGVkU2NhbGFycyIsInR5cGVJc0FCdWlsdEluU2NhbGFyIiwiaW5jbHVkZXMiLCJ0eXBlSXNBU3VwcG9ydGVkU2NhbGFyIiwiZ2V0VHlwZVNldHRpbmdzQnlUeXBlIiwiYWxsVHlwZVNldHRpbmdzIiwiZ2F0c2J5QXBpIiwicGx1Z2luT3B0aW9ucyIsIl9fYWxsVHlwZVNldHRpbmciLCJfX2FsbCIsInR5cGVTZXR0aW5ncyIsImZpbHRlclR5cGVEZWZpbml0aW9uIiwidHlwZURlZmluaXRpb24iLCJ0eXBlQnVpbGRlckFwaSIsInR5cGVLaW5kIiwiZmlsdGVycyIsInR5cGVEZWZpbml0aW9uRmlsdGVycyIsImZpbHRlciIsImxlbmd0aCIsImZvckVhY2giLCJ0eXBlRGVmIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFFQTs7O0FBR08sTUFBTUEsYUFBYSxHQUFJQyxJQUFELElBQVU7QUFDckMsTUFBSSxDQUFDQSxJQUFELElBQVMsT0FBT0EsSUFBUCxLQUFpQixRQUE5QixFQUF1QztBQUNyQyxXQUFPLElBQVA7QUFDRDs7QUFFRCxRQUFNO0FBQ0pDLElBQUFBLE1BQU0sRUFBRTtBQUFFQyxNQUFBQSxVQUFVLEVBQUVDO0FBQWQ7QUFESixNQUVGLHFDQUZKLENBTHFDLENBU3JDOztBQUNBLE1BQUlILElBQUksS0FB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QUFwQzs7QUFFQSxNQUFJYSxZQUFKLEVBQWtCO0FBQ2hCLDZCQUFZRixnQkFBWixFQUFpQ0UsWUFBakM7QUFDRDs7QUFFRCxTQUFPRixnQkFBUDtBQUNELENBbkJNO0FBcUJQOzs7Ozs7O0FBR08sTUFBTUcsb0JBQW9CLEdBQUcsQ0FDbENDLGNBRGtDLEVBRWxDQyxjQUZrQyxFQUdsQ0MsUUFIa0MsS0FJL0I7QUFDSCxRQUFNQyxPQUFPLEdBQUdDLG1DQUFzQkMsTUFBdEIsQ0FBOEJBLE1BQUQsSUFDM0MsQ0FBQ0osY0FBYyxDQUFDekIsSUFBZixDQUFvQkwsSUFBckIsRUFBNEIsT0FBNUIsRUFBb0NtQixRQUFwQyxDQUE2Q2UsTUFBTSxDQUFDcEIsUUFBcEQsQ0FEYyxDQUFoQjs7QUFJQSxNQUFJa0IsT0FBSixhQUFJQSxPQUFKLHVCQUFJQSxPQUFPLENBQUVHLE1BQWIsRUFBcUI7QUFDbkJILElBQUFBLE9BQU8sQ0FBQ0ksT0FBUixDQUFpQkYsTUFBRCxJQUFZO0FBQzFCLFVBQUlBLE1BQU0sSUFBSSxPQUFPQSxNQUFNLENBQUNHLE9BQWQsS0FBMkIsVUFBekMsRUFBb0Q7QUFDbERSLFFBQUFBLGNBQWMsR0FBR0ssTUFBTSxDQUFDRyxPQUFQLENBQ2ZSLGNBRGUsRUFFZkMsY0FGZSxFQUdmQyxRQUhlLENBQWpCO0FBS0Q7QUFDRixLQVJEO0FBU0Q7O0FBRUQsU0FBT0YsY0FBUDtBQUNELENBdEJNIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0b3JlIGZyb20gXCJ+L3N0b3JlXCJcbmltcG9ydCB7IHR5cGVEZWZpbml0aW9uRmlsdGVycyB9IGZyb20gXCIuL3R5cGUtZmlsdGVyc1wiXG5pbXBvcnQgeyBnZXRQbHVnaW5PcHRpb25zIH0gZnJvbSBcIn4vdXRpbHMvZ2V0LWdhdHNieS1hcGlcIlxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gbmFtZXNwYWNlcyB0eXBlbmFtZXMgd2l0aCBhIHByZWZpeFxuICovXG5leHBvcnQgY29uc3QgYnVpbGRUeXBlTmFtZSA9IChuYW1lKSA9PiB7XG4gIGlmICghbmFtZSB8fCB0eXBlb2YgbmFtZSAhPT0gYHN0cmluZ2ApIHtcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3Qge1xuICAgIHNjaGVtYTogeyB0eXBlUHJlZml4OiBwcmVmaXggfSxcbiAgfSA9IGdldFBsdWdpbk9wdGlvbnMoKVxuXG4gIC8vIHRoaXMgaXMgZm9yIG91ciBuYW1lc3BhY2UgdHlwZSBvbiB0aGUgcm9vdCB7IHdwIHsgLi4uZmllbGRzIH0gfVxuICBpZiAobmFtZSA9PT0gcHJlZml4KSB7XG4gICAgcmV0dXJuIG5hbWVcbiAgfVxuXG4gIHJldHVybiBwcmVmaXggKyBuYW1lXG59XG5cbi8qKlxuICogRmluZCB0aGUgZmlyc3QgdHlwZSBuYW1lIG9mIGEgVHlwZSBkZWZpbml0aW9uIHB1bGxlZCB2aWEgaW50cm9zcGVjdGlvblxuICogQHBhcmFtIHtvYmplY3R9IHR5cGVcbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRUeXBlTmFtZSA9ICh0eXBlKSA9PlxuICB0eXBlPy5uYW1lIHx8XG4gIHR5cGU/Lm9mVHlwZT8ubmFtZSB8fFxuICB0eXBlPy5vZlR5cGU/Lm9mVHlwZT8ubmFtZSB8fFxuICB0eXBlPy5vZlR5cGU/Lm9mVHlwZT8ub2ZUeXBlPy5uYW1lXG5cbi8qKlxuICogRmluZCB0aGUgZmlyc3QgdHlwZSBraW5kIG9mIGEgVHlwZSBkZWZpbml0aW9uIHB1bGxlZCB2aWEgaW50cm9zcGVjdGlvblxuICogQHBhcmFtIHtvYmplY3R9IHR5cGVcbiAqL1xuZXhwb3J0IGNvbnN0IGZpbmRUeXBlS2luZCA9ICh0eXBlKSA9PlxuICB0eXBlPy5raW5kIHx8XG4gIHR5cGU/Lm9mVHlwZT8ua2luZCB8fFxuICB0eXBlPy5vZlR5cGU/Lm9mVHlwZT8ua2luZCB8fFxuICB0eXBlPy5vZlR5cGU/Lm9mVHlwZT8ub2ZUeXBlPy5raW5kXG5cbmV4cG9ydCBjb25zdCBmaWVsZE9mVHlwZVdhc0ZldGNoZWQgPSAodHlwZSkgPT4ge1xuICBjb25zdCB7IGZldGNoZWRUeXBlcyB9ID0gc3RvcmUuZ2V0U3RhdGUoKS5yZW1vdGVTY2hlbWFcbiAgY29uc3QgdHlwZU5hbWUgPSBmaW5kVHlwZU5hbWUodHlwZSlcbiAgY29uc3QgdHlwZVdhc0ZldGNoZWQgPSAhIWZldGNoZWRUeXBlcy5nZXQodHlwZU5hbWUpXG5cbiAgcmV0dXJuIHR5cGVXYXNGZXRjaGVkXG59XG5cbmNvbnN0IHN1cHBvcnRlZFNjYWxhcnMgPSBbXG4gIGBJbnRgLFxuICBgRmxvYXRgLFxuICBgU3RyaW5nYCxcbiAgYEJvb2xlYW5gLFxuICBgSURgLFxuICBgRGF0ZWAsXG4gIGBKU09OYCxcbl1cblxuZXhwb3J0IGNvbnN0IHR5cGVJc0FCdWlsdEluU2NhbGFyID0gKHR5cGUpID0+XG4gIC8vIEB0b2RvIHRoZSBuZXh0IGZ1bmN0aW9uIGFuZCB0aGlzIG9uZSBhcmUgcmVkdW5kYW50LlxuICAvLyBzZWUgdGhlIG5leHQgdG9kbyBvbiBob3cgdG8gZml4IHRoZSBpc3N1ZS4gSWYgdGhhdCB0b2RvIGlzIHJlc29sdmVkLCB0aGVzZSBmdW5jdGlvbnMgd2lsbCBiZSBpZGVudGljYWwuIDooXG4gIHN1cHBvcnRlZFNjYWxhcnMuaW5jbHVkZXMoZmluZFR5cGVOYW1lKHR5cGUpKVxuXG5leHBvcnQgY29uc3QgdHlwZUlzQVN1cHBvcnRlZFNjYWxhciA9ICh0eXBlKSA9PiB7XG4gIGlmIChmaW5kVHlwZUtpbmQodHlwZSkgIT09IGBTQ0FMQVJgKSB7XG4gICAgLy8gQHRvZG8gcmV0dXJuaW5nIHRydWUgaGVyZSBzZWVtcyB3cm9uZyBzaW5jZSBhIHR5cGUgdGhhdCBpcyBub3QgYSBzY2FsYXIgY2FuJ3QgYmUgYSBzdXBwb3J0ZWQgc2NhbGFyLi4uIHNvIHRoZXJlIGlzIHNvbWUgb3RoZXIgbG9naWMgZWxzZXdoZXJlIHRoYXQgaXMgd3JvbmdcbiAgICAvLyBtYWtpbmcgdGhpcyByZXR1cm4gZmFsc2UgY2F1c2VzIGVycm9ycyBpbiB0aGUgc2NoZW1hXG4gICAgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBzdXBwb3J0ZWRTY2FsYXJzLmluY2x1ZGVzKGZpbmRUeXBlTmFtZSh0eXBlKSlcbn1cblxuLy8gcmV0cmlldmVzIHBsdWdpbiBzZXR0aW5ncyBmb3IgdGhlIHByb3ZpZGVkIHR5cGVcbmV4cG9ydCBjb25zdCBnZXRUeXBlU2V0dGluZ3NCeVR5cGUgPSAodHlwZSkgPT4ge1xuICBpZiAoIXR5cGUpIHtcbiAgICByZXR1cm4ge31cbiAgfVxuXG4gIC8vIHRoZSBwbHVnaW4gb3B0aW9ucyBvYmplY3QgY29udGFpbmluZyBldmVyeSB0eXBlIHNldHRpbmdcbiAgY29uc3QgYWxsVHlwZVNldHRpbmdzID0gc3RvcmUuZ2V0U3RhdGUoKS5nYXRzYnlBcGkucGx1Z2luT3B0aW9ucy50eXBlXG5cbiAgLy8gdGhlIHR5cGUuX19hbGwgcGx1Z2luIG9wdGlvbiB3aGljaCBpcyBhcHBsaWVkIHRvIGV2ZXJ5IHR5cGUgc2V0dGluZ1xuICBjb25zdCBfX2FsbFR5cGVTZXR0aW5nID0gYWxsVHlwZVNldHRpbmdzLl9fYWxsIHx8IHt9XG5cbiAgY29uc3QgdHlwZU5hbWUgPSBmaW5kVHlwZU5hbWUodHlwZSlcbiAgY29uc3QgdHlwZVNldHRpbmdzID0gYWxsVHlwZVNldHRpbmdzW3R5cGVOYW1lXVxuXG4gIGlmICh0eXBlU2V0dGluZ3MpIHtcbiAgICByZXR1cm4geyAuLi5fX2FsbFR5cGVTZXR0aW5nLCAuLi50eXBlU2V0dGluZ3MgfVxuICB9XG5cbiAgcmV0dXJuIF9fYWxsVHlwZVNldHRpbmdcbn1cblxuLyoqXG4gKiBUaGlzIGlzIHVzZWQgdG8gZmlsdGVyIHRoZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZCB0eXBlIGRlZmluaXRpb25zIGJlZm9yZSB0aGV5J3JlIGFkZGVkIHRvIHRoZSBzY2hlbWEgY3VzdG9taXphdGlvbiBhcGkuXG4gKi9cbmV4cG9ydCBjb25zdCBmaWx0ZXJUeXBlRGVmaW5pdGlvbiA9IChcbiAgdHlwZURlZmluaXRpb24sXG4gIHR5cGVCdWlsZGVyQXBpLFxuICB0eXBlS2luZFxuKSA9PiB7XG4gIGNvbnN0IGZpbHRlcnMgPSB0eXBlRGVmaW5pdGlvbkZpbHRlcnMuZmlsdGVyKChmaWx0ZXIpID0+XG4gICAgW3R5cGVCdWlsZGVyQXBpLnR5cGUubmFtZSwgYF9fYWxsYF0uaW5jbHVkZXMoZmlsdGVyLnR5cGVOYW1lKVxuICApXG5cbiAgaWYgKGZpbHRlcnM/Lmxlbmd0aCkge1xuICAgIGZpbHRlcnMuZm9yRWFjaCgoZmlsdGVyKSA9PiB7XG4gICAgICBpZiAoZmlsdGVyICYmIHR5cGVvZiBmaWx0ZXIudHlwZURlZiA9PT0gYGZ1bmN0aW9uYCkge1xuICAgICAgICB0eXBlRGVmaW5pdGlvbiA9IGZpbHRlci50eXBlRGVmKFxuICAgICAgICAgIHR5cGVEZWZpbml0aW9uLFxuICAgICAgICAgIHR5cGVCdWlsZGVyQXBpLFxuICAgICAgICAgIHR5cGVLaW5kXG4gICAgICAgIClcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgcmV0dXJuIHR5cGVEZWZpbml0aW9uXG59XG4iXX0=