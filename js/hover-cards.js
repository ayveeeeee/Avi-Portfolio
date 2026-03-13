/**
 * "View" label for case-card hover.
 * The label lives INSIDE .custom-cursor so it shares the exact same
 * position update — no separate animation loop, no drift.
 */
(function initViewLabel() {
  if (('ontouchstart' in window) || (navigator.maxTouchPoints > 0)) return;

  var cursorEl = document.querySelector('.custom-cursor');
  if (!cursorEl) return;

  // Ensure cursor-label span exists (index.html has it; work.html may not)
  var label = cursorEl.querySelector('.cursor-label');
  if (!label) {
    label = document.createElement('span');
    label.className = 'cursor-label';
    label.textContent = 'View';
    cursorEl.appendChild(label);
  }

  document.querySelectorAll('.case-card').forEach(function (card) {
    card.addEventListener('pointerenter', function () {
      document.body.classList.add('cursor-view-mode');
      document.body.classList.remove('hovering-link');
    });
    card.addEventListener('pointerleave', function () {
      document.body.classList.remove('cursor-view-mode');
    });
  });
})();
