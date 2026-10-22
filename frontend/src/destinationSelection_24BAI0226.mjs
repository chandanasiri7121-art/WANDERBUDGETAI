// UI-only guards: never let a previous destination's attractions travel with a new selection.
export function safeAttractionsFor(destination) {
  if (!destination) return [];
  const attractions = Array.isArray(destination.attractions) ? destination.attractions : [];
  if (destination.is_external) {
    // Geographically scoped: only allow external/scoped attractions, never leak database destinations
    return attractions.filter(attraction => {
      if (!attraction || typeof attraction !== 'object') return false;
      if (Number.isSafeInteger(Number(attraction.destination_id)) && Number(attraction.destination_id) > 0 && !attraction.is_external) {
        return false;
      }
      return true;
    });
  }
  if (destination.is_preview) {
    return attractions.filter(attraction => String(attraction.attraction_id || '').startsWith('est_'));
  }
  const destinationId = Number(destination.destination_id);
  if (!Number.isSafeInteger(destinationId) || destinationId <= 0) return [];
  return attractions.filter(attraction => Number(attraction.destination_id) === destinationId);
}

export function selectionStateFor(destination) {
  const attractions = safeAttractionsFor(destination);
  return {
    destination: { ...destination, attractions },
    attractionIds: attractions.map(attraction => attraction.attraction_id),
    canUseDatabaseEstimator: Boolean(destination?.destination_id) && !destination?.is_external && !destination?.is_preview
  };
}

const CITY_ALIASES = {
  bengaluru: ['bangalore'],
  bangalore: ['bengaluru'],
  mumbai: ['bombay'],
  bombay: ['mumbai'],
  chennai: ['madras'],
  madras: ['chennai'],
  kolkata: ['calcutta'],
  calcutta: ['kolkata'],
  varanasi: ['banaras', 'kashi', 'benares'],
  banaras: ['varanasi'],
  kashi: ['varanasi'],
  benares: ['varanasi'],
  kochi: ['cochin'],
  cochin: ['kochi'],
  visakhapatnam: ['vizag'],
  vizag: ['visakhapatnam'],
  puducherry: ['pondicherry'],
  pondicherry: ['puducherry'],
  thiruvananthapuram: ['trivandrum'],
  trivandrum: ['thiruvananthapuram'],
  badrinath: ['badrinathpuri'],
  badrinathpuri: ['badrinath'],
  vizianagaram: ['vijayanagaram', 'vijayangaram'],
  vijayanagaram: ['vizianagaram', 'vijayangaram'],
  vijayangaram: ['vizianagaram', 'vijayanagaram']
};

export function destinationDropdownGroups(query, destinations, externalPlaces) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const tokens = normalizedQuery.split(/[,\s]+/).filter(Boolean);
  const matches = item => {
    if (!normalizedQuery) return true;
    const cityLower = String(item.city_name || '').toLowerCase().trim();
    if (cityLower === normalizedQuery) return true;
    if (CITY_ALIASES[normalizedQuery]?.includes(cityLower) || CITY_ALIASES[cityLower]?.includes(normalizedQuery)) {
      return true;
    }
    if (tokens.some(token => CITY_ALIASES[token]?.includes(cityLower))) {
      return true;
    }
    const values = [
      item.city_name,
      item.region_name,
      item.country_name,
      item.full_name,
      item.city_name && item.country_name ? `${item.city_name}, ${item.country_name}` : ''
    ];
    if (values.some(value => String(value || '').toLowerCase().includes(normalizedQuery))) return true;
    const combined = values.filter(Boolean).join(' ').toLowerCase();
    if (tokens.length > 0 && tokens.every(token => combined.includes(token))) return true;
    return false;
  };
  const verifiedList = (Array.isArray(destinations) ? destinations : []).filter(matches);
  const externalList = (Array.isArray(externalPlaces) ? externalPlaces : []).filter(matches);
  return {
    verified: verifiedList,
    external: externalList,
    cataloged: verifiedList
  };
}

export function externalPlacesFromDiscovery(payload, destinations) {
  const places = Array.isArray(payload?.results) ? payload.results : [];
  const verified = Array.isArray(destinations) ? destinations : [];
  return places.filter(place => !verified.some(destination =>
    destination.city_name?.toLowerCase() === place.city_name?.toLowerCase() &&
    destination.country_name?.toLowerCase() === place.country_name?.toLowerCase()
  ));
}

export function isCurrentSearchRequest(requestId, currentRequestId) {
  return requestId === currentRequestId;
}
