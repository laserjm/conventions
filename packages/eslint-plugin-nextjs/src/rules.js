import actionSuffix from './rules/action-suffix.js';
import useCaseExportName from './rules/use-case-export-name.js';
import noInlineCacheTags from './rules/no-inline-cache-tags.js';
import tagMatchesTypeName from './rules/tag-matches-type-name.js';
import noServerExportsFromIndex from './rules/no-server-exports-from-index.js';
import schemaSuffix from './rules/schema-suffix.js';
import requireServerOnly from './rules/require-server-only.js';
import actionsUseCommands from './rules/actions-use-commands.js';

export const rules = {
  'action-suffix': actionSuffix, // NX-NAME-50
  'use-case-export-name': useCaseExportName, // NX-NAME-03
  'no-inline-cache-tags': noInlineCacheTags, // NX-CACHE-02
  'tag-matches-type-name': tagMatchesTypeName, // NX-ERR-02, NX-NAME-62
  'no-server-exports-from-index': noServerExportsFromIndex, // NX-LAYER-05, NX-NAME-12
  'schema-suffix': schemaSuffix, // NX-NAME-60, NX-ZOD-02
  'require-server-only': requireServerOnly, // NX-LAYER-05, NX-LAYER-11
  'actions-use-commands': actionsUseCommands, // NX-LAYER-11
};
