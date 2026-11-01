import useCaseExportName from './rules/use-case-export-name.js';
import tagMatchesTypeName from './rules/tag-matches-type-name.js';
import actionsUseCommands from './rules/actions-use-commands.js';

// Only rules that need what ast-grep lacks: the file name, two captured texts, or the file system.
export const rules = {
  'use-case-export-name': useCaseExportName, // NX-NAME-03
  'tag-matches-type-name': tagMatchesTypeName, // NX-ERR-02, NX-NAME-22, NX-NAME-62
  'actions-use-commands': actionsUseCommands, // NX-LAYER-11
};
