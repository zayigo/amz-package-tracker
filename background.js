let lastRequest = {};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (
    request.action === 'getTrackingInfo' ||
    request.action === 'refreshTracking'
  ) {
    chrome.cookies.getAll(
      { url: `https://${request.domain || lastRequest.domain}` },
      (cookies) => {
        const sessionCookies = cookies.reduce((acc, cookie) => {
          acc[cookie.name] = cookie.value;
          return acc;
        }, {});
        fetchTrackingData(
          request.trackingId || lastRequest.trackingId,
          request.csrfToken || lastRequest.csrfToken,
          sessionCookies,
          request.domain || lastRequest.domain
        ).then((data) => {
          if (request.trackingId) {
            lastRequest.trackingId = request.trackingId;
          }
          if (request.csrfToken) {
            lastRequest.csrfToken = request.csrfToken;
          }
          if (request.domain) {
            lastRequest.domain = request.domain;
          }
          sendResponse(data);
        });
      }
    );
    return true; // Indicates we will send a response asynchronously
  }
});

const fetchTrackingData = (trackingId, csrfToken, cookies, domain) => {
  const url = `https://${domain}/progress-tracker/package/actions/map-tracking-deans-proxy`;

  const formBody = new URLSearchParams({
    trackingId: trackingId,
    csrfToken: csrfToken,
  }).toString();

  return fetch(url, {
    method: 'POST',
    body: formBody,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      Cookie: Object.entries(cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Tracking data:', data);
      return data;
    })
    .catch((error) => {
      console.error('Error fetching tracking data:', error);
      return { success: false, error: error.message };
    });
};
