"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../../store"));

var _helpers = require("../../create-schema-customization/helpers");

var _isExcluded = require("../is-excluded");

var _transformFields = require("../../create-schema-customization/transform-fields");

const transformInlineFragments = ({
  possibleTypes,
  gatsbyNodesInfo,
  typeMap,
  depth,
  maxDepth,
  parentType,
  parentField,
  fragments,
  circularQueryLimit,
  buildingFragment = false,
  ancestorTypeNames: parentAncestorTypeNames
}) => {
  const ancestorTypeNames = [...parentAncestorTypeNames];
  return possibleTypes && depth <= maxDepth ? possibleTypes.map(possibleType => {
    possibleType = Object.assign({}, possibleType);
    const type = typeMap.get(possibleType.name);

    if (!type) {
      return false;
    }

    const typeSettings = (0, _helpers.getTypeSettingsByType)(type);

    if (typeSettings.exclude) {
      return false;
    }

    possibleType.type = Object.assign({}, type); // save this type so we can use it in schema customization

    _store.default.dispatch.remoteSchema.addFetchedType(type);

    const isAGatsbyNode = gatsbyNodesInfo.typeNames.includes(possibleType.name);

    if (isAGatsbyNode) {
      // we use the id to link to the top level Gatsby node
      possibleType.fields = [`id`];
      return possibleType;
    }

    const typeInfo = typeMap.get(possibleType.name);
    let filteredFields = [...typeInfo.fields];

    if ((parentType === null || parentType === void 0 ? void 0 : parentType.kind) === `INTERFACE`) {
      // remove any fields from our fragment if the parent type already has them as shared fields
      filteredFields = filteredFields.filter(filteredField => !parentType.fields.find(parentField => parentField.name === filteredField.name));
    }

    if (typeInfo) {
      const fields = recursivelyTransformFields({
        fields: filteredFields,
        parentType: type,
        depth,
        ancestorTypeNames,
        fragments,
        buildingFragment,
        circularQueryLimit
      });

      if (!fields || !fields.length) {
        return false;
      }

      possibleType.fields = [...fields];
      return possibleType;
    }

    return false;
  }).filter(Boolean) : null;
}; // since we're counting circular types that may be on fields many levels up, incarnation felt like it works here ;) the types are born again in later generations


const countIncarnations = ({
  typeName,
  ancestorTypeNames
}) => {
  var _ancestorTypeNames$fi;

  return ancestorTypeNames.length ? (_ancestorTypeNames$fi = ancestorTypeNames.filter(ancestorTypeName => ancestorTypeName === typeName)) === null || _ancestorTypeNames$fi === void 0 ? void 0 : _ancestorTypeNames$fi.length : 0;
};

function transformField({
  field,
  gatsbyNodesInfo,
  typeMap,
  maxDepth,
  depth,
  fieldBlacklist,
  fieldAliases,
  ancestorTypeNames: parentAncestorTypeNames,
  circularQueryLimit,
  fragments,
  buildingFragment
} = {}) {
  var _fieldType$fields;

  const ancestorTypeNames = [...parentAncestorTypeNames]; // we're potentially infinitely recursing when fields are connected to other types that have fields that are connections to other types
  //  so we need a maximum limit for that

  if (depth > maxDepth) {
    return false;
  }

  depth++; // if the field has no type we can't use it.

  if (!field || !field.type) {
    return false;
  }

  const typeSettings = (0, _helpers.getTypeSettingsByType)(field.type);

  if (typeSettings.exclude || typeSettings.nodeInterface) {
    return false;
  } // count the number of times this type has appeared as an ancestor of itself
  // somewhere up the tree


  const typeName = (0, _helpers.findTypeName)(field.type);
  const typeIncarnationCount = countIncarnations({
    typeName,
    ancestorTypeNames
  });

  if (typeIncarnationCount > 0) {
    // this type is nested within itself atleast once
    // create a fragment here that can be reused
    createFragment({
      fields: typeMap.get(typeName).fields,
      type: field.type,
      fragments,
      field,
      ancestorTypeNames: parentAncestorTypeNames,
      depth,
      fieldBlacklist,
      fieldAliases,
      typeMap,
      gatsbyNodesInfo,
      circularQueryLimit,
      queryDepth: maxDepth,
      buildingFragment
    });
  }

  if (typeIncarnationCount >= circularQueryLimit) {
    return false;
  } // this is used to alias fields that conflict with Gatsby node fields
  // for ex Gatsby and WPGQL both have a `parent` field


  const fieldName = (0, _transformFields.returnAliasedFieldName)({
    fieldAliases,
    field
  });

  if (fieldBlacklist.includes(field.name) || fieldBlacklist.includes(fieldName)) {
    return false;
  } // remove fields that have required args. They'll cause query errors if ommitted
  //  and we can't determine how to use those args programatically.


  if (field.args && field.args.length && field.args.find(arg => {
    var _arg$type;

    return (arg === null || arg === void 0 ? void 0 : (_arg$type = arg.type) === null || _arg$type === void 0 ? void 0 : _arg$type.kind) === `NON_NULL`;
  })) {
    return false;
  }

  const fieldType = typeMap.get((0, _helpers.findTypeName)(field.type)) || {};
  const ofType = typeMap.get((0, _helpers.findTypeName)(fieldType.ofType)) || {};

  if (fieldType.kind === `SCALAR` || fieldType.kind === `NON_NULL` && ofType.kind === `SCALAR` || fieldType.kind === `LIST` && fieldType.ofType.kind === `SCALAR`) {
    return {
      fieldName,
      fieldType
    };
  }

  const isListOfGatsbyNodes = ofType && gatsbyNodesInfo.typeNames.includes(typeName);
  const isListOfMediaItems = ofType && typeName === `MediaItem`;
  const hasIdField = fieldType === null || fieldType === void 0 ? void 0 : (_fieldType$fields = fieldType.fields) === null || _fieldType$fields === void 0 ? void 0 : _fieldType$fields.find(({
    name
  }) => name === `id`);

  if (fieldType.kind === `LIST` && isListOfGatsbyNodes && !isListOfMediaItems && hasIdField) {
    return {
      fieldName: fieldName,
      fields: [`id`],
      fieldType
    };
  } else if (fieldType.kind === `LIST` && isListOfMediaItems && hasIdField) {
    return {
      fieldName: fieldName,
      fields: [`id`, `sourceUrl`],
      fieldType
    };
  } else if (fieldType.kind === `LIST`) {
    const listOfType = typeMap.get((0, _helpers.findTypeName)(fieldType));
    const transformedFields = recursivelyTransformFields({
      fields: listOfType.fields,
      parentType: listOfType || fieldType,
      depth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
    const transformedInlineFragments = transformInlineFragments({
      possibleTypes: listOfType.possibleTypes,
      parentType: listOfType || fieldType,
      parentField: field,
      gatsbyNodesInfo,
      typeMap,
      depth,
      maxDepth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });

    if (!(transformedFields === null || transformedFields === void 0 ? void 0 : transformedFields.length) && !(transformedInlineFragments === null || transformedInlineFragments === void 0 ? void 0 : transformedInlineFragments.length)) {
      return false;
    } // if we have either inlineFragments or fields


    return {
      fieldName: fieldName,
      fields: transformedFields,
      inlineFragments: transformedInlineFragments,
      fieldType
    };
  }

  const isAGatsbyNode = gatsbyNodesInfo.typeNames.includes(typeName);
  const isAMediaItemNode = isAGatsbyNode && typeName === `MediaItem`; // pull the id and sourceUrl for connections to media item gatsby nodes

  if (isAMediaItemNode && hasIdField) {
    return {
      fieldName: fieldName,
      fields: [`id`, `sourceUrl`],
      fieldType
    };
  } else if (isAGatsbyNode && hasIdField) {
    // just pull the id for connections to other gatsby nodes
    return {
      fieldName: fieldName,
      fields: [`id`],
      fieldType
    };
  }

  const typeInfo = typeMap.get((0, _helpers.findTypeName)(fieldType));
  const {
    fields
  } = typeInfo || {};
  let transformedInlineFragments;

  if (typeInfo.possibleTypes) {
    transformedInlineFragments = transformInlineFragments({
      possibleTypes: typeInfo.possibleTypes,
      parentType: typeInfo,
      parentField: field,
      gatsbyNodesInfo,
      typeMap,
      depth,
      maxDepth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
  }

  if (fields || transformedInlineFragments) {
    var _transformedInlineFra;

    const transformedFields = recursivelyTransformFields({
      parentType: typeInfo,
      parentFieldName: field.name,
      fields,
      depth,
      ancestorTypeNames,
      parentField: field,
      fragments,
      circularQueryLimit,
      buildingFragment
    });

    if (!(transformedFields === null || transformedFields === void 0 ? void 0 : transformedFields.length) && !((_transformedInlineFra = transformedInlineFragments) === null || _transformedInlineFra === void 0 ? void 0 : _transformedInlineFra.length)) {
      return false;
    }

    return {
      fieldName: fieldName,
      fields: transformedFields,
      inlineFragments: transformedInlineFragments,
      fieldType
    };
  }

  if (fieldType.kind === `UNION`) {
    const typeInfo = typeMap.get(fieldType.name);
    const transformedFields = recursivelyTransformFields({
      fields: typeInfo.fields,
      parentType: fieldType,
      depth,
      ancestorTypeNames,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
    const inlineFragments = transformInlineFragments({
      possibleTypes: typeInfo.possibleTypes,
      gatsbyNodesInfo,
      typeMap,
      depth,
      maxDepth,
      ancestorTypeNames,
      parentField: field,
      fragments,
      circularQueryLimit,
      buildingFragment
    });
    return {
      fieldName: fieldName,
      fields: transformedFields,
      inlineFragments,
      fieldType
    };
  }

  return false;
}

const createFragment = ({
  fields,
  field,
  type,
  fragments,
  fieldBlacklist,
  fieldAliases,
  typeMap,
  gatsbyNodesInfo,
  queryDepth,
  ancestorTypeNames,
  buildingFragment = false
}) => {
  var _queryType$possibleTy;

  const typeName = (0, _helpers.findTypeName)(type);

  if (buildingFragment) {
    // this fragment is inside a fragment that's already being built so we should exit
    return null;
  }

  const previouslyCreatedFragment = fragments === null || fragments === void 0 ? void 0 : fragments[typeName];

  if (previouslyCreatedFragment && buildingFragment === typeName) {
    return previouslyCreatedFragment;
  }

  const fragmentFields = fields.reduce((fragmentFields, field) => {
    var _fieldType$fields2;

    const fieldTypeName = (0, _helpers.findTypeName)(field.type);
    const fieldType = typeMap.get(fieldTypeName);

    if ( // if this field is a different type than the fragment but has a field of the same type as the fragment,
    // we need to skip this field in the fragment to prevent nesting this type in itself a level down
    fieldType.name !== typeName && (fieldType === null || fieldType === void 0 ? void 0 : (_fieldType$fields2 = fieldType.fields) === null || _fieldType$fields2 === void 0 ? void 0 : _fieldType$fields2.find(innerFieldField => (0, _helpers.findTypeName)(innerFieldField.type) === typeName))) {
      return fragmentFields;
    }

    const transformedField = transformField({
      field,
      gatsbyNodesInfo,
      typeMap,
      maxDepth: queryDepth,
      depth: 0,
      fieldBlacklist,
      fieldAliases,
      ancestorTypeNames,
      circularQueryLimit: 1,
      fragments,
      buildingFragment: typeName
    });

    if ((0, _helpers.findTypeName)(field.type) !== typeName && !!transformedField) {
      fragmentFields.push(transformedField);
    }

    return fragmentFields;
  }, []);
  const queryType = typeMap.get(typeName);
  const transformedInlineFragments = (queryType === null || queryType === void 0 ? void 0 : (_queryType$possibleTy = queryType.possibleTypes) === null || _queryType$possibleTy === void 0 ? void 0 : _queryType$possibleTy.length) ? transformInlineFragments({
    possibleTypes: queryType.possibleTypes,
    parentType: queryType,
    parentField: field,
    gatsbyNodesInfo,
    typeMap,
    depth: 0,
    maxDepth: queryDepth,
    circularQueryLimit: 1,
    ancestorTypeNames,
    fragments,
    buildingFragment: typeName
  }) : null;

  if (fragments) {
    fragments[typeName] = {
      name: `${typeName}Fragment`,
      type: typeName,
      fields: fragmentFields,
      inlineFragments: transformedInlineFragments
    };
  }

  return fragmentFields;
};

const transformFields = ({
  fields,
  parentType,
  fragments,
  parentField,
  ancestorTypeNames,
  depth,
  fieldBlacklist,
  fieldAliases,
  typeMap,
  gatsbyNodesInfo,
  queryDepth,
  circularQueryLimit,
  pluginOptions,
  buildingFragment
}) => fields === null || fields === void 0 ? void 0 : fields.filter(field => !(0, _isExcluded.fieldIsExcludedOnParentType)({
  pluginOptions,
  field,
  parentType,
  parentField
})).map(field => {
  const transformedField = transformField({
    maxDepth: queryDepth,
    gatsbyNodesInfo,
    fieldBlacklist,
    fieldAliases,
    typeMap,
    field,
    depth,
    ancestorTypeNames,
    circularQueryLimit,
    fragments,
    buildingFragment
  });

  if (transformedField) {
    // save this type so we know to use it in schema customization
    _store.default.dispatch.remoteSchema.addFetchedType(field.type);
  }

  const typeName = (0, _helpers.findTypeName)(field.type);
  const fragment = fragments === null || fragments === void 0 ? void 0 : fragments[typeName]; // @todo add any adjacent fields and inline fragments directly to the stored fragment object so this logic can be changed to if (fragment) useTheFragment()
  // once that's done it can be added above and below transformField() above ☝️
  // and potentially short circuit expensive work that will be thrown away anyway

  if (fragment && transformedField && buildingFragment !== typeName) {
    var _transformedField$fie, _transformedField$inl;

    // if (fragment && buildingFragment !== typeName && transformedField) {
    // remove fields from this query that already exist in the fragment
    if (transformedField === null || transformedField === void 0 ? void 0 : (_transformedField$fie = transformedField.fields) === null || _transformedField$fie === void 0 ? void 0 : _transformedField$fie.length) {
      transformedField.fields = transformedField.fields.filter(field => !fragment.fields.find(fragmentField => fragmentField.fieldName === field.fieldName));
    } // if this field has no fields (because it has inline fragments only)
    // we need to create an empty array since we treat reusable fragments as
    // a field


    if (!transformedField.fields) {
      transformedField.fields = [];
    }

    transformedField.fields.push({
      internalType: `Fragment`,
      fragment
    });

    if (transformedField === null || transformedField === void 0 ? void 0 : (_transformedField$inl = transformedField.inlineFragments) === null || _transformedField$inl === void 0 ? void 0 : _transformedField$inl.length) {
      transformedField.inlineFragments = transformedField.inlineFragments.filter(fieldInlineFragment => // yes this is a horrible use of .find(). @todo refactor this for better perf
      !fragment.inlineFragments.find(fragmentInlineFragment => fragmentInlineFragment.name === fieldInlineFragment.name));
    }
  }

  if (field.fields && !transformedField) {
    return null;
  }

  const fieldTypeKind = (0, _helpers.findTypeKind)(field.type);
  const fieldOfTypeKind = (0, _helpers.findTypeKind)(field.type.ofType);
  const typeKindsRequiringSelectionSets = [`OBJECT`, `UNION`, `INTERFACE`];
  const fieldNeedsSelectionSet = typeKindsRequiringSelectionSets.includes(fieldTypeKind) || typeKindsRequiringSelectionSets.includes(fieldOfTypeKind);

  if ( // if our field needs a selectionset
  fieldNeedsSelectionSet && // but we have no fields
  !transformedField.fields && // and no inline fragments
  !transformedField.inlineFragments) {
    // we need to discard this field to prevent GraphQL errors
    // we're likely at the very bottom of the query depth
    // so that this fields children were omitted
    return null;
  }

  return transformedField;
}).filter(Boolean);

const recursivelyTransformFields = ({
  fields,
  parentType,
  fragments,
  parentField = {},
  ancestorTypeNames: parentAncestorTypeNames,
  depth = 0,
  buildingFragment = false
}) => {
  if (!fields || !fields.length) {
    return null;
  }

  if (!parentAncestorTypeNames) {
    parentAncestorTypeNames = [];
  }

  const ancestorTypeNames = [...parentAncestorTypeNames];

  const {
    gatsbyApi: {
      pluginOptions
    },
    remoteSchema: {
      fieldBlacklist,
      fieldAliases,
      typeMap,
      gatsbyNodesInfo
    }
  } = _store.default.getState();

  const {
    schema: {
      queryDepth,
      circularQueryLimit
    }
  } = pluginOptions;

  if (depth > queryDepth && ancestorTypeNames.length) {
    return null;
  }

  const typeName = (0, _helpers.findTypeName)(parentType);
  const grandParentTypeName = ancestorTypeNames.length ? ancestorTypeNames[ancestorTypeNames.length - 1] : null;

  if (grandParentTypeName && typeName !== grandParentTypeName) {
    // if a field has fields of the same type as the field above it
    // we shouldn't fetch them. 2 types that are circular between each other
    // are dangerous as they will generate very large queries and fetch data we don't need
    // these types should instead be proper connections so we can identify
    // that only an id needs to be fetched.
    // @todo maybe move this into transformFields() instead of here
    fields = fields.filter(field => {
      const fieldTypeName = (0, _helpers.findTypeName)(field.type);
      return fieldTypeName !== grandParentTypeName;
    });
  }

  const typeIncarnationCount = countIncarnations({
    typeName,
    ancestorTypeNames
  }); // this appears to not be needed here but @todo investigate if that's always true
  // it's also being used in transformField()
  // if (typeIncarnationCount > 0) {
  //   // this type is nested within itself atleast once
  //   // create a fragment here that can be reused
  //   createFragment({
  //     fields,
  //     type: parentType,
  //     fragments,
  //     field: parentField,
  //     ancestorTypeNames: parentAncestorTypeNames,
  //     depth,
  //     fieldBlacklist,
  //     fieldAliases,
  //     typeMap,
  //     gatsbyNodesInfo,
  //     queryDepth,
  //     circularQueryLimit,
  //     pluginOptions,
  //     buildingFragment,
  //   })
  // }

  if (typeIncarnationCount >= circularQueryLimit) {
    return null;
  }

  parentAncestorTypeNames.push(typeName);
  let recursivelyTransformedFields = transformFields({
    fields,
    parentType,
    fragments,
    parentField,
    ancestorTypeNames: parentAncestorTypeNames,
    depth,
    fieldBlacklist,
    fieldAliases,
    typeMap,
    gatsbyNodesInfo,
    queryDepth,
    circularQueryLimit,
    pluginOptions,
    buildingFragment
  });

  if (!recursivelyTransformedFields.length) {
    return null;
  }

  return recursivelyTransformedFields;
};

var _default = recursivelyTransformFields;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9pbmdlc3QtcmVtb3RlLXNjaGVtYS9idWlsZC1xdWVyaWVzLWZyb20taW50cm9zcGVjdGlvbi9yZWN1cnNpdmVseS10cmFuc2Zvcm0tZmllbGRzLmpzIl0sIm5hbWVzIjpbInRyYW5zZm9ybUlubGluZUZyYWdtZW50cyIsInBvc3NpYmxlVHlwZXMiLCJnYXRzYnlOb2Rlc0luZm8iLCJ0eXBlTWFwIiwiZGVwdGgiLCJtYXhEZXB0aCIsInBhcmVudFR5cGUiLCJwYXJlbnRGaWVsZCIsImZyYWdtZW50cyIsImNpcmN1bGFyUXVlcnlMaW1pdCIsImJ1aWxkaW5nRnJhZ21lbnQiLCJhbmNlc3RvclR5cGVOYW1lcyIsInBhcmVudEFuY2VzdG9yVHlwZU5hbWVzIiwibWFwIiwicG9zc2libGVUeXBlIiwidHlwZSIsImdldCIsIm5hbWUiLCJ0eXBlU2V0dGluZ3MiLCJleGNsdWRlIiwic3RvcmUiLCJkaXNwYXRjaCIsInJlbW90ZVNjaGVtYSIsImFkZEZldGNoZWRUeXBlIiwiaXNBR2F0c2J5Tm9kZSIsInR5cGVOYW1lcyIsImluY2x1ZGVzIiwiZmllbGRzIiwidHlwZUluZm8iLCJmaWx0ZXJlZEZpZWxkcyIsImtpbmQiLCJmaWx0ZXIiLCJmaWx0ZXJlZEZpZWxkIiwiZmluZCIsInJlY3Vyc2l2ZWx5VHJhbnNmb3JtRmllbGRzIiwibGVuZ3RoIiwiQm9vbGVhbiIsImNvdW50SW5jYXJuYXRpb25zIiwidHlwZU5hbWUiLCJhbmNlc3RvclR5cGVOYW1lIiwidHJhbnNmb3JtRmllbGQiLCJmaWVsZCIsImZpZWxkQmxhY2tsaXN0IiwiZmllbGRBbGlhc2VzIiwibm9kZUludGVyZmFjZSIsInR5cGVJbmNhcm5hdGlvbkNvdW50IiwiY3JlYXRlRnJhZ21lbnQiLCJxdWVyeURlcHRoIiwiZmllbGROYW1lIiwiYXJncyIsImFyZyIsImZpZWxkVHlwZSIsIm9mVHlwZSIsImlzTGlzdE9mR2F0c2J5Tm9kZXMiLCJpc0xpc3RPZk1lZGlhSXRlbXMiLCJoYXNJZEZpZWxkIiwibGlzdE9mVHlwZSIsInRyYW5zZm9ybWVkRmllbGRzIiwidHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHMiLCJpbmxpbmVGcmFnbWVudHMiLCJpc0FNZWRpYUl0ZW1Ob2RlIiwicGFyZW50RmllbGROYW1lIiwicHJldmlvdXNseUNyZWF0ZWRGcmFnbWVudCIsImZyYWdtZW50RmllbGRzIiwicmVkdWNlIiwiZmllbGRUeXBlTmFtZSIsImlubmVyRmllbGRGaWVsZCIsInRyYW5zZm9ybWVkRmllbGQiLCJwdXNoIiwicXVlcnlUeXBlIiwidHJhbnNmb3JtRmllbGRzIiwicGx1Z2luT3B0aW9ucyIsImZyYWdtZW50IiwiZnJhZ21lbnRGaWVsZCIsImludGVybmFsVHlwZSIsImZpZWxkSW5saW5lRnJhZ21lbnQiLCJmcmFnbWVudElubGluZUZyYWdtZW50IiwiZmllbGRUeXBlS2luZCIsImZpZWxkT2ZUeXBlS2luZCIsInR5cGVLaW5kc1JlcXVpcmluZ1NlbGVjdGlvblNldHMiLCJmaWVsZE5lZWRzU2VsZWN0aW9uU2V0IiwiZ2F0c2J5QXBpIiwiZ2V0U3RhdGUiLCJzY2hlbWEiLCJncmFuZFBhcmVudFR5cGVOYW1lIiwicmVjdXJzaXZlbHlUcmFuc2Zvcm1lZEZpZWxkcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBS0E7O0FBQ0E7O0FBRUEsTUFBTUEsd0JBQXdCLEdBQUcsQ0FBQztBQUNoQ0MsRUFBQUEsYUFEZ0M7QUFFaENDLEVBQUFBLGVBRmdDO0FBR2hDQyxFQUFBQSxPQUhnQztBQUloQ0MsRUFBQUEsS0FKZ0M7QUFLaENDLEVBQUFBLFFBTGdDO0FBTWhDQyxFQUFBQSxVQU5nQztBQU9oQ0MsRUFBQUEsV0FQZ0M7QUFRaENDLEVBQUFBLFNBUmdDO0FBU2hDQyxFQUFBQSxrQkFUZ0M7QUFVaENDLEVBQUFBLGdCQUFnQixHQUFHLEtBVmE7QUFXaENDLEVBQUFBLGlCQUFpQixFQUFFQztBQVhhLENBQUQsS0FZM0I7QUFDSixRQUFNRCxpQkFBaUIsR0FBRyxD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b20gXCJ+L3N0b3JlXCJcbmltcG9ydCB7XG4gIGdldFR5cGVTZXR0aW5nc0J5VHlwZSxcbiAgZmluZFR5cGVOYW1lLFxuICBmaW5kVHlwZUtpbmQsXG59IGZyb20gXCJ+L3N0ZXBzL2NyZWF0ZS1zY2hlbWEtY3VzdG9taXphdGlvbi9oZWxwZXJzXCJcbmltcG9ydCB7IGZpZWxkSXNFeGNsdWRlZE9uUGFyZW50VHlwZSB9IGZyb20gXCJ+L3N0ZXBzL2luZ2VzdC1yZW1vdGUtc2NoZW1hL2lzLWV4Y2x1ZGVkXCJcbmltcG9ydCB7IHJldHVybkFsaWFzZWRGaWVsZE5hbWUgfSBmcm9tIFwifi9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vdHJhbnNmb3JtLWZpZWxkc1wiXG5cbmNvbnN0IHRyYW5zZm9ybUlubGluZUZyYWdtZW50cyA9ICh7XG4gIHBvc3NpYmxlVHlwZXMsXG4gIGdhdHNieU5vZGVzSW5mbyxcbiAgdHlwZU1hcCxcbiAgZGVwdGgsXG4gIG1heERlcHRoLFxuICBwYXJlbnRUeXBlLFxuICBwYXJlbnRGaWVsZCxcbiAgZnJhZ21lbnRzLFxuICBjaXJjdWxhclF1ZXJ5TGltaXQsXG4gIGJ1aWxkaW5nRnJhZ21lbnQgPSBmYWxzZSxcbiAgYW5jZXN0b3JUeXBlTmFtZXM6IHBhcmVudEFuY2VzdG9yVHlwZU5hbWVzLFxufSkgPT4ge1xuICBjb25zdCBhbmNlc3RvclR5cGVOYW1lcyA9IFsuLi5wYXJlbnRBbmNlc3RvclR5cGVOYW1lc11cblxuICByZXR1cm4gcG9zc2libGVUeXBlcyAmJiBkZXB0aCA8PSBtYXhEZXB0aFxuICAgID8gcG9zc2libGVUeXBlc1xuICAgICAgICAubWFwKChwb3NzaWJsZVR5cGUpID0+IHtcbiAgICAgICAgICBwb3NzaWJsZVR5cGUgPSB7IC4uLnBvc3NpYmxlVHlwZSB9XG5cbiAgICAgICAgICBjb25zdCB0eXBlID0gdHlwZU1hcC5nZXQocG9zc2libGVUeXBlLm5hbWUpXG5cbiAgICAgICAgICBpZiAoIXR5cGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHR5cGVTZXR0aW5ncyA9IGdldFR5cGVTZXR0aW5nc0J5VHlwZSh0eXBlKVxuXG4gICAgICAgICAgaWYgKHR5cGVTZXR0aW5ncy5leGNsdWRlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwb3NzaWJsZVR5cGUudHlwZSA9IHsgLi4udHlwZSB9XG5cbiAgICAgICAgICAvLyBzYXZlIHRoaXMgdHlwZSBzbyB3ZSBjYW4gdXNlIGl0IGluIHNjaGVtYSBjdXN0b21pemF0aW9uXG4gICAgICAgICAgc3RvcmUuZGlzcGF0Y2gucmVtb3RlU2NoZW1hLmFkZEZldGNoZWRUeXBlKHR5cGUpXG5cbiAgICAgICAgICBjb25zdCBpc0FHYXRzYnlOb2RlID0gZ2F0c2J5Tm9kZXNJbmZvLnR5cGVOYW1lcy5pbmNsdWRlcyhcbiAgICAgICAgICAgIHBvc3NpYmxlVHlwZS5uYW1lXG4gICAgICAgICAgKVxuXG4gICAgICAgICAgaWYgKGlzQUdhdHNieU5vZGUpIHtcbiAgICAgICAgICAgIC8vIHdlIHVzZSB0aGUgaWQgdG8gbGluayB0byB0aGUgdG9wIGxldmVsIEdhdHNieSBub2RlXG4gICAgICAgICAgICBwb3NzaWJsZVR5cGUuZmllbGRzID0gW2BpZGBdXG4gICAgICAgICAgICByZXR1cm4gcG9zc2libGVUeXBlXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgdHlwZUluZm8gPSB0eXBlTWFwLmdldChwb3NzaWJsZVR5cGUubmFtZSlcblxuICAgICAgICAgIGxldCBmaWx0ZXJlZEZpZWxkcyA9IFsuLi50eXBlSW5mby5maWVsZHNdXG5cbiAgICAgICAgICBpZiAocGFyZW50VHlwZT8ua2luZCA9PT0gYElOVEVSRkFDRWApIHtcbiAgICAgICAgICAgIC8vIHJlbW92ZSBhbnkgZmllbGRzIGZyb20gb3VyIGZyYWdtZW50IGlmIHRoZSBwYXJlbnQgdHlwZSBhbHJlYWR5IGhhcyB0aGVtIGFzIHNoYXJlZCBmaWVsZHNcbiAgICAgICAgICAgIGZpbHRlcmVkRmllbGRzID0gZmlsdGVyZWRGaWVsZHMuZmlsdGVyKFxuICAgICAgICAgICAgICAoZmlsdGVyZWRGaWVsZCkgPT5cbiAgICAgICAgICAgICAgICAhcGFyZW50VHlwZS5maWVsZHMuZmluZChcbiAgICAgICAgICAgICAgICAgIChwYXJlbnRGaWVsZCkgPT4gcGFyZW50RmllbGQubmFtZSA9PT0gZmlsdGVyZWRGaWVsZC5uYW1lXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlSW5mbykge1xuICAgICAgICAgICAgY29uc3QgZmllbGRzID0gcmVjdXJzaXZlbHlUcmFuc2Zvcm1GaWVsZHMoe1xuICAgICAgICAgICAgICBmaWVsZHM6IGZpbHRlcmVkRmllbGRzLFxuICAgICAgICAgICAgICBwYXJlbnRUeXBlOiB0eXBlLFxuICAgICAgICAgICAgICBkZXB0aCxcbiAgICAgICAgICAgICAgYW5jZXN0b3JUeXBlTmFtZXMsXG4gICAgICAgICAgICAgIGZyYWdtZW50cyxcbiAgICAgICAgICAgICAgYnVpbGRpbmdGcmFnbWVudCxcbiAgICAgICAgICAgICAgY2lyY3VsYXJRdWVyeUxpbWl0LFxuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgaWYgKCFmaWVsZHMgfHwgIWZpZWxkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBvc3NpYmxlVHlwZS5maWVsZHMgPSBbLi4uZmllbGRzXVxuICAgICAgICAgICAgcmV0dXJuIHBvc3NpYmxlVHlwZVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9KVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgOiBudWxsXG59XG5cbi8vIHNpbmNlIHdlJ3JlIGNvdW50aW5nIGNpcmN1bGFyIHR5cGVzIHRoYXQgbWF5IGJlIG9uIGZpZWxkcyBtYW55IGxldmVscyB1cCwgaW5jYXJuYXRpb24gZmVsdCBsaWtlIGl0IHdvcmtzIGhlcmUgOykgdGhlIHR5cGVzIGFyZSBib3JuIGFnYWluIGluIGxhdGVyIGdlbmVyYXRpb25zXG5jb25zdCBjb3VudEluY2FybmF0aW9ucyA9ICh7IHR5cGVOYW1lLCBhbmNlc3RvclR5cGVOYW1lcyB9KSA9PlxuICBhbmNlc3RvclR5cGVOYW1lcy5sZW5ndGhcbiAgICA/IGFuY2VzdG9yVHlwZU5hbWVzLmZpbHRlcihcbiAgICAgICAgKGFuY2VzdG9yVHlwZU5hbWUpID0+IGFuY2VzdG9yVHlwZU5hbWUgPT09IHR5cGVOYW1lXG4gICAgICApPy5sZW5ndGhcbiAgICA6IDBcblxuZnVuY3Rpb24gdHJhbnNmb3JtRmllbGQoe1xuICBmaWVsZCxcbiAgZ2F0c2J5Tm9kZXNJbmZvLFxuICB0eXBlTWFwLFxuICBtYXhEZXB0aCxcbiAgZGVwdGgsXG4gIGZpZWxkQmxhY2tsaXN0LFxuICBmaWVsZEFsaWFzZXMsXG4gIGFuY2VzdG9yVHlwZU5hbWVzOiBwYXJlbnRBbmNlc3RvclR5cGVOYW1lcyxcbiAgY2lyY3VsYXJRdWVyeUxpbWl0LFxuICBmcmFnbWVudHMsXG4gIGJ1aWxkaW5nRnJhZ21lbnQsXG59ID0ge30pIHtcbiAgY29uc3QgYW5jZXN0b3JUeXBlTmFtZXMgPSBbLi4ucGFyZW50QW5jZXN0b3JUeXBlTmFtZXNdXG4gIC8vIHdlJ3JlIHBvdGVudGlhbGx5IGluZmluaXRlbHkgcmVjdXJzaW5nIHdoZW4gZmllbGRzIGFyZSBjb25uZWN0ZWQgdG8gb3RoZXIgdHlwZXMgdGhhdCBoYXZlIGZpZWxkcyB0aGF0IGFyZSBjb25uZWN0aW9ucyB0byBvdGhlciB0eXBlc1xuICAvLyAgc28gd2UgbmVlZCBhIG1heGltdW0gbGltaXQgZm9yIHRoYXRcbiAgaWYgKGRlcHRoID4gbWF4RGVwdGgpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIGRlcHRoKytcblxuICAvLyBpZiB0aGUgZmllbGQgaGFzIG5vIHR5cGUgd2UgY2FuJ3QgdXNlIGl0LlxuICBpZiAoIWZpZWxkIHx8ICFmaWVsZC50eXBlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICBjb25zdCB0eXBlU2V0dGluZ3MgPSBnZXRUeXBlU2V0dGluZ3NCeVR5cGUoZmllbGQudHlwZSlcblxuICBpZiAodHlwZVNldHRpbmdzLmV4Y2x1ZGUgfHwgdHlwZVNldHRpbmdzLm5vZGVJbnRlcmZhY2UpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIC8vIGNvdW50IHRoZSBudW1iZXIgb2YgdGltZXMgdGhpcyB0eXBlIGhhcyBhcHBlYXJlZCBhcyBhbiBhbmNlc3RvciBvZiBpdHNlbGZcbiAgLy8gc29tZXdoZXJlIHVwIHRoZSB0cmVlXG4gIGNvbnN0IHR5cGVOYW1lID0gZmluZFR5cGVOYW1lKGZpZWxkLnR5cGUpXG5cbiAgY29uc3QgdHlwZUluY2FybmF0aW9uQ291bnQgPSBjb3VudEluY2FybmF0aW9ucyh7XG4gICAgdHlwZU5hbWUsXG4gICAgYW5jZXN0b3JUeXBlTmFtZXMsXG4gIH0pXG5cbiAgaWYgKHR5cGVJbmNhcm5hdGlvbkNvdW50ID4gMCkge1xuICAgIC8vIHRoaXMgdHlwZSBpcyBuZXN0ZWQgd2l0aGluIGl0c2VsZiBhdGxlYXN0IG9uY2VcbiAgICAvLyBjcmVhdGUgYSBmcmFnbWVudCBoZXJlIHRoYXQgY2FuIGJlIHJldXNlZFxuICAgIGNyZWF0ZUZyYWdtZW50KHtcbiAgICAgIGZpZWxkczogdHlwZU1hcC5nZXQodHlwZU5hbWUpLmZpZWxkcyxcbiAgICAgIHR5cGU6IGZpZWxkLnR5cGUsXG4gICAgICBmcmFnbWVudHMsXG4gICAgICBmaWVsZCxcbiAgICAgIGFuY2VzdG9yVHlwZU5hbWVzOiBwYXJlbnRBbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgIGRlcHRoLFxuICAgICAgZmllbGRCbGFja2xpc3QsXG4gICAgICBmaWVsZEFsaWFzZXMsXG4gICAgICB0eXBlTWFwLFxuICAgICAgZ2F0c2J5Tm9kZXNJbmZvLFxuICAgICAgY2lyY3VsYXJRdWVyeUxpbWl0LFxuICAgICAgcXVlcnlEZXB0aDogbWF4RGVwdGgsXG4gICAgICBidWlsZGluZ0ZyYWdtZW50LFxuICAgIH0pXG4gIH1cblxuICBpZiAodHlwZUluY2FybmF0aW9uQ291bnQgPj0gY2lyY3VsYXJRdWVyeUxpbWl0KSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICAvLyB0aGlzIGlzIHVzZWQgdG8gYWxpYXMgZmllbGRzIHRoYXQgY29uZmxpY3Qgd2l0aCBHYXRzYnkgbm9kZSBmaWVsZHNcbiAgLy8gZm9yIGV4IEdhdHNieSBhbmQgV1BHUUwgYm90aCBoYXZlIGEgYHBhcmVudGAgZmllbGRcbiAgY29uc3QgZmllbGROYW1lID0gcmV0dXJuQWxpYXNlZEZpZWxkTmFtZSh7IGZpZWxkQWxpYXNlcywgZmllbGQgfSlcblxuICBpZiAoXG4gICAgZmllbGRCbGFja2xpc3QuaW5jbHVkZXMoZmllbGQubmFtZSkgfHxcbiAgICBmaWVsZEJsYWNrbGlzdC5pbmNsdWRlcyhmaWVsZE5hbWUpXG4gICkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLy8gcmVtb3ZlIGZpZWxkcyB0aGF0IGhhdmUgcmVxdWlyZWQgYXJncy4gVGhleSdsbCBjYXVzZSBxdWVyeSBlcnJvcnMgaWYgb21taXR0ZWRcbiAgLy8gIGFuZCB3ZSBjYW4ndCBkZXRlcm1pbmUgaG93IHRvIHVzZSB0aG9zZSBhcmdzIHByb2dyYW1hdGljYWxseS5cbiAgaWYgKFxuICAgIGZpZWxkLmFyZ3MgJiZcbiAgICBmaWVsZC5hcmdzLmxlbmd0aCAmJlxuICAgIGZpZWxkLmFyZ3MuZmluZCgoYXJnKSA9PiBhcmc/LnR5cGU/LmtpbmQgPT09IGBOT05fTlVMTGApXG4gICkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgY29uc3QgZmllbGRUeXBlID0gdHlwZU1hcC5nZXQoZmluZFR5cGVOYW1lKGZpZWxkLnR5cGUpKSB8fCB7fVxuICBjb25zdCBvZlR5cGUgPSB0eXBlTWFwLmdldChmaW5kVHlwZU5hbWUoZmllbGRUeXBlLm9mVHlwZSkpIHx8IHt9XG5cbiAgaWYgKFxuICAgIGZpZWxkVHlwZS5raW5kID09PSBgU0NBTEFSYCB8fFxuICAgIChmaWVsZFR5cGUua2luZCA9PT0gYE5PTl9OVUxMYCAmJiBvZlR5cGUua2luZCA9PT0gYFNDQUxBUmApIHx8XG4gICAgKGZpZWxkVHlwZS5raW5kID09PSBgTElTVGAgJiYgZmllbGRUeXBlLm9mVHlwZS5raW5kID09PSBgU0NBTEFSYClcbiAgKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkTmFtZSxcbiAgICAgIGZpZWxkVHlwZSxcbiAgICB9XG4gIH1cblxuICBjb25zdCBpc0xpc3RPZkdhdHNieU5vZGVzID1cbiAgICBvZlR5cGUgJiYgZ2F0c2J5Tm9kZXNJbmZvLnR5cGVOYW1lcy5pbmNsdWRlcyh0eXBlTmFtZSlcblxuICBjb25zdCBpc0xpc3RPZk1lZGlhSXRlbXMgPSBvZlR5cGUgJiYgdHlwZU5hbWUgPT09IGBNZWRpYUl0ZW1gXG5cbiAgY29uc3QgaGFzSWRGaWVsZCA9IGZpZWxkVHlwZT8uZmllbGRzPy5maW5kKCh7IG5hbWUgfSkgPT4gbmFtZSA9PT0gYGlkYClcblxuICBpZiAoXG4gICAgZmllbGRUeXBlLmtpbmQgPT09IGBMSVNUYCAmJlxuICAgIGlzTGlzdE9mR2F0c2J5Tm9kZXMgJiZcbiAgICAhaXNMaXN0T2ZNZWRpYUl0ZW1zICYmXG4gICAgaGFzSWRGaWVsZFxuICApIHtcbiAgICByZXR1cm4ge1xuICAgICAgZmllbGROYW1lOiBmaWVsZE5hbWUsXG4gICAgICBmaWVsZHM6IFtgaWRgXSxcbiAgICAgIGZpZWxkVHlwZSxcbiAgICB9XG4gIH0gZWxzZSBpZiAoZmllbGRUeXBlLmtpbmQgPT09IGBMSVNUYCAmJiBpc0xpc3RPZk1lZGlhSXRlbXMgJiYgaGFzSWRGaWVsZCkge1xuICAgIHJldHVybiB7XG4gICAgICBmaWVsZE5hbWU6IGZpZWxkTmFtZSxcbiAgICAgIGZpZWxkczogW2BpZGAsIGBzb3VyY2VVcmxgXSxcbiAgICAgIGZpZWxkVHlwZSxcbiAgICB9XG4gIH0gZWxzZSBpZiAoZmllbGRUeXBlLmtpbmQgPT09IGBMSVNUYCkge1xuICAgIGNvbnN0IGxpc3RPZlR5cGUgPSB0eXBlTWFwLmdldChmaW5kVHlwZU5hbWUoZmllbGRUeXBlKSlcblxuICAgIGNvbnN0IHRyYW5zZm9ybWVkRmllbGRzID0gcmVjdXJzaXZlbHlUcmFuc2Zvcm1GaWVsZHMoe1xuICAgICAgZmllbGRzOiBsaXN0T2ZUeXBlLmZpZWxkcyxcbiAgICAgIHBhcmVudFR5cGU6IGxpc3RPZlR5cGUgfHwgZmllbGRUeXBlLFxuICAgICAgZGVwdGgsXG4gICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgIGZyYWdtZW50cyxcbiAgICAgIGNpcmN1bGFyUXVlcnlMaW1pdCxcbiAgICAgIGJ1aWxkaW5nRnJhZ21lbnQsXG4gICAgfSlcblxuICAgIGNvbnN0IHRyYW5zZm9ybWVkSW5saW5lRnJhZ21lbnRzID0gdHJhbnNmb3JtSW5saW5lRnJhZ21lbnRzKHtcbiAgICAgIHBvc3NpYmxlVHlwZXM6IGxpc3RPZlR5cGUucG9zc2libGVUeXBlcyxcbiAgICAgIHBhcmVudFR5cGU6IGxpc3RPZlR5cGUgfHwgZmllbGRUeXBlLFxuICAgICAgcGFyZW50RmllbGQ6IGZpZWxkLFxuICAgICAgZ2F0c2J5Tm9kZXNJbmZvLFxuICAgICAgdHlwZU1hcCxcbiAgICAgIGRlcHRoLFxuICAgICAgbWF4RGVwdGgsXG4gICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgIGZyYWdtZW50cyxcbiAgICAgIGNpcmN1bGFyUXVlcnlMaW1pdCxcbiAgICAgIGJ1aWxkaW5nRnJhZ21lbnQsXG4gICAgfSlcblxuICAgIGlmICghdHJhbnNmb3JtZWRGaWVsZHM/Lmxlbmd0aCAmJiAhdHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHM/Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgLy8gaWYgd2UgaGF2ZSBlaXRoZXIgaW5saW5lRnJhZ21lbnRzIG9yIGZpZWxkc1xuICAgIHJldHVybiB7XG4gICAgICBmaWVsZE5hbWU6IGZpZWxkTmFtZSxcbiAgICAgIGZpZWxkczogdHJhbnNmb3JtZWRGaWVsZHMsXG4gICAgICBpbmxpbmVGcmFnbWVudHM6IHRyYW5zZm9ybWVkSW5saW5lRnJhZ21lbnRzLFxuICAgICAgZmllbGRUeXBlLFxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGlzQUdhdHNieU5vZGUgPSBnYXRzYnlOb2Rlc0luZm8udHlwZU5hbWVzLmluY2x1ZGVzKHR5cGVOYW1lKVxuICBjb25zdCBpc0FNZWRpYUl0ZW1Ob2RlID0gaXNBR2F0c2J5Tm9kZSAmJiB0eXBlTmFtZSA9PT0gYE1lZGlhSXRlbWBcblxuICAvLyBwdWxsIHRoZSBpZCBhbmQgc291cmNlVXJsIGZvciBjb25uZWN0aW9ucyB0byBtZWRpYSBpdGVtIGdhdHNieSBub2Rlc1xuICBpZiAoaXNBTWVkaWFJdGVtTm9kZSAmJiBoYXNJZEZpZWxkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkTmFtZTogZmllbGROYW1lLFxuICAgICAgZmllbGRzOiBbYGlkYCwgYHNvdXJjZVVybGBdLFxuICAgICAgZmllbGRUeXBlLFxuICAgIH1cbiAgfSBlbHNlIGlmIChpc0FHYXRzYnlOb2RlICYmIGhhc0lkRmllbGQpIHtcbiAgICAvLyBqdXN0IHB1bGwgdGhlIGlkIGZvciBjb25uZWN0aW9ucyB0byBvdGhlciBnYXRzYnkgbm9kZXNcbiAgICByZXR1cm4ge1xuICAgICAgZmllbGROYW1lOiBmaWVsZE5hbWUsXG4gICAgICBmaWVsZHM6IFtgaWRgXSxcbiAgICAgIGZpZWxkVHlwZSxcbiAgICB9XG4gIH1cblxuICBjb25zdCB0eXBlSW5mbyA9IHR5cGVNYXAuZ2V0KGZpbmRUeXBlTmFtZShmaWVsZFR5cGUpKVxuXG4gIGNvbnN0IHsgZmllbGRzIH0gPSB0eXBlSW5mbyB8fCB7fVxuXG4gIGxldCB0cmFuc2Zvcm1lZElubGluZUZyYWdtZW50c1xuXG4gIGlmICh0eXBlSW5mby5wb3NzaWJsZVR5cGVzKSB7XG4gICAgdHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHMgPSB0cmFuc2Zvcm1JbmxpbmVGcmFnbWVudHMoe1xuICAgICAgcG9zc2libGVUeXBlczogdHlwZUluZm8ucG9zc2libGVUeXBlcyxcbiAgICAgIHBhcmVudFR5cGU6IHR5cGVJbmZvLFxuICAgICAgcGFyZW50RmllbGQ6IGZpZWxkLFxuICAgICAgZ2F0c2J5Tm9kZXNJbmZvLFxuICAgICAgdHlwZU1hcCxcbiAgICAgIGRlcHRoLFxuICAgICAgbWF4RGVwdGgsXG4gICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgIGZyYWdtZW50cyxcbiAgICAgIGNpcmN1bGFyUXVlcnlMaW1pdCxcbiAgICAgIGJ1aWxkaW5nRnJhZ21lbnQsXG4gICAgfSlcbiAgfVxuXG4gIGlmIChmaWVsZHMgfHwgdHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHMpIHtcbiAgICBjb25zdCB0cmFuc2Zvcm1lZEZpZWxkcyA9IHJlY3Vyc2l2ZWx5VHJhbnNmb3JtRmllbGRzKHtcbiAgICAgIHBhcmVudFR5cGU6IHR5cGVJbmZvLFxuICAgICAgcGFyZW50RmllbGROYW1lOiBmaWVsZC5uYW1lLFxuICAgICAgZmllbGRzLFxuICAgICAgZGVwdGgsXG4gICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgIHBhcmVudEZpZWxkOiBmaWVsZCxcbiAgICAgIGZyYWdtZW50cyxcbiAgICAgIGNpcmN1bGFyUXVlcnlMaW1pdCxcbiAgICAgIGJ1aWxkaW5nRnJhZ21lbnQsXG4gICAgfSlcblxuICAgIGlmICghdHJhbnNmb3JtZWRGaWVsZHM/Lmxlbmd0aCAmJiAhdHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHM/Lmxlbmd0aCkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkTmFtZTogZmllbGROYW1lLFxuICAgICAgZmllbGRzOiB0cmFuc2Zvcm1lZEZpZWxkcyxcbiAgICAgIGlubGluZUZyYWdtZW50czogdHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHMsXG4gICAgICBmaWVsZFR5cGUsXG4gICAgfVxuICB9XG5cbiAgaWYgKGZpZWxkVHlwZS5raW5kID09PSBgVU5JT05gKSB7XG4gICAgY29uc3QgdHlwZUluZm8gPSB0eXBlTWFwLmdldChmaWVsZFR5cGUubmFtZSlcblxuICAgIGNvbnN0IHRyYW5zZm9ybWVkRmllbGRzID0gcmVjdXJzaXZlbHlUcmFuc2Zvcm1GaWVsZHMoe1xuICAgICAgZmllbGRzOiB0eXBlSW5mby5maWVsZHMsXG4gICAgICBwYXJlbnRUeXBlOiBmaWVsZFR5cGUsXG4gICAgICBkZXB0aCxcbiAgICAgIGFuY2VzdG9yVHlwZU5hbWVzLFxuICAgICAgZnJhZ21lbnRzLFxuICAgICAgY2lyY3VsYXJRdWVyeUxpbWl0LFxuICAgICAgYnVpbGRpbmdGcmFnbWVudCxcbiAgICB9KVxuXG4gICAgY29uc3QgaW5saW5lRnJhZ21lbnRzID0gdHJhbnNmb3JtSW5saW5lRnJhZ21lbnRzKHtcbiAgICAgIHBvc3NpYmxlVHlwZXM6IHR5cGVJbmZvLnBvc3NpYmxlVHlwZXMsXG4gICAgICBnYXRzYnlOb2Rlc0luZm8sXG4gICAgICB0eXBlTWFwLFxuICAgICAgZGVwdGgsXG4gICAgICBtYXhEZXB0aCxcbiAgICAgIGFuY2VzdG9yVHlwZU5hbWVzLFxuICAgICAgcGFyZW50RmllbGQ6IGZpZWxkLFxuICAgICAgZnJhZ21lbnRzLFxuICAgICAgY2lyY3VsYXJRdWVyeUxpbWl0LFxuICAgICAgYnVpbGRpbmdGcmFnbWVudCxcbiAgICB9KVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZpZWxkTmFtZTogZmllbGROYW1lLFxuICAgICAgZmllbGRzOiB0cmFuc2Zvcm1lZEZpZWxkcyxcbiAgICAgIGlubGluZUZyYWdtZW50cyxcbiAgICAgIGZpZWxkVHlwZSxcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2Vcbn1cblxuY29uc3QgY3JlYXRlRnJhZ21lbnQgPSAoe1xuICBmaWVsZHMsXG4gIGZpZWxkLFxuICB0eXBlLFxuICBmcmFnbWVudHMsXG4gIGZpZWxkQmxhY2tsaXN0LFxuICBmaWVsZEFsaWFzZXMsXG4gIHR5cGVNYXAsXG4gIGdhdHNieU5vZGVzSW5mbyxcbiAgcXVlcnlEZXB0aCxcbiAgYW5jZXN0b3JUeXBlTmFtZXMsXG4gIGJ1aWxkaW5nRnJhZ21lbnQgPSBmYWxzZSxcbn0pID0+IHtcbiAgY29uc3QgdHlwZU5hbWUgPSBmaW5kVHlwZU5hbWUodHlwZSlcblxuICBpZiAoYnVpbGRpbmdGcmFnbWVudCkge1xuICAgIC8vIHRoaXMgZnJhZ21lbnQgaXMgaW5zaWRlIGEgZnJhZ21lbnQgdGhhdCdzIGFscmVhZHkgYmVpbmcgYnVpbHQgc28gd2Ugc2hvdWxkIGV4aXRcbiAgICByZXR1cm4gbnVsbFxuICB9XG5cbiAgY29uc3QgcHJldmlvdXNseUNyZWF0ZWRGcmFnbWVudCA9IGZyYWdtZW50cz8uW3R5cGVOYW1lXVxuXG4gIGlmIChwcmV2aW91c2x5Q3JlYXRlZEZyYWdtZW50ICYmIGJ1aWxkaW5nRnJhZ21lbnQgPT09IHR5cGVOYW1lKSB7XG4gICAgcmV0dXJuIHByZXZpb3VzbHlDcmVhdGVkRnJhZ21lbnRcbiAgfVxuXG4gIGNvbnN0IGZyYWdtZW50RmllbGRzID0gZmllbGRzLnJlZHVjZSgoZnJhZ21lbnRGaWVsZHMsIGZpZWxkKSA9PiB7XG4gICAgY29uc3QgZmllbGRUeXBlTmFtZSA9IGZpbmRUeXBlTmFtZShmaWVsZC50eXBlKVxuICAgIGNvbnN0IGZpZWxkVHlwZSA9IHR5cGVNYXAuZ2V0KGZpZWxkVHlwZU5hbWUpXG5cbiAgICBpZiAoXG4gICAgICAvLyBpZiB0aGlzIGZpZWxkIGlzIGEgZGlmZmVyZW50IHR5cGUgdGhhbiB0aGUgZnJhZ21lbnQgYnV0IGhhcyBhIGZpZWxkIG9mIHRoZSBzYW1lIHR5cGUgYXMgdGhlIGZyYWdtZW50LFxuICAgICAgLy8gd2UgbmVlZCB0byBza2lwIHRoaXMgZmllbGQgaW4gdGhlIGZyYWdtZW50IHRvIHByZXZlbnQgbmVzdGluZyB0aGlzIHR5cGUgaW4gaXRzZWxmIGEgbGV2ZWwgZG93blxuICAgICAgZmllbGRUeXBlLm5hbWUgIT09IHR5cGVOYW1lICYmXG4gICAgICBmaWVsZFR5cGU/LmZpZWxkcz8uZmluZChcbiAgICAgICAgKGlubmVyRmllbGRGaWVsZCkgPT4gZmluZFR5cGVOYW1lKGlubmVyRmllbGRGaWVsZC50eXBlKSA9PT0gdHlwZU5hbWVcbiAgICAgIClcbiAgICApIHtcbiAgICAgIHJldHVybiBmcmFnbWVudEZpZWxkc1xuICAgIH1cblxuICAgIGNvbnN0IHRyYW5zZm9ybWVkRmllbGQgPSB0cmFuc2Zvcm1GaWVsZCh7XG4gICAgICBmaWVsZCxcbiAgICAgIGdhdHNieU5vZGVzSW5mbyxcbiAgICAgIHR5cGVNYXAsXG4gICAgICBtYXhEZXB0aDogcXVlcnlEZXB0aCxcbiAgICAgIGRlcHRoOiAwLFxuICAgICAgZmllbGRCbGFja2xpc3QsXG4gICAgICBmaWVsZEFsaWFzZXMsXG4gICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgIGNpcmN1bGFyUXVlcnlMaW1pdDogMSxcbiAgICAgIGZyYWdtZW50cyxcbiAgICAgIGJ1aWxkaW5nRnJhZ21lbnQ6IHR5cGVOYW1lLFxuICAgIH0pXG5cbiAgICBpZiAoZmluZFR5cGVOYW1lKGZpZWxkLnR5cGUpICE9PSB0eXBlTmFtZSAmJiAhIXRyYW5zZm9ybWVkRmllbGQpIHtcbiAgICAgIGZyYWdtZW50RmllbGRzLnB1c2godHJhbnNmb3JtZWRGaWVsZClcbiAgICB9XG5cbiAgICByZXR1cm4gZnJhZ21lbnRGaWVsZHNcbiAgfSwgW10pXG5cbiAgY29uc3QgcXVlcnlUeXBlID0gdHlwZU1hcC5nZXQodHlwZU5hbWUpXG5cbiAgY29uc3QgdHJhbnNmb3JtZWRJbmxpbmVGcmFnbWVudHMgPSBxdWVyeVR5cGU/LnBvc3NpYmxlVHlwZXM/Lmxlbmd0aFxuICAgID8gdHJhbnNmb3JtSW5saW5lRnJhZ21lbnRzKHtcbiAgICAgICAgcG9zc2libGVUeXBlczogcXVlcnlUeXBlLnBvc3NpYmxlVHlwZXMsXG4gICAgICAgIHBhcmVudFR5cGU6IHF1ZXJ5VHlwZSxcbiAgICAgICAgcGFyZW50RmllbGQ6IGZpZWxkLFxuICAgICAgICBnYXRzYnlOb2Rlc0luZm8sXG4gICAgICAgIHR5cGVNYXAsXG4gICAgICAgIGRlcHRoOiAwLFxuICAgICAgICBtYXhEZXB0aDogcXVlcnlEZXB0aCxcbiAgICAgICAgY2lyY3VsYXJRdWVyeUxpbWl0OiAxLFxuICAgICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgICAgZnJhZ21lbnRzLFxuICAgICAgICBidWlsZGluZ0ZyYWdtZW50OiB0eXBlTmFtZSxcbiAgICAgIH0pXG4gICAgOiBudWxsXG5cbiAgaWYgKGZyYWdtZW50cykge1xuICAgIGZyYWdtZW50c1t0eXBlTmFtZV0gPSB7XG4gICAgICBuYW1lOiBgJHt0eXBlTmFtZX1GcmFnbWVudGAsXG4gICAgICB0eXBlOiB0eXBlTmFtZSxcbiAgICAgIGZpZWxkczogZnJhZ21lbnRGaWVsZHMsXG4gICAgICBpbmxpbmVGcmFnbWVudHM6IHRyYW5zZm9ybWVkSW5saW5lRnJhZ21lbnRzLFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmcmFnbWVudEZpZWxkc1xufVxuXG5jb25zdCB0cmFuc2Zvcm1GaWVsZHMgPSAoe1xuICBmaWVsZHMsXG4gIHBhcmVudFR5cGUsXG4gIGZyYWdtZW50cyxcbiAgcGFyZW50RmllbGQsXG4gIGFuY2VzdG9yVHlwZU5hbWVzLFxuICBkZXB0aCxcbiAgZmllbGRCbGFja2xpc3QsXG4gIGZpZWxkQWxpYXNlcyxcbiAgdHlwZU1hcCxcbiAgZ2F0c2J5Tm9kZXNJbmZvLFxuICBxdWVyeURlcHRoLFxuICBjaXJjdWxhclF1ZXJ5TGltaXQsXG4gIHBsdWdpbk9wdGlvbnMsXG4gIGJ1aWxkaW5nRnJhZ21lbnQsXG59KSA9PlxuICBmaWVsZHNcbiAgICA/LmZpbHRlcihcbiAgICAgIChmaWVsZCkgPT5cbiAgICAgICAgIWZpZWxkSXNFeGNsdWRlZE9uUGFyZW50VHlwZSh7XG4gICAgICAgICAgcGx1Z2luT3B0aW9ucyxcbiAgICAgICAgICBmaWVsZCxcbiAgICAgICAgICBwYXJlbnRUeXBlLFxuICAgICAgICAgIHBhcmVudEZpZWxkLFxuICAgICAgICB9KVxuICAgIClcbiAgICAubWFwKChmaWVsZCkgPT4ge1xuICAgICAgY29uc3QgdHJhbnNmb3JtZWRGaWVsZCA9IHRyYW5zZm9ybUZpZWxkKHtcbiAgICAgICAgbWF4RGVwdGg6IHF1ZXJ5RGVwdGgsXG4gICAgICAgIGdhdHNieU5vZGVzSW5mbyxcbiAgICAgICAgZmllbGRCbGFja2xpc3QsXG4gICAgICAgIGZpZWxkQWxpYXNlcyxcbiAgICAgICAgdHlwZU1hcCxcbiAgICAgICAgZmllbGQsXG4gICAgICAgIGRlcHRoLFxuICAgICAgICBhbmNlc3RvclR5cGVOYW1lcyxcbiAgICAgICAgY2lyY3VsYXJRdWVyeUxpbWl0LFxuICAgICAgICBmcmFnbWVudHMsXG4gICAgICAgIGJ1aWxkaW5nRnJhZ21lbnQsXG4gICAgICB9KVxuXG4gICAgICBpZiAodHJhbnNmb3JtZWRGaWVsZCkge1xuICAgICAgICAvLyBzYXZlIHRoaXMgdHlwZSBzbyB3ZSBrbm93IHRvIHVzZSBpdCBpbiBzY2hlbWEgY3VzdG9taXphdGlvblxuICAgICAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuYWRkRmV0Y2hlZFR5cGUoZmllbGQudHlwZSlcbiAgICAgIH1cblxuICAgICAgY29uc3QgdHlwZU5hbWUgPSBmaW5kVHlwZU5hbWUoZmllbGQudHlwZSlcbiAgICAgIGNvbnN0IGZyYWdtZW50ID0gZnJhZ21lbnRzPy5bdHlwZU5hbWVdXG5cbiAgICAgIC8vIEB0b2RvIGFkZCBhbnkgYWRqYWNlbnQgZmllbGRzIGFuZCBpbmxpbmUgZnJhZ21lbnRzIGRpcmVjdGx5IHRvIHRoZSBzdG9yZWQgZnJhZ21lbnQgb2JqZWN0IHNvIHRoaXMgbG9naWMgY2FuIGJlIGNoYW5nZWQgdG8gaWYgKGZyYWdtZW50KSB1c2VUaGVGcmFnbWVudCgpXG4gICAgICAvLyBvbmNlIHRoYXQncyBkb25lIGl0IGNhbiBiZSBhZGRlZCBhYm92ZSBhbmQgYmVsb3cgdHJhbnNmb3JtRmllbGQoKSBhYm92ZSDimJ3vuI9cbiAgICAgIC8vIGFuZCBwb3RlbnRpYWxseSBzaG9ydCBjaXJjdWl0IGV4cGVuc2l2ZSB3b3JrIHRoYXQgd2lsbCBiZSB0aHJvd24gYXdheSBhbnl3YXlcbiAgICAgIGlmIChmcmFnbWVudCAmJiB0cmFuc2Zvcm1lZEZpZWxkICYmIGJ1aWxkaW5nRnJhZ21lbnQgIT09IHR5cGVOYW1lKSB7XG4gICAgICAgIC8vIGlmIChmcmFnbWVudCAmJiBidWlsZGluZ0ZyYWdtZW50ICE9PSB0eXBlTmFtZSAmJiB0cmFuc2Zvcm1lZEZpZWxkKSB7XG4gICAgICAgIC8vIHJlbW92ZSBmaWVsZHMgZnJvbSB0aGlzIHF1ZXJ5IHRoYXQgYWxyZWFkeSBleGlzdCBpbiB0aGUgZnJhZ21lbnRcbiAgICAgICAgaWYgKHRyYW5zZm9ybWVkRmllbGQ/LmZpZWxkcz8ubGVuZ3RoKSB7XG4gICAgICAgICAgdHJhbnNmb3JtZWRGaWVsZC5maWVsZHMgPSB0cmFuc2Zvcm1lZEZpZWxkLmZpZWxkcy5maWx0ZXIoXG4gICAgICAgICAgICAoZmllbGQpID0+XG4gICAgICAgICAgICAgICFmcmFnbWVudC5maWVsZHMuZmluZChcbiAgICAgICAgICAgICAgICAoZnJhZ21lbnRGaWVsZCkgPT4gZnJhZ21lbnRGaWVsZC5maWVsZE5hbWUgPT09IGZpZWxkLmZpZWxkTmFtZVxuICAgICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgdGhpcyBmaWVsZCBoYXMgbm8gZmllbGRzIChiZWNhdXNlIGl0IGhhcyBpbmxpbmUgZnJhZ21lbnRzIG9ubHkpXG4gICAgICAgIC8vIHdlIG5lZWQgdG8gY3JlYXRlIGFuIGVtcHR5IGFycmF5IHNpbmNlIHdlIHRyZWF0IHJldXNhYmxlIGZyYWdtZW50cyBhc1xuICAgICAgICAvLyBhIGZpZWxkXG4gICAgICAgIGlmICghdHJhbnNmb3JtZWRGaWVsZC5maWVsZHMpIHtcbiAgICAgICAgICB0cmFuc2Zvcm1lZEZpZWxkLmZpZWxkcyA9IFtdXG4gICAgICAgIH1cblxuICAgICAgICB0cmFuc2Zvcm1lZEZpZWxkLmZpZWxkcy5wdXNoKHtcbiAgICAgICAgICBpbnRlcm5hbFR5cGU6IGBGcmFnbWVudGAsXG4gICAgICAgICAgZnJhZ21lbnQsXG4gICAgICAgIH0pXG5cbiAgICAgICAgaWYgKHRyYW5zZm9ybWVkRmllbGQ/LmlubGluZUZyYWdtZW50cz8ubGVuZ3RoKSB7XG4gICAgICAgICAgdHJhbnNmb3JtZWRGaWVsZC5pbmxpbmVGcmFnbWVudHMgPSB0cmFuc2Zvcm1lZEZpZWxkLmlubGluZUZyYWdtZW50cy5maWx0ZXIoXG4gICAgICAgICAgICAoZmllbGRJbmxpbmVGcmFnbWVudCkgPT5cbiAgICAgICAgICAgICAgLy8geWVzIHRoaXMgaXMgYSBob3JyaWJsZSB1c2Ugb2YgLmZpbmQoKS4gQHRvZG8gcmVmYWN0b3IgdGhpcyBmb3IgYmV0dGVyIHBlcmZcbiAgICAgICAgICAgICAgIWZyYWdtZW50LmlubGluZUZyYWdtZW50cy5maW5kKFxuICAgICAgICAgICAgICAgIChmcmFnbWVudElubGluZUZyYWdtZW50KSA9PlxuICAgICAgICAgICAgICAgICAgZnJhZ21lbnRJbmxpbmVGcmFnbWVudC5uYW1lID09PSBmaWVsZElubGluZUZyYWdtZW50Lm5hbWVcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgIClcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZmllbGQuZmllbGRzICYmICF0cmFuc2Zvcm1lZEZpZWxkKSB7XG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGZpZWxkVHlwZUtpbmQgPSBmaW5kVHlwZUtpbmQoZmllbGQudHlwZSlcbiAgICAgIGNvbnN0IGZpZWxkT2ZUeXBlS2luZCA9IGZpbmRUeXBlS2luZChmaWVsZC50eXBlLm9mVHlwZSlcbiAgICAgIGNvbnN0IHR5cGVLaW5kc1JlcXVpcmluZ1NlbGVjdGlvblNldHMgPSBbYE9CSkVDVGAsIGBVTklPTmAsIGBJTlRFUkZBQ0VgXVxuICAgICAgY29uc3QgZmllbGROZWVkc1NlbGVjdGlvblNldCA9XG4gICAgICAgIHR5cGVLaW5kc1JlcXVpcmluZ1NlbGVjdGlvblNldHMuaW5jbHVkZXMoZmllbGRUeXBlS2luZCkgfHxcbiAgICAgICAgdHlwZUtpbmRzUmVxdWlyaW5nU2VsZWN0aW9uU2V0cy5pbmNsdWRlcyhmaWVsZE9mVHlwZUtpbmQpXG5cbiAgICAgIGlmIChcbiAgICAgICAgLy8gaWYgb3VyIGZpZWxkIG5lZWRzIGEgc2VsZWN0aW9uc2V0XG4gICAgICAgIGZpZWxkTmVlZHNTZWxlY3Rpb25TZXQgJiZcbiAgICAgICAgLy8gYnV0IHdlIGhhdmUgbm8gZmllbGRzXG4gICAgICAgICF0cmFuc2Zvcm1lZEZpZWxkLmZpZWxkcyAmJlxuICAgICAgICAvLyBhbmQgbm8gaW5saW5lIGZyYWdtZW50c1xuICAgICAgICAhdHJhbnNmb3JtZWRGaWVsZC5pbmxpbmVGcmFnbWVudHNcbiAgICAgICkge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGRpc2NhcmQgdGhpcyBmaWVsZCB0byBwcmV2ZW50IEdyYXBoUUwgZXJyb3JzXG4gICAgICAgIC8vIHdlJ3JlIGxpa2VseSBhdCB0aGUgdmVyeSBib3R0b20gb2YgdGhlIHF1ZXJ5IGRlcHRoXG4gICAgICAgIC8vIHNvIHRoYXQgdGhpcyBmaWVsZHMgY2hpbGRyZW4gd2VyZSBvbWl0dGVkXG4gICAgICAgIHJldHVybiBudWxsXG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cmFuc2Zvcm1lZEZpZWxkXG4gICAgfSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pXG5cbmNvbnN0IHJlY3Vyc2l2ZWx5VHJhbnNmb3JtRmllbGRzID0gKHtcbiAgZmllbGRzLFxuICBwYXJlbnRUeXBlLFxuICBmcmFnbWVudHMsXG4gIHBhcmVudEZpZWxkID0ge30sXG4gIGFuY2VzdG9yVHlwZU5hbWVzOiBwYXJlbnRBbmNlc3RvclR5cGVOYW1lcyxcbiAgZGVwdGggPSAwLFxuICBidWlsZGluZ0ZyYWdtZW50ID0gZmFsc2UsXG59KSA9PiB7XG4gIGlmICghZmllbGRzIHx8ICFmaWVsZHMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIGlmICghcGFyZW50QW5jZXN0b3JUeXBlTmFtZXMpIHtcbiAgICBwYXJlbnRBbmNlc3RvclR5cGVOYW1lcyA9IFtdXG4gIH1cblxuICBjb25zdCBhbmNlc3RvclR5cGVOYW1lcyA9IFsuLi5wYXJlbnRBbmNlc3RvclR5cGVOYW1lc11cblxuICBjb25zdCB7XG4gICAgZ2F0c2J5QXBpOiB7IHBsdWdpbk9wdGlvbnMgfSxcbiAgICByZW1vdGVTY2hlbWE6IHsgZmllbGRCbGFja2xpc3QsIGZpZWxkQWxpYXNlcywgdHlwZU1hcCwgZ2F0c2J5Tm9kZXNJbmZvIH0sXG4gIH0gPSBzdG9yZS5nZXRTdGF0ZSgpXG5cbiAgY29uc3Qge1xuICAgIHNjaGVtYTogeyBxdWVyeURlcHRoLCBjaXJjdWxhclF1ZXJ5TGltaXQgfSxcbiAgfSA9IHBsdWdpbk9wdGlvbnNcblxuICBpZiAoZGVwdGggPiBxdWVyeURlcHRoICYmIGFuY2VzdG9yVHlwZU5hbWVzLmxlbmd0aCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCB0eXBlTmFtZSA9IGZpbmRUeXBlTmFtZShwYXJlbnRUeXBlKVxuXG4gIGNvbnN0IGdyYW5kUGFyZW50VHlwZU5hbWUgPSBhbmNlc3RvclR5cGVOYW1lcy5sZW5ndGhcbiAgICA/IGFuY2VzdG9yVHlwZU5hbWVzW2FuY2VzdG9yVHlwZU5hbWVzLmxlbmd0aCAtIDFdXG4gICAgOiBudWxsXG5cbiAgaWYgKGdyYW5kUGFyZW50VHlwZU5hbWUgJiYgdHlwZU5hbWUgIT09IGdyYW5kUGFyZW50VHlwZU5hbWUpIHtcbiAgICAvLyBpZiBhIGZpZWxkIGhhcyBmaWVsZHMgb2YgdGhlIHNhbWUgdHlwZSBhcyB0aGUgZmllbGQgYWJvdmUgaXRcbiAgICAvLyB3ZSBzaG91bGRuJ3QgZmV0Y2ggdGhlbS4gMiB0eXBlcyB0aGF0IGFyZSBjaXJjdWxhciBiZXR3ZWVuIGVhY2ggb3RoZXJcbiAgICAvLyBhcmUgZGFuZ2Vyb3VzIGFzIHRoZXkgd2lsbCBnZW5lcmF0ZSB2ZXJ5IGxhcmdlIHF1ZXJpZXMgYW5kIGZldGNoIGRhdGEgd2UgZG9uJ3QgbmVlZFxuICAgIC8vIHRoZXNlIHR5cGVzIHNob3VsZCBpbnN0ZWFkIGJlIHByb3BlciBjb25uZWN0aW9ucyBzbyB3ZSBjYW4gaWRlbnRpZnlcbiAgICAvLyB0aGF0IG9ubHkgYW4gaWQgbmVlZHMgdG8gYmUgZmV0Y2hlZC5cbiAgICAvLyBAdG9kbyBtYXliZSBtb3ZlIHRoaXMgaW50byB0cmFuc2Zvcm1GaWVsZHMoKSBpbnN0ZWFkIG9mIGhlcmVcbiAgICBmaWVsZHMgPSBmaWVsZHMuZmlsdGVyKChmaWVsZCkgPT4ge1xuICAgICAgY29uc3QgZmllbGRUeXBlTmFtZSA9IGZpbmRUeXBlTmFtZShmaWVsZC50eXBlKVxuICAgICAgcmV0dXJuIGZpZWxkVHlwZU5hbWUgIT09IGdyYW5kUGFyZW50VHlwZU5hbWVcbiAgICB9KVxuICB9XG5cbiAgY29uc3QgdHlwZUluY2FybmF0aW9uQ291bnQgPSBjb3VudEluY2FybmF0aW9ucyh7XG4gICAgdHlwZU5hbWUsXG4gICAgYW5jZXN0b3JUeXBlTmFtZXMsXG4gIH0pXG5cbiAgLy8gdGhpcyBhcHBlYXJzIHRvIG5vdCBiZSBuZWVkZWQgaGVyZSBidXQgQHRvZG8gaW52ZXN0aWdhdGUgaWYgdGhhdCdzIGFsd2F5cyB0cnVlXG4gIC8vIGl0J3MgYWxzbyBiZWluZyB1c2VkIGluIHRyYW5zZm9ybUZpZWxkKClcbiAgLy8gaWYgKHR5cGVJbmNhcm5hdGlvbkNvdW50ID4gMCkge1xuICAvLyAgIC8vIHRoaXMgdHlwZSBpcyBuZXN0ZWQgd2l0aGluIGl0c2VsZiBhdGxlYXN0IG9uY2VcbiAgLy8gICAvLyBjcmVhdGUgYSBmcmFnbWVudCBoZXJlIHRoYXQgY2FuIGJlIHJldXNlZFxuICAvLyAgIGNyZWF0ZUZyYWdtZW50KHtcbiAgLy8gICAgIGZpZWxkcyxcbiAgLy8gICAgIHR5cGU6IHBhcmVudFR5cGUsXG4gIC8vICAgICBmcmFnbWVudHMsXG4gIC8vICAgICBmaWVsZDogcGFyZW50RmllbGQsXG4gIC8vICAgICBhbmNlc3RvclR5cGVOYW1lczogcGFyZW50QW5jZXN0b3JUeXBlTmFtZXMsXG4gIC8vICAgICBkZXB0aCxcbiAgLy8gICAgIGZpZWxkQmxhY2tsaXN0LFxuICAvLyAgICAgZmllbGRBbGlhc2VzLFxuICAvLyAgICAgdHlwZU1hcCxcbiAgLy8gICAgIGdhdHNieU5vZGVzSW5mbyxcbiAgLy8gICAgIHF1ZXJ5RGVwdGgsXG4gIC8vICAgICBjaXJjdWxhclF1ZXJ5TGltaXQsXG4gIC8vICAgICBwbHVnaW5PcHRpb25zLFxuICAvLyAgICAgYnVpbGRpbmdGcmFnbWVudCxcbiAgLy8gICB9KVxuICAvLyB9XG5cbiAgaWYgKHR5cGVJbmNhcm5hdGlvbkNvdW50ID49IGNpcmN1bGFyUXVlcnlMaW1pdCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBwYXJlbnRBbmNlc3RvclR5cGVOYW1lcy5wdXNoKHR5cGVOYW1lKVxuXG4gIGxldCByZWN1cnNpdmVseVRyYW5zZm9ybWVkRmllbGRzID0gdHJhbnNmb3JtRmllbGRzKHtcbiAgICBmaWVsZHMsXG4gICAgcGFyZW50VHlwZSxcbiAgICBmcmFnbWVudHMsXG4gICAgcGFyZW50RmllbGQsXG4gICAgYW5jZXN0b3JUeXBlTmFtZXM6IHBhcmVudEFuY2VzdG9yVHlwZU5hbWVzLFxuICAgIGRlcHRoLFxuICAgIGZpZWxkQmxhY2tsaXN0LFxuICAgIGZpZWxkQWxpYXNlcyxcbiAgICB0eXBlTWFwLFxuICAgIGdhdHNieU5vZGVzSW5mbyxcbiAgICBxdWVyeURlcHRoLFxuICAgIGNpcmN1bGFyUXVlcnlMaW1pdCxcbiAgICBwbHVnaW5PcHRpb25zLFxuICAgIGJ1aWxkaW5nRnJhZ21lbnQsXG4gIH0pXG5cbiAgaWYgKCFyZWN1cnNpdmVseVRyYW5zZm9ybWVkRmllbGRzLmxlbmd0aCkge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gcmVjdXJzaXZlbHlUcmFuc2Zvcm1lZEZpZWxkc1xufVxuXG5leHBvcnQgZGVmYXVsdCByZWN1cnNpdmVseVRyYW5zZm9ybUZpZWxkc1xuIl19