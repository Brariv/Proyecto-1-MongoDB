const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const MENU_ID_OFFSET_FROM_RESTAURANT = 0x32n;
const MENU_CACHE = new Map();
const MENU_REQUESTS_IN_FLIGHT = new Map();
const ORDERED_RESTAURANTS_CACHE = new Map();
const ORDERED_RESTAURANTS_IN_FLIGHT = new Map();
const USER_REVIEWS_CACHE = new Map();
const USER_REVIEWS_IN_FLIGHT = new Map();

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `Error ${response.status}`);
  }

  if (Array.isArray(payload) && payload.length > 1 && Number(payload[1]) >= 400) {
    throw new Error(payload[0]?.message || `Error ${payload[1]}`);
  }

  return payload;
};

const getDistanceKm = (latitudeA, longitudeA, latitudeB, longitudeB) => {
  const radius = 6371;
  const dLat = ((latitudeB - latitudeA) * Math.PI) / 180;
  const dLon = ((longitudeB - longitudeA) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((latitudeA * Math.PI) / 180) *
      Math.cos((latitudeB * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};

const normalizeAddress = (address, index = 0) => ({
  id: address.id || address._id || `server-addr-${index + 1}`,
  alias: address.alias || `Dirección ${index + 1}`,
  address: address.address || '',
  city: address.city || '',
  state: address.state || '',
  postal_code: address.postal_code || '',
  latitude: Number(address.latitude) || Number(address.geo?.coordinates?.[1]) || 0,
  longitude: Number(address.longitude) || Number(address.geo?.coordinates?.[0]) || 0,
});

const normalizeRestaurant = (restaurant) => {
  const location = restaurant.address || restaurant.location || {};
  const rawAddress = typeof restaurant.address === 'string' ? restaurant.address : '';

  return {
    _id: restaurant.restaurant_id || restaurant._id || restaurant.id,
    type: restaurant.type || restaurant.name || 'Pizza Hut',
    state: restaurant.state || '',
    city: restaurant.city || '',
    phone: restaurant.phone || '',
    location: {
      address1: location.address1 || rawAddress || '',
      address2: location.address2 || '',
      postal_code: location.postal_code || '',
      latitude: Number(location.latitude) || Number(location.geo?.coordinates?.[1]) || 0,
      longitude: Number(location.longitude) || Number(location.geo?.coordinates?.[0]) || 0,
    },
    hours: {
      Open: restaurant.hours?.Open || '-',
      Close: restaurant.hours?.Close || '-',
    },
    not_available_products: restaurant.not_available_products || [],
  };
};

const getNearRestaurants = async (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return [];
  }

  const response = await requestJson('/restaurants/near', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify({
      latitude: lat,
      longitude: lon,
    }),
  });

  const items = Array.isArray(response) ? response : Array.isArray(response?.restaurants) ? response.restaurants : [];
  return items.map(normalizeRestaurant);
};

const normalizeReview = (review, fallbackUserId, fallbackRestaurantId) => ({
  _id: review.review_id || review._id || review.id,
  stars: Number(review.stars || 0),
  comment: review.comment || '',
  date: review.date || new Date().toISOString(),
  user_id: review.user_id || fallbackUserId,
  restaurant_id: review.restaurant_id || fallbackRestaurantId,
});

const toHexObjectId = (numericValue) => {
  const hex = numericValue.toString(16);
  return hex.padStart(24, '0').slice(-24);
};

const resolveMenuIdForOrder = (restaurantId, menuId) => {
  const rawMenuId = String(menuId ?? '').trim();
  if (!rawMenuId) {
    return '';
  }

  if (/^[a-f0-9]{24}$/i.test(rawMenuId)) {
    return rawMenuId;
  }

  const syntheticMatch = rawMenuId.match(/^([a-f0-9]{24})-(\d+)$/i);
  if (!syntheticMatch) {
    return rawMenuId;
  }

  const [, syntheticRestaurantId, menuIndexValue] = syntheticMatch;
  const effectiveRestaurantId = /^[a-f0-9]{24}$/i.test(String(restaurantId ?? ''))
    ? String(restaurantId).trim()
    : syntheticRestaurantId;

  const index = Number(menuIndexValue);
  if (!Number.isInteger(index) || index < 0) {
    return rawMenuId;
  }

  try {
    const baseNumeric = BigInt(`0x${effectiveRestaurantId}`);
    return toHexObjectId(baseNumeric + MENU_ID_OFFSET_FROM_RESTAURANT + BigInt(index));
  } catch {
    return rawMenuId;
  }
};

export const getUserProfile = async (userId, options = {}) => {
  const query = options?.cacheBust ? `?t=${Date.now()}` : '';
  const response = await requestJson(`/users/${userId}/addresses${query}`, options?.noCache ? { cache: 'no-store' } : undefined);
  const profileFallback = options?.profileFallback || {};
  const addresses = Array.isArray(response?.addresses)
    ? response.addresses
    : Array.isArray(response?.address)
      ? response.address
      : [];

  return {
    _id: userId,
    name: response?.name || profileFallback?.name || '',
    email: response?.email || profileFallback?.email || '',
    password: 'hashed_password',
    phone: response?.phone || profileFallback?.phone || '',
    addresses: addresses.map(normalizeAddress),
    reviews_id: [],
  };
};

export const updateUserProfile = async (userId, updatePayload) => {
  const pendingAddresses = (updatePayload?.addresses || []).filter((address) =>
    String(address.id).startsWith('local-'),
  );

  await Promise.all(
    pendingAddresses.map((address) =>
      requestJson(`/users/${userId}/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alias: address.alias,
          address: address.address,
          city: address.city,
          state: address.state || '',
          postal_code: address.postal_code || '',
        }),
      }),
    ),
  );

  return getUserProfile(userId, {
    noCache: true,
    cacheBust: true,
    profileFallback: {
      name: updatePayload?.name || '',
      email: updatePayload?.email || '',
      phone: updatePayload?.phone || '',
    },
  });
};

export const createUserAddress = async (userId, addressPayload) => {
  if (!userId) {
    throw new Error('Falta userId');
  }

  const payload = addressPayload || {};

  return requestJson(`/users/${userId}/addresses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alias: payload.alias || '',
      address: payload.address || '',
      city: payload.city || '',
      state: payload.state || '',
      postal_code: payload.postal_code || '',
    }),
  });
};

export const deleteUserAddress = async (userId, addressValue) => {
  if (!userId) {
    throw new Error('Falta userId');
  }

  const trimmed = String(addressValue ?? '').trim();
  if (!trimmed) {
    throw new Error('Falta address');
  }

  return requestJson(`/users/${userId}/addresses`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address: trimmed,
    }),
  });
};

export const getAllLocations = async () => {
  const response = await requestJson('/restaurants');
  const restaurants = Array.isArray(response) ? response : [];
  return restaurants.map(normalizeRestaurant);
};

export const getNearbyLocationsByAddress = async (address) => {
  const latitude = Number(address?.latitude) || Number(address?.geo?.coordinates?.[1]) || 0;
  const longitude = Number(address?.longitude) || Number(address?.geo?.coordinates?.[0]) || 0;

  const nearbyFromBackend = await getNearRestaurants(latitude, longitude);
  if (Array.isArray(nearbyFromBackend) && nearbyFromBackend.length > 0) {
    return nearbyFromBackend;
  }

  const allLocations = await getAllLocations();
  return allLocations
    .map((restaurant) => ({
      ...restaurant,
      _distanceKm: getDistanceKm(
        latitude,
        longitude,
        Number(restaurant.location?.latitude) || 0,
        Number(restaurant.location?.longitude) || 0,
      ),
    }))
    .sort((first, second) => first._distanceKm - second._distanceKm)
    .slice(0, 3)
    .map(({ _distanceKm, ...restaurant }) => restaurant);
};

export const getUserReviews = async (userId) => {
  if (!userId) {
    return [];
  }

  if (USER_REVIEWS_CACHE.has(userId)) {
    return USER_REVIEWS_CACHE.get(userId);
  }

  if (USER_REVIEWS_IN_FLIGHT.has(userId)) {
    return USER_REVIEWS_IN_FLIGHT.get(userId);
  }

  const pendingRequest = (async () => {
    const orderedRestaurants = await getRestaurantsOrderedByUser(userId);
    const restaurants = Array.isArray(orderedRestaurants) ? orderedRestaurants : [];

    const reviewRequests = restaurants
      .map((restaurant) => restaurant.restaurant_id)
      .filter(Boolean)
      .map((restaurantId) =>
        requestJson(`/reviews/${userId}?restaurant_id=${encodeURIComponent(restaurantId)}`)
          .then((review) => normalizeReview(review, userId, restaurantId))
          .catch(() => null),
      );

    const reviews = await Promise.all(reviewRequests);
    const normalizedReviews = reviews.filter((review) => review && review._id);
    USER_REVIEWS_CACHE.set(userId, normalizedReviews);
    return normalizedReviews;
  })();

  USER_REVIEWS_IN_FLIGHT.set(userId, pendingRequest);

  try {
    return await pendingRequest;
  } finally {
    USER_REVIEWS_IN_FLIGHT.delete(userId);
  }
};

const getRestaurantsOrderedByUser = async (userId) => {
  if (!userId) {
    return [];
  }

  if (ORDERED_RESTAURANTS_CACHE.has(userId)) {
    return ORDERED_RESTAURANTS_CACHE.get(userId);
  }

  if (ORDERED_RESTAURANTS_IN_FLIGHT.has(userId)) {
    return ORDERED_RESTAURANTS_IN_FLIGHT.get(userId);
  }

  const pendingRequest = (async () => {
    const orderedRestaurants = await requestJson(`/restaurants/ordered/${userId}`);
    const restaurants = Array.isArray(orderedRestaurants) ? orderedRestaurants : [];
    ORDERED_RESTAURANTS_CACHE.set(userId, restaurants);
    return restaurants;
  })();

  ORDERED_RESTAURANTS_IN_FLIGHT.set(userId, pendingRequest);

  try {
    return await pendingRequest;
  } finally {
    ORDERED_RESTAURANTS_IN_FLIGHT.delete(userId);
  }
};

export const getReviewableRestaurants = async (userId) => {
  const [orderedRestaurants, userReviews] = await Promise.all([
    getRestaurantsOrderedByUser(userId),
    getUserReviews(userId),
  ]);

  const restaurants = (Array.isArray(orderedRestaurants) ? orderedRestaurants : []).map((restaurant) => ({
    _id: restaurant.restaurant_id,
    type: restaurant.name || 'Pizza Hut',
    city: '',
    state: '',
    phone: '',
    location: {
      address1: restaurant.address || '',
      address2: '',
      postal_code: '',
      latitude: 0,
      longitude: 0,
    },
    hours: {
      Open: '-',
      Close: '-',
    },
    not_available_products: [],
  }));

  const reviewedRestaurantIds = new Set(userReviews.map((review) => review.restaurant_id));
  return restaurants.filter((restaurant) => !reviewedRestaurantIds.has(restaurant._id));
};

export const updateReview = async (reviewId, updatePayload) => {
  const response = await requestJson(`/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (updatePayload?.user_id) {
    USER_REVIEWS_CACHE.delete(updatePayload.user_id);
  }

  return response;
};

export const createReview = async (reviewPayload) => {
  const response = await requestJson('/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reviewPayload),
  });

  if (reviewPayload?.user_id) {
    USER_REVIEWS_CACHE.delete(reviewPayload.user_id);
  }

  return response;
};

export const getMenuByRestaurant = async (restaurantId) => {
  if (!restaurantId) {
    return [];
  }

  if (MENU_CACHE.has(restaurantId)) {
    return MENU_CACHE.get(restaurantId);
  }

  if (MENU_REQUESTS_IN_FLIGHT.has(restaurantId)) {
    return MENU_REQUESTS_IN_FLIGHT.get(restaurantId);
  }

  const pendingRequest = (async () => {
    const response = await requestJson(`/restaurants/${restaurantId}/menu`);
    const menu = Array.isArray(response?.menu) ? response.menu : [];

    const normalizedMenu = menu.map((item, index) => ({
      _id: item.menu_id || item._id || `${restaurantId}-${index}`,
      menu_id: item.menu_id || item._id || `${restaurantId}-${index}`,
      Pizza: item.pizza || item.Pizza || '',
      Type: item.type || item.Type || '',
      Size: item.size || item.Size || '',
      Price: Number(item.price ?? item.Price ?? 0),
      Stock: 0,
      restaurant_id: restaurantId,
    }));

    MENU_CACHE.set(restaurantId, normalizedMenu);
    return normalizedMenu;
  })();

  MENU_REQUESTS_IN_FLIGHT.set(restaurantId, pendingRequest);

  try {
    return await pendingRequest;
  } finally {
    MENU_REQUESTS_IN_FLIGHT.delete(restaurantId);
  }
};

export const getAdminMenuItems = async () => {
  const restaurantNamesResponse = await requestJson('/restaurants/names');
  const restaurantNames = Array.isArray(restaurantNamesResponse) ? restaurantNamesResponse : [];
  const firstRestaurantId = restaurantNames[0]?.restaurant_id;

  if (!firstRestaurantId) {
    return [];
  }

  return getMenuByRestaurant(firstRestaurantId);
};

export const getTopRatedRestaurants = async () => {
  const response = await requestJson('/best-rated');
  return Array.isArray(response) ? response : [];
};

export const getSalesByState = async () => {
  const response = await requestJson('/sales-per-state');
  return Array.isArray(response) ? response : [];
};

export const getBestSellingProducts = async () => {
  const response = await requestJson('/best-sellers');
  return Array.isArray(response) ? response : [];
};

export const getMonthlySalesTrend = async () => {
  const response = await requestJson('/sales-per-month');
  return Array.isArray(response) ? response : [];
};

export const updateAdminMenuStock = async () => {
  throw new Error('El backend actual no expone un endpoint para actualizar stock de menú.');
};

export const disableProductsForRestaurants = async () => {
  throw new Error('El backend actual no expone un endpoint para deshabilitar productos por restaurante.');
};

const normalizeOrderPayload = (orderPayload) => {
  const normalizedRestaurantId = String(orderPayload?.restaurant_id ?? '').trim();

  const normalizedItems = Array.isArray(orderPayload?.items)
    ? orderPayload.items
        .map((item) => ({
          menu_id: resolveMenuIdForOrder(normalizedRestaurantId, item?.menu_id),
          quantity: Number(item?.quantity ?? 0),
        }))
        .filter((item) => item.menu_id && Number.isFinite(item.quantity) && item.quantity > 0)
    : [];

  return {
    user_id: String(orderPayload?.user_id ?? '').trim(),
    restaurant_id: normalizedRestaurantId,
    payment_method: String(orderPayload?.payment_method ?? '').trim() || 'Credit Card',
    items: normalizedItems,
  };
};

export const submitOrder = async (orderPayload) => {
  const normalizedOrderPayload = normalizeOrderPayload(orderPayload);

  const response = await requestJson('/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedOrderPayload),
  });

  return {
    ...(typeof response === 'object' && response !== null ? response : {}),
    persisted_payload: normalizedOrderPayload,
    requested_payload: normalizedOrderPayload,
    used_fallback: false,
  };
};
