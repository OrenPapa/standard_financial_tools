const TOOLTIP_MARGIN = 12;
let activeTrigger = null;
let tooltipEl = null;

export function initializeTooltips() {
  document.documentElement.classList.add('tooltip-enhanced');
  tooltipEl = document.getElementById('floatingTooltip');

  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.id = 'floatingTooltip';
    tooltipEl.className = 'floating-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipEl);
  }

  document.addEventListener('mouseover', event => {
    const trigger = event.target.closest?.('.info-tip');
    if (trigger) showTooltip(trigger);
  });

  document.addEventListener('mouseout', event => {
    const trigger = event.target.closest?.('.info-tip');
    if (trigger && !trigger.contains(event.relatedTarget)) hideTooltip(trigger);
  });

  document.addEventListener('focusin', event => {
    const trigger = event.target.closest?.('.info-tip');
    if (trigger) showTooltip(trigger);
  });

  document.addEventListener('focusout', event => {
    const trigger = event.target.closest?.('.info-tip');
    if (trigger) hideTooltip(trigger);
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest?.('.info-tip');

    if (trigger) {
      event.preventDefault();
      if (activeTrigger === trigger && tooltipEl.classList.contains('is-visible')) {
        hideTooltip(trigger);
      } else {
        showTooltip(trigger);
      }
      return;
    }

    hideTooltip();
  });

  window.addEventListener('resize', () => hideTooltip());
  window.addEventListener('scroll', () => hideTooltip(), true);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideTooltip();
  });
}

function showTooltip(trigger) {
  const source = trigger.querySelector('.tip-text');
  const text = source?.textContent?.trim();
  if (!text || !tooltipEl) return;

  activeTrigger = trigger;
  tooltipEl.textContent = text;
  tooltipEl.style.maxWidth = `${Math.min(280, window.innerWidth - TOOLTIP_MARGIN * 2)}px`;
  tooltipEl.classList.add('is-measuring');
  tooltipEl.classList.add('is-visible');

  requestAnimationFrame(() => {
    positionTooltip(trigger);
    tooltipEl.classList.remove('is-measuring');
  });
}

function hideTooltip(trigger = activeTrigger) {
  if (trigger && activeTrigger && trigger !== activeTrigger) return;
  activeTrigger = null;
  if (!tooltipEl) return;
  tooltipEl.classList.remove('is-visible');
  tooltipEl.classList.remove('is-measuring');
}

function positionTooltip(trigger) {
  if (!tooltipEl) return;

  const triggerRect = trigger.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centeredX = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
  const x = clamp(centeredX, TOOLTIP_MARGIN, viewportWidth - tooltipRect.width - TOOLTIP_MARGIN);
  const spaceAbove = triggerRect.top - TOOLTIP_MARGIN;
  const spaceBelow = viewportHeight - triggerRect.bottom - TOOLTIP_MARGIN;
  const shouldOpenBelow = spaceBelow >= tooltipRect.height || spaceBelow > spaceAbove;
  const y = shouldOpenBelow
    ? Math.min(triggerRect.bottom + 8, viewportHeight - tooltipRect.height - TOOLTIP_MARGIN)
    : Math.max(TOOLTIP_MARGIN, triggerRect.top - tooltipRect.height - 8);

  tooltipEl.style.left = `${Math.round(x)}px`;
  tooltipEl.style.top = `${Math.round(y)}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}
