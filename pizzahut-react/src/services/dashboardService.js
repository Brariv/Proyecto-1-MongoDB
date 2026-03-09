const USE_MOCK_DATA = true;
const API_BASE_URL = 'http://localhost:3000/api';

// Endpoints planeados para backend (descomentar al integrar API real):
// GET    `${API_BASE_URL}/users/:userId`
// PATCH  `${API_BASE_URL}/users/:userId`
// GET    `${API_BASE_URL}/restaurants`
// GET    `${API_BASE_URL}/reviews?user_id=:userId`
// PATCH  `${API_BASE_URL}/reviews/:reviewId`
// POST   `${API_BASE_URL}/reviews`
// GET    `${API_BASE_URL}/users/:userId/reviewable-restaurants`
// GET    `${API_BASE_URL}/orders?user_id=:userId`
// GET    `${API_BASE_URL}/menu?restaurant_id=:restaurantId`
// POST   `${API_BASE_URL}/orders`

let MOCK_USERS = [
  {
    _id: 'user-001',
    name: 'Cliente Pizza Hut',
    email: 'user@pizzahut.com',
    password: 'hashed_password',
    phone: '+555-100-2001',
    addresses: [
      {
        id: 'addr-001',
        alias: 'Casa',
        address: '456 Elm Street',
        city: 'Anytown',
        latitude: 40.7128,
        longitude: -74.006,
      },
      {
        id: 'addr-002',
        alias: 'Trabajo',
        address: '30 Park Avenue',
        city: 'Anytown',
        latitude: 40.7198,
        longitude: -74.002,
      },
    ],
    reviews_id: ['rev-001', 'rev-002'],
  },
];

const MOCK_RESTAURANTS = [
  {
    _id: 'rest-001',
    state: 'NY',
    city: 'Anytown',
    location: {
      address1: '123 Main Street',
      address2: 'Suite 100',
      postal_code: '12345',
      latitude: 40.713,
      longitude: -74.0058,
    },
    hours: {
      Open: '10:00 AM',
      Close: '10:00 PM',
    },
    type: 'Pizza Hut Express',
    phone: '555-123-4567',
  },
  {
    _id: 'rest-002',
    state: 'NY',
    city: 'Anytown',
    location: {
      address1: '80 Lexington Ave',
      address2: 'Local 2',
      postal_code: '12346',
      latitude: 40.72,
      longitude: -74.001,
    },
    hours: {
      Open: '09:00 AM',
      Close: '11:00 PM',
    },
    type: 'Pizza Hut',
    phone: '555-987-1212',
  },
  {
    _id: 'rest-003',
    state: 'NY',
    city: 'Anytown',
    location: {
      address1: '14 Broadway',
      address2: 'Piso 1',
      postal_code: '12340',
      latitude: 40.7075,
      longitude: -74.01,
    },
    hours: {
      Open: '10:30 AM',
      Close: '10:30 PM',
    },
    type: 'Pizza Hut Delivery',
    phone: '555-110-8899',
  },
];

let MOCK_REVIEWS = [
  {
    _id: 'rev-001',
    stars: 5,
    date: '2024-06-01T12:00:00Z',
    comment: 'Amazing food and great service!',
    restaurant_id: 'rest-001',
    user_id: 'user-001',
  },
  {
    _id: 'rev-002',
    stars: 4,
    date: '2024-06-05T18:30:00Z',
    comment: 'La pizza llegó caliente y a tiempo.',
    restaurant_id: 'rest-002',
    user_id: 'user-001',
  },
];

const MOCK_ORDERS = [
  {
    _id: 'ord-001',
    User_id: 'user-001',
    Restaurant_id: 'rest-001',
    Total: 26.48,
    Items: [
      {
        Menu_id: 'menu-001',
        Quantity: 2,
        Price: 12.99,
      },
    ],
    Order_date: '2026-02-10T18:30:00Z',
    Payment_method: 'Credit Card',
  },
  {
    _id: 'ord-002',
    User_id: 'user-001',
    Restaurant_id: 'rest-003',
    Total: 8.99,
    Items: [
      {
        Menu_id: 'menu-005',
        Quantity: 1,
        Price: 8.99,
      },
    ],
    Order_date: '2026-03-01T20:05:00Z',
    Payment_method: 'Cash',
  },
];

const MOCK_MENU_ITEMS = [
  {
    _id: 'menu-001',
    Pizza: 'Super Supreme Pizza (Pan Pizza)',
    Type: 'Classic Recipe Pizzas',
    Size: 'Large',
    Price: 12.99,
    available_until: '2026-12-31T23:59:59Z',
    restaurant_id: 'rest-001',
  },
  {
    _id: 'menu-002',
    Pizza: 'Pepperoni Lover\'s Pizza',
    Type: 'Classic Recipe Pizzas',
    Size: 'Medium',
    Price: 10.99,
    available_until: '2026-12-31T23:59:59Z',
    restaurant_id: 'rest-001',
  },
  {
    _id: 'menu-003',
    Pizza: 'Veggie Lover\'s Pizza',
    Type: 'Vegetarian Pizzas',
    Size: 'Large',
    Price: 11.49,
    available_until: '2026-12-31T23:59:59Z',
    restaurant_id: 'rest-002',
  },
  {
    _id: 'menu-004',
    Pizza: 'Meat Lover\'s Pizza',
    Type: 'Classic Recipe Pizzas',
    Size: 'Large',
    Price: 13.49,
    available_until: '2026-12-31T23:59:59Z',
    restaurant_id: 'rest-002',
  },
  {
    _id: 'menu-005',
    Pizza: 'Hawaiian Chicken Pizza',
    Type: 'Specialty Pizzas',
    Size: 'Personal',
    Price: 8.99,
    available_until: '2026-12-31T23:59:59Z',
    restaurant_id: 'rest-003',
  },
  {
    _id: 'menu-006',
    Pizza: 'Cheese Pizza',
    Type: 'Classic Recipe Pizzas',
    Size: 'Large',
    Price: 9.99,
    available_until: '2026-12-31T23:59:59Z',
    restaurant_id: 'rest-003',
  },
];

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

export const getUserProfile = async (userId) => {
  if (USE_MOCK_DATA) {
    const foundUser = MOCK_USERS.find((user) => user._id === userId) ?? null;
    return foundUser ? JSON.parse(JSON.stringify(foundUser)) : null;
  }

  const response = await fetch(`${API_BASE_URL}/users/${userId}`);
  if (!response.ok) {
    throw new Error('No se pudo cargar el perfil del usuario');
  }
  return response.json();
};

export const updateUserProfile = async (userId, updatePayload) => {
  if (USE_MOCK_DATA) {
    MOCK_USERS = MOCK_USERS.map((user) => {
      if (user._id !== userId) {
        return user;
      }
      return {
        ...user,
        ...updatePayload,
      };
    });

    const updated = MOCK_USERS.find((user) => user._id === userId) ?? null;
    return updated ? JSON.parse(JSON.stringify(updated)) : null;
  }

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar el perfil del usuario');
  }

  return response.json();
};

export const getAllLocations = async () => {
  if (USE_MOCK_DATA) {
    return MOCK_RESTAURANTS;
  }

  const response = await fetch(`${API_BASE_URL}/restaurants`);
  if (!response.ok) {
    throw new Error('No se pudieron cargar las localizaciones');
  }
  return response.json();
};

export const getNearbyLocationsByAddress = async (address) => {
  const locations = await getAllLocations();
  return locations
    .map((restaurant) => {
      const distance = getDistanceKm(
        address.latitude,
        address.longitude,
        restaurant.location.latitude,
        restaurant.location.longitude,
      );
      return {
        ...restaurant,
        distanceKm: Number(distance.toFixed(2)),
      };
    })
    .sort((first, second) => first.distanceKm - second.distanceKm)
    .slice(0, 3);
};

export const getUserReviews = async (userId) => {
  if (USE_MOCK_DATA) {
    return MOCK_REVIEWS.filter((review) => review.user_id === userId);
  }

  const response = await fetch(`${API_BASE_URL}/reviews?user_id=${userId}`);
  if (!response.ok) {
    throw new Error('No se pudieron cargar las reseñas del usuario');
  }
  return response.json();
};

export const getUserOrders = async (userId) => {
  if (USE_MOCK_DATA) {
    return MOCK_ORDERS.filter((order) => order.User_id === userId);
  }

  const response = await fetch(`${API_BASE_URL}/orders?user_id=${userId}`);
  if (!response.ok) {
    throw new Error('No se pudieron cargar las órdenes del usuario');
  }
  return response.json();
};

export const getReviewableRestaurants = async (userId) => {
  if (USE_MOCK_DATA) {
    const userOrders = MOCK_ORDERS.filter((order) => order.User_id === userId);
    const orderedRestaurantIds = [...new Set(userOrders.map((order) => order.Restaurant_id))];
    const reviewedRestaurantIds = new Set(
      MOCK_REVIEWS.filter((review) => review.user_id === userId).map((review) => review.restaurant_id),
    );

    return MOCK_RESTAURANTS.filter(
      (restaurant) =>
        orderedRestaurantIds.includes(restaurant._id) && !reviewedRestaurantIds.has(restaurant._id),
    );
  }

  const response = await fetch(`${API_BASE_URL}/users/${userId}/reviewable-restaurants`);
  if (!response.ok) {
    throw new Error('No se pudieron cargar los restaurantes para reseñar');
  }
  return response.json();
};

export const updateReview = async (reviewId, updatePayload) => {
  if (USE_MOCK_DATA) {
    MOCK_REVIEWS = MOCK_REVIEWS.map((review) => {
      if (review._id !== reviewId) {
        return review;
      }
      return {
        ...review,
        stars: updatePayload.stars,
        comment: updatePayload.comment,
      };
    });

    return MOCK_REVIEWS.find((review) => review._id === reviewId) ?? null;
  }

  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar la reseña');
  }

  return response.json();
};

export const createReview = async (reviewPayload) => {
  if (USE_MOCK_DATA) {
    const newReview = {
      _id: `rev-${Date.now()}`,
      ...reviewPayload,
    };
    MOCK_REVIEWS = [newReview, ...MOCK_REVIEWS];
    return newReview;
  }

  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reviewPayload),
  });

  if (!response.ok) {
    throw new Error('No se pudo crear la reseña');
  }

  return response.json();
};

export const getMenuByRestaurant = async (restaurantId) => {
  if (USE_MOCK_DATA) {
    return MOCK_MENU_ITEMS.filter((item) => item.restaurant_id === restaurantId);
  }

  const response = await fetch(`${API_BASE_URL}/menu?restaurant_id=${restaurantId}`);
  if (!response.ok) {
    throw new Error('No se pudo cargar el menú del restaurante');
  }
  return response.json();
};

export const submitOrder = async (orderPayload) => {
  if (USE_MOCK_DATA) {
    return {
      ok: true,
      order_id: `ord-${Date.now()}`,
      payload: orderPayload,
    };
  }

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!response.ok) {
    throw new Error('No se pudo enviar la orden');
  }

  return response.json();
};
