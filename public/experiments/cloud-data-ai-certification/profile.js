'use strict';

(() => {
  const scripts = ['./profile-core.js', './resource-reviews.js', './resource-mode-sync.js'];
  let chain = Promise.resolve();
  scripts.forEach((src) => {
    chain = chain.then(
      () =>
        new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = false;
          script.onload = resolve;
          script.onerror = reject;
          document.body.append(script);
        }),
    );
  });
  chain.catch((error) => console.error('Unable to load certification lab enhancements.', error));
})();
