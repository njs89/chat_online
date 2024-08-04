export function initializeMenu() {
    const menu = `
        <nav class="bottom-menu">
            <a href="mainpage.html" class="menu-item" data-page="mainpage">
                <img src="/icons/profile.svg" alt="Profile" class="menu-icon">
                <span>Profile</span>
            </a>
            <a href="match.html" class="menu-item" data-page="match">
                <img src="/icons/match.svg" alt="Match" class="menu-icon">
                <span>Match</span>
            </a>
            <a href="settings.html" class="menu-item" data-page="settings">
                <img src="/icons/settings.svg" alt="Settings" class="menu-icon">
                <span>Settings</span>
            </a>
        </nav>
    `;

    document.body.insertAdjacentHTML('beforeend', menu);

    // Set active menu item based on current page
    const currentPage = window.location.pathname.split('/').pop().split('.')[0];
    const activeItem = document.querySelector(`.menu-item[data-page="${currentPage}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}