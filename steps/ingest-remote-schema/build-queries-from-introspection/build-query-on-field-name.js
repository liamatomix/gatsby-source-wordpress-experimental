"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.buildNodeQueryOnFieldName = exports.buildSelectionSet = exports.buildNodesQueryOnFieldName = exports.generateReusableFragments = void 0;

require("source-map-support/register");

var _graphqlQueryCompress = _interopRequireDefault(require("graphql-query-compress"));

var _store = _interopRequireDefault(require("../../../store"));

var _helpers = require("../../create-schema-customization/helpers");

const buildReusableFragments = ({
  fragments
}) => Object.values(fragments).map(({
  name,
  type,
  fields,
  inlineFragments
}) => `fragment ${name} on ${type} {
      ${buildSelectionSet(fields)}
      ${buildInlineFragments(inlineFragments)}
    }`).join(` `);
/**
 * Takes in a fragments object (built up during the buildSelectionSet function)
 * transforms that object into an actual fragment,
 * then checks for unused fragments and potential regenerates again
 * with the unused fragments removed
 */


const generateReusableFragments = ({
  fragments,
  selectionSet
}) => {
  const fragmentsValues = Object.values(fragments);

  if (!fragmentsValues.length) {
    return ``;
  }

  let builtFragments = buildReusableFragments({
    fragments
  });

  if (fragments) {
    let regenerateFragments = false;
    fragmentsValues.forEach(({
      name,
      type
    }) => {
      // if our query didn't use the fragment due to the query depth AND the fragment isn't used in another fragment, delete it
      // @todo these fragments shouldn't be generated if they wont be used.
      // if we fix this todo, we can use the buildReusableFragments function directly
      // instead of running it twice to remove unused fragments
      if (!selectionSet.includes(`...${name}`) && !builtFragments.includes(`...${name}`)) {
        delete fragments[type];
        regenerateFragments = true;
      }
    });

    if (regenerateFragments) {
      builtFragments = buildReusableFragments({
        fragments
      });
    }
  }

  return builtFragments;
};

exports.generateReusableFragments = generateReusableFragments;

const buildNodesQueryOnFieldName = ({
  fieldName,
  builtSelectionSet,
  builtFragments = ``,
  queryVariables = ``,
  fieldVariables = ``
}) => (0, _graphqlQueryCompress.default)(buildQuery({
  queryName: `NODE_LIST_QUERY`,
  variables: `$first: Int!, $after: String, ${queryVariables}`,
  fieldName,
  fieldVariables: `first: $first, after: $after, ${fieldVariables}`,
  builtSelectionSet: `
        nodes {
          ${builtSelectionSet}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      `,
  builtFragments
}));

exports.buildNodesQueryOnFieldName = buildNodesQueryOnFieldName;

const buildVariables = variables => variables && typeof variables === `string` ? `(${variables})` : ``;

const buildInlineFragment = ({
  name,
  fields,
  fragments
}) => `
  ... on ${name} {
    ${buildSelectionSet(fields, {
  fragments
})}
  }
`;

const buildInlineFragments = (inlineFragments, {
  fragments = {}
} = {}) => inlineFragments ? `
      __typename
      ${inlineFragments.map(inlineFragment => buildInlineFragment(Object.assign({}, inlineFragment, {
  fragments
}))).join(` `)}
    ` : ``;

const buildSelectionSet = (fields, {
  fragments = {}
} = {}) => {
  if (!fields || !fields.length) {
    return ``;
  }

  const {
    remoteSchema: {
      typeMap
    }
  } = _store.default.getState();

  const selectionSet = fields.map(field => {
    if (typeof field === `string`) {
      return field;
    }

    let {
      fieldName,
      variables,
      fields,
      inlineFragments,
      fieldType,
      internalType,
      builtSelectionSet
    } = field;

    if (internalType === `Fragment`) {
      return `...${field.fragment.name}`;
    }

    if ((!variables || variables === ``) && (fields === null || fields === void 0 ? void 0 : fields.find(field => field.fieldName === `nodes`))) {
      // @todo instead of checking for a nodes field, include the field type here
      // and check for input args instead. Maybe some kind of input args API or something would be helpful
      variables = `first: 100`;
    }

    const selectionSet = builtSelectionSet || buildSelectionSet(fields, {
      fragments
    });
    const builtInlineFragments = buildInlineFragments(inlineFragments, {
      fragments
    });

    if (fieldName && (builtInlineFragments !== `` || selectionSet !== ``)) {
      return `
          ${fieldName} ${buildVariables(variables)} {
            ${selectionSet}
            ${builtInlineFragments}
          }
        `;
    } else if (fieldName) {
      const fullFieldType = typeMap.get((0, _helpers.findTypeName)(fieldType)); // if this field has subfields but we didn't build a selection set for it
      // we shouldn't fetch this field. This can happen when we have self referencing types that are limited by the schema.circularQueryLimit plugin option.
      // @todo the above should be fixed in recursively-transform-fields.js instead of here. recursion is hard :p

      if (fullFieldType.fields) {
        return null;
      }

      return fieldName;
    }

    return null;
  }).filter(Boolean).join(`
    `);
  return selectionSet;
};

exports.buildSelectionSet = buildSelectionSet;

const buildQuery = ({
  queryName,
  fieldName,
  fieldVariables,
  variables,
  builtSelectionSet,
  builtFragments = ``
}) => `
  query ${queryName} ${buildVariables(variables)} {
    ${fieldName} ${buildVariables(fieldVariables)} {
      ${builtSelectionSet}
    }
  }

  ${builtFragments}
`;

const buildNodeQueryOnFieldName = ({
  fieldName,
  builtFragments,
  builtSelectionSet,
  variables = `$id: ID!`,
  fieldInputArguments = `id: $id`,
  queryName = `SINGLE_CONTENT_QUERY`
}) => (0, _graphqlQueryCompress.default)(buildQuery({
  queryName,
  variables,
  fieldName,
  fieldVariables: fieldInputArguments,
  builtFragments,
  builtSelectionSet
}));

exports.buildNodeQueryOnFieldName = buildNodeQueryOnFieldName;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9zdGVwcy9pbmdlc3QtcmVtb3RlLXNjaGVtYS9idWlsZC1xdWVyaWVzLWZyb20taW50cm9zcGVjdGlvbi9idWlsZC1xdWVyeS1vbi1maWVsZC1uYW1lLmpzIl0sIm5hbWVzIjpbImJ1aWxkUmV1c2FibGVGcmFnbWVudHMiLCJmcmFnbWVudHMiLCJPYmplY3QiLCJ2YWx1ZXMiLCJtYXAiLCJuYW1lIiwidHlwZSIsImZpZWxkcyIsImlubGluZUZyYWdtZW50cyIsImJ1aWxkU2VsZWN0aW9uU2V0IiwiYnVpbGRJbmxpbmVGcmFnbWVudHMiLCJqb2luIiwiZ2VuZXJhdGVSZXVzYWJsZUZyYWdtZW50cyIsInNlbGVjdGlvblNldCIsImZyYWdtZW50c1ZhbHVlcyIsImxlbmd0aCIsImJ1aWx0RnJhZ21lbnRzIiwicmVnZW5lcmF0ZUZyYWdtZW50cyIsImZvckVhY2giLCJpbmNsdWRlcyIsImJ1aWxkTm9kZXNRdWVyeU9uRmllbGROYW1lIiwiZmllbGROYW1lIiwiYnVpbHRTZWxlY3Rpb25TZXQiLCJxdWVyeVZhcmlhYmxlcyIsImZpZWxkVmFyaWFibGVzIiwiYnVpbGRRdWVyeSIsInF1ZXJ5TmFtZSIsInZhcmlhYmxlcyIsImJ1aWxkVmFyaWFibGVzIiwiYnVpbGRJbmxpbmVGcmFnbWVudCIsImlubGluZUZyYWdtZW50IiwicmVtb3RlU2NoZW1hIiwidHlwZU1hcCIsInN0b3JlIiwiZ2V0U3RhdGUiLCJmaWVsZCIsImZpZWxkVHlwZSIsImludGVybmFsVHlwZSIsImZyYWdtZW50IiwiZmluZCIsImJ1aWx0SW5saW5lRnJhZ21lbnRzIiwiZnVsbEZpZWxkVHlwZSIsImdldCIsImZpbHRlciIsIkJvb2xlYW4iLCJidWlsZE5vZGVRdWVyeU9uRmllbGROYW1lIiwiZmllbGRJbnB1dEFyZ3VtZW50cyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTUEsc0JBQXNCLEdBQUcsQ0FBQztBQUFFQyxFQUFBQTtB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SUFJdEJOLGNBQWU7Q0FkbkI7O0FBaUJPLE1BQU02Qix5QkFBeUIsR0FBRyxDQUFDO0FBQ3hDeEIsRUFBQUEsU0FEd0M7QUFFeENMLEVBQUFBLGNBRndDO0FBR3hDTSxFQUFBQSxpQkFId0M7QUFJeENLLEVBQUFBLFNBQVMsR0FBSSxVQUoyQjtBQUt4Q21CLEVBQUFBLG1CQUFtQixHQUFJLFNBTGlCO0FBTXhDcEIsRUFBQUEsU0FBUyxHQUFJO0FBTjJCLENBQUQsS0FRdkMsbUNBQ0VELFVBQVUsQ0FBQztBQUNUQyxFQUFBQSxTQURTO0FBRVRDLEVBQUFBLFNBRlM7QUFHVE4sRUFBQUEsU0FIUztBQUlURyxFQUFBQSxjQUFjLEVBQUVzQixtQkFKUDtBQUtUOUIsRUFBQUEsY0FMUztBQU1UTSxFQUFBQTtBQU5TLENBQUQsQ0FEWixDQVJLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNvbXByZXNzIGZyb20gXCJncmFwaHFsLXF1ZXJ5LWNvbXByZXNzXCJcbmltcG9ydCBzdG9yZSBmcm9tIFwifi9zdG9yZVwiXG5pbXBvcnQgeyBmaW5kVHlwZU5hbWUgfSBmcm9tIFwifi9zdGVwcy9jcmVhdGUtc2NoZW1hLWN1c3RvbWl6YXRpb24vaGVscGVyc1wiXG5cbmNvbnN0IGJ1aWxkUmV1c2FibGVGcmFnbWVudHMgPSAoeyBmcmFnbWVudHMgfSkgPT5cbiAgT2JqZWN0LnZhbHVlcyhmcmFnbWVudHMpXG4gICAgLm1hcChcbiAgICAgICh7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHR5cGUsXG4gICAgICAgIGZpZWxkcyxcbiAgICAgICAgaW5saW5lRnJhZ21lbnRzLFxuICAgICAgfSkgPT4gYGZyYWdtZW50ICR7bmFtZX0gb24gJHt0eXBlfSB7XG4gICAgICAke2J1aWxkU2VsZWN0aW9uU2V0KGZpZWxkcyl9XG4gICAgICAke2J1aWxkSW5saW5lRnJhZ21lbnRzKGlubGluZUZyYWdtZW50cyl9XG4gICAgfWBcbiAgICApXG4gICAgLmpvaW4oYCBgKVxuXG4vKipcbiAqIFRha2VzIGluIGEgZnJhZ21lbnRzIG9iamVjdCAoYnVpbHQgdXAgZHVyaW5nIHRoZSBidWlsZFNlbGVjdGlvblNldCBmdW5jdGlvbilcbiAqIHRyYW5zZm9ybXMgdGhhdCBvYmplY3QgaW50byBhbiBhY3R1YWwgZnJhZ21lbnQsXG4gKiB0aGVuIGNoZWNrcyBmb3IgdW51c2VkIGZyYWdtZW50cyBhbmQgcG90ZW50aWFsIHJlZ2VuZXJhdGVzIGFnYWluXG4gKiB3aXRoIHRoZSB1bnVzZWQgZnJhZ21lbnRzIHJlbW92ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IGdlbmVyYXRlUmV1c2FibGVGcmFnbWVudHMgPSAoeyBmcmFnbWVudHMsIHNlbGVjdGlvblNldCB9KSA9PiB7XG4gIGNvbnN0IGZyYWdtZW50c1ZhbHVlcyA9IE9iamVjdC52YWx1ZXMoZnJhZ21lbnRzKVxuXG4gIGlmICghZnJhZ21lbnRzVmFsdWVzLmxlbmd0aCkge1xuICAgIHJldHVybiBgYFxuICB9XG5cbiAgbGV0IGJ1aWx0RnJhZ21lbnRzID0gYnVpbGRSZXVzYWJsZUZyYWdtZW50cyh7IGZyYWdtZW50cyB9KVxuXG4gIGlmIChmcmFnbWVudHMpIHtcbiAgICBsZXQgcmVnZW5lcmF0ZUZyYWdtZW50cyA9IGZhbHNlXG5cbiAgICBmcmFnbWVudHNWYWx1ZXMuZm9yRWFjaCgoeyBuYW1lLCB0eXBlIH0pID0+IHtcbiAgICAgIC8vIGlmIG91ciBxdWVyeSBkaWRuJ3QgdXNlIHRoZSBmcmFnbWVudCBkdWUgdG8gdGhlIHF1ZXJ5IGRlcHRoIEFORCB0aGUgZnJhZ21lbnQgaXNuJ3QgdXNlZCBpbiBhbm90aGVyIGZyYWdtZW50LCBkZWxldGUgaXRcbiAgICAgIC8vIEB0b2RvIHRoZXNlIGZyYWdtZW50cyBzaG91bGRuJ3QgYmUgZ2VuZXJhdGVkIGlmIHRoZXkgd29udCBiZSB1c2VkLlxuICAgICAgLy8gaWYgd2UgZml4IHRoaXMgdG9kbywgd2UgY2FuIHVzZSB0aGUgYnVpbGRSZXVzYWJsZUZyYWdtZW50cyBmdW5jdGlvbiBkaXJlY3RseVxuICAgICAgLy8gaW5zdGVhZCBvZiBydW5uaW5nIGl0IHR3aWNlIHRvIHJlbW92ZSB1bnVzZWQgZnJhZ21lbnRzXG4gICAgICBpZiAoXG4gICAgICAgICFzZWxlY3Rpb25TZXQuaW5jbHVkZXMoYC4uLiR7bmFtZX1gKSAmJlxuICAgICAgICAhYnVpbHRGcmFnbWVudHMuaW5jbHVkZXMoYC4uLiR7bmFtZX1gKVxuICAgICAgKSB7XG4gICAgICAgIGRlbGV0ZSBmcmFnbWVudHNbdHlwZV1cbiAgICAgICAgcmVnZW5lcmF0ZUZyYWdtZW50cyA9IHRydWVcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKHJlZ2VuZXJhdGVGcmFnbWVudHMpIHtcbiAgICAgIGJ1aWx0RnJhZ21lbnRzID0gYnVpbGRSZXVzYWJsZUZyYWdtZW50cyh7IGZyYWdtZW50cyB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBidWlsdEZyYWdtZW50c1xufVxuXG5leHBvcnQgY29uc3QgYnVpbGROb2Rlc1F1ZXJ5T25GaWVsZE5hbWUgPSAoe1xuICBmaWVsZE5hbWUsXG4gIGJ1aWx0U2VsZWN0aW9uU2V0LFxuICBidWlsdEZyYWdtZW50cyA9IGBgLFxuICBxdWVyeVZhcmlhYmxlcyA9IGBgLFxuICBmaWVsZFZhcmlhYmxlcyA9IGBgLFxufSkgPT5cbiAgY29tcHJlc3MoXG4gICAgYnVpbGRRdWVyeSh7XG4gICAgICBxdWVyeU5hbWU6IGBOT0RFX0xJU1RfUVVFUllgLFxuICAgICAgdmFyaWFibGVzOiBgJGZpcnN0OiBJbnQhLCAkYWZ0ZXI6IFN0cmluZywgJHtxdWVyeVZhcmlhYmxlc31gLFxuICAgICAgZmllbGROYW1lLFxuICAgICAgZmllbGRWYXJpYWJsZXM6IGBmaXJzdDogJGZpcnN0LCBhZnRlcjogJGFmdGVyLCAke2ZpZWxkVmFyaWFibGVzfWAsXG4gICAgICBidWlsdFNlbGVjdGlvblNldDogYFxuICAgICAgICBub2RlcyB7XG4gICAgICAgICAgJHtidWlsdFNlbGVjdGlvblNldH1cbiAgICAgICAgfVxuICAgICAgICBwYWdlSW5mbyB7XG4gICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgICBlbmRDdXJzb3JcbiAgICAgICAgfVxuICAgICAgYCxcbiAgICAgIGJ1aWx0RnJhZ21lbnRzLFxuICAgIH0pXG4gIClcblxuY29uc3QgYnVpbGRWYXJpYWJsZXMgPSAodmFyaWFibGVzKSA9PlxuICB2YXJpYWJsZXMgJiYgdHlwZW9mIHZhcmlhYmxlcyA9PT0gYHN0cmluZ2AgPyBgKCR7dmFyaWFibGVzfSlgIDogYGBcblxuY29uc3QgYnVpbGRJbmxpbmVGcmFnbWVudCA9ICh7IG5hbWUsIGZpZWxkcywgZnJhZ21lbnRzIH0pID0+IGBcbiAgLi4uIG9uICR7bmFtZX0ge1xuICAgICR7YnVpbGRTZWxlY3Rpb25TZXQoZmllbGRzLCB7IGZyYWdtZW50cyB9KX1cbiAgfVxuYFxuXG5jb25zdCBidWlsZElubGluZUZyYWdtZW50cyA9IChpbmxpbmVGcmFnbWVudHMsIHsgZnJhZ21lbnRzID0ge30gfSA9IHt9KSA9PlxuICBpbmxpbmVGcmFnbWVudHNcbiAgICA/IGBcbiAgICAgIF9fdHlwZW5hbWVcbiAgICAgICR7aW5saW5lRnJhZ21lbnRzXG4gICAgICAgIC5tYXAoKGlubGluZUZyYWdtZW50KSA9PlxuICAgICAgICAgIGJ1aWxkSW5saW5lRnJhZ21lbnQoeyAuLi5pbmxpbmVGcmFnbWVudCwgZnJhZ21lbnRzIH0pXG4gICAgICAgIClcbiAgICAgICAgLmpvaW4oYCBgKX1cbiAgICBgXG4gICAgOiBgYFxuXG5leHBvcnQgY29uc3QgYnVpbGRTZWxlY3Rpb25TZXQgPSAoZmllbGRzLCB7IGZyYWdtZW50cyA9IHt9IH0gPSB7fSkgPT4ge1xuICBpZiAoIWZpZWxkcyB8fCAhZmllbGRzLmxlbmd0aCkge1xuICAgIHJldHVybiBgYFxuICB9XG5cbiAgY29uc3Qge1xuICAgIHJlbW90ZVNjaGVtYTogeyB0eXBlTWFwIH0sXG4gIH0gPSBzdG9yZS5nZXRTdGF0ZSgpXG5cbiAgY29uc3Qgc2VsZWN0aW9uU2V0ID0gZmllbGRzXG4gICAgLm1hcCgoZmllbGQpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgZmllbGQgPT09IGBzdHJpbmdgKSB7XG4gICAgICAgIHJldHVybiBmaWVsZFxuICAgICAgfVxuXG4gICAgICBsZXQge1xuICAgICAgICBmaWVsZE5hbWUsXG4gICAgICAgIHZhcmlhYmxlcyxcbiAgICAgICAgZmllbGRzLFxuICAgICAgICBpbmxpbmVGcmFnbWVudHMsXG4gICAgICAgIGZpZWxkVHlwZSxcbiAgICAgICAgaW50ZXJuYWxUeXBlLFxuICAgICAgICBidWlsdFNlbGVjdGlvblNldCxcbiAgICAgIH0gPSBmaWVsZFxuXG4gICAgICBpZiAoaW50ZXJuYWxUeXBlID09PSBgRnJhZ21lbnRgKSB7XG4gICAgICAgIHJldHVybiBgLi4uJHtmaWVsZC5mcmFnbWVudC5uYW1lfWBcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICAoIXZhcmlhYmxlcyB8fCB2YXJpYWJsZXMgPT09IGBgKSAmJlxuICAgICAgICBmaWVsZHM/LmZpbmQoKGZpZWxkKSA9PiBmaWVsZC5maWVsZE5hbWUgPT09IGBub2Rlc2ApXG4gICAgICApIHtcbiAgICAgICAgLy8gQHRvZG8gaW5zdGVhZCBvZiBjaGVja2luZyBmb3IgYSBub2RlcyBmaWVsZCwgaW5jbHVkZSB0aGUgZmllbGQgdHlwZSBoZXJlXG4gICAgICAgIC8vIGFuZCBjaGVjayBmb3IgaW5wdXQgYXJncyBpbnN0ZWFkLiBNYXliZSBzb21lIGtpbmQgb2YgaW5wdXQgYXJncyBBUEkgb3Igc29tZXRoaW5nIHdvdWxkIGJlIGhlbHBmdWxcbiAgICAgICAgdmFyaWFibGVzID0gYGZpcnN0OiAxMDBgXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNlbGVjdGlvblNldCA9XG4gICAgICAgIGJ1aWx0U2VsZWN0aW9uU2V0IHx8XG4gICAgICAgIGJ1aWxkU2VsZWN0aW9uU2V0KGZpZWxkcywge1xuICAgICAgICAgIGZyYWdtZW50cyxcbiAgICAgICAgfSlcblxuICAgICAgY29uc3QgYnVpbHRJbmxpbmVGcmFnbWVudHMgPSBidWlsZElubGluZUZyYWdtZW50cyhpbmxpbmVGcmFnbWVudHMsIHtcbiAgICAgICAgZnJhZ21lbnRzLFxuICAgICAgfSlcblxuICAgICAgaWYgKGZpZWxkTmFtZSAmJiAoYnVpbHRJbmxpbmVGcmFnbWVudHMgIT09IGBgIHx8IHNlbGVjdGlvblNldCAhPT0gYGApKSB7XG4gICAgICAgIHJldHVybiBgXG4gICAgICAgICAgJHtmaWVsZE5hbWV9ICR7YnVpbGRWYXJpYWJsZXModmFyaWFibGVzKX0ge1xuICAgICAgICAgICAgJHtzZWxlY3Rpb25TZXR9XG4gICAgICAgICAgICAke2J1aWx0SW5saW5lRnJhZ21lbnRzfVxuICAgICAgICAgIH1cbiAgICAgICAgYFxuICAgICAgfSBlbHNlIGlmIChmaWVsZE5hbWUpIHtcbiAgICAgICAgY29uc3QgZnVsbEZpZWxkVHlwZSA9IHR5cGVNYXAuZ2V0KGZpbmRUeXBlTmFtZShmaWVsZFR5cGUpKVxuXG4gICAgICAgIC8vIGlmIHRoaXMgZmllbGQgaGFzIHN1YmZpZWxkcyBidXQgd2UgZGlkbid0IGJ1aWxkIGEgc2VsZWN0aW9uIHNldCBmb3IgaXRcbiAgICAgICAgLy8gd2Ugc2hvdWxkbid0IGZldGNoIHRoaXMgZmllbGQuIFRoaXMgY2FuIGhhcHBlbiB3aGVuIHdlIGhhdmUgc2VsZiByZWZlcmVuY2luZyB0eXBlcyB0aGF0IGFyZSBsaW1pdGVkIGJ5IHRoZSBzY2hlbWEuY2lyY3VsYXJRdWVyeUxpbWl0IHBsdWdpbiBvcHRpb24uXG4gICAgICAgIC8vIEB0b2RvIHRoZSBhYm92ZSBzaG91bGQgYmUgZml4ZWQgaW4gcmVjdXJzaXZlbHktdHJhbnNmb3JtLWZpZWxkcy5qcyBpbnN0ZWFkIG9mIGhlcmUuIHJlY3Vyc2lvbiBpcyBoYXJkIDpwXG4gICAgICAgIGlmIChmdWxsRmllbGRUeXBlLmZpZWxkcykge1xuICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZmllbGROYW1lXG4gICAgICB9XG5cbiAgICAgIHJldHVybiBudWxsXG4gICAgfSlcbiAgICAuZmlsdGVyKEJvb2xlYW4pLmpvaW4oYFxuICAgIGApXG5cbiAgcmV0dXJuIHNlbGVjdGlvblNldFxufVxuXG5jb25zdCBidWlsZFF1ZXJ5ID0gKHtcbiAgcXVlcnlOYW1lLFxuICBmaWVsZE5hbWUsXG4gIGZpZWxkVmFyaWFibGVzLFxuICB2YXJpYWJsZXMsXG4gIGJ1aWx0U2VsZWN0aW9uU2V0LFxuICBidWlsdEZyYWdtZW50cyA9IGBgLFxufSkgPT4gYFxuICBxdWVyeSAke3F1ZXJ5TmFtZX0gJHtidWlsZFZhcmlhYmxlcyh2YXJpYWJsZXMpfSB7XG4gICAgJHtmaWVsZE5hbWV9ICR7YnVpbGRWYXJpYWJsZXMoZmllbGRWYXJpYWJsZXMpfSB7XG4gICAgICAke2J1aWx0U2VsZWN0aW9uU2V0fVxuICAgIH1cbiAgfVxuXG4gICR7YnVpbHRGcmFnbWVudHN9XG5gXG5cbmV4cG9ydCBjb25zdCBidWlsZE5vZGVRdWVyeU9uRmllbGROYW1lID0gKHtcbiAgZmllbGROYW1lLFxuICBidWlsdEZyYWdtZW50cyxcbiAgYnVpbHRTZWxlY3Rpb25TZXQsXG4gIHZhcmlhYmxlcyA9IGAkaWQ6IElEIWAsXG4gIGZpZWxkSW5wdXRBcmd1bWVudHMgPSBgaWQ6ICRpZGAsXG4gIHF1ZXJ5TmFtZSA9IGBTSU5HTEVfQ09OVEVOVF9RVUVSWWAsXG59KSA9PlxuICBjb21wcmVzcyhcbiAgICBidWlsZFF1ZXJ5KHtcbiAgICAgIHF1ZXJ5TmFtZSxcbiAgICAgIHZhcmlhYmxlcyxcbiAgICAgIGZpZWxkTmFtZSxcbiAgICAgIGZpZWxkVmFyaWFibGVzOiBmaWVsZElucHV0QXJndW1lbnRzLFxuICAgICAgYnVpbHRGcmFnbWVudHMsXG4gICAgICBidWlsdFNlbGVjdGlvblNldCxcbiAgICB9KVxuICApXG4iXX0=