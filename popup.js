let map, marker, destinationMarker;
let rawResponse = {};
let refreshInterval;

const initMap = () => {
  map = L.map('map').setView([0, 0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);
};

const updateMap = (lat, lon, destLat, destLon) => {
  if (!map) {
    initMap();
  }
  if (destinationMarker) {
    destinationMarker.remove();
  }
  if (marker) {
    marker.remove();
  }
  marker = L.marker([lat, lon]).addTo(map).bindPopup('Current Location');
  destinationMarker = L.marker([destLat, destLon])
    .addTo(map)
    .bindPopup('Destination');

  map.panTo([lat, lon]);
};

const updateInfo = (data) => {
  const info = document.getElementById('info');
  const pkgDetails = data.packageLocationDetails;
  const lastUpdate = new Date(
    pkgDetails.transporterDetails.geoLocation.locationTime * 1000
  ).toLocaleString();
  info.innerHTML = `
<p>Last Update: ${lastUpdate}</p>
<p>Status: ${pkgDetails.trackingObjectState}</p>
<p>Stops Remaining: ${pkgDetails.stopsRemaining}</p>
<p>Tracking ID: ${pkgDetails.trackingObjectId}</p>
`;
};

const refreshData = () => {
  chrome.runtime.sendMessage({ action: 'refreshTracking' }, (response) => {
    if (response && response.success) {
      rawResponse = response;
      const data = response.packageLocationDetails;
      if (data.trackingObjectState === 'DELIVERED') {
        // Package has been delivered, only show destination
        updateMap(
          data.destinationAddress.geoLocation.latitude,
          data.destinationAddress.geoLocation.longitude,
          data.destinationAddress.geoLocation.latitude,
          data.destinationAddress.geoLocation.longitude
        );
        document.getElementById('info').innerHTML =
          '<p>Package has been delivered!</p>';
      } else if (data.trackingObjectState === 'NOT_READY') {
        document.getElementById('info').innerHTML =
          '<p>Package is not yet ready for delivery tracking</p>';
      } else {
        // Package is still in transit
        updateMap(
          data.transporterDetails.geoLocation.latitude,
          data.transporterDetails.geoLocation.longitude,
          data.destinationAddress.geoLocation.latitude,
          data.destinationAddress.geoLocation.longitude
        );
        updateInfo(response);
      }
    } else {
      console.error(
        'Error refreshing data:',
        response ? response.error : 'Unknown error'
      );
      document.getElementById('info').innerHTML =
        '<p>Error refreshing data. Please try again.</p>';
    }
  });
};

const startRefreshInterval = () => {
  return setInterval(refreshData, 5000);
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('refresh').addEventListener('click', refreshData);

  document.getElementById('copy').addEventListener('click', () => {
    navigator.clipboard
      .writeText(JSON.stringify(rawResponse, null, 2))
      .catch((err) => console.error('Failed to copy: ', err));
  });

  refreshData();
  refreshInterval = startRefreshInterval();
});

window.addEventListener('unload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
