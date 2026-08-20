export function hasAdvancedControls(module) {
  return Boolean(
    module.controls?.some(control => control.advanced)
    || module.scenarioFields?.some(control => control.advanced)
    || module.advancedControls?.some(control => control.advanced)
  );
}

export function calculationStateForAdvanced(module, state, advancedEnabled) {
  if (advancedEnabled || !hasAdvancedControls(module)) {
    return state;
  }

  const nextState = [...(module.controls || []), ...(module.advancedControls || [])].reduce((next, meta) => {
    if (meta.advanced) {
      next[meta.id] = inactiveAdvancedValue(meta);
    }
    return next;
  }, { ...state });

  if (Array.isArray(nextState.scenarios) && module.scenarioFields?.some(meta => meta.advanced)) {
    nextState.scenarios = nextState.scenarios.map(scenario => module.scenarioFields.reduce((nextScenario, meta) => {
      if (meta.advanced) {
        nextScenario[meta.id] = inactiveAdvancedValue(meta);
      }
      return nextScenario;
    }, { ...scenario }));
  }

  return nextState;
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
