/* eslint-disable no-undef */
// Should NOT be replaced - window$1 is a different identifier
if (typeof window$1 === 'undefined') {
  console.log('no window$1');
}

// Should be replaced - standalone typeof window
if (typeof window === 'undefined') {
  console.log('no window');
}

// Should NOT be replaced - window_ is a different identifier  
if (typeof window_ !== 'undefined') {
  console.log('has window_');
}

// Should be replaced - typeof window followed by dot
if (typeof window.document !== 'undefined') {
  console.log('has document');
}
