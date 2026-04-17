$(document).ready(function () {
    // Helper to wait for Firebase variables to be available on window
    async function waitForFirebase() {
        return new Promise((resolve) => {
            const checkFallback = setInterval(() => {
                if (window.firebaseDb && window.firebaseFirestoreVars) {
                    clearInterval(checkFallback);
                    resolve();
                }
            }, 50);
            // Safety timeout
            setTimeout(() => { clearInterval(checkFallback); resolve(); }, 3000);
        });
    }

    async function loadLegalData() {
        try {
            await waitForFirebase();

            const { doc, getDoc } = window.firebaseFirestoreVars;
            const settingsRef = doc(window.firebaseDb, "settings", "main");
            const docSnap = await getDoc(settingsRef);

            if (docSnap.exists()) {
                const settings = docSnap.data();
                
                // Update Brand & Site Info
                if (settings.siteInfo) {
                    const brand = settings.siteInfo.brandName || 'Vivek Suryavanshi';
                    
                    // Update Tab Title
                    const pageTitle = $('h1').first().text() || 'Legal';
                    document.title = `${pageTitle} | ${brand}`;
                    
                    // Update Navbar Brand
                    if (brand.toUpperCase() === 'VIVEK' || brand.toUpperCase() === 'SURYAVANSHI' || brand.toUpperCase() === 'VIVEK SURYAVANSHI') {
                        $('#nav-brand').html('Vivek<span class="text-brand-500">Suryavanshi</span>');
                    } else if (brand.toUpperCase() === 'PHOTOFIXX') {
                        $('#nav-brand').html('PHOTO<span class="text-brand-500">FIXX</span>');
                    } else {
                        $('#nav-brand').text(brand);
                    }

                    // Update Footer Copyright
                    $('#footer-copyright-name').text(`${brand} Studio`);
                }
            }
        } catch (error) {
            // Fallback to static content
        }
    }

    function updateThemeIcons() {
        const isDark = $('html').hasClass('dark');
        if (isDark) {
            $('.theme-icon-light').removeClass('hidden');
            $('.theme-icon-dark').addClass('hidden');
        } else {
            $('.theme-icon-light').addClass('hidden');
            $('.theme-icon-dark').removeClass('hidden');
        }
    }

    $('#theme-toggle').click(function() {
        const isDark = $('html').hasClass('dark');
        if (isDark) {
            $('html').removeClass('dark');
            localStorage.setItem('theme', 'light');
        } else {
            $('html').addClass('dark');
            localStorage.setItem('theme', 'dark');
        }
        updateThemeIcons();
    });

    // Initialize
    updateThemeIcons();
    loadLegalData();
});
