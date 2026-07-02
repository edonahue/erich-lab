'use strict';

(() => {
  function syncCredibilityFilter() {
    const select = document.querySelector('#resourceCredibility');
    if (!select) return;
    const desired = document.body.classList.contains('is-personalized') ? 'recommended' : 'all';
    if (select.value === desired) return;
    select.value = desired;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const observer = new MutationObserver(syncCredibilityFilter);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  syncCredibilityFilter();
})();
