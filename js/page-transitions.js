/**
 * Universal Page Transition System
 * Handles fade-out → navigate → fade-in transitions across all pages
 * Uses GSAP for smooth animations
 */

(function() {
  'use strict';
  
  // Transition state
  let isTransitioning = false;
  let transitionTimeline = null;

  // Configuration
  const config = {
    duration: 0.4,
    ease: 'power2.inOut',
    yOffset: 20
  };

  // Get the main content wrapper (everything except navbar)
  function getContentWrapper() {
    return document.querySelector('main') || document.querySelector('.page-transition-wrapper');
  }

  /**
   * Fade out current page content
   */
  function fadeOut(callback) {
    if (isTransitioning || typeof gsap === 'undefined') {
      if (callback) callback();
      return;
    }
    isTransitioning = true;

    const content = getContentWrapper();
    if (!content) {
      if (callback) callback();
      return;
    }

    // Kill any existing transition
    if (transitionTimeline) {
      transitionTimeline.kill();
    }

    // Disable interactions during transition
    document.body.classList.add('transitioning');
    gsap.set(content, { pointerEvents: 'none' });

    // Animate out
    transitionTimeline = gsap.to(content, {
      opacity: 0,
      y: -config.yOffset,
      duration: config.duration,
      ease: config.ease,
      overwrite: true,
      onComplete: () => {
        if (callback) callback();
      }
    });
  }

  /**
   * Fade in new page content
   */
  function fadeIn() {
    if (typeof gsap === 'undefined') {
      isTransitioning = false;
      document.body.classList.remove('transitioning');
      return;
    }

    const content = getContentWrapper();
    if (!content) {
      isTransitioning = false;
      document.body.classList.remove('transitioning');
      return;
    }

    // Set initial state
    gsap.set(content, { opacity: 0, y: config.yOffset });

    // Animate in
    gsap.to(content, {
      opacity: 1,
      y: 0,
      duration: config.duration,
      ease: config.ease,
      overwrite: true,
      onComplete: () => {
        isTransitioning = false;
        document.body.classList.remove('transitioning');
        gsap.set(content, { pointerEvents: 'auto' });
      }
    });
  }

  /**
   * Navigate to a new page with transition
   */
  function navigateToPage(url) {
    if (!url || isTransitioning) return;

    fadeOut(() => {
      // Scroll to top instantly before navigation
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Mark that we're transitioning for the next page
      sessionStorage.setItem('pageTransition', 'true');
      
      // Navigate
      window.location.href = url;
    });
  }

  /**
   * Get the target URL from an element (checks href, data-case-study, data-href)
   */
  function getTargetUrl(element) {
    // Check for href attribute (standard links)
    if (element.hasAttribute('href')) {
      return element.getAttribute('href');
    }
    
    // Check for data-case-study (case study cards)
    if (element.hasAttribute('data-case-study')) {
      return element.getAttribute('data-case-study');
    }
    
    // Check for data-href (flexible data attribute)
    if (element.hasAttribute('data-href')) {
      return element.getAttribute('data-href');
    }
    
    return null;
  }

  /**
   * Check if this is a valid internal link
   */
  function isInternalLink(href, element) {
    if (!href) return false;

    // Skip external links
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      return false;
    }

    // Skip special protocols
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('file://')) {
      return false;
    }

    // Skip anchors (same page scrolling)
    if (href.startsWith('#')) {
      return false;
    }

    // Skip links with target="_blank"
    if (element.hasAttribute('target') && element.getAttribute('target') === '_blank') {
      return false;
    }

    // Skip data-scroll links (smooth scroll within page)
    if (element.hasAttribute('data-scroll')) {
      return false;
    }

    return true;
  }

  /**
   * Initialize transitions on page load
   */
  function initTransitions() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded - page transitions disabled');
      return;
    }

    // Check if we arrived via a page transition
    const isPageTransition = sessionStorage.getItem('pageTransition') === 'true';
    
    if (isPageTransition) {
      sessionStorage.removeItem('pageTransition');
      // Fade in the new page
      fadeIn();
    } else {
      // Initial page load - show content immediately
      const content = getContentWrapper();
      if (content && typeof gsap !== 'undefined') {
        gsap.set(content, { opacity: 1, y: 0 });
      }
    }

    // Intercept all link clicks and clickable elements
    document.addEventListener('click', (e) => {
      let clickableElement = null;
      let href = null;

      // First, try to find an <a> tag (highest priority)
      const linkTag = e.target.closest('a');
      if (linkTag) {
        clickableElement = linkTag;
        href = getTargetUrl(linkTag);
      }
      
      // If no <a> tag or no href, check for elements with data-case-study or data-href
      // This handles case study cards and other clickable elements
      if (!clickableElement || !href) {
        const dataElement = e.target.closest('[data-case-study], [data-href]');
        if (dataElement) {
          clickableElement = dataElement;
          href = getTargetUrl(dataElement);
        }
      }
      
      // If still nothing, check if the clicked element itself has these attributes
      if (!clickableElement || !href) {
        if (e.target.hasAttribute('data-case-study') || e.target.hasAttribute('data-href')) {
          clickableElement = e.target;
          href = getTargetUrl(e.target);
        }
      }
      
      if (!clickableElement || !href) return;

      // Validate the link
      if (!isInternalLink(href, clickableElement)) return;

      // Prevent default navigation
      e.preventDefault();
      e.stopPropagation();

      // Don't transition if already transitioning
      if (isTransitioning) return;

      // Check if we're clicking to the current page
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      let targetPage = href;

      // Normalize the href
      if (targetPage === '/' || targetPage === '') {
        targetPage = 'index.html';
      }
      if (targetPage.startsWith('./')) {
        targetPage = targetPage.substring(2);
      }

      // If clicking to current page, just scroll to top
      if (targetPage === currentPage || 
          (currentPage === 'index.html' && (targetPage === '/' || targetPage === ''))) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Navigate with transition
      navigateToPage(targetPage);
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (transitionTimeline) {
        transitionTimeline.kill();
      }
      gsap.killTweensOf("*");
    });
  }

  // Initialize when DOM is ready and GSAP is available
  function waitForGSAP() {
    if (typeof gsap !== 'undefined') {
      // Small delay to ensure all other scripts have run
      setTimeout(initTransitions, 50);
    } else {
      // Retry after a short delay if GSAP isn't loaded yet
      setTimeout(waitForGSAP, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGSAP);
  } else {
    waitForGSAP();
  }

  // Expose for debugging
  window.__pageTransitions = {
    navigateToPage,
    fadeOut,
    fadeIn
  };
})();

