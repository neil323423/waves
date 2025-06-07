(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const indicators = document.querySelectorAll('.shortcut-indicator, .shortcut-indicator-2, .shortcut-indicator-3, .shortcut-indicator-4');
    const arrowIndicators = document.querySelectorAll('.shortcut-indicator, .shortcut-indicator-2');
    indicators.forEach(el => {
      if (!el.dataset.original) el.dataset.original = el.innerHTML;
    });

    function getSearchInputs(){
      return [
        document.getElementById('searchInput'),
        document.getElementById('searchInputt'),
        document.getElementById('gameSearchInput'),
        document.getElementById('shortcutSearchInput')
      ].filter(Boolean);
    }

    function isVisible(el){
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function focusFirstVisibleInput(){
      const inputs = getSearchInputs();
      for (let inp of inputs) {
        if (isVisible(inp)) {
          inp.focus();
          return inp;
        }
      }
      if (inputs[0]) {
        inputs[0].focus();
        return inputs[0];
      }
      return null;
    }

    let arrowMode = false;

    function updateIndicatorState(){
      const hasText = getSearchInputs().some(i => i.value.trim() !== '');
      if (hasText === arrowMode) return;
      arrowMode = hasText;
      arrowIndicators.forEach(ind => {
        ind.classList.remove('fadeIn');
        ind.classList.add('fadeOut');
        setTimeout(() => {
          if (hasText) {
            ind.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
            ind.classList.add('arrow-mode');
          } else {
            ind.innerHTML = ind.dataset.original;
            ind.classList.remove('arrow-mode');
          }
          ind.classList.remove('fadeOut');
          ind.classList.add('fadeIn');
        }, 100);
      });
    }

    function triggerSubmit(input){
      const query = input.value.trim();
      if (!query) {
        showToast('Please enter something in the Search Bar.','error','warning');
        return;
      }
      if (window.APP && typeof APP.handleSearch === 'function') {
        APP.handleSearch(query);
        if (input.id === 'searchInput') input.value = '';
      }
    }

    function handleIndicatorAction(){
      const inputs = getSearchInputs().filter(isVisible);
      const active = document.activeElement;
      if (inputs.includes(active) && active.value.trim()) {
        triggerSubmit(active);
        return;
      }
      const withText = inputs.find(i => i.value.trim());
      if (withText) {
        triggerSubmit(withText);
        return;
      }
      focusFirstVisibleInput();
    }

    updateIndicatorState();
    getSearchInputs().forEach(i => i.addEventListener('input', updateIndicatorState));

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const act = document.activeElement;
        if (getSearchInputs().includes(act)) {
          act.blur();
          e.preventDefault();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        focusFirstVisibleInput();
      }
    });

    document.body.addEventListener('click', e => {
      const ind = e.target.closest('.shortcut-indicator, .shortcut-indicator-2, .shortcut-indicator-3, .shortcut-indicator-4');
      if (!ind) return;
      e.preventDefault();
      if (ind.classList.contains('arrow-mode')) {
        handleIndicatorAction();
      } else {
        focusFirstVisibleInput();
      }
    });

    const coolIframe = document.getElementById('cool-iframe');
    if (coolIframe){
      coolIframe.addEventListener('load', () => {
        const doc = coolIframe.contentWindow.document;
        doc.addEventListener('keydown', innerE => {
          if (innerE.key === 'Escape') {
            if (doc.activeElement.blur) doc.activeElement.blur();
            innerE.preventDefault();
          }
          if (innerE.ctrlKey && innerE.key.toLowerCase() === 's') {
            innerE.preventDefault();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
          }
        });
        doc.querySelectorAll('.shortcut-indicator, .shortcut-indicator-2, .shortcut-indicator-3, .shortcut-indicator-4')
          .forEach(el => {
            el.addEventListener('click', ev => {
              ev.preventDefault();
              window.parent.postMessage({ type: 'iframe-focus-search' }, '*');
            });
          });
      });
    }

    window.addEventListener('message', msgEvt => {
      if (msgEvt.data?.type === 'iframe-focus-search'){
        const inp = focusFirstVisibleInput();
        if (inp && inp.value.trim()) triggerSubmit(inp);
      }
    });

  });
})();