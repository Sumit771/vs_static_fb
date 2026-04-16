$(document).ready(function () {
  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getInstagramEmbedUrl(url) {
    if (!url) return '';
    // Standardize URL and remove query params
    const cleanUrl = url.split('?')[0].split('#')[0];
    // Extract ID from /reel/ID/ or /p/ID/ or /reels/ID/ (handle trailing slashes and different paths)
    const match = cleanUrl.match(/\/(?:reels?|p)\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed/`;
    }
    return '';
  }

  // Initialize AOS
  AOS.init({ duration: 800, once: false, offset: 100, easing: 'ease-out-cubic' });

  // Mobile Menu
  $('#mobile-menu-btn').click(function () {
    $('#mobile-menu').toggleClass('hidden').addClass('animate-in fade-in slide-in-from-top-4 duration-300');
    $(this).find('i').toggleClass('fa-bars fa-xmark');
  });
  $('.mobile-link').click(function () {
    $('#mobile-menu').addClass('hidden');
    $('#mobile-menu-btn i').removeClass('fa-xmark').addClass('fa-bars');
  });

  // ========== DATA STATE ==========
  let allSettings = null;
  let activeMainCat = "All Work";
  let activeSubCat = "All";

  // ========== DATA FETCHING & RENDERING ==========
  async function loadSettings() {
    try {
      // Small delay to ensure Firebase initializes completely before fetching
      await new Promise(r => setTimeout(r, 100));
      
      const { doc, getDoc } = window.firebaseFirestoreVars;
      const settingsRef = doc(window.firebaseDb, "settings", "main");
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        allSettings = docSnap.data();
        renderPage(allSettings);
      } else {
        console.warn("No site settings found in Firebase!");
      }
    } catch (error) {
      console.error('Failed to load site settings:', error);
    }
  }

  function renderPage(settings) {
    if (!settings) return;

    // Site Info
    if (settings.siteInfo) {
      const brand = settings.siteInfo.brandName || 'vivek';
      document.title = `${brand} • Portfolio Studio`;

      // Update Navbar Brand
      $('#nav-brand').text(brand);

      // Update Footer Brand intelligently
      if (brand.toUpperCase() === 'vivek' || brand.toUpperCase() === 'DESIGNPRO') {
        const brandMatch = brand.toUpperCase() === 'vivek' ? 'PHOTO<span class="text-brand-500">FIXX</span>' : 'DESIGN<span class="text-brand-500">PRO</span>';
        $('#footer-brand').html(brandMatch);
      } else {
        $('#footer-brand').text(brand);
      }

      if (settings.siteInfo.tagline) $('#hero-tagline').text(settings.siteInfo.tagline);
      if (settings.siteInfo.footerText) $('#footer-text').text(settings.siteInfo.footerText);
    }

    // Hero Section
    if (settings.hero) {
      if (settings.hero.title) {
        const titleParts = settings.hero.title.split('|');
        if (titleParts.length > 1) {
          $('#hero-title').html(`${escapeHtml(titleParts[0])} <br><span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400 via-purple-400">${escapeHtml(titleParts[1])}</span>`);
        } else {
          $('#hero-title').text(settings.hero.title);
        }
      }
      if (settings.hero.taglineHero) $('#site-tagline-hero').text(settings.hero.taglineHero);
      if (settings.hero.ownerImage) {
        $('.hero-bg').css('background-image', `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.5)), url('${settings.hero.ownerImage}')`);
      }
    }

    // Services
    if (settings.services && settings.services.length > 0) {
      const servicesHtml = settings.services.map((s, i) => `
        <div class="service-card group bg-gray-50 dark:bg-white/5 p-8 rounded-3xl border border-gray-100 dark:border-white/10 hover:border-brand-500/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(139,92,246,0.15)] hover:-translate-y-2 relative overflow-hidden" 
             data-aos="fade-up" data-aos-delay="${100 * (i + 1)}">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
          <div class="service-icon w-16 h-16 bg-brand-500/10 text-brand-500 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 shadow-inner">
            <i class="${s.icon || 'fa-solid fa-star'}"></i>
          </div>
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${s.title}</h3>
          <p class="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">${s.description}</p>
        </div>
      `).join('');
      $('#services-grid').html(servicesHtml);
    }

    // Portfolio Filters & Grid
    renderPortfolioFilters(settings.portfolioCategories);
    renderPortfolioGrid();

    // Reels
    if (settings.reelsItems && settings.reelsItems.length > 0) {
      const reelsHtml = settings.reelsItems.map(item => {
        const embedUrl = getInstagramEmbedUrl(item.image);
        
        // If it's a valid IG link, use Iframe. Otherwise, fallback to Image.
        if (embedUrl) {
          return `
            <div class="carousel-slide">
              <div class="reel-iframe-container reels-loading min-w-[300px] w-[300px] bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 transition-all hover:border-brand-500">
                <iframe 
                  src="${embedUrl}" 
                  class="w-full h-full reel-iframe" 
                  frameborder="0" 
                  scrolling="no" 
                  allowtransparency="true" 
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  loading="lazy">
                </iframe>
              </div>
            </div>
          `;
        } else {
          // Fallback to Image View
          return `
            <div class="carousel-slide">
              <div class="min-w-[300px] w-[300px] aspect-[9/16] bg-gray-800 rounded-3xl relative overflow-hidden group cursor-pointer border-4 border-gray-800 hover:border-brand-500 transition-all reel-fallback" data-url="${escapeHtml(item.image)}">
                <img src="${item.image}" alt="${escapeHtml(item.alt || item.title || 'Reel')}" class="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700">
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl group-hover:bg-brand-500 transition-colors">
                    <i class="fa-solid fa-play ml-1"></i>
                  </div>
                </div>
                <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                  <p class="text-sm font-medium text-white truncate"><i class="fa-solid fa-heart text-red-500 mr-2"></i>Link: ${escapeHtml(item.title || item.alt || 'View Reel')}</p>
                </div>
              </div>
            </div>
          `;
        }
      }).join('');
      
      $('#reelTrack').html(reelsHtml);
      $('#reelTrack').find('.reel-iframe').on('load', function() {
        $(this).parent().removeClass('reels-loading');
        $(this).addClass('loaded');
      });
      $('#reelTrack').find('.reel-fallback').on('click', function() {
        window.open($(this).data('url'), '_blank');
      });
      initReelCarousel();
    }

    // Testimonials
    if (settings.testimonials && settings.testimonials.length > 0) {
      const contactHtml = settings.testimonials.map(t => `
        <div class="carousel-slide px-4">
          <div class="testimonial-card text-center">
            <div class="text-5xl text-brand-500 mb-4">“</div>
            <p class="text-lg text-gray-700 leading-relaxed mb-6">${escapeHtml(t.quote)}</p>
            <div class="flex items-center justify-center gap-4">
              <div class="text-left">
                <h4 class="font-bold text-gray-900">${escapeHtml(t.name)}</h4>
                <p class="text-sm text-gray-500">Client • ${'★'.repeat(t.rating)}</p>
              </div>
            </div>
          </div>
        </div>
      `).join('');
      $('#testimonialTrack').html(contactHtml);
      initCarousel('testimonialTrack', 'testimonialPrev', 'testimonialNext', 'testimonialDots', 6000);
    }

    // About Section
    if (settings.about) {
      $('#about-text').text(settings.about.text);
      if (settings.about.yearsExperience) $('#stat-years').text(settings.about.yearsExperience);
      if (settings.about.clientsCount) $('#stat-clients').text(settings.about.clientsCount);
      if (settings.about.image) $('#about-image').attr('src', settings.about.image);
    }

    // Contact Info & Socials
    if (settings.contact) {
      const email = settings.contact.email || 'creative@vivek.com';
      const location = settings.contact.location || 'India';
      const whatsapp = settings.contact.whatsappNumber || '';

      // Main Contact Section
      if ($('#contact-email').length) {
        $('#contact-email').text(email).attr('href', `mailto:${email}`);
      }
      if ($('#contact-location').length) {
        $('#contact-location').text(location);
      }

      // Footer Contact Details
      $('#footer-email-link').text(email).attr('href', `mailto:${email}`);
      $('#footer-location').text(location);

      // WhatsApp Floating Button
      if (whatsapp) {
        // Clean number: remove anything that's not a digit
        const cleanWhatsapp = whatsapp.replace(/\D/g, '');
        $('#whatsapp-float').attr('href', `https://wa.me/${cleanWhatsapp}`).removeClass('hidden');
      } else {
        $('#whatsapp-float').addClass('hidden');
      }
    }

    // Social Links in Footer
    if (settings.socialLinks) {
      let socialHtml = '';
      if (settings.socialLinks.instagram) {
        socialHtml += `<a href="${settings.socialLinks.instagram}" target="_blank" class="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-500 hover:text-white transition-all shadow-sm border border-gray-100 dark:border-white/10"><i class="fa-brands fa-instagram"></i></a>`;
      }
      if (settings.socialLinks.youtube) {
        socialHtml += `<a href="${settings.socialLinks.youtube}" target="_blank" class="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-500 hover:text-white transition-all shadow-sm border border-gray-100 dark:border-white/10"><i class="fa-brands fa-youtube"></i></a>`;
      }
      if (settings.socialLinks.linkedin) {
        socialHtml += `<a href="${settings.socialLinks.linkedin}" target="_blank" class="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:bg-brand-500 hover:text-white transition-all shadow-sm border border-gray-100 dark:border-white/10"><i class="fa-brands fa-linkedin-in"></i></a>`;
      }
      $('#footer-socials').html(socialHtml);
    }

    // Refresh AOS for new elements
    setTimeout(() => { 
      AOS.refresh(); 
      console.log("AOS Refresh triggered for dynamic content");
    }, 300);
  }

  // ========== PORTFOLIO FILTERING LOGIC ==========
  function renderPortfolioFilters(categories) {
    // Standardize categories (handle strings vs objects & nested objects)
    const normalizedCategories = categories.map(cat => {
      const getString = (val) => {
        if (typeof val === 'string') return val;
        if (val && typeof val === 'object' && val.label) return getString(val.label);
        return val ? String(val) : "Unnamed";
      };

      const label = getString(cat?.label || cat);
      const icon = getString(cat?.icon || "fa-solid fa-star");
      return { label, icon };
    });

    // Main Filters
    let mainHtml = `<button class="filter-btn-main active" data-cat="All Work"><i class="fa-solid fa-grip-vertical"></i> All Work</button>`;
    mainHtml += normalizedCategories.map(cat => `
      <button class="filter-btn-main" data-cat="${cat.label}">
        <i class="${cat.icon}"></i> ${cat.label}
      </button>
    `).join('');
    $('#main-filters').html(mainHtml);

    // Event Listeners for Main Filters
    $('.filter-btn-main').click(function () {
      const cat = $(this).data('cat');
      activeMainCat = cat;
      activeSubCat = "All"; // Reset subcat

      $('.filter-btn-main').removeClass('active');
      $(this).addClass('active');

      renderSubFilters(cat);
      renderPortfolioGrid();
    });
  }

  function renderSubFilters(mainCatLabel) {
    const subContainer = $('#sub-filters');
    if (mainCatLabel === "All Work") {
      subContainer.addClass('opacity-0 pointer-events-none').html('');
      return;
    }

    const catObj = allSettings.portfolioCategories.find(c => c.label === mainCatLabel);
    if (!catObj || !catObj.subCategories || catObj.subCategories.length === 0) {
      subContainer.addClass('opacity-0 pointer-events-none').html('');
      return;
    }

    let subHtml = `<button class="filter-btn-sub active" data-sub="All">All Projects</button>`;
    subHtml += catObj.subCategories.map(sub => `
      <button class="filter-btn-sub" data-sub="${sub}">${sub}</button>
    `).join('');

    subContainer.html(subHtml).addClass('opacity-0');

    // Smooth reveal with slight delay
    requestAnimationFrame(() => {
      subContainer.removeClass('opacity-0 pointer-events-none');
    });

    // Event Listeners for Sub Filters
    $('.filter-btn-sub').click(function () {
      activeSubCat = $(this).data('sub');
      $('.filter-btn-sub').removeClass('active');
      $(this).addClass('active');
      renderPortfolioGrid();
    });
  }

  function renderPortfolioGrid() {
    if (!allSettings || !allSettings.portfolioItems) return;

    let items = allSettings.portfolioItems;

    // Filter by Main
    if (activeMainCat !== "All Work") {
      items = items.filter(i => i.category === activeMainCat);
    }

    // Filter by Sub
    if (activeSubCat !== "All") {
      items = items.filter(i => i.subCategory === activeSubCat);
    }

    const gridHtml = items.map((item, i) => {
      const categoryLabel = String(item.subCategory || item.category || "General");
      const titleLabel = String(item.title || item.alt || "Portfolio Item");

      return `
        <div class="group relative overflow-hidden rounded-2xl shadow-xl cursor-pointer h-72 md:h-96" data-aos="fade-up" data-aos-delay="${50 * (i % 6)}">
          <img src="${item.image}" alt="${escapeHtml(titleLabel)}" class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy">
          <div class="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6">
            <div class="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="text-brand-400 font-bold text-xs uppercase tracking-widest mb-2 block">${escapeHtml(categoryLabel)}</span>
              <h3 class="text-white text-xl md:text-2xl font-black mb-2">${escapeHtml(titleLabel)}</h3>
              <div class="w-12 h-1 bg-brand-500 rounded-full"></div>
            </div>
          </div>
          <div class="absolute top-4 right-4 bg-brand-500/90 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
             <i class="fa-solid fa-plus text-lg"></i>
          </div>
        </div>
      `;
    }).join('');

    const grid = $('#portfolio-grid');
    grid.fadeOut(200, function () {
      grid.html(gridHtml).fadeIn(300);
      AOS.refresh();
    });
  }

  // ========== THEME TOGGLE LOGIC ==========
  function updateThemeIcons() {
    const isDark = $('html').hasClass('dark');
    if (isDark) {
      $('#theme-toggle-light-icon, #theme-toggle-light-icon-m').removeClass('hidden');
      $('#theme-toggle-dark-icon, #theme-toggle-dark-icon-m').addClass('hidden');
    } else {
      $('#theme-toggle-light-icon, #theme-toggle-light-icon-m').addClass('hidden');
      $('#theme-toggle-dark-icon, #theme-toggle-dark-icon-m').removeClass('hidden');
    }
    console.log("Theme icons updated. Mode:", isDark ? "Dark" : "Light");
  }

  function toggleTheme() {
    const isDark = $('html').hasClass('dark');
    if (isDark) {
      $('html').removeClass('dark');
      localStorage.setItem('theme', 'light');
    } else {
      $('html').addClass('dark');
      localStorage.setItem('theme', 'dark');
    }
    updateThemeIcons();
  }

  // Bind click events to both desktop and mobile toggle buttons
  $('#theme-toggle, #theme-toggle-mobile').on('click', function(e) {
    e.preventDefault();
    toggleTheme();
  });

  // Initial icon update on page load
  updateThemeIcons();

  // Navbar scroll
  $(window).scroll(function () {
    const isScrolled = $(this).scrollTop() > 50;
    $('#navbar').toggleClass('shadow-xl bg-white/95 dark:bg-brand-950/95 py-2', isScrolled);
    $('#navbar').toggleClass('py-4', !isScrolled);
    $('#backToTop').toggleClass('opacity-100 visible translate-y-0', $(this).scrollTop() > 400);
    $('#backToTop').toggleClass('translate-y-10', $(this).scrollTop() <= 400);
  });

  $('#backToTop').click(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#nav-logo').click(() => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // FAQ
  $('.faq-btn').click(function () {
    $(this).next('.faq-content').slideToggle(300);
    $(this).find('i').toggleClass('rotate-180');
    $('.faq-content').not($(this).next()).slideUp(300);
    $('.faq-btn').not($(this)).find('i').removeClass('rotate-180');
  });

  $('#contactForm').submit(async function (e) {
    e.preventDefault();
    const btn = $(this).find('button');
    const original = btn.html();

    const formData = {
      name: $('#name').val(),
      email: $('#email').val(),
      subject: $('#subject').val(),
      message: $('#message').val(),
      createdAt: new Date().toISOString()
    };

    btn.html('<i class="fa-solid fa-spinner fa-spin"></i> Sending...').prop('disabled', true);

    try {
      const { collection, addDoc } = window.firebaseFirestoreVars;
      await addDoc(collection(window.firebaseDb, "contacts"), formData);
      
      btn.html('<i class="fa-solid fa-check"></i> Message Sent!').removeClass('bg-brand-500').addClass('bg-green-500');
      this.reset();
    } catch (err) {
      console.error(err);
      alert('Communication error. Please try again.');
      btn.html(original).prop('disabled', false);
    } finally {
      setTimeout(() => {
        btn.html(original).prop('disabled', false).removeClass('bg-green-500').addClass('bg-brand-500');
      }, 3000);
    }
  });

  // ========== CAROUSELS ==========
  function initCarousel(trackId, prevId, nextId, dotsId, autoInterval = 5000) {
    const track = $(`#${trackId}`);
    const slides = track.children('.carousel-slide');
    const prevBtn = $(`#${prevId}`);
    const nextBtn = $(`#${nextId}`);
    const dotsContainer = $(`#${dotsId}`);

    if (slides.length === 0) return;

    let currentIndex = 0;
    let slideCount = slides.length;
    let interval;

    function updateCarousel() {
      const slideWidth = slides.first().outerWidth(true);
      track.css('transform', `translateX(-${currentIndex * slideWidth}px)`);
      dotsContainer.find('.carousel-dot').removeClass('active').eq(currentIndex).addClass('active');
    }

    function goToSlide(index) {
      if (index < 0) index = slideCount - 1;
      if (index >= slideCount) index = 0;
      currentIndex = index;
      updateCarousel();
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }

    function startAutoSlide() {
      if (autoInterval) {
        clearInterval(interval);
        interval = setInterval(nextSlide, autoInterval);
      }
    }
    function stopAutoSlide() { clearInterval(interval); }

    dotsContainer.empty();
    for (let i = 0; i < slideCount; i++) {
      dotsContainer.append(`<button class="carousel-dot ${i === 0 ? 'active' : ''}"></button>`);
    }
    dotsContainer.off('click').on('click', '.carousel-dot', function () {
      goToSlide($(this).index());
      startAutoSlide();
    });

    prevBtn.off('click').click(() => { prevSlide(); startAutoSlide(); });
    nextBtn.off('click').click(() => { nextSlide(); startAutoSlide(); });
    track.parent().hover(stopAutoSlide, startAutoSlide);

    updateCarousel();
    startAutoSlide();
    $(window).resize(() => updateCarousel());
  }

  function initReelCarousel() {
    const track = $('#reelTrack');
    const slides = track.children('.carousel-slide');
    const prevBtn = $('#reelPrev');
    const nextBtn = $('#reelNext');
    const dotsContainer = $('#reelDots');

    if (slides.length === 0) return;

    let currentIndex = 0;
    let slideCount = slides.length;
    let interval;
    const autoInterval = 4000;

    function getSlideWidth() { return slides.first().outerWidth(true); }

    function updateCarousel() {
      const slideWidth = getSlideWidth();
      track.css('transform', `translateX(-${currentIndex * slideWidth}px)`);
      dotsContainer.find('.carousel-dot').removeClass('active').eq(currentIndex).addClass('active');
    }

    function goToSlide(index) {
      if (index < 0) index = slideCount - 1;
      if (index >= slideCount) index = 0;
      currentIndex = index;
      updateCarousel();
    }

    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }

    function startAutoSlide() {
      clearInterval(interval);
      interval = setInterval(nextSlide, autoInterval);
    }
    function stopAutoSlide() { clearInterval(interval); }

    dotsContainer.empty();
    for (let i = 0; i < slideCount; i++) {
      dotsContainer.append(`<button class="carousel-dot ${i === 0 ? 'active' : ''}"></button>`);
    }
    dotsContainer.off('click').on('click', '.carousel-dot', function () {
      goToSlide($(this).index());
      startAutoSlide();
    });

    prevBtn.off('click').click(() => { prevSlide(); startAutoSlide(); });
    nextBtn.off('click').click(() => { nextSlide(); startAutoSlide(); });
    track.parent().hover(stopAutoSlide, startAutoSlide);

    updateCarousel();
    startAutoSlide();
    $(window).resize(() => updateCarousel());
  }

  loadSettings();
});