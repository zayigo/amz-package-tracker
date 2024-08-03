(() => {
  window.postMessage(
    {
      type: 'FROM_PAGE_SCRIPT',
      csrfToken: window.csrfToken,
    },
    '*'
  );
})();
