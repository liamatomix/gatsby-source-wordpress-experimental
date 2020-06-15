"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

require("source-map-support/register");

var _merge = _interopRequireDefault(require("lodash/merge"));

var _createRemoteMediaItemNode = require("../steps/source-nodes/create-nodes/create-remote-media-item-node");

var _menu = require("../steps/source-nodes/before-change-node/menu");

var _category = require("../steps/source-nodes/before-change-node/category");

const defaultPluginOptions = {
  url: null,
  verbose: false,
  debug: {
    graphql: {
      showQueryOnError: false,
      showQueryVarsOnError: false,
      copyQueryOnError: false,
      panicOnError: false,
      onlyReportCriticalErrors: true,
      copyNodeSourcingQueryAndExit: false,
      writeQueriesToDisk: false
    },
    timeBuildSteps: false,
    disableCompatibilityCheck: false
  },
  develop: {
    nodeUpdateInterval: 300,
    hardCacheMediaFiles: false
  },
  production: {
    hardCacheMediaFiles: false
  },
  auth: {
    htaccess: {
      username: null,
      password: null
    }
  },
  schema: {
    queryDepth: 15,
    circularQueryLimit: 5,
    typePrefix: `Wp`,
    timeout: 30 * 1000,
    // 30 seconds
    perPage: 100
  },
  excludeFieldNames: [],
  html: {
    // this causes the source plugin to find/replace images in html
    useGatsbyImage: true,
    // this adds a limit to the max width an image can be
    // if the image selected in WP is smaller, or the image is smaller than this
    // those values will be used instead.
    imageMaxWidth: null,
    // if a max width can't be inferred from html, this value will be passed to Sharp
    // if the image is smaller than this, the images width will be used instead
    fallbackImageMaxWidth: 100,
    imageQuality: 90
  },
  type: {
    __all: {
      dateFields: [`date`]
    },
    RootQuery: {
      excludeFieldNames: [`viewer`, `node`, `schemaMd5`]
    },
    Settings: {
      excludeFieldNames: [`generalSettingsEmail`]
    },
    GeneralSettings: {
      excludeFieldNames: [`email`]
    },
    ActionMonitorAction: {
      exclude: true
    },
    UserToActionMonitorActionConnection: {
      exclude: true
    },
    Plugin: {
      exclude: true
    },
    PostFormat: {
      exclude: true
    },
    Theme: {
      exclude: true
    },
    UserRole: {
      exclude: true
    },
    UserToUserRoleConnection: {
      exclude: true
    },
    Page: {
      excludeFieldNames: [`enclosure`]
    },
    User: {
      excludeFieldNames: [`extraCapabilities`, `capKey`, `email`, `registeredDate`]
    },
    MediaItem: {
      lazyNodes: false,
      beforeChangeNode: async ({
        remoteNode,
        actionType,
        typeSettings
      }) => {
        // we fetch lazy nodes files in resolvers, no need to fetch them here.
        if (typeSettings.lazyNodes) {
          return {
            remoteNode
          };
        }

        if (actionType === `CREATE` || actionType === `UPDATE`) {
          const createdMediaItem = await (0, _createRemoteMediaItemNode.createRemoteMediaItemNode)({
            mediaItemNode: remoteNode
          });

          if (createdMediaItem) {
            remoteNode.remoteFile = {
              id: createdMediaItem.id
            };
            remoteNode.localFile = {
              id: createdMediaItem.id
            };
            return {
              remoteNode
            };
          }
        }

        return {
          remoteNode
        };
      }
    },
    ContentNode: {
      nodeInterface: true
    },
    Category: {
      // @todo remove this when categories are a flat list in WPGQL
      beforeChangeNode: _category.categoryBeforeChangeNode
    },
    Menu: {
      /**
       * This is used to fetch child menu items
       * on Menus as it's problematic to fetch them otherwise
       * in WPGQL currently
       *
       * So after a Menu Node is fetched and processed, this function runs
       * It loops through the child menu items, generates a query for them,
       * fetches them, and creates nodes out of them.
       *
       * This runs when initially fetching all nodes, and after an incremental
       * fetch happens
       *
       * When we can get a list of all menu items regardless of location in WPGQL, this can be removed.
       */
      // @todo remove this when menus are a flat list in WPGQL
      beforeChangeNode: _menu.menuBeforeChangeNode
    },
    MenuItem: {
      /**
       * This was my previous attempt at fetching problematic menuItems
       * I temporarily solved this above, but I'm leaving this here as
       * a reminder of the nodeListQueries API
       *
       * this worked to pull all menus in the initial fetch, but menus had to be assigned to a location
       * that was problematic because saving a menu would then fetch those menu items using the incremental fetching logic in this plugin. So menu items that previously existed in WP wouldn't show up initially if they had no location set, then as menus were saved they would show up.
       */
      // nodeListQueries: ({
      //   name,
      //   store,
      //   transformedFields,
      //   helpers: { buildNodesQueryOnFieldName },
      // }) => {
      //   const menuLocationEnumValues = store
      //     .getState()
      //     .remoteSchema.introspectionData.__schema.types.find(
      //       type => type.name === `MenuLocationEnum`
      //     )
      //     .enumValues.map(value => value.name)
      //   const queries = menuLocationEnumValues.map(enumValue =>
      //     buildNodesQueryOnFieldName({
      //       fields: transformedFields,
      //       fieldName: name,
      //       fieldVariables: `where: { location: ${enumValue} }`,
      //     })
      //   )
      //   return queries
      // },
    },
    // the next two types can't be sourced in Gatsby properly yet
    // @todo instead of excluding these manually, auto exclude them
    // based on how they behave (no single node query available)
    EnqueuedScript: {
      exclude: true
    },
    EnqueuedStylesheet: {
      exclude: true
    },
    EnqueuedAsset: {
      exclude: true
    },
    ContentNodeToEnqueuedScriptConnection: {
      exclude: true
    },
    ContentNodeToEnqueuedStylesheetConnection: {
      exclude: true
    },
    TermNodeToEnqueuedScriptConnection: {
      exclude: true
    },
    TermNodeToEnqueuedStylesheetConnection: {
      exclude: true
    },
    UserToEnqueuedScriptConnection: {
      exclude: true
    },
    UserToEnqueuedStylesheetConnection: {
      exclude: true
    }
  }
};
const gatsbyApi = {
  state: {
    helpers: {},
    pluginOptions: defaultPluginOptions
  },
  reducers: {
    setState(state, payload) {
      return (0, _merge.default)(state, payload);
    }

  }
};
var _default = gatsbyApi;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvZ2F0c2J5LWFwaS5qcyJdLCJuYW1lcyI6WyJkZWZhdWx0UGx1Z2luT3B0aW9ucyIsInVybCIsInZlcmJvc2UiLCJkZWJ1ZyIsImdyYXBocWwiLCJzaG93UXVlcnlPbkVycm9yIiwic2hvd1F1ZXJ5VmFyc09uRXJyb3IiLCJjb3B5UXVlcnlPbkVycm9yIiwicGFuaWNPbkVycm9yIiwib25seVJlcG9ydENyaXRpY2FsRXJyb3JzIiwiY29weU5vZGVTb3VyY2luZ1F1ZXJ5QW5kRXhpdCIsIndyaXRlUXVlcmllc1RvRGlzayIsInRpbWVCdWlsZFN0ZXBzIiwiZGlzYWJsZUNvbXBhdGliaWxpdHlDaGVjayIsImRldmVsb3AiLCJub2RlVXBkYXRlSW50ZXJ2YWwiLCJoYXJkQ2FjaGVNZWRpYUZpbGVzIiwicHJvZHVjdGlvbiIsImF1dGgiLCJodGFjY2VzcyIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJzY2hlbWEiLCJxdWVyeURlcHRoIiwiY2lyY3VsYXJRdWVyeUxpbWl0IiwidHlwZVByZWZpeCIsInRpbWVvdXQiLCJwZXJQYWdlIiwiZXhjbHVkZUZpZWxkTmFtZXMiLCJodG1sIiwidXNlR2F0c2J5SW1hZ2UiLCJpbWFnZU1heFdpZHRoIiwiZmFsbGJhY2tJbWFnZU1heFdpZHRoIiwiaW1hZ2VRdWFsaXR5IiwidHlwZSIsIl9fYWxsIiwiZGF0ZUZpZWxkcyIsIlJvb3RRdWVyeSIsIlNldHRpbmdzIiwiR2VuZXJhbFNldHRpbmdzIiwiQWN0aW9uTW9uaXRvckFjdGlvbiIsImV4Y2x1ZGUiLCJVc2VyVG9BY3Rpb25Nb25pdG9yQWN0aW9uQ29ubmVjdGlvbiIsIlBsdWdpbiIsIlBvc3RGb3JtYXQiLCJUaGVtZSIsIlVzZXJSb2xlIiwiVXNlclRvVXNlclJvbGVDb25uZWN0aW9uIiwiUGFnZSIsIlVzZXIiLCJNZWRpYUl0ZW0iLCJsYXp5Tm9kZXMiLCJiZWZvcmVDaGFuZ2VOb2RlIiwicmVtb3RlTm9kZSIsImFjdGlvblR5cGUiLCJ0eXBlU2V0dGluZ3MiLCJjcmVhdGVkTWVkaWFJdGVtIiwibWVkaWFJdGVtTm9kZSIsInJlbW90ZUZpbGUiLCJpZCIsImxvY2FsRmlsZSIsIkNvbnRlbnROb2RlIiwibm9kZUludGVyZmFjZSIsIkNhdGVnb3J5IiwiY2F0ZWdvcnlCZWZvcmVDaGFuZ2VOb2RlIiwiTWVudSIsIm1lbnVCZWZvcmVDaGFuZ2VOb2RlIiwiTWVudUl0ZW0iLCJFbnF1ZXVlZFNjcmlwdCIsIkVucXVldWVkU3R5bGVzaGVldCIsIkVucXVldWVkQXNzZXQiLCJDb250ZW50Tm9kZVRvRW5xdWV1ZWRTY3JpcHRDb25uZWN0aW9uIiwiQ29udGVudE5vZGVUb0VucXVldWVkU3R5bGVzaGVldENvbm5lY3Rpb24iLCJUZXJtTm9kZVRvRW5xdWV1ZWRTY3JpcHRDb25uZWN0aW9uIiwiVGVybU5vZGVUb0VucXVldWVkU3R5bGVzaGVldENvbm5lY3Rpb24iLCJVc2VyVG9FbnF1ZXVlZFNjcmlwdENvbm5lY3Rpb24iLCJVc2VyVG9FbnF1ZXVlZFN0eWxlc2hlZXRDb25uZWN0aW9uIiwiZ2F0c2J5QXBpIiwic3RhdGUiLCJoZWxwZXJzIiwicGx1Z2luT3B0aW9ucyIsInJlZHVjZXJzIiwic2V0U3RhdGUiLCJwYXlsb2FkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQSxNQUFNQSxvQkFBb0IsR0FBRztBQUMzQkMsRUFBQUEsR0FBRyxFQUFFLElBRHNCO0FBRTNCQyxFQUFBQSxPQUFPLEVBQUUsS0FGa0I7QUFHM0JDLEVBQUFBLEtBQUssRUFBRTtBQUNMQyxJQUFBQSxPQUFPLEVBQUU7QUFDUEMsTUFBQUEsZ0JBQWdCLEVBQUUsS0FEWDtBQUVQQyxNQUFBQSxvQkFBb0IsRUFBRSxLQUZmO0FBR1BDLE1BQUFBLGdCQUFnQixFQUFFLEtBSFg7QUFJUEMsTUFBQUEsWUFBWSxFQUFFLEtBSlA7QUFLUEMsTUFBQUEsd0JBQXdCLEVBQUUsSUFMbkI7QUFNUEMsTUFBQUEsNEJBQTRCLEVBQUUsS0FOdkI7QUFPUEMsTUFB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QUFBLGtCQUFrQixFQUFFO0FBQ2xCNUIsTUFBQUEsT0FBTyxFQUFFO0FBRFMsS0E3SWhCO0FBZ0pKNkIsSUFBQUEsYUFBYSxFQUFFO0FBQ2I3QixNQUFBQSxPQUFPLEVBQUU7QUFESSxLQWhKWDtBQW1KSjhCLElBQUFBLHFDQUFxQyxFQUFFO0FBQ3JDOUIsTUFBQUEsT0FBTyxFQUFFO0FBRDRCLEtBbkpuQztBQXNKSitCLElBQUFBLHlDQUF5QyxFQUFFO0FBQ3pDL0IsTUFBQUEsT0FBTyxFQUFFO0FBRGdDLEtBdEp2QztBQXlKSmdDLElBQUFBLGtDQUFrQyxFQUFFO0FBQ2xDaEMsTUFBQUEsT0FBTyxFQUFFO0FBRHlCLEtBekpoQztBQTRKSmlDLElBQUFBLHNDQUFzQyxFQUFFO0FBQ3RDakMsTUFBQUEsT0FBTyxFQUFFO0FBRDZCLEtBNUpwQztBQStKSmtDLElBQUFBLDhCQUE4QixFQUFFO0FBQzlCbEMsTUFBQUEsT0FBTyxFQUFFO0FBRHFCLEtBL0o1QjtBQWtLSm1DLElBQUFBLGtDQUFrQyxFQUFFO0FBQ2xDbkMsTUFBQUEsT0FBTyxFQUFFO0FBRHlCO0FBbEtoQztBQWpEcUIsQ0FBN0I7QUF5TkEsTUFBTW9DLFNBQVMsR0FBRztBQUNoQkMsRUFBQUEsS0FBSyxFQUFFO0FBQ0xDLElBQUFBLE9BQU8sRUFBRSxFQURKO0FBRUxDLElBQUFBLGFBQWEsRUFBRWhGO0FBRlYsR0FEUztBQU1oQmlGLEVBQUFBLFFBQVEsRUFBRTtBQUNSQyxJQUFBQSxRQUFRLENBQUNKLEtBQUQsRUFBUUssT0FBUixFQUFpQjtBQUN2QixhQUFPLG9CQUFNTCxLQUFOLEVBQWFLLE9BQWIsQ0FBUDtBQUNEOztBQUhPO0FBTk0sQ0FBbEI7ZUFhZU4sUyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtZXJnZSBmcm9tIFwibG9kYXNoL21lcmdlXCJcbmltcG9ydCB7IGNyZWF0ZVJlbW90ZU1lZGlhSXRlbU5vZGUgfSBmcm9tIFwifi9zdGVwcy9zb3VyY2Utbm9kZXMvY3JlYXRlLW5vZGVzL2NyZWF0ZS1yZW1vdGUtbWVkaWEtaXRlbS1ub2RlXCJcbmltcG9ydCB7IG1lbnVCZWZvcmVDaGFuZ2VOb2RlIH0gZnJvbSBcIn4vc3RlcHMvc291cmNlLW5vZGVzL2JlZm9yZS1jaGFuZ2Utbm9kZS9tZW51XCJcbmltcG9ydCB7IGNhdGVnb3J5QmVmb3JlQ2hhbmdlTm9kZSB9IGZyb20gXCJ+L3N0ZXBzL3NvdXJjZS1ub2Rlcy9iZWZvcmUtY2hhbmdlLW5vZGUvY2F0ZWdvcnlcIlxuXG5jb25zdCBkZWZhdWx0UGx1Z2luT3B0aW9ucyA9IHtcbiAgdXJsOiBudWxsLFxuICB2ZXJib3NlOiBmYWxzZSxcbiAgZGVidWc6IHtcbiAgICBncmFwaHFsOiB7XG4gICAgICBzaG93UXVlcnlPbkVycm9yOiBmYWxzZSxcbiAgICAgIHNob3dRdWVyeVZhcnNPbkVycm9yOiBmYWxzZSxcbiAgICAgIGNvcHlRdWVyeU9uRXJyb3I6IGZhbHNlLFxuICAgICAgcGFuaWNPbkVycm9yOiBmYWxzZSxcbiAgICAgIG9ubHlSZXBvcnRDcml0aWNhbEVycm9yczogdHJ1ZSxcbiAgICAgIGNvcHlOb2RlU291cmNpbmdRdWVyeUFuZEV4aXQ6IGZhbHNlLFxuICAgICAgd3JpdGVRdWVyaWVzVG9EaXNrOiBmYWxzZSxcbiAgICB9LFxuICAgIHRpbWVCdWlsZFN0ZXBzOiBmYWxzZSxcbiAgICBkaXNhYmxlQ29tcGF0aWJpbGl0eUNoZWNrOiBmYWxzZSxcbiAgfSxcbiAgZGV2ZWxvcDoge1xuICAgIG5vZGVVcGRhdGVJbnRlcnZhbDogMzAwLFxuICAgIGhhcmRDYWNoZU1lZGlhRmlsZXM6IGZhbHNlLFxuICB9LFxuICBwcm9kdWN0aW9uOiB7XG4gICAgaGFyZENhY2hlTWVkaWFGaWxlczogZmFsc2UsXG4gIH0sXG4gIGF1dGg6IHtcbiAgICBodGFjY2Vzczoge1xuICAgICAgdXNlcm5hbWU6IG51bGwsXG4gICAgICBwYXNzd29yZDogbnVsbCxcbiAgICB9LFxuICB9LFxuICBzY2hlbWE6IHtcbiAgICBxdWVyeURlcHRoOiAxNSxcbiAgICBjaXJjdWxhclF1ZXJ5TGltaXQ6IDUsXG4gICAgdHlwZVByZWZpeDogYFdwYCxcbiAgICB0aW1lb3V0OiAzMCAqIDEwMDAsIC8vIDMwIHNlY29uZHNcbiAgICBwZXJQYWdlOiAxMDAsXG4gIH0sXG4gIGV4Y2x1ZGVGaWVsZE5hbWVzOiBbXSxcbiAgaHRtbDoge1xuICAgIC8vIHRoaXMgY2F1c2VzIHRoZSBzb3VyY2UgcGx1Z2luIHRvIGZpbmQvcmVwbGFjZSBpbWFnZXMgaW4gaHRtbFxuICAgIHVzZUdhdHNieUltYWdlOiB0cnVlLFxuICAgIC8vIHRoaXMgYWRkcyBhIGxpbWl0IHRvIHRoZSBtYXggd2lkdGggYW4gaW1hZ2UgY2FuIGJlXG4gICAgLy8gaWYgdGhlIGltYWdlIHNlbGVjdGVkIGluIFdQIGlzIHNtYWxsZXIsIG9yIHRoZSBpbWFnZSBpcyBzbWFsbGVyIHRoYW4gdGhpc1xuICAgIC8vIHRob3NlIHZhbHVlcyB3aWxsIGJlIHVzZWQgaW5zdGVhZC5cbiAgICBpbWFnZU1heFdpZHRoOiBudWxsLFxuICAgIC8vIGlmIGEgbWF4IHdpZHRoIGNhbid0IGJlIGluZmVycmVkIGZyb20gaHRtbCwgdGhpcyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0byBTaGFycFxuICAgIC8vIGlmIHRoZSBpbWFnZSBpcyBzbWFsbGVyIHRoYW4gdGhpcywgdGhlIGltYWdlcyB3aWR0aCB3aWxsIGJlIHVzZWQgaW5zdGVhZFxuICAgIGZhbGxiYWNrSW1hZ2VNYXhXaWR0aDogMTAwLFxuICAgIGltYWdlUXVhbGl0eTogOTAsXG4gIH0sXG4gIHR5cGU6IHtcbiAgICBfX2FsbDoge1xuICAgICAgZGF0ZUZpZWxkczogW2BkYXRlYF0sXG4gICAgfSxcbiAgICBSb290UXVlcnk6IHtcbiAgICAgIGV4Y2x1ZGVGaWVsZE5hbWVzOiBbYHZpZXdlcmAsIGBub2RlYCwgYHNjaGVtYU1kNWBdLFxuICAgIH0sXG4gICAgU2V0dGluZ3M6IHtcbiAgICAgIGV4Y2x1ZGVGaWVsZE5hbWVzOiBbYGdlbmVyYWxTZXR0aW5nc0VtYWlsYF0sXG4gICAgfSxcbiAgICBHZW5lcmFsU2V0dGluZ3M6IHtcbiAgICAgIGV4Y2x1ZGVGaWVsZE5hbWVzOiBbYGVtYWlsYF0sXG4gICAgfSxcbiAgICBBY3Rpb25Nb25pdG9yQWN0aW9uOiB7XG4gICAgICBleGNsdWRlOiB0cnVlLFxuICAgIH0sXG4gICAgVXNlclRvQWN0aW9uTW9uaXRvckFjdGlvbkNvbm5lY3Rpb246IHtcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICBQbHVnaW46IHtcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICBQb3N0Rm9ybWF0OiB7XG4gICAgICBleGNsdWRlOiB0cnVlLFxuICAgIH0sXG4gICAgVGhlbWU6IHtcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICBVc2VyUm9sZToge1xuICAgICAgZXhjbHVkZTogdHJ1ZSxcbiAgICB9LFxuICAgIFVzZXJUb1VzZXJSb2xlQ29ubmVjdGlvbjoge1xuICAgICAgZXhjbHVkZTogdHJ1ZSxcbiAgICB9LFxuICAgIFBhZ2U6IHtcbiAgICAgIGV4Y2x1ZGVGaWVsZE5hbWVzOiBbYGVuY2xvc3VyZWBdLFxuICAgIH0sXG4gICAgVXNlcjoge1xuICAgICAgZXhjbHVkZUZpZWxkTmFtZXM6IFtcbiAgICAgICAgYGV4dHJhQ2FwYWJpbGl0aWVzYCxcbiAgICAgICAgYGNhcEtleWAsXG4gICAgICAgIGBlbWFpbGAsXG4gICAgICAgIGByZWdpc3RlcmVkRGF0ZWAsXG4gICAgICBdLFxuICAgIH0sXG4gICAgTWVkaWFJdGVtOiB7XG4gICAgICBsYXp5Tm9kZXM6IGZhbHNlLFxuICAgICAgYmVmb3JlQ2hhbmdlTm9kZTogYXN5bmMgKHsgcmVtb3RlTm9kZSwgYWN0aW9uVHlwZSwgdHlwZVNldHRpbmdzIH0pID0+IHtcbiAgICAgICAgLy8gd2UgZmV0Y2ggbGF6eSBub2RlcyBmaWxlcyBpbiByZXNvbHZlcnMsIG5vIG5lZWQgdG8gZmV0Y2ggdGhlbSBoZXJlLlxuICAgICAgICBpZiAodHlwZVNldHRpbmdzLmxhenlOb2Rlcykge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZW1vdGVOb2RlLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhY3Rpb25UeXBlID09PSBgQ1JFQVRFYCB8fCBhY3Rpb25UeXBlID09PSBgVVBEQVRFYCkge1xuICAgICAgICAgIGNvbnN0IGNyZWF0ZWRNZWRpYUl0ZW0gPSBhd2FpdCBjcmVhdGVSZW1vdGVNZWRpYUl0ZW1Ob2RlKHtcbiAgICAgICAgICAgIG1lZGlhSXRlbU5vZGU6IHJlbW90ZU5vZGUsXG4gICAgICAgICAgfSlcblxuICAgICAgICAgIGlmIChjcmVhdGVkTWVkaWFJdGVtKSB7XG4gICAgICAgICAgICByZW1vdGVOb2RlLnJlbW90ZUZpbGUgPSB7XG4gICAgICAgICAgICAgIGlkOiBjcmVhdGVkTWVkaWFJdGVtLmlkLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVtb3RlTm9kZS5sb2NhbEZpbGUgPSB7XG4gICAgICAgICAgICAgIGlkOiBjcmVhdGVkTWVkaWFJdGVtLmlkLFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICByZW1vdGVOb2RlLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcmVtb3RlTm9kZSxcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuICAgIENvbnRlbnROb2RlOiB7XG4gICAgICBub2RlSW50ZXJmYWNlOiB0cnVlLFxuICAgIH0sXG4gICAgQ2F0ZWdvcnk6IHtcbiAgICAgIC8vIEB0b2RvIHJlbW92ZSB0aGlzIHdoZW4gY2F0ZWdvcmllcyBhcmUgYSBmbGF0IGxpc3QgaW4gV1BHUUxcbiAgICAgIGJlZm9yZUNoYW5nZU5vZGU6IGNhdGVnb3J5QmVmb3JlQ2hhbmdlTm9kZSxcbiAgICB9LFxuICAgIE1lbnU6IHtcbiAgICAgIC8qKlxuICAgICAgICogVGhpcyBpcyB1c2VkIHRvIGZldGNoIGNoaWxkIG1lbnUgaXRlbXNcbiAgICAgICAqIG9uIE1lbnVzIGFzIGl0J3MgcHJvYmxlbWF0aWMgdG8gZmV0Y2ggdGhlbSBvdGhlcndpc2VcbiAgICAgICAqIGluIFdQR1FMIGN1cnJlbnRseVxuICAgICAgICpcbiAgICAgICAqIFNvIGFmdGVyIGEgTWVudSBOb2RlIGlzIGZldGNoZWQgYW5kIHByb2Nlc3NlZCwgdGhpcyBmdW5jdGlvbiBydW5zXG4gICAgICAgKiBJdCBsb29wcyB0aHJvdWdoIHRoZSBjaGlsZCBtZW51IGl0ZW1zLCBnZW5lcmF0ZXMgYSBxdWVyeSBmb3IgdGhlbSxcbiAgICAgICAqIGZldGNoZXMgdGhlbSwgYW5kIGNyZWF0ZXMgbm9kZXMgb3V0IG9mIHRoZW0uXG4gICAgICAgKlxuICAgICAgICogVGhpcyBydW5zIHdoZW4gaW5pdGlhbGx5IGZldGNoaW5nIGFsbCBub2RlcywgYW5kIGFmdGVyIGFuIGluY3JlbWVudGFsXG4gICAgICAgKiBmZXRjaCBoYXBwZW5zXG4gICAgICAgKlxuICAgICAgICogV2hlbiB3ZSBjYW4gZ2V0IGEgbGlzdCBvZiBhbGwgbWVudSBpdGVtcyByZWdhcmRsZXNzIG9mIGxvY2F0aW9uIGluIFdQR1FMLCB0aGlzIGNhbiBiZSByZW1vdmVkLlxuICAgICAgICovXG4gICAgICAvLyBAdG9kbyByZW1vdmUgdGhpcyB3aGVuIG1lbnVzIGFyZSBhIGZsYXQgbGlzdCBpbiBXUEdRTFxuICAgICAgYmVmb3JlQ2hhbmdlTm9kZTogbWVudUJlZm9yZUNoYW5nZU5vZGUsXG4gICAgfSxcbiAgICBNZW51SXRlbToge1xuICAgICAgLyoqXG4gICAgICAgKiBUaGlzIHdhcyBteSBwcmV2aW91cyBhdHRlbXB0IGF0IGZldGNoaW5nIHByb2JsZW1hdGljIG1lbnVJdGVtc1xuICAgICAgICogSSB0ZW1wb3JhcmlseSBzb2x2ZWQgdGhpcyBhYm92ZSwgYnV0IEknbSBsZWF2aW5nIHRoaXMgaGVyZSBhc1xuICAgICAgICogYSByZW1pbmRlciBvZiB0aGUgbm9kZUxpc3RRdWVyaWVzIEFQSVxuICAgICAgICpcbiAgICAgICAqIHRoaXMgd29ya2VkIHRvIHB1bGwgYWxsIG1lbnVzIGluIHRoZSBpbml0aWFsIGZldGNoLCBidXQgbWVudXMgaGFkIHRvIGJlIGFzc2lnbmVkIHRvIGEgbG9jYXRpb25cbiAgICAgICAqIHRoYXQgd2FzIHByb2JsZW1hdGljIGJlY2F1c2Ugc2F2aW5nIGEgbWVudSB3b3VsZCB0aGVuIGZldGNoIHRob3NlIG1lbnUgaXRlbXMgdXNpbmcgdGhlIGluY3JlbWVudGFsIGZldGNoaW5nIGxvZ2ljIGluIHRoaXMgcGx1Z2luLiBTbyBtZW51IGl0ZW1zIHRoYXQgcHJldmlvdXNseSBleGlzdGVkIGluIFdQIHdvdWxkbid0IHNob3cgdXAgaW5pdGlhbGx5IGlmIHRoZXkgaGFkIG5vIGxvY2F0aW9uIHNldCwgdGhlbiBhcyBtZW51cyB3ZXJlIHNhdmVkIHRoZXkgd291bGQgc2hvdyB1cC5cbiAgICAgICAqL1xuICAgICAgLy8gbm9kZUxpc3RRdWVyaWVzOiAoe1xuICAgICAgLy8gICBuYW1lLFxuICAgICAgLy8gICBzdG9yZSxcbiAgICAgIC8vICAgdHJhbnNmb3JtZWRGaWVsZHMsXG4gICAgICAvLyAgIGhlbHBlcnM6IHsgYnVpbGROb2Rlc1F1ZXJ5T25GaWVsZE5hbWUgfSxcbiAgICAgIC8vIH0pID0+IHtcbiAgICAgIC8vICAgY29uc3QgbWVudUxvY2F0aW9uRW51bVZhbHVlcyA9IHN0b3JlXG4gICAgICAvLyAgICAgLmdldFN0YXRlKClcbiAgICAgIC8vICAgICAucmVtb3RlU2NoZW1hLmludHJvc3BlY3Rpb25EYXRhLl9fc2NoZW1hLnR5cGVzLmZpbmQoXG4gICAgICAvLyAgICAgICB0eXBlID0+IHR5cGUubmFtZSA9PT0gYE1lbnVMb2NhdGlvbkVudW1gXG4gICAgICAvLyAgICAgKVxuICAgICAgLy8gICAgIC5lbnVtVmFsdWVzLm1hcCh2YWx1ZSA9PiB2YWx1ZS5uYW1lKVxuICAgICAgLy8gICBjb25zdCBxdWVyaWVzID0gbWVudUxvY2F0aW9uRW51bVZhbHVlcy5tYXAoZW51bVZhbHVlID0+XG4gICAgICAvLyAgICAgYnVpbGROb2Rlc1F1ZXJ5T25GaWVsZE5hbWUoe1xuICAgICAgLy8gICAgICAgZmllbGRzOiB0cmFuc2Zvcm1lZEZpZWxkcyxcbiAgICAgIC8vICAgICAgIGZpZWxkTmFtZTogbmFtZSxcbiAgICAgIC8vICAgICAgIGZpZWxkVmFyaWFibGVzOiBgd2hlcmU6IHsgbG9jYXRpb246ICR7ZW51bVZhbHVlfSB9YCxcbiAgICAgIC8vICAgICB9KVxuICAgICAgLy8gICApXG4gICAgICAvLyAgIHJldHVybiBxdWVyaWVzXG4gICAgICAvLyB9LFxuICAgIH0sXG4gICAgLy8gdGhlIG5leHQgdHdvIHR5cGVzIGNhbid0IGJlIHNvdXJjZWQgaW4gR2F0c2J5IHByb3Blcmx5IHlldFxuICAgIC8vIEB0b2RvIGluc3RlYWQgb2YgZXhjbHVkaW5nIHRoZXNlIG1hbnVhbGx5LCBhdXRvIGV4Y2x1ZGUgdGhlbVxuICAgIC8vIGJhc2VkIG9uIGhvdyB0aGV5IGJlaGF2ZSAobm8gc2luZ2xlIG5vZGUgcXVlcnkgYXZhaWxhYmxlKVxuICAgIEVucXVldWVkU2NyaXB0OiB7XG4gICAgICBleGNsdWRlOiB0cnVlLFxuICAgIH0sXG4gICAgRW5xdWV1ZWRTdHlsZXNoZWV0OiB7XG4gICAgICBleGNsdWRlOiB0cnVlLFxuICAgIH0sXG4gICAgRW5xdWV1ZWRBc3NldDoge1xuICAgICAgZXhjbHVkZTogdHJ1ZSxcbiAgICB9LFxuICAgIENvbnRlbnROb2RlVG9FbnF1ZXVlZFNjcmlwdENvbm5lY3Rpb246IHtcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICBDb250ZW50Tm9kZVRvRW5xdWV1ZWRTdHlsZXNoZWV0Q29ubmVjdGlvbjoge1xuICAgICAgZXhjbHVkZTogdHJ1ZSxcbiAgICB9LFxuICAgIFRlcm1Ob2RlVG9FbnF1ZXVlZFNjcmlwdENvbm5lY3Rpb246IHtcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgICBUZXJtTm9kZVRvRW5xdWV1ZWRTdHlsZXNoZWV0Q29ubmVjdGlvbjoge1xuICAgICAgZXhjbHVkZTogdHJ1ZSxcbiAgICB9LFxuICAgIFVzZXJUb0VucXVldWVkU2NyaXB0Q29ubmVjdGlvbjoge1xuICAgICAgZXhjbHVkZTogdHJ1ZSxcbiAgICB9LFxuICAgIFVzZXJUb0VucXVldWVkU3R5bGVzaGVldENvbm5lY3Rpb246IHtcbiAgICAgIGV4Y2x1ZGU6IHRydWUsXG4gICAgfSxcbiAgfSxcbn1cblxuY29uc3QgZ2F0c2J5QXBpID0ge1xuICBzdGF0ZToge1xuICAgIGhlbHBlcnM6IHt9LFxuICAgIHBsdWdpbk9wdGlvbnM6IGRlZmF1bHRQbHVnaW5PcHRpb25zLFxuICB9LFxuXG4gIHJlZHVjZXJzOiB7XG4gICAgc2V0U3RhdGUoc3RhdGUsIHBheWxvYWQpIHtcbiAgICAgIHJldHVybiBtZXJnZShzdGF0ZSwgcGF5bG9hZClcbiAgICB9LFxuICB9LFxufVxuXG5leHBvcnQgZGVmYXVsdCBnYXRzYnlBcGlcbiJdfQ==