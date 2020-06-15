"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.identifyAndStoreIngestableFieldsAndTypes = void 0;

require("source-map-support/register");

var _store = _interopRequireDefault(require("../../store"));

var _isExcluded = require("./is-excluded");

var _helpers = require("../create-schema-customization/helpers");

const identifyAndStoreIngestableFieldsAndTypes = async () => {
  const nodeListFilter = field => field.name === `nodes`;

  const state = _store.default.getState();

  const {
    introspectionData,
    fieldBlacklist,
    typeMap
  } = state.remoteSchema;
  const {
    helpers,
    pluginOptions
  } = state.gatsbyApi;
  const cachedFetchedTypes = await helpers.cache.get(`previously-fetched-types`);

  if (cachedFetchedTypes) {
    const restoredFetchedTypesMap = new Map(cachedFetchedTypes);

    _store.default.dispatch.remoteSchema.setState({
      fetchedTypes: restoredFetchedTypesMap
    });
  }

  if (pluginOptions.type) {
    Object.entries(pluginOptions.type).forEach(([typeName, typeSettings]) => {
      var _pluginOptions$type, _pluginOptions$type$_;

      // our lazy types won't initially be fetched,
      // so we need to mark them as fetched here
      if ((typeSettings.lazyNodes || ((_pluginOptions$type = pluginOptions.type) === null || _pluginOptions$type === void 0 ? void 0 : (_pluginOptions$type$_ = _pluginOptions$type.__all) === null || _pluginOptions$type$_ === void 0 ? void 0 : _pluginOptions$type$_.lazyNodes)) && !(0, _isExcluded.typeIsExcluded)({
        pluginOptions,
        typeName
      })) {
        const lazyType = typeMap.get(typeName);

        _store.default.dispatch.remoteSchema.addFetchedType(lazyType);
      }
    });
  }

  const interfaces = introspectionData.__schema.types.filter(type => type.kind === `INTERFACE`);

  for (const interfaceType of interfaces) {
    if ((0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: interfaceType.name
    })) {
      continue;
    }

    _store.default.dispatch.remoteSchema.addFetchedType(interfaceType);

    if (interfaceType.fields) {
      for (const interfaceField of interfaceType.fields) {
        if (interfaceField.type) {
          _store.default.dispatch.remoteSchema.addFetchedType(interfaceField.type);
        }
      }
    }
  }

  const rootFields = typeMap.get(`RootQuery`).fields;
  const nodeInterfaceTypes = [];
  const nodeListRootFields = [];
  const nonNodeRootFields = [];
  const nodeInterfacePossibleTypeNames = [];

  for (const field of rootFields) {
    var _field$args, _pluginOptions$type$R, _pluginOptions$type$R2;

    const fieldHasNonNullArgs = field.args.some(arg => arg.type.kind === `NON_NULL`);

    if (fieldHasNonNullArgs) {
      // we can't know what those args should be, so skip this field
      continue;
    }

    if ((0, _isExcluded.typeIsExcluded)({
      pluginOptions,
      typeName: field.type.name
    })) {
      continue;
    }

    if (field.type.kind === `OBJECT`) {
      const type = typeMap.get(field.type.name);
      const nodeField = type.fields.find(nodeListFilter);

      if (nodeField && nodeField.type.ofType.kind === `INTERFACE`) {
        const nodeListField = type.fields.find(nodeListFilter);

        if (nodeListField) {
          var _pluginOptions$type2, _pluginOptions$type2$;

          nodeInterfaceTypes.push(nodeListField.type.ofType.name);

          _store.default.dispatch.remoteSchema.addFetchedType(nodeListField.type);

          const nodeListFieldType = typeMap.get(nodeListField.type.ofType.name);

          for (const innerField of nodeListFieldType.fields) {
            _store.default.dispatch.remoteSchema.addFetchedType(innerField.type);
          }

          if ( // if we haven't marked this as a nodeInterface type then push this to root fields to fetch it
          // nodeInterface is different than a node which is an interface type.
          // In Gatsby nodeInterface means the node data is pulled from a different type. On the WP side we can also have nodes that are of an interface type, but we only pull them from a single root field
          // the problem is that if we don't mark them as a node list root field
          // we don't know to identify them later as being a node type that will have been fetched and we also wont try to fetch this type during node sourcing.
          !(pluginOptions === null || pluginOptions === void 0 ? void 0 : (_pluginOptions$type2 = pluginOptions.type) === null || _pluginOptions$type2 === void 0 ? void 0 : (_pluginOptions$type2$ = _pluginOptions$type2[nodeListField.type.ofType.name]) === null || _pluginOptions$type2$ === void 0 ? void 0 : _pluginOptions$type2$.nodeInterface)) {
            var _nodeInterfaceType$po;

            const nodeInterfaceType = typeMap.get((0, _helpers.findTypeName)(nodeListField.type)); // we need to mark all the possible types as being fetched
            // and also need to record the possible type as a node type

            nodeInterfaceType === null || nodeInterfaceType === void 0 ? void 0 : (_nodeInterfaceType$po = nodeInterfaceType.possibleTypes) === null || _nodeInterfaceType$po === void 0 ? void 0 : _nodeInterfaceType$po.forEach(type => {
              nodeInterfacePossibleTypeNames.push(type.name);

              _store.default.dispatch.remoteSchema.addFetchedType(type);
            });
            nodeListRootFields.push(field);
          }

          continue;
        }
      } else if (nodeField) {
        if (fieldBlacklist.includes(field.name)) {
          continue;
        }

        _store.default.dispatch.remoteSchema.addFetchedType(nodeField.type);

        nodeListRootFields.push(field);
        continue;
      }
    }

    if (fieldBlacklist.includes(field.name)) {
      continue;
    }

    const takesIDinput = field === null || field === void 0 ? void 0 : (_field$args = field.args) === null || _field$args === void 0 ? void 0 : _field$args.find(arg => arg.type.name === `ID`); // if a non-node root field takes an id input, we 99% likely can't use it.
    // so don't fetch it and don't add it to the schema.

    if (takesIDinput) {
      continue;
    }

    if ( // if this type is excluded on the RootQuery, skip it
    (_pluginOptions$type$R = pluginOptions.type.RootQuery) === null || _pluginOptions$type$R === void 0 ? void 0 : (_pluginOptions$type$R2 = _pluginOptions$type$R.excludeFieldNames) === null || _pluginOptions$type$R2 === void 0 ? void 0 : _pluginOptions$type$R2.find(excludedFieldName => excludedFieldName === field.name)) {
      continue;
    } // we don't need to mark types as fetched if they're supported SCALAR types


    if (!(0, _helpers.typeIsABuiltInScalar)(field.type)) {
      _store.default.dispatch.remoteSchema.addFetchedType(field.type);
    }

    nonNodeRootFields.push(field);
  }

  const nodeListFieldNames = nodeListRootFields.map(field => field.name);
  const nodeListTypeNames = [...nodeInterfacePossibleTypeNames, ...nodeListRootFields.map(field => {
    const connectionType = typeMap.get(field.type.name);
    const nodesField = connectionType.fields.find(nodeListFilter);
    return nodesField.type.ofType.name;
  })];
  const gatsbyNodesInfo = {
    fieldNames: nodeListFieldNames,
    typeNames: nodeListTypeNames
  };

  _store.default.dispatch.remoteSchema.setState({
    gatsbyNodesInfo,
    ingestibles: {
      nodeListRootFields,
      nonNodeRootFields,
      nodeInterfaceTypes
    }
  });
};

exports.identifyAndStoreIngestableFieldsAndTypes = identifyAndStoreIngestableFieldsAndTypes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zdGVwcy9pbmdlc3QtcmVtb3RlLXNjaGVtYS9pZGVudGlmeS1hbmQtc3RvcmUtaW5nZXN0YWJsZS10eXBlcy5qcyJdLCJuYW1lcyI6WyJpZGVudGlmeUFuZFN0b3JlSW5nZXN0YWJsZUZpZWxkc0FuZFR5cGVzIiwibm9kZUxpc3RGaWx0ZXIiLCJmaWVsZCIsIm5hbWUiLCJzdGF0ZSIsInN0b3JlIiwiZ2V0U3RhdGUiLCJpbnRyb3NwZWN0aW9uRGF0YSIsImZpZWxkQmxhY2tsaXN0IiwidHlwZU1hcCIsInJlbW90ZVNjaGVtYSIsImhlbHBlcnMiLCJwbHVnaW5PcHRpb25zIiwiZ2F0c2J5QXBpIiwiY2FjaGVkRmV0Y2hlZFR5cGVzIiwiY2FjaGUiLCJnZXQiLCJyZXN0b3JlZEZldGNoZWRUeXBlc01hcCIsIk1hcCIsImRpc3BhdGNoIiwic2V0U3RhdGUiLCJmZXRjaGVkVHlwZXMiLCJ0eXBlIiwiT2JqZWN0IiwiZW50cmllcyIsImZvckVhY2giLCJ0eXBlTmFtZSIsInR5cGVTZXR0aW5ncyIsImxhenlOb2RlcyIsIl9fYWxsIiwibGF6eVR5cGUiLCJhZGRGZXRjaGVkVHlwZSIsImludGVyZmFjZXMiLCJfX3NjaGVtYSIsInR5cGVzIiwiZmlsdGVyIiwia2luZCIsImludGVyZmFjZVR5cGUiLCJmaWVsZHMiLCJpbnRlcmZhY2VGaWVsZCIsInJvb3RGaWVsZHMiLCJub2RlSW50ZXJmYWNlVHlwZXMiLCJub2RlTGlzdFJvb3RGaWVsZHMiLCJub25Ob2RlUm9vdEZpZWxkcyIsIm5vZGVJbnRlcmZhY2VQb3NzaWJsZVR5cGVOYW1lcyIsImZpZWxkSGFzTm9uTnVsbEFyZ3MiLCJhcmdzIiwic29tZSIsImFyZyIsIm5vZGVGaWVsZCIsImZpbmQiLCJvZlR5cGUiLCJub2RlTGlzdEZpZWxkIiwicHVzaCIsIm5vZGVMaXN0RmllbGRUeXBlIiwiaW5uZXJGaWVsZCIsIm5vZGVJbnRlcmZhY2UiLCJub2RlSW50ZXJmYWNlVHlwZSIsInBvc3NpYmxlVHlwZXMiLCJpbmNsdWRlcyIsInRha2VzSURpbnB1dCIsIlJvb3RRdWVyeSIsImV4Y2x1ZGVGaWVsZE5hbWVzIiwiZXhjbHVkZWRGaWVsZE5hbWUiLCJub2RlTGlzdEZpZWxkTmFtZXMiLCJtYXAiLCJub2RlTGlzdFR5cGVOYW1lcyIsImNvbm5lY3Rpb25UeXBlIiwibm9kZXNGaWVsZCIsImdhdHNieU5vZGVzSW5mbyIsImZpZWxkTmFtZXMiLCJ0eXBlTmFtZXMiLCJpbmdlc3RpYmxlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBR0EsTUFBTUEsd0NBQXdDLEdBQUcsWUFBWTtBQUMzRCxRQUFNQyxjQUFjLEdBQUlDLEtBQUQsSUFBV0EsS0FBSyxDQUFDQyxJQUFOLEtBQWdCLE9BQWxEOztBQUVBLFFBQU1DLEtBQUssR0FBR0MsZUFBTUMsUUFBTixFQUFkOztBQUNBLFFBQU07QUFBRUMsSUFBQUEsaUJBQUY7QUFBcUJDLElBQUFBLGNBQXJCO0FBQXFDQyxJQUFBQTtBQUFyQyxNQUFpREwsS0FBSyxDQUFDTSxZQUE3RDtBQUNBLFFBQU07QUFBRUMsSUFBQUEsT0FBRjtBQUFXQyxJQUFBQTtBQUFYLE1BQTZCUixLQUFLLENBQUNTLFNBQXpDO0FBRUEsUUFBTUMsa0JBQWtCLEdBQUcsTUFBTUgsT0FBTyxDQUFDSSxLQUFSLENBQWNDLEdBQWQsQ0FBbUIsMEJBQW5CLENBQWpDOztBQUVBLE1BQUlGLGtCQUFKLEVBQXdCO0FBQ3RCLFVBQU1HLHVCQUF1QixHQUFHLElBQUlDLEdBQUosQ0FBUUosa0JBQVIsQ0FBaEM7O0FBRUFULG1CQUFNYyxRQUFOLENBQWVULFlBQWYsQ0FBNEJVLFFBQTVCLENBQXFDO0FBQ25DQyxNQUFBQSxZQUFZLEVBQUVKO0FBRHFCLEtBQXJDO0FBR0Q7O0FBRUQsTUFBSUwsYUFBYSxDQUFDVSxJQUFsQixFQUF3QjtBQUN0QkMsSUFBQUEsTUFBTSxDQUFDQyxPQUFQLENBQWVaLGFBQWEsQ0FBQ1UsSUFBN0IsRUFBbUNHLE9BQW5DLENBQTJDLENBQUMsQ0FBQ0MsUUFBRCxFQUFXQyxZQUFYLENBQUQsS0FBOEI7QUFBQTs7QUFDdkU7QUFDQTtBQUNBLFVBQ0UsQ0FBQ0EsWUFBWSxDQUFDQyxTQUFiLDRCQUEwQmhCLGFBQWEsQ0FBQ1UsSUFBeEMsaUZBQTBCLG9CQUFvQk8sS0FBOUMsMERBQTBCLHNCQUEyQkQsU0FBckQsQ0FBRCxLQUNBLENBQUMsZ0NBQWU7QUFBRWhCLFFBQUFBLGFBQUY7QUFBaUJjLFFBQUFBO0FBQWpCLE9BQWYsQ0FGSCxFQUdFO0FBQ0EsY0FBTUksUUFBUSxHQUFHckIsT0FBTyxDQUFDTyxHQUFSLENBQVlVLFFBQVosQ0FBakI7O0FBQ0FyQix1QkFBTWMsUUFBTixDQUFlVCxZQUFmLENBQTRCcUIsY0FBNUIsQ0FBMkNELFFBQTNDO0FBQ0Q7QUFDRixLQVZEO0FBV0Q7O0FBRUQsUUFBTUUsVUFBVSxHQUFHekIsaUJBQWlCLENBQUMwQixRQUFsQixDQUEyQkMsS0FBM0IsQ0FBaUNDLE1BQWpDLENBQ2hCYixJQUFELElBQVVBLElBQUksQ0FBQ2MsSUFBTCxLQUFlLFdBRFIsQ0FBbkI7O0FBSUEsT0FBSyxNQUFNQyxhQUFYLElBQTRCTCxVQUE1QixFQUF3QztBQUN0QyxRQUFJLGdDQUFlO0FBQUVwQixNQUFBQSxhQUFGO0FBQWlCYyxNQUFBQSxRQUFRLEVBQUVXLGFBQWEsQ0FBQ2xDO0FBQXpDLEtBQWYsQ0FBSixFQUFxRTtBQUNuRTtBQUNEOztBQUVERSxtQkFBTWMsUUFBTixDQUFlVCxZQUFmLENBQTRCcUIsY0FBNUIsQ0FBMkNNLGFBQTNDOztBQUVBLFFBQUlBLGFBQWEsQ0FBQ0MsTUFBbEIsRUFBMEI7QUFDeEIsV0FBSyxNQUFNQyxjQUFYLElBQTZCRixhQUFhLENBQUNDLE1BQTNDLEVBQW1EO0FBQ2pELFlBQUlDLGNBQWMsQ0FBQ2pCLElBQW5CLEVBQXlCO0FBQ3ZCakIseUJBQU1jLFFBQU4sQ0FBZVQsWUFBZixDQUE0QnFCLGNBQTVCLENBQTJDUSxjQUFjLENBQUNqQixJQUExRDtBQUNEO0FBQ0Y7QUFDRjtBQUNGOztBQUVELFFBQU1rQixVQUFVLEdBQUcvQixPQUFPLENBQUNPLEdBQVIsQ0FBYSxXQUFiLEVBQXlCc0IsTUFBNUM7QUFFQSxRQUFNRyxrQkFBa0IsR0FBRyxFQUEzQjtBQUNBLFFBQU1DLGtCQUFrQixHQUFHLEVBQTNCO0FBQ0EsUUFBTUMsaUJBQWlCLEdBQUcsRUFBMUI7QUFDQSxRQUFNQyw4QkFBOEIsR0FBRyxFQUF2Qzs7QUFFQSxPQUFLLE1BQU0xQyxLQUFYLElBQW9Cc0MsVUFBcEIsRUFBZ0M7QUFBQTs7QUFDOUIsVUFBTUssbUJBQW1CLEdBQUczQyxLQUFLLENBQUM0QyxJQUFOLENBQVdDLElBQVgsQ0FDekJDLEdBQUQsSUFBU0EsR0FBRyxDQUFDMUIsSUFBSixDQUFTYyxJQUFULEtBQW1CLFVBREYsQ0FBNUI7O0FBSUEsUUFBSVMsbUJBQUosRUFBeUI7QUFDdkI7QUFDQTtBQUNEOztBQUVELFFBQUksZ0NBQWU7QUFBRWpDLE1BQUFBLGFBQUY7QUFBaUJjLE1BQUFBLFFBQVEsRUFBRXhCLEtBQUssQ0FBQ29CLElBQU4sQ0FBV25CO0FBQXRDLEtBQWYsQ0FBSixFQUFrRTtBQUNoRTtBQUNEOztBQUVELFFBQUlELEtBQUssQ0FBQ29CLElBQU4sQ0FBV2MsSUFBWCxLQUFxQixRQUF6QixFQUFrQztBQUNoQyxZQUFNZCxJQUFJLEdBQUdiLE9BQU8sQ0FBQ08sR0FBUixDQUFZZCxLQUFLLENBQUNvQixJQUFOLENBQVduQixJQUF2QixDQUFiO0FBRUEsWUFBTThDLFNBQVMsR0FBRzNCLElBQUksQ0FBQ2dCLE1BQUwsQ0FBWVksSUFBWixDQUFpQmpELGNBQWpCLENBQWxCOztBQUVBLFVBQUlnRCxTQUFTLElBQUlBLFNBQVMsQ0FBQzNCLElBQVYsQ0FBZTZCLE1BQWYsQ0FBc0JmLElBQXRCLEtBQWdDLFdBQWpELEVBQTZEO0FBQzNELGNBQU1nQixhQUFhLEdBQUc5QixJQUFJLENBQUNnQixNQUFMLENBQVlZLElBQVosQ0FBaUJqRCxjQUFqQixDQUF0Qjs7QUFFQSxZQUFJbUQsYUFBSixFQUFtQjtBQUFBOztBQUNqQlgsVUFBQUEsa0JBQWtCLENBQUNZLElBQW5CLENBQXdCRCxhQUFhLENBQUM5QixJQUFkLENBQW1CNkIsTUFBbkIsQ0FBMEJoRCxJQUFsRDs7QUFFQUUseUJBQU1jLFFBQU4sQ0FBZVQsWUFBZixDQUE0QnFCLGNBQTVCLENBQTJDcUIsYUFBYSxDQUFDOUIsSUFBekQ7O0FBRUEsZ0JBQU1nQyxpQkFBaUIsR0FBRzdDLE9BQU8sQ0FBQ08sR0FBUixDQUFZb0MsYUFBYSxDQUFDOUIsSUFBZCxDQUFtQjZCLE1BQW5CLENBQTBCaEQsSUFBdEMsQ0FBMUI7O0FBRUEsZUFBSyxNQUFNb0QsVUFBWCxJQUF5QkQsaUJBQWlCLENBQUNoQixNQUEzQyxFQUFtRDtBQUNqRGpDLDJCQUFNYyxRQUFOLENBQWVULFlBQWYsQ0FBNEJxQixjQUE1QixDQUEyQ3dCLFVBQVUsQ0FBQ2pDLElBQXREO0FBQ0Q7O0FBRUQsZUFDRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBQ1YsYUFBRCxhQUFDQSxhQUFELCtDQUFDQSxhQUFhLENBQUVVLElBQWhCLGtGQUFDLHFCQUFzQjhCLGFBQWEsQ0FBQzlCLElBQWQsQ0FBbUI2QixNQUFuQixDQUEwQmhELElBQWhELENBQUQsMERBQUMsc0JBQ0dxRCxhQURKLENBTkYsRUFRRTtBQUFBOztBQUNBLGtCQUFNQyxpQkFBaUIsR0FBR2hELE9BQU8sQ0FBQ08sR0FBUixDQUN4QiwyQkFBYW9DLGFBQWEsQ0FBQzlCLElBQTNCLENBRHdCLENBQTFCLENBREEsQ0FLQTtBQUNBOztBQUNBbUMsWUFBQUEsaUJBQWlCLFNBQWpCLElBQUFBLGlCQUFpQixXQUFqQixxQ0FBQUEsaUJBQWlCLENBQUVDLGFBQW5CLGdGQUFrQ2pDLE9BQWxDLENBQTJDSCxJQUFELElBQVU7QUFDbERzQixjQUFBQSw4QkFBOEIsQ0FBQ1MsSUFBL0IsQ0FBb0MvQixJQUFJLENBQUNuQixJQUF6Qzs7QUFDQUUsNkJBQU1jLFFBQU4sQ0FBZVQsWUFBZixDQUE0QnFCLGNBQTVCLENBQTJDVCxJQUEzQztBQUNELGFBSEQ7QUFLQW9CLFlBQUFBLGtCQUFrQixDQUFDVyxJQUFuQixDQUF3Qm5ELEtBQXhCO0FBQ0Q7O0FBRUQ7QUFDRDtBQUNGLE9BdkNELE1BdUNPLElBQUkrQyxTQUFKLEVBQWU7QUFDcEIsWUFBSXpDLGNBQWMsQ0FBQ21ELFFBQWYsQ0FBd0J6RCxLQUFLLENBQUNDLElBQTlCLENBQUosRUFBeUM7QUFDdkM7QUFDRDs7QUFFREUsdUJBQU1jLFFBQU4sQ0FBZVQsWUFBZixDQUE0QnFCLGNBQTVCLENBQTJDa0IsU0FBUyxDQUFDM0IsSUFBckQ7O0FBRUFvQixRQUFBQSxrQkFBa0IsQ0FBQ1csSUFBbkIsQ0FBd0JuRCxLQUF4QjtBQUNBO0FBQ0Q7QUFDRjs7QUFFRCxRQUFJTSxjQUFjLENBQUNtRCxRQUFmLENBQXdCekQsS0FBSyxDQUFDQyxJQUE5QixDQUFKLEVBQXlDO0FBQ3ZDO0FBQ0Q7O0FBRUQsVUFBTXlELFlBQVksR0FBRzFELEtBQUgsYUFBR0EsS0FBSCxzQ0FBR0EsS0FBSyxDQUFFNEMsSUFBVixnREFBRyxZQUFhSSxJQUFiLENBQW1CRixHQUFELElBQVNBLEdBQUcsQ0FBQzFCLElBQUosQ0FBU25CLElBQVQsS0FBbUIsSUFBOUMsQ0FBckIsQ0ExRThCLENBNEU5QjtBQUNBOztBQUNBLFFBQUl5RCxZQUFKLEVBQWtCO0FBQ2hCO0FBQ0Q7O0FBRUQsU0FDRTtBQURGLDZCQUVFaEQsYUFBYSxDQUFDVSxJQUFkLENBQW1CdUMsU0FGckIsb0ZBRUUsc0JBQThCQyxpQkFGaEMsMkRBRUUsdUJBQWlEWixJQUFqRCxDQUNHYSxpQkFBRCxJQUF1QkEsaUJBQWlCLEtBQUs3RCxLQUFLLENBQUNDLElBRHJELENBRkYsRUFLRTtBQUNBO0FBQ0QsS0F6RjZCLENBMkY5Qjs7O0FBQ0EsUUFBSSxDQUFDLG1DQUFxQkQsS0FBSyxDQUFDb0IsSUFBM0IsQ0FBTCxFQUF1QztBQUNyQ2pCLHFCQUFNYyxRQUFOLENBQWVULFlBQWYsQ0FBNEJxQixjQUE1QixDQUEyQzdCLEtBQUssQ0FBQ29CLElBQWpEO0FBQ0Q7O0FBRURxQixJQUFBQSxpQkFBaUIsQ0FBQ1UsSUFBbEIsQ0FBdUJuRCxLQUF2QjtBQUNEOztBQUVELFFBQU04RCxrQkFBa0IsR0FBR3RCLGtCQUFrQixDQUFDdUIsR0FBbkIsQ0FBd0IvRCxLQUFELElBQVdBLEtBQUssQ0FBQ0MsSUFBeEMsQ0FBM0I7QUFFQSxRQUFNK0QsaUJBQWlCLEdBQUcsQ0FDeEIsR0FBR3RCLDhCQURxQixFQUV4QixHQUFHRixrQkFBa0IsQ0FBQ3VCLEdBQW5CLENBQXdCL0QsS0FBRCxJQUFXO0FBQ25DLFVBQU1pRSxjQUFjLEdBQUcxRCxPQUFPLENBQUNPLEdBQVIsQ0FBWWQsS0FBSyxDQUFDb0IsSUFBTixDQUFXbkIsSUFBdkIsQ0FBdkI7QUFFQSxVQUFNaUUsVUFBVSxHQUFHRCxjQUFjLENBQUM3QixNQUFmLENBQXNCWSxJQUF0QixDQUEyQmpELGNBQTNCLENBQW5CO0FBQ0EsV0FBT21FLFVBQVUsQ0FBQzlDLElBQVgsQ0FBZ0I2QixNQUFoQixDQUF1QmhELElBQTlCO0FBQ0QsR0FMRSxDQUZxQixDQUExQjtBQVVBLFFBQU1rRSxlQUFlLEdBQUc7QUFDdEJDLElBQUFBLFVBQVUsRUFBRU4sa0JBRFU7QUFFdEJPLElBQUFBLFNBQVMsRUFBRUw7QUFGVyxHQUF4Qjs7QUFLQTdELGlCQUFNYyxRQUFOLENBQWVULFlBQWYsQ0FBNEJVLFFBQTVCLENBQXFDO0FBQ25DaUQsSUFBQUEsZUFEbUM7QUFFbkNHLElBQUFBLFdBQVcsRUFBRTtBQUNYOUIsTUFBQUEsa0JBRFc7QUFFWEMsTUFBQUEsaUJBRlc7QUFHWEYsTUFBQUE7QUFIVztBQUZzQixHQUFyQztBQVFELENBdExEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHN0b3JlIGZyb20gXCJ+L3N0b3JlXCJcbmltcG9ydCB7IHR5cGVJc0V4Y2x1ZGVkIH0gZnJvbSBcIn4vc3RlcHMvaW5nZXN0LXJlbW90ZS1zY2hlbWEvaXMtZXhjbHVkZWRcIlxuaW1wb3J0IHsgdHlwZUlzQUJ1aWx0SW5TY2FsYXIgfSBmcm9tIFwiLi4vY3JlYXRlLXNjaGVtYS1jdXN0b21pemF0aW9uL2hlbHBlcnNcIlxuaW1wb3J0IHsgZmluZFR5cGVOYW1lIH0gZnJvbSBcIn4vc3RlcHMvY3JlYXRlLXNjaGVtYS1jdXN0b21pemF0aW9uL2hlbHBlcnNcIlxuXG5jb25zdCBpZGVudGlmeUFuZFN0b3JlSW5nZXN0YWJsZUZpZWxkc0FuZFR5cGVzID0gYXN5bmMgKCkgPT4ge1xuICBjb25zdCBub2RlTGlzdEZpbHRlciA9IChmaWVsZCkgPT4gZmllbGQubmFtZSA9PT0gYG5vZGVzYFxuXG4gIGNvbnN0IHN0YXRlID0gc3RvcmUuZ2V0U3RhdGUoKVxuICBjb25zdCB7IGludHJvc3BlY3Rpb25EYXRhLCBmaWVsZEJsYWNrbGlzdCwgdHlwZU1hcCB9ID0gc3RhdGUucmVtb3RlU2NoZW1hXG4gIGNvbnN0IHsgaGVscGVycywgcGx1Z2luT3B0aW9ucyB9ID0gc3RhdGUuZ2F0c2J5QXBpXG5cbiAgY29uc3QgY2FjaGVkRmV0Y2hlZFR5cGVzID0gYXdhaXQgaGVscGVycy5jYWNoZS5nZXQoYHByZXZpb3VzbHktZmV0Y2hlZC10eXBlc2ApXG5cbiAgaWYgKGNhY2hlZEZldGNoZWRUeXBlcykge1xuICAgIGNvbnN0IHJlc3RvcmVkRmV0Y2hlZFR5cGVzTWFwID0gbmV3IE1hcChjYWNoZWRGZXRjaGVkVHlwZXMpXG5cbiAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuc2V0U3RhdGUoe1xuICAgICAgZmV0Y2hlZFR5cGVzOiByZXN0b3JlZEZldGNoZWRUeXBlc01hcCxcbiAgICB9KVxuICB9XG5cbiAgaWYgKHBsdWdpbk9wdGlvbnMudHlwZSkge1xuICAgIE9iamVjdC5lbnRyaWVzKHBsdWdpbk9wdGlvbnMudHlwZSkuZm9yRWFjaCgoW3R5cGVOYW1lLCB0eXBlU2V0dGluZ3NdKSA9PiB7XG4gICAgICAvLyBvdXIgbGF6eSB0eXBlcyB3b24ndCBpbml0aWFsbHkgYmUgZmV0Y2hlZCxcbiAgICAgIC8vIHNvIHdlIG5lZWQgdG8gbWFyayB0aGVtIGFzIGZldGNoZWQgaGVyZVxuICAgICAgaWYgKFxuICAgICAgICAodHlwZVNldHRpbmdzLmxhenlOb2RlcyB8fCBwbHVnaW5PcHRpb25zLnR5cGU/Ll9fYWxsPy5sYXp5Tm9kZXMpICYmXG4gICAgICAgICF0eXBlSXNFeGNsdWRlZCh7IHBsdWdpbk9wdGlvbnMsIHR5cGVOYW1lIH0pXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgbGF6eVR5cGUgPSB0eXBlTWFwLmdldCh0eXBlTmFtZSlcbiAgICAgICAgc3RvcmUuZGlzcGF0Y2gucmVtb3RlU2NoZW1hLmFkZEZldGNoZWRUeXBlKGxhenlUeXBlKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBjb25zdCBpbnRlcmZhY2VzID0gaW50cm9zcGVjdGlvbkRhdGEuX19zY2hlbWEudHlwZXMuZmlsdGVyKFxuICAgICh0eXBlKSA9PiB0eXBlLmtpbmQgPT09IGBJTlRFUkZBQ0VgXG4gIClcblxuICBmb3IgKGNvbnN0IGludGVyZmFjZVR5cGUgb2YgaW50ZXJmYWNlcykge1xuICAgIGlmICh0eXBlSXNFeGNsdWRlZCh7IHBsdWdpbk9wdGlvbnMsIHR5cGVOYW1lOiBpbnRlcmZhY2VUeXBlLm5hbWUgfSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgc3RvcmUuZGlzcGF0Y2gucmVtb3RlU2NoZW1hLmFkZEZldGNoZWRUeXBlKGludGVyZmFjZVR5cGUpXG5cbiAgICBpZiAoaW50ZXJmYWNlVHlwZS5maWVsZHMpIHtcbiAgICAgIGZvciAoY29uc3QgaW50ZXJmYWNlRmllbGQgb2YgaW50ZXJmYWNlVHlwZS5maWVsZHMpIHtcbiAgICAgICAgaWYgKGludGVyZmFjZUZpZWxkLnR5cGUpIHtcbiAgICAgICAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuYWRkRmV0Y2hlZFR5cGUoaW50ZXJmYWNlRmllbGQudHlwZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHJvb3RGaWVsZHMgPSB0eXBlTWFwLmdldChgUm9vdFF1ZXJ5YCkuZmllbGRzXG5cbiAgY29uc3Qgbm9kZUludGVyZmFjZVR5cGVzID0gW11cbiAgY29uc3Qgbm9kZUxpc3RSb290RmllbGRzID0gW11cbiAgY29uc3Qgbm9uTm9kZVJvb3RGaWVsZHMgPSBbXVxuICBjb25zdCBub2RlSW50ZXJmYWNlUG9zc2libGVUeXBlTmFtZXMgPSBbXVxuXG4gIGZvciAoY29uc3QgZmllbGQgb2Ygcm9vdEZpZWxkcykge1xuICAgIGNvbnN0IGZpZWxkSGFzTm9uTnVsbEFyZ3MgPSBmaWVsZC5hcmdzLnNvbWUoXG4gICAgICAoYXJnKSA9PiBhcmcudHlwZS5raW5kID09PSBgTk9OX05VTExgXG4gICAgKVxuXG4gICAgaWYgKGZpZWxkSGFzTm9uTnVsbEFyZ3MpIHtcbiAgICAgIC8vIHdlIGNhbid0IGtub3cgd2hhdCB0aG9zZSBhcmdzIHNob3VsZCBiZSwgc28gc2tpcCB0aGlzIGZpZWxkXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmICh0eXBlSXNFeGNsdWRlZCh7IHBsdWdpbk9wdGlvbnMsIHR5cGVOYW1lOiBmaWVsZC50eXBlLm5hbWUgfSkpIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYgKGZpZWxkLnR5cGUua2luZCA9PT0gYE9CSkVDVGApIHtcbiAgICAgIGNvbnN0IHR5cGUgPSB0eXBlTWFwLmdldChmaWVsZC50eXBlLm5hbWUpXG5cbiAgICAgIGNvbnN0IG5vZGVGaWVsZCA9IHR5cGUuZmllbGRzLmZpbmQobm9kZUxpc3RGaWx0ZXIpXG5cbiAgICAgIGlmIChub2RlRmllbGQgJiYgbm9kZUZpZWxkLnR5cGUub2ZUeXBlLmtpbmQgPT09IGBJTlRFUkZBQ0VgKSB7XG4gICAgICAgIGNvbnN0IG5vZGVMaXN0RmllbGQgPSB0eXBlLmZpZWxkcy5maW5kKG5vZGVMaXN0RmlsdGVyKVxuXG4gICAgICAgIGlmIChub2RlTGlzdEZpZWxkKSB7XG4gICAgICAgICAgbm9kZUludGVyZmFjZVR5cGVzLnB1c2gobm9kZUxpc3RGaWVsZC50eXBlLm9mVHlwZS5uYW1lKVxuXG4gICAgICAgICAgc3RvcmUuZGlzcGF0Y2gucmVtb3RlU2NoZW1hLmFkZEZldGNoZWRUeXBlKG5vZGVMaXN0RmllbGQudHlwZSlcblxuICAgICAgICAgIGNvbnN0IG5vZGVMaXN0RmllbGRUeXBlID0gdHlwZU1hcC5nZXQobm9kZUxpc3RGaWVsZC50eXBlLm9mVHlwZS5uYW1lKVxuXG4gICAgICAgICAgZm9yIChjb25zdCBpbm5lckZpZWxkIG9mIG5vZGVMaXN0RmllbGRUeXBlLmZpZWxkcykge1xuICAgICAgICAgICAgc3RvcmUuZGlzcGF0Y2gucmVtb3RlU2NoZW1hLmFkZEZldGNoZWRUeXBlKGlubmVyRmllbGQudHlwZSlcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAvLyBpZiB3ZSBoYXZlbid0IG1hcmtlZCB0aGlzIGFzIGEgbm9kZUludGVyZmFjZSB0eXBlIHRoZW4gcHVzaCB0aGlzIHRvIHJvb3QgZmllbGRzIHRvIGZldGNoIGl0XG4gICAgICAgICAgICAvLyBub2RlSW50ZXJmYWNlIGlzIGRpZmZlcmVudCB0aGFuIGEgbm9kZSB3aGljaCBpcyBhbiBpbnRlcmZhY2UgdHlwZS5cbiAgICAgICAgICAgIC8vIEluIEdhdHNieSBub2RlSW50ZXJmYWNlIG1lYW5zIHRoZSBub2RlIGRhdGEgaXMgcHVsbGVkIGZyb20gYSBkaWZmZXJlbnQgdHlwZS4gT24gdGhlIFdQIHNpZGUgd2UgY2FuIGFsc28gaGF2ZSBub2RlcyB0aGF0IGFyZSBvZiBhbiBpbnRlcmZhY2UgdHlwZSwgYnV0IHdlIG9ubHkgcHVsbCB0aGVtIGZyb20gYSBzaW5nbGUgcm9vdCBmaWVsZFxuICAgICAgICAgICAgLy8gdGhlIHByb2JsZW0gaXMgdGhhdCBpZiB3ZSBkb24ndCBtYXJrIHRoZW0gYXMgYSBub2RlIGxpc3Qgcm9vdCBmaWVsZFxuICAgICAgICAgICAgLy8gd2UgZG9uJ3Qga25vdyB0byBpZGVudGlmeSB0aGVtIGxhdGVyIGFzIGJlaW5nIGEgbm9kZSB0eXBlIHRoYXQgd2lsbCBoYXZlIGJlZW4gZmV0Y2hlZCBhbmQgd2UgYWxzbyB3b250IHRyeSB0byBmZXRjaCB0aGlzIHR5cGUgZHVyaW5nIG5vZGUgc291cmNpbmcuXG4gICAgICAgICAgICAhcGx1Z2luT3B0aW9ucz8udHlwZT8uW25vZGVMaXN0RmllbGQudHlwZS5vZlR5cGUubmFtZV1cbiAgICAgICAgICAgICAgPy5ub2RlSW50ZXJmYWNlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlSW50ZXJmYWNlVHlwZSA9IHR5cGVNYXAuZ2V0KFxuICAgICAgICAgICAgICBmaW5kVHlwZU5hbWUobm9kZUxpc3RGaWVsZC50eXBlKVxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIG1hcmsgYWxsIHRoZSBwb3NzaWJsZSB0eXBlcyBhcyBiZWluZyBmZXRjaGVkXG4gICAgICAgICAgICAvLyBhbmQgYWxzbyBuZWVkIHRvIHJlY29yZCB0aGUgcG9zc2libGUgdHlwZSBhcyBhIG5vZGUgdHlwZVxuICAgICAgICAgICAgbm9kZUludGVyZmFjZVR5cGU/LnBvc3NpYmxlVHlwZXM/LmZvckVhY2goKHR5cGUpID0+IHtcbiAgICAgICAgICAgICAgbm9kZUludGVyZmFjZVBvc3NpYmxlVHlwZU5hbWVzLnB1c2godHlwZS5uYW1lKVxuICAgICAgICAgICAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuYWRkRmV0Y2hlZFR5cGUodHlwZSlcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIG5vZGVMaXN0Um9vdEZpZWxkcy5wdXNoKGZpZWxkKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobm9kZUZpZWxkKSB7XG4gICAgICAgIGlmIChmaWVsZEJsYWNrbGlzdC5pbmNsdWRlcyhmaWVsZC5uYW1lKSkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuYWRkRmV0Y2hlZFR5cGUobm9kZUZpZWxkLnR5cGUpXG5cbiAgICAgICAgbm9kZUxpc3RSb290RmllbGRzLnB1c2goZmllbGQpXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGZpZWxkQmxhY2tsaXN0LmluY2x1ZGVzKGZpZWxkLm5hbWUpKSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGNvbnN0IHRha2VzSURpbnB1dCA9IGZpZWxkPy5hcmdzPy5maW5kKChhcmcpID0+IGFyZy50eXBlLm5hbWUgPT09IGBJRGApXG5cbiAgICAvLyBpZiBhIG5vbi1ub2RlIHJvb3QgZmllbGQgdGFrZXMgYW4gaWQgaW5wdXQsIHdlIDk5JSBsaWtlbHkgY2FuJ3QgdXNlIGl0LlxuICAgIC8vIHNvIGRvbid0IGZldGNoIGl0IGFuZCBkb24ndCBhZGQgaXQgdG8gdGhlIHNjaGVtYS5cbiAgICBpZiAodGFrZXNJRGlucHV0KSB7XG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmIChcbiAgICAgIC8vIGlmIHRoaXMgdHlwZSBpcyBleGNsdWRlZCBvbiB0aGUgUm9vdFF1ZXJ5LCBza2lwIGl0XG4gICAgICBwbHVnaW5PcHRpb25zLnR5cGUuUm9vdFF1ZXJ5Py5leGNsdWRlRmllbGROYW1lcz8uZmluZChcbiAgICAgICAgKGV4Y2x1ZGVkRmllbGROYW1lKSA9PiBleGNsdWRlZEZpZWxkTmFtZSA9PT0gZmllbGQubmFtZVxuICAgICAgKVxuICAgICkge1xuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyB3ZSBkb24ndCBuZWVkIHRvIG1hcmsgdHlwZXMgYXMgZmV0Y2hlZCBpZiB0aGV5J3JlIHN1cHBvcnRlZCBTQ0FMQVIgdHlwZXNcbiAgICBpZiAoIXR5cGVJc0FCdWlsdEluU2NhbGFyKGZpZWxkLnR5cGUpKSB7XG4gICAgICBzdG9yZS5kaXNwYXRjaC5yZW1vdGVTY2hlbWEuYWRkRmV0Y2hlZFR5cGUoZmllbGQudHlwZSlcbiAgICB9XG5cbiAgICBub25Ob2RlUm9vdEZpZWxkcy5wdXNoKGZpZWxkKVxuICB9XG5cbiAgY29uc3Qgbm9kZUxpc3RGaWVsZE5hbWVzID0gbm9kZUxpc3RSb290RmllbGRzLm1hcCgoZmllbGQpID0+IGZpZWxkLm5hbWUpXG5cbiAgY29uc3Qgbm9kZUxpc3RUeXBlTmFtZXMgPSBbXG4gICAgLi4ubm9kZUludGVyZmFjZVBvc3NpYmxlVHlwZU5hbWVzLFxuICAgIC4uLm5vZGVMaXN0Um9vdEZpZWxkcy5tYXAoKGZpZWxkKSA9PiB7XG4gICAgICBjb25zdCBjb25uZWN0aW9uVHlwZSA9IHR5cGVNYXAuZ2V0KGZpZWxkLnR5cGUubmFtZSlcblxuICAgICAgY29uc3Qgbm9kZXNGaWVsZCA9IGNvbm5lY3Rpb25UeXBlLmZpZWxkcy5maW5kKG5vZGVMaXN0RmlsdGVyKVxuICAgICAgcmV0dXJuIG5vZGVzRmllbGQudHlwZS5vZlR5cGUubmFtZVxuICAgIH0pLFxuICBdXG5cbiAgY29uc3QgZ2F0c2J5Tm9kZXNJbmZvID0ge1xuICAgIGZpZWxkTmFtZXM6IG5vZGVMaXN0RmllbGROYW1lcyxcbiAgICB0eXBlTmFtZXM6IG5vZGVMaXN0VHlwZU5hbWVzLFxuICB9XG5cbiAgc3RvcmUuZGlzcGF0Y2gucmVtb3RlU2NoZW1hLnNldFN0YXRlKHtcbiAgICBnYXRzYnlOb2Rlc0luZm8sXG4gICAgaW5nZXN0aWJsZXM6IHtcbiAgICAgIG5vZGVMaXN0Um9vdEZpZWxkcyxcbiAgICAgIG5vbk5vZGVSb290RmllbGRzLFxuICAgICAgbm9kZUludGVyZmFjZVR5cGVzLFxuICAgIH0sXG4gIH0pXG59XG5cbmV4cG9ydCB7IGlkZW50aWZ5QW5kU3RvcmVJbmdlc3RhYmxlRmllbGRzQW5kVHlwZXMgfVxuIl19