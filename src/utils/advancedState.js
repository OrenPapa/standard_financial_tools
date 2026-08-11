export function hasAdvancedControls(module) {
  return module.controls.some(control => control.advanced);
}

export function calculationStateForAdvanced(module, state, advancedEnabled) {
  if (advancedEnabled || !hasAdvancedControls(module)) {
    return state;
  }

  return module.controls.reduce((nextState, meta) => {
    if (meta.advanced) {
      nextState[meta.id] = inactiveAdvancedValue(meta);
    }
    return nextState;
  }, { ...state });
}

export function visibleTableForAdvanced(module, table, advancedEnabled) {
  if (advancedEnabled || !module.advancedTableColumnKeys?.length) {
    return table;
  }

  const advancedColumnKeys = new Set(module.advancedTableColumnKeys);
  return {
    ...table,
    columns: table.columns.filter(column => !advancedColumnKeys.has(column.key))
  };
}

function inactiveAdvancedValue(meta) {
  if (Object.hasOwn(meta, 'inactiveValue')) return meta.inactiveValue;
  if (meta.type === 'select') return meta.options[0]?.[0] ?? '';
  if (meta.type === 'checkbox') return false;
  return 0;
}
