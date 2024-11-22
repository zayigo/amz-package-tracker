(() => {
  window.postMessage(
    {
      type: 'FROM_PAGE_SCRIPT',
      csrfToken:
        window.csrfToken ||
        document
          .querySelector('meta[name="CSRF-TOKEN"]')
          ?.getAttribute('content'),
    },
    '*'
  );
})();
