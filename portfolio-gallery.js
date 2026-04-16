$(document).ready(function () {
  let allPortfolioItems = [];
  let filteredItems = [];
  let currentLightboxIndex = 0;
  let activeFilter = "All";
  let searchQuery = "";

  // Initialize AOS
  AOS.init({ duration: 800, once: true, offset: 50 });

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function extractInstagramHandle(url) {
    if (!url) return '';
    try {
      const parts = url.split('instagram.com/')[1];
      if (!parts) return '';
      const handle = parts.split('/')[0].split('?')[0];
      return handle ? `@${handle}` : '';
    } catch (e) {
      return '';
    }
  }

  // ========== DATA FETCHING ==========
  async function loadGalleryData() {
    try {
      // Ensure Firebase initializes
      await new Promise(r => setTimeout(r, 200));

      const { doc, getDoc } = window.firebaseFirestoreVars;
      const settingsRef = doc(window.firebaseDb, "settings", "main");
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        const settings = docSnap.data();
        allPortfolioItems = settings.portfolioItems || [];
        
        // Update Brand & Site Info
        if (settings.siteInfo) {
           const brand = settings.siteInfo.brandName || 'vivek';
           $('#nav-brand').text(brand);
           $('#footer-brand').text(brand);
           $('#footer-text').text(settings.siteInfo.footerText || '');
           
           // Update Copyright Name
           $('#footer-copyright-name').text(`${brand} Studio`);
        }

        // Render Socials
        renderSocials(settings.socialLinks);
        
        // Render Categories
        renderCategories(settings.portfolioCategories);
        
        // Initial Render
        applyFiltersAndRender();
      }
    } catch (error) {
      console.error('Gallery failed to load:', error);
      $('#gallery-grid').html('<p class="text-center text-red-500 py-20">Error loading projects. Please refresh.</p>');
    }
  }

  function renderSocials(links) {
    if (!links) return;
    let html = '';
    if (links.instagram) html += `<a href="${links.instagram}" target="_blank" class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all"><i class="fa-brands fa-instagram text-xl"></i></a>`;
    if (links.youtube) html += `<a href="${links.youtube}" target="_blank" class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all"><i class="fa-brands fa-youtube text-xl"></i></a>`;
    if (links.linkedin) html += `<a href="${links.linkedin}" target="_blank" class="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all"><i class="fa-brands fa-linkedin-in text-xl"></i></a>`;
    $('#footer-socials').html(html);
  }

  function renderCategories(categories) {
    if (!categories) return;
    const container = $('#gallery-filters');
    const existingMain = container.find('button[data-filter="All"]');
    
    const catHtml = categories.map(cat => {
        const label = typeof cat === 'string' ? cat : (cat.label || 'Unnamed');
        return `<button class="gallery-filter-btn px-6 py-2 rounded-full border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 font-medium hover:border-brand-500 transition-all" data-filter="${label}">${label}</button>`;
    }).join('');
    
    container.append(catHtml);

    // Filter clicks
    $('.gallery-filter-btn').click(function() {
        activeFilter = $(this).data('filter');
        $('.gallery-filter-btn').removeClass('active bg-brand-500 text-white border-brand-500').addClass('border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300').removeProp('font-bold');
        $(this).addClass('active bg-brand-500 text-white border-brand-500 font-bold').removeClass('border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300');
        applyFiltersAndRender();
    });
  }

  function applyFiltersAndRender() {
    searchQuery = $('#gallery-search').val().toLowerCase();
    
    filteredItems = allPortfolioItems.filter(item => {
        const matchesCat = activeFilter === "All" || item.category === activeFilter;
        const matchesSearch = !searchQuery || 
                             (item.title || "").toLowerCase().includes(searchQuery) ||
                             (item.category || "").toLowerCase().includes(searchQuery) ||
                             (item.alt || "").toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    renderGrid();
  }

  function renderGrid() {
    const grid = $('#gallery-grid');
    const empty = $('#empty-state');

    if (filteredItems.length === 0) {
        grid.addClass('hidden');
        empty.removeClass('hidden');
        return;
    }

    grid.removeClass('hidden');
    empty.addClass('hidden');

    const html = filteredItems.map((item, index) => {
        const title = item.title || item.alt || "Portfolio Project";
        const cat = item.subCategory || item.category || "Creative";
        
        return `
            <div class="gallery-item group relative overflow-hidden cursor-pointer bg-white dark:bg-brand-900 shadow-lg border border-gray-100 dark:border-white/5" 
                 data-aos="fade-up" data-index="${index}">
                <img src="${item.image}" alt="${escapeHtml(title)}" class="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy">
                
                <div class="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/20 to-transparent opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-all duration-500 flex flex-col justify-end p-8">
                   <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                       <span class="text-brand-400 font-black text-xs uppercase tracking-widest block mb-2">${escapeHtml(cat)}</span>
                       <h3 class="text-white text-2xl font-black leading-tight">${escapeHtml(title)}</h3>
                   </div>
                </div>

                </div>
            </div>
        `;
    }).join('');

    grid.html(html);
    
    // Bind clicks for Lightbox
    $('.gallery-item').click(function() {
        openLightbox($(this).data('index'));
    });

    AOS.refresh();
  }

  // ========== SEARCH LOGIC ==========
  $('#gallery-search').on('input', function() {
      applyFiltersAndRender();
  });

  $('#reset-filters').click(function() {
      $('#gallery-search').val('');
      $('button[data-filter="All"]').click();
  });

  // ========== LIGHTBOX LOGIC ==========
  function openLightbox(index) {
      currentLightboxIndex = index;
      updateLightboxContent();
      $('#lightbox').addClass('active').css('display', 'flex');
      $('body').css('overflow', 'hidden');
  }

  function closeLightbox() {
      $('#lightbox').removeClass('active');
      setTimeout(() => $('#lightbox').css('display', 'none'), 300);
      $('body').css('overflow', '');
  }

  function updateLightboxContent() {
      const item = filteredItems[currentLightboxIndex];
      if (!item) return;

      const img = $('#lightbox-img');
      img.attr('src', item.image);
      $('#lightbox-title').text(item.title || item.alt || "Portfolio Project");
      $('#lightbox-category').text(item.subCategory || item.category || "Creative");

      // Handle arrows visibility
      $('#lightbox-prev').toggleClass('hidden', currentLightboxIndex === 0);
      $('#lightbox-next').toggleClass('hidden', currentLightboxIndex === filteredItems.length - 1);
  }

  $(document).on('click', '#lightbox-close', function(e) {
      e.stopPropagation();
      closeLightbox();
  });

  $(document).on('click', '#lightbox', function(e) {
      if (e.target === this) closeLightbox();
  });

  $('#lightbox-next').click(function() {
      if (currentLightboxIndex < filteredItems.length - 1) {
          currentLightboxIndex++;
          updateLightboxContent();
      }
  });

  $('#lightbox-prev').click(function() {
      if (currentLightboxIndex > 0) {
          currentLightboxIndex--;
          updateLightboxContent();
      }
  });

  $(document).keydown(function(e) {
      if (!$('#lightbox').hasClass('active')) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight" && currentLightboxIndex < filteredItems.length - 1) $('#lightbox-next').click();
      if (e.key === "ArrowLeft" && currentLightboxIndex > 0) $('#lightbox-prev').click();
  });

  // ========== THEME HANDLING ==========
  function updateThemeIcons() {
    const isDark = $('html').hasClass('dark');
    if (isDark) {
      $('#theme-toggle-light-icon, #theme-toggle-light-icon-m').removeClass('hidden');
      $('#theme-toggle-dark-icon, #theme-toggle-dark-icon-m').addClass('hidden');
    } else {
      $('#theme-toggle-light-icon, #theme-toggle-light-icon-m').addClass('hidden');
      $('#theme-toggle-dark-icon, #theme-toggle-dark-icon-m').removeClass('hidden');
    }
  }

  $('#theme-toggle, #theme-toggle-mobile').click(function() {
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

  updateThemeIcons();

  // Load Data
  loadGalleryData();
});
