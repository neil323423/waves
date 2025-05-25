document.addEventListener('DOMContentLoaded', function () {

  NProgress.configure({ showSpinner: false });
  NProgress.start();

  const titleElement = document.querySelector('.search-title');
  if (titleElement) {
    const text = titleElement.textContent.trim();
    titleElement.textContent = '';
    text.split('').forEach((letter, i) => {
      const span = document.createElement('span');
      span.textContent = letter;
      span.style.animationDelay = `${i * 0.05}s`;
      titleElement.appendChild(span);
    });
  }

  window.addEventListener('load', function () {
    NProgress.done();
  });
});