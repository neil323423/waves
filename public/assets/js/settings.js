const settingsIcon = document.getElementById('settings-icon');
const settingsMenu = document.getElementById('settings-menu');
const closeSettingsButton = document.getElementById('close-settings');

settingsIcon.addEventListener('click', (event) => {
  event.preventDefault();

  if (settingsMenu.classList.contains('open')) {
    settingsMenu.classList.add('close');
    setTimeout(() => {
      settingsMenu.classList.remove('open', 'close');
    }, 300);
  } else {
    settingsMenu.classList.add('open');
    setTimeout(() => {
      settingsMenu.classList.remove('close');
    }, 300);
  }
});

closeSettingsButton.addEventListener('click', () => {
  settingsMenu.classList.add('close');
  setTimeout(() => {
    settingsMenu.classList.remove('open', 'close');
  }, 300); 
});
