// Injects a script to retrieve the CSRF token from the page
const injectPageScript = () => {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('pageScript.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
};

const getTrackingInfo = () => {
  injectPageScript();

  window.addEventListener(
    'message',
    (event) => {
      if (event.source !== window) {
        return;
      }
      if (event.data.type && event.data.type === 'FROM_PAGE_SCRIPT') {
        const { csrfToken } = event.data;
        const trackingElement = document.querySelector(
          '.pt-delivery-card-trackingId'
        );
        let trackingId = '';

        if (trackingElement) {
          const content = trackingElement.textContent;
          trackingId = content.split(':')[1]?.trim() || '';
        }

        chrome.runtime.sendMessage({
          action: 'getTrackingInfo',
          csrfToken: csrfToken,
          trackingId: trackingId,
          domain: window.location.hostname,
        });
      }
    },
    false
  );
};

getTrackingInfo();
