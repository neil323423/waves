(function () {
    document.addEventListener('DOMContentLoaded', function () {
       function getSearchInputs() {
          return [
             document.getElementById('searchInput'),
             document.getElementById('searchInputt'),
             document.getElementById('gameSearchInput'),
             document.getElementById('appSearchInput')
          ].filter(Boolean);
       }
 
       function isVisible(el) {
          return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
       }
 
       function focusFirstVisibleInput() {
          const inputs = getSearchInputs();
          for (const input of inputs) {
             if (isVisible(input)) {
                input.focus();
                return;
             }
          }
          if (inputs.length) {
             inputs[0].focus();
          }
       }
 
       document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
             const inputs = getSearchInputs();
             const active = document.activeElement;
             if (inputs.includes(active)) {
                active.blur();
                e.preventDefault();
                return;
             }
          }
 
          if (e.ctrlKey && e.key.toLowerCase() === 's') {
             e.preventDefault();
             focusFirstVisibleInput();
          }
       });
 
       document.querySelectorAll(
          '.shortcut-indicator, .shortcut-indicator-2, .shortcut-indicator-3, .shortcut-indicator-4'
       ).forEach(function (el) {
          el.addEventListener('click', function (e) {
             e.preventDefault();
             focusFirstVisibleInput();
          });
       });
 
       document.body.addEventListener('click', function (e) {
          if (
             e.target.classList.contains('shortcut-indicator') ||
             e.target.classList.contains('shortcut-indicator-2') ||
             e.target.classList.contains('shortcut-indicator-3') ||
             e.target.classList.contains('shortcut-indicator-4')
          ) {
             e.preventDefault();
             focusFirstVisibleInput();
          }
       });
 
       const coolIframe = document.getElementById('cool-iframe');
       if (coolIframe) {
          coolIframe.addEventListener('load', function () {
             const doc = coolIframe.contentWindow.document;
 
             doc.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') {
                   if (doc.activeElement && doc.activeElement.blur) {
                      doc.activeElement.blur();
                      e.preventDefault();
                      return;
                   }
                }
                if (e.ctrlKey && e.key.toLowerCase() === 's') {
                   e.preventDefault();
                   document.dispatchEvent(new KeyboardEvent('keydown', {
                      key: 's',
                      ctrlKey: true
                   }));
                }
             });
 
             doc.querySelectorAll(
                '.shortcut-indicator, .shortcut-indicator-2, .shortcut-indicator-3, .shortcut-indicator-4'
             ).forEach(function (iframeEl) {
                iframeEl.addEventListener('click', function (e) {
                   e.preventDefault();
                   window.parent.postMessage({
                      type: 'iframe-focus-search'
                   }, '*');
                });
             });
          });
       }
 
       window.addEventListener('message', function (event) {
          const msg = event.data;
          if (msg.type === 'iframe-focus-search') {
             focusFirstVisibleInput();
          }
       });
    });
 })();