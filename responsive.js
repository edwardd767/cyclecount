(() => {
  const body = document.body;
  const sidebar = document.querySelector('.sidebar');
  const menuButtons = document.querySelectorAll('#menu, #menuButton, .hamburger, .menu-button');

  menuButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (window.innerWidth <= 768 && sidebar) {
        event.preventDefault();
        event.stopPropagation();
        body.classList.toggle('mobile-menu-open');
      }
    }, true);
  });

  document.addEventListener('click', event => {
    if (window.innerWidth <= 768 && body.classList.contains('mobile-menu-open')) {
      const clickedSidebar = event.target.closest('.sidebar');
      const clickedMenu = event.target.closest('#menu, #menuButton, .hamburger, .menu-button');
      if (!clickedSidebar && !clickedMenu) body.classList.remove('mobile-menu-open');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) body.classList.remove('mobile-menu-open');
  });
})();
