import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Pizza, Star, UserCircle2, LogOut, Store, Minus, Plus, Send, Search, Pencil, X, Trash2 } from 'lucide-react';
import {
  createReview,
  getAllLocations,
  getMenuByRestaurant,
  getNearbyLocationsByAddress,
  getReviewableRestaurants,
  submitOrder,
  getUserProfile,
  updateUserProfile,
  updateReview,
  getUserReviews,
} from '../services/dashboardService';

const DASHBOARD_SECTIONS = {
  order: 'realizar-pedido',
  menu: 'menu',
  locations: 'localizaciones',
  reviews: 'resenas',
  profile: 'perfil',
};

export default function UserDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState(DASHBOARD_SECTIONS.order);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    password: 'hashed_password',
    phone: '',
    addresses: [],
    reviews_id: [],
  });
  const [newAddressForm, setNewAddressForm] = useState({
    alias: '',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [recommendedLocations, setRecommendedLocations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [quantitiesByMenuId, setQuantitiesByMenuId] = useState({});
  const [lastOrderPayload, setLastOrderPayload] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [reviewModalType, setReviewModalType] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewableRestaurants, setReviewableRestaurants] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    stars: 5,
    comment: '',
    restaurant_id: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const userProfile = await getUserProfile(user.id);
      const allLocations = await getAllLocations();
      const userReviews = await getUserReviews(user.id);
      const allowedRestaurants = await getReviewableRestaurants(user.id);

      setProfile(userProfile);
      setProfileForm({
        name: userProfile?.name ?? '',
        email: userProfile?.email ?? '',
        password: userProfile?.password ?? 'hashed_password',
        phone: userProfile?.phone ?? '',
        addresses: userProfile?.addresses ?? [],
        reviews_id: userProfile?.reviews_id ?? [],
      });
      setLocations(allLocations);
      setReviews(userReviews);
      setReviewableRestaurants(allowedRestaurants);

      if (userProfile?.addresses?.length) {
        const firstAddress = userProfile.addresses[0];
        setSelectedAddressId(firstAddress.id);
        const nearest = await getNearbyLocationsByAddress(firstAddress);
        setRecommendedLocations(nearest);
      }
    };

    loadData();
  }, [user.id]);

  const refreshReviewsData = async () => {
    const [userReviews, allowedRestaurants] = await Promise.all([
      getUserReviews(user.id),
      getReviewableRestaurants(user.id),
    ]);
    setReviews(userReviews);
    setReviewableRestaurants(allowedRestaurants);
  };

  const syncProfileForm = (nextProfile) => {
    setProfile(nextProfile);
    setProfileForm({
      name: nextProfile?.name ?? '',
      email: nextProfile?.email ?? '',
      password: nextProfile?.password ?? 'hashed_password',
      phone: nextProfile?.phone ?? '',
      addresses: nextProfile?.addresses ?? [],
      reviews_id: nextProfile?.reviews_id ?? [],
    });
  };

  const selectedAddress = useMemo(() => {
    if (!profile?.addresses?.length) {
      return null;
    }
    return profile.addresses.find((address) => address.id === selectedAddressId) ?? null;
  }, [profile, selectedAddressId]);

  const handleAddressChange = async (event) => {
    const newAddressId = event.target.value;
    setSelectedAddressId(newAddressId);

    const address = profile.addresses.find((item) => item.id === newAddressId);
    if (!address) {
      setRecommendedLocations([]);
      return;
    }

    const nearest = await getNearbyLocationsByAddress(address);
    setRecommendedLocations(nearest);
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    const items = await getMenuByRestaurant(restaurant._id);
    setMenuItems(items);
    setQuantitiesByMenuId({});
    setLastOrderPayload(null);
    setActiveSection(DASHBOARD_SECTIONS.menu);
  };

  const updateQuantity = (menuId, delta) => {
    setQuantitiesByMenuId((previous) => {
      const currentQty = previous[menuId] ?? 0;
      const nextQty = Math.max(0, currentQty + delta);

      if (nextQty === 0) {
        const nextState = { ...previous };
        delete nextState[menuId];
        return nextState;
      }

      return {
        ...previous,
        [menuId]: nextQty,
      };
    });
  };

  const subtotal = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      const quantity = quantitiesByMenuId[item._id] ?? 0;
      return acc + item.Price * quantity;
    }, 0);
  }, [menuItems, quantitiesByMenuId]);

  const filteredLocations = useMemo(() => {
    const search = addressSearch.trim().toLowerCase();
    if (!search) {
      return locations;
    }

    return locations.filter((location) => {
      const fullAddress = `${location.location.address1} ${location.location.address2}`.toLowerCase();
      return fullAddress.includes(search);
    });
  }, [locations, addressSearch]);

  const locationNameById = useMemo(() => {
    return locations.reduce((acc, location) => {
      acc[location._id] = `${location.type} - ${location.location.address1}, ${location.city}`;
      return acc;
    }, {});
  }, [locations]);

  const openEditReviewModal = (review) => {
    setSelectedReview(review);
    setReviewForm({
      stars: review.stars,
      comment: review.comment,
      restaurant_id: review.restaurant_id,
    });
    setReviewModalType('edit');
  };

  const openNewReviewModal = () => {
    const firstRestaurantId = reviewableRestaurants[0]?._id ?? '';
    setSelectedReview(null);
    setReviewForm({
      stars: 5,
      comment: '',
      restaurant_id: firstRestaurantId,
    });
    setReviewModalType('create');
  };

  const closeReviewModal = () => {
    setReviewModalType(null);
    setSelectedReview(null);
  };

  const handleSaveReview = async () => {
    if (reviewModalType === 'edit' && selectedReview) {
      await updateReview(selectedReview._id, {
        stars: Number(reviewForm.stars),
        comment: reviewForm.comment,
      });
    }

    if (reviewModalType === 'create') {
      await createReview({
        stars: Number(reviewForm.stars),
        date: new Date().toISOString(),
        comment: reviewForm.comment,
        restaurant_id: reviewForm.restaurant_id,
        user_id: user.id,
      });
    }

    await refreshReviewsData();
    closeReviewModal();
  };

  const handleAddAddress = () => {
    if (!newAddressForm.alias || !newAddressForm.address || !newAddressForm.city) {
      return;
    }

    const addressToAdd = {
      id: `addr-${Date.now()}`,
      alias: newAddressForm.alias,
      address: newAddressForm.address,
      city: newAddressForm.city,
      latitude: Number(newAddressForm.latitude) || 0,
      longitude: Number(newAddressForm.longitude) || 0,
    };

    setProfileForm((prev) => ({
      ...prev,
      addresses: [...prev.addresses, addressToAdd],
    }));

    setNewAddressForm({
      alias: '',
      address: '',
      city: '',
      latitude: '',
      longitude: '',
    });
  };

  const handleRemoveAddress = (addressId) => {
    setProfileForm((prev) => ({
      ...prev,
      addresses: prev.addresses.filter((address) => address.id !== addressId),
    }));
  };

  const handleSaveProfile = async () => {
    const payload = {
      name: profileForm.name,
      email: profileForm.email,
      phone: profileForm.phone,
      addresses: profileForm.addresses,
      reviews_id: profileForm.reviews_id,
    };

    const updatedProfile = await updateUserProfile(user.id, payload);
    if (updatedProfile) {
      syncProfileForm(updatedProfile);
    }

    setProfileEditMode(false);
  };

  const handleCancelProfileEdit = () => {
    syncProfileForm(profile);
    setProfileEditMode(false);
  };

  const handleSubmitOrder = async () => {
    if (!selectedRestaurant || subtotal <= 0) {
      return;
    }

    const items = menuItems
      .filter((item) => (quantitiesByMenuId[item._id] ?? 0) > 0)
      .map((item) => ({
        Menu_id: item._id,
        Quantity: quantitiesByMenuId[item._id],
        Price: item.Price,
      }));

    const orderPayload = {
      _id: `ord-${Date.now()}`,
      User_id: user.id,
      Restaurant_id: selectedRestaurant._id,
      Total: Number(subtotal.toFixed(2)),
      Items: items,
      Order_date: new Date().toISOString(),
      Payment_method: paymentMethod,
    };

    const response = await submitOrder(orderPayload);
    setLastOrderPayload(response.payload ?? orderPayload);
  };

  const renderOrderSection = () => (
    <section className="dashboard-panel">
      <h2>Realizar pedido</h2>
      <p>Selecciona una dirección para recomendarte los Pizza Hut más cercanos.</p>

      <div className="address-box">
        <label htmlFor="address-select">Dirección de entrega</label>
        <select id="address-select" value={selectedAddressId} onChange={handleAddressChange}>
          {(profile?.addresses ?? []).map((address) => (
            <option key={address.id} value={address.id}>
              {address.alias} - {address.address}, {address.city}
            </option>
          ))}
        </select>
      </div>

      {selectedAddress ? (
        <p className="selected-address">
          Entrega en: {selectedAddress.address}, {selectedAddress.city}
        </p>
      ) : null}

      <div className="cards-grid">
        {recommendedLocations.map((location) => (
          <article key={location._id} className="dashboard-card">
            <h3>
              <Store size={16} /> {location.type}
            </h3>
            <p>
              {location.location.address1}, {location.location.address2}
            </p>
            <p>{location.city}, {location.state}</p>
            <p>Horario: {location.hours.Open} - {location.hours.Close}</p>
            <p>Distancia aprox: {location.distanceKm} km</p>
            <button
              type="button"
              className="select-restaurant-button"
              onClick={() => handleSelectRestaurant(location)}
            >
              Ver menú
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const renderMenuSection = () => (
    <section className="dashboard-panel">
      <div className="menu-header">
        <h2>Menú</h2>
        <button
          type="button"
          className="back-button"
          onClick={() => setActiveSection(DASHBOARD_SECTIONS.order)}
        >
          Cambiar restaurante
        </button>
      </div>

      {selectedRestaurant ? (
        <p className="selected-address">
          Restaurante: {selectedRestaurant.type} - {selectedRestaurant.location.address1}
        </p>
      ) : null}

      <div className="menu-table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Pizza</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Precio</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => {
              const quantity = quantitiesByMenuId[item._id] ?? 0;
              return (
                <tr key={item._id}>
                  <td>{item.Pizza}</td>
                  <td>{item.Type}</td>
                  <td>{item.Size}</td>
                  <td>${item.Price.toFixed(2)}</td>
                  <td>
                    <div className="qty-controls">
                      <button type="button" onClick={() => updateQuantity(item._id, -1)}>
                        <Minus size={15} />
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateQuantity(item._id, 1)}>
                        <Plus size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="order-actions">
        <div className="payment-method-box">
          <label htmlFor="payment-method">Método de pago</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
          >
            <option value="Credit Card">Tarjeta</option>
            <option value="Cash">Efectivo</option>
          </select>
        </div>

        <div className="order-submit-group">
          <p className="subtotal">Subtotal: ${subtotal.toFixed(2)}</p>
          <button
            type="button"
            className="send-order-button"
            onClick={handleSubmitOrder}
            disabled={subtotal <= 0}
          >
            <Send size={16} /> Enviar orden
          </button>
        </div>
      </div>

      {lastOrderPayload ? (
        <div className="order-json-box">
          <p>JSON enviado:</p>
          <pre>{JSON.stringify(lastOrderPayload, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );

  const renderLocationsSection = () => (
    <section className="dashboard-panel">
      <h2>Localizaciones</h2>
      <p>Todos los restaurantes Pizza Hut disponibles.</p>

      <div className="locations-search-box">
        <Search size={16} />
        <input
          type="text"
          placeholder="Buscar por dirección"
          value={addressSearch}
          onChange={(event) => setAddressSearch(event.target.value)}
        />
      </div>

      <div className="locations-table-wrapper">
        <table className="locations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Ciudad</th>
              <th>Dirección 1</th>
              <th>Dirección 2</th>
              <th>Postal</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Apertura</th>
              <th>Cierre</th>
              <th>Teléfono</th>
              <th>No disponibles</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map((location) => (
              <tr key={location._id}>
                <td>{location._id}</td>
                <td>{location.type}</td>
                <td>{location.state}</td>
                <td>{location.city}</td>
                <td>{location.location.address1}</td>
                <td>{location.location.address2 || '-'}</td>
                <td>{location.location.postal_code}</td>
                <td>{location.location.latitude}</td>
                <td>{location.location.longitude}</td>
                <td>{location.hours?.Open || '-'}</td>
                <td>{location.hours?.Close || '-'}</td>
                <td>{location.phone || '-'}</td>
                <td>{location.not_available_products?.length ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="locations-count">Resultados: {filteredLocations.length}</p>
    </section>
  );

  const renderReviewsSection = () => (
    <section className="dashboard-panel">
      <div className="reviews-header">
        <div>
          <h2>Reseñas</h2>
          <p>Reseñas realizadas por restaurante.</p>
        </div>
        <button type="button" className="new-review-button" onClick={openNewReviewModal}>
          <Plus size={16} /> Nueva Reseña
        </button>
      </div>

      <div className="cards-grid reviews-grid">
        {reviews.map((review) => (
          <article key={review._id} className="dashboard-card review-card">
            <h3>
              <Star size={16} /> {review.stars} estrellas
            </h3>
            <p className="review-meta">{locationNameById[review.restaurant_id] || review.restaurant_id}</p>
            <p className="review-meta">Fecha: {new Date(review.date).toLocaleDateString()}</p>
            <p>{review.comment}</p>
            <div className="review-card-actions">
              <button type="button" className="edit-review-button" onClick={() => openEditReviewModal(review)}>
                <Pencil size={14} /> Editar
              </button>
            </div>
          </article>
        ))}
      </div>

      {reviewModalType ? (
        <div className="review-modal-overlay">
          <div className="review-modal">
            <button type="button" className="close-modal-button" onClick={closeReviewModal}>
              <X size={16} />
            </button>

            <h3>{reviewModalType === 'edit' ? 'Editar reseña' : 'Nueva reseña'}</h3>

            <div className="review-form-grid">
              {reviewModalType === 'create' ? (
                <label>
                  Restaurante
                  <select
                    value={reviewForm.restaurant_id}
                    onChange={(event) =>
                      setReviewForm((prev) => ({ ...prev, restaurant_id: event.target.value }))
                    }
                  >
                    {reviewableRestaurants.map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id}>
                        {restaurant.type} - {restaurant.location.address1}, {restaurant.city}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  Restaurante
                  <input
                    value={locationNameById[reviewForm.restaurant_id] || reviewForm.restaurant_id}
                    disabled
                    readOnly
                  />
                </label>
              )}

              <label>
                Estrellas
                <select
                  value={reviewForm.stars}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, stars: Number(event.target.value) }))
                  }
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </label>

              <label className="full-width">
                Comentario
                <textarea
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(event) =>
                    setReviewForm((prev) => ({ ...prev, comment: event.target.value }))
                  }
                />
              </label>

              {reviewModalType === 'create' ? (
                <p className="review-date-text">Fecha: {new Date().toLocaleDateString()}</p>
              ) : (
                <p className="review-date-text">
                  Fecha: {selectedReview ? new Date(selectedReview.date).toLocaleDateString() : '-'}
                </p>
              )}
            </div>

            <div className="review-modal-actions">
              <button type="button" className="back-button" onClick={closeReviewModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="send-order-button"
                onClick={handleSaveReview}
                disabled={!reviewForm.comment.trim() || (reviewModalType === 'create' && !reviewForm.restaurant_id)}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );

  const renderProfileSection = () => (
    <section className="dashboard-panel">
      <div className="profile-screen-header">
        <h2>Perfil</h2>
        {!profileEditMode ? (
          <button type="button" className="new-review-button" onClick={() => setProfileEditMode(true)}>
            <Pencil size={14} /> Editar perfil
          </button>
        ) : (
          <div className="profile-actions">
            <button type="button" className="back-button" onClick={handleCancelProfileEdit}>
              Cancelar
            </button>
            <button type="button" className="send-order-button" onClick={handleSaveProfile}>
              Guardar perfil
            </button>
          </div>
        )}
      </div>

      <div className="profile-data-grid">
        <label>
          ID
          <input value={profile?._id || user.id} disabled readOnly />
        </label>
        <label>
          Nombre
          <input
            value={profileForm.name}
            disabled={!profileEditMode}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </label>
        <label>
          Email
          <input
            value={profileForm.email}
            disabled={!profileEditMode}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
          />
        </label>
        <label>
          Password
          <input value={profileForm.password} disabled readOnly />
        </label>
        <label>
          Teléfono
          <input
            value={profileForm.phone}
            disabled={!profileEditMode}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </label>
        <label>
          reviews_id
          <input value={(profileForm.reviews_id || []).join(', ')} disabled readOnly />
        </label>
      </div>

      <div className="profile-addresses-block">
        <h3>Direcciones</h3>
        <div className="cards-grid">
          {(profileForm.addresses || []).map((address) => (
            <article key={address.id} className="dashboard-card profile-address-card">
              <p><strong>{address.alias}</strong></p>
              <p>{address.address}</p>
              <p>{address.city}</p>
              <p>Lat: {address.latitude}</p>
              <p>Lng: {address.longitude}</p>
              {profileEditMode ? (
                <button
                  type="button"
                  className="edit-review-button delete-address-button"
                  onClick={() => handleRemoveAddress(address.id)}
                >
                  <Trash2 size={14} /> Eliminar
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {profileEditMode ? (
        <div className="add-address-box">
          <h3>Añadir nueva dirección</h3>
          <div className="profile-data-grid">
            <label>
              Alias
              <input
                value={newAddressForm.alias}
                onChange={(event) => setNewAddressForm((prev) => ({ ...prev, alias: event.target.value }))}
              />
            </label>
            <label>
              Dirección
              <input
                value={newAddressForm.address}
                onChange={(event) => setNewAddressForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </label>
            <label>
              Ciudad
              <input
                value={newAddressForm.city}
                onChange={(event) => setNewAddressForm((prev) => ({ ...prev, city: event.target.value }))}
              />
            </label>
            <label>
              Latitud
              <input
                value={newAddressForm.latitude}
                onChange={(event) => setNewAddressForm((prev) => ({ ...prev, latitude: event.target.value }))}
              />
            </label>
            <label>
              Longitud
              <input
                value={newAddressForm.longitude}
                onChange={(event) => setNewAddressForm((prev) => ({ ...prev, longitude: event.target.value }))}
              />
            </label>
          </div>

          <button type="button" className="new-review-button" onClick={handleAddAddress}>
            <Plus size={16} /> Añadir dirección
          </button>
        </div>
      ) : null}
    </section>
  );

  const renderContent = () => {
    if (activeSection === DASHBOARD_SECTIONS.menu) {
      return renderMenuSection();
    }

    if (activeSection === DASHBOARD_SECTIONS.locations) {
      return renderLocationsSection();
    }

    if (activeSection === DASHBOARD_SECTIONS.reviews) {
      return renderReviewsSection();
    }

    if (activeSection === DASHBOARD_SECTIONS.profile) {
      return renderProfileSection();
    }

    return renderOrderSection();
  };

  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="Pizza Hut" className="sidebar-logo" />
          <span>Pizza Hut</span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={activeSection === DASHBOARD_SECTIONS.order ? 'active' : ''}
            onClick={() => setActiveSection(DASHBOARD_SECTIONS.order)}
          >
            <Pizza size={18} /> Realizar pedido
          </button>
          <button
            type="button"
            className={activeSection === DASHBOARD_SECTIONS.locations ? 'active' : ''}
            onClick={() => setActiveSection(DASHBOARD_SECTIONS.locations)}
          >
            <MapPin size={18} /> Localizaciones
          </button>
          <button
            type="button"
            className={activeSection === DASHBOARD_SECTIONS.reviews ? 'active' : ''}
            onClick={() => setActiveSection(DASHBOARD_SECTIONS.reviews)}
          >
            <Star size={18} /> Reseñas
          </button>
        </nav>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <h1>Dashboard de usuario</h1>

          <div className="header-actions">
            <button
              type="button"
              className="profile-button"
              onClick={() => setActiveSection(DASHBOARD_SECTIONS.profile)}
            >
              <UserCircle2 size={24} />
            </button>
            <button type="button" className="logout-button" onClick={onLogout}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>

        {renderContent()}
      </section>
    </main>
  );
}
