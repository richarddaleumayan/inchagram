/**
 * Debug script to find elements causing horizontal overflow
 * Run this in browser console on iPhone to find the culprit
 *
 * Usage: Copy and paste this entire script into browser console
 */

(function debugOverflow() {
  console.log('🔍 Checking for horizontal overflow on elements...');

  const viewportWidth = window.innerWidth;
  console.log(`📱 Viewport width: ${viewportWidth}px`);

  const overflowingElements = [];

  // Check all elements
  const allElements = document.querySelectorAll('*');

  allElements.forEach((el) => {
    const rect = el.getBoundingClientRect();

    // Check if element extends beyond viewport
    if (rect.right > viewportWidth || rect.left < 0) {
      const computedStyle = window.getComputedStyle(el);

      overflowingElements.push({
        element: el,
        tag: el.tagName,
        class: el.className,
        id: el.id,
        width: rect.width,
        left: rect.left,
        right: rect.right,
        overflow: rect.right - viewportWidth,
        position: computedStyle.position,
        display: computedStyle.display
      });
    }
  });

  if (overflowingElements.length === 0) {
    console.log('✅ No overflowing elements found!');
    return;
  }

  console.log(`⚠️ Found ${overflowingElements.length} overflowing elements:`);
  console.table(overflowingElements.slice(0, 20)); // Show top 20

  // Highlight overflowing elements
  overflowingElements.forEach((item) => {
    item.element.style.outline = '3px solid red';
  });

  console.log('🔴 Overflowing elements are now outlined in RED');
  console.log('💡 Check the table above for details');

  // Return elements for further inspection
  return overflowingElements;
})();
