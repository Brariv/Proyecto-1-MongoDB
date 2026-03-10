import React, { useEffect, useMemo, useState } from 'react';
import { ListChecks, ShieldAlert, Minus, Plus, Save, LogOut, BarChart3, TrendingUp, ShoppingBasket, ChartLine } from 'lucide-react';
import {
  getBestSellingProducts,
  disableProductsForRestaurants,
  getAdminMenuItems,
  getAllLocations,
  getMonthlySalesTrend,
  getSalesByState,
  getTopRatedRestaurants,
  updateAdminMenuStock,
} from '../services/dashboardService';

const ADMIN_SECTIONS = {
  menu: 'menu',
  availability: 'availability',
  bestRestaurants: 'best-restaurants',
  sales: 'sales',
  bestProducts: 'best-products',
  salesTrend: 'sales-trend',
  reports: 'reports',
};

export default function AdminDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState(ADMIN_SECTIONS.menu);
  const [menuItems, setMenuItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stockByMenuId, setStockByMenuId] = useState({});
  const [selectedRestaurantIds, setSelectedRestaurantIds] = useState([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);
  const [adminMessage, setAdminMessage] = useState('');
  const [bestRestaurants, setBestRestaurants] = useState([]);
  const [salesByState, setSalesByState] = useState([]);
  const [bestProducts, setBestProducts] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          adminMenuItems,
          allLocations,
          topRatedRestaurants,
          salesByStateData,
          bestSellers,
          monthlyTrend,
        ] = await Promise.all([
          getAdminMenuItems(),
          getAllLocations(),
          getTopRatedRestaurants(),
          getSalesByState(),
          getBestSellingProducts(),
          getMonthlySalesTrend(),
        ]);

        setMenuItems(adminMenuItems);
        setLocations(allLocations);
        setBestRestaurants(topRatedRestaurants);
        setSalesByState(salesByStateData);
        setBestProducts(bestSellers);
        setSalesTrend(monthlyTrend);
        setStockByMenuId(
          adminMenuItems.reduce((acc, item) => {
            acc[item._id] = item.Stock ?? 0;
            return acc;
          }, {}),
        );
      } catch (loadError) {
        console.error(loadError);
        setAdminMessage(loadError.message || 'No se pudieron cargar los datos de administrador.');
      }
    };

    loadData();
  }, []);

  const updateStock = (menuId, delta) => {
    setStockByMenuId((previous) => {
      const currentValue = previous[menuId] ?? 0;
      return {
        ...previous,
        [menuId]: Math.max(0, currentValue + delta),
      };
    });
  };

  const handleSaveStock = async () => {
    const stockUpdates = menuItems.map((item) => ({
      Menu_id: item._id,
      Stock: stockByMenuId[item._id] ?? 0,
    }));

    try {
      await updateAdminMenuStock(stockUpdates);
      const refreshedMenu = await getAdminMenuItems();
      setMenuItems(refreshedMenu);
      setAdminMessage('Cambios de inventario guardados correctamente.');
    } catch (saveError) {
      setAdminMessage(saveError.message || 'No se pudo guardar el inventario.');
    }
  };

  const toggleSelection = (setFn, currentList, value) => {
    if (currentList.includes(value)) {
      setFn(currentList.filter((item) => item !== value));
      return;
    }
    setFn([...currentList, value]);
  };

  const handleDisableProducts = async () => {
    if (!selectedRestaurantIds.length || !selectedMenuIds.length) {
      return;
    }

    try {
      const selectedRestaurantIdsSnapshot = [...selectedRestaurantIds];
      const selectedMenuIdsSnapshot = [...selectedMenuIds].map((id) => String(id));

      await disableProductsForRestaurants({
        restaurantIds: selectedRestaurantIdsSnapshot,
        menuIds: selectedMenuIdsSnapshot,
      });

      const refreshedLocations = await getAllLocations();

      const mergeUnavailableItems = (sourceLocations) =>
        sourceLocations.map((restaurant) => {
          if (!selectedRestaurantIdsSnapshot.includes(restaurant._id)) {
            return restaurant;
          }

          return {
            ...restaurant,
            not_available_products: [...selectedMenuIdsSnapshot],
          };
        });

      const hasUnavailableData = refreshedLocations.some(
        (restaurant) => (restaurant.not_available_products?.length ?? 0) > 0,
      );

      setLocations(
        hasUnavailableData
          ? refreshedLocations
          : mergeUnavailableItems(refreshedLocations),
      );
      setSelectedRestaurantIds([]);
      setSelectedMenuIds([]);
      setAdminMessage('Productos deshabilitados en los restaurantes seleccionados.');
    } catch (disableError) {
      setAdminMessage(disableError.message || 'No se pudo actualizar la disponibilidad.');
    }
  };

  const menuById = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      acc[item._id] = item.Pizza;
      return acc;
    }, {});
  }, [menuItems]);

  const renderMenuSection = () => (
    <section className="dashboard-panel">
      <div className="menu-header">
        <h2>Menú</h2>
        <button type="button" className="send-order-button" onClick={handleSaveStock}>
          <Save size={16} /> Guardar
        </button>
      </div>

      <p>Administra el inventario de productos del menú.</p>

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
              const quantity = stockByMenuId[item._id] ?? 0;
              return (
                <tr key={item._id}>
                  <td>{item.Pizza}</td>
                  <td>{item.Type}</td>
                  <td>{item.Size}</td>
                  <td>${item.Price.toFixed(2)}</td>
                  <td>
                    <div className="qty-controls">
                      <button type="button" onClick={() => updateStock(item._id, -1)}>
                        <Minus size={15} />
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => updateStock(item._id, 1)}>
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
    </section>
  );

  const renderAvailabilitySection = () => (
    <section className="dashboard-panel">
      <h2>Disponibilidad</h2>
      <p>Selecciona restaurantes y productos para deshabilitar esos ítems del menú.</p>

      <div className="availability-grid">
        <article className="availability-card">
          <h3>Restaurantes</h3>
          <div className="availability-list">
            {locations.map((restaurant) => (
              <label key={restaurant._id} className="availability-item">
                <input
                  type="checkbox"
                  checked={selectedRestaurantIds.includes(restaurant._id)}
                  onChange={() =>
                    toggleSelection(setSelectedRestaurantIds, selectedRestaurantIds, restaurant._id)
                  }
                />
                <span>{restaurant.type} - {restaurant.location.address1}, {restaurant.city}</span>
              </label>
            ))}
          </div>
        </article>

        <article className="availability-card">
          <h3>Productos del menú</h3>
          <div className="availability-list">
            {menuItems.map((item) => (
              <label key={item._id} className="availability-item">
                <input
                  type="checkbox"
                  checked={selectedMenuIds.includes(item._id)}
                  onChange={() => toggleSelection(setSelectedMenuIds, selectedMenuIds, item._id)}
                />
                <span>{item.Pizza}</span>
              </label>
            ))}
          </div>
        </article>
      </div>

      <div className="availability-actions">
        <button
          type="button"
          className="send-order-button"
          onClick={handleDisableProducts}
          disabled={!selectedRestaurantIds.length || !selectedMenuIds.length}
        >
          <ShieldAlert size={16} /> Deshabilitar productos seleccionados
        </button>
      </div>

      <div className="availability-results">
        <h3>Estado actual por restaurante</h3>
        {locations.map((restaurant) => (
          <p key={restaurant._id}>
            {restaurant.type} - {restaurant.city}: {restaurant.not_available_products?.length ?? 0} productos deshabilitados
            {(restaurant.not_available_products?.length ?? 0) > 0
              ? ` (${restaurant.not_available_products.map((id) => menuById[id] || id).join(', ')})`
              : ''}
          </p>
        ))}
      </div>
    </section>
  );

  const renderBestRestaurantsSection = () => (
    <section className="dashboard-panel">
      <h2>Mejores restaurantes</h2>
      <p>Restaurantes mejor calificados:</p>
      <h3 className="admin-table-title">Top de restaurantes con mejores reseñas</h3>

      <div className="menu-table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>ID del Restaurante</th>
              <th>Nombre del Restaurante</th>
              <th>Ciudad</th>
              <th>Promedio de Estrellas</th>
              <th>Total de Reseñas</th>
            </tr>
          </thead>
          <tbody>
            {bestRestaurants.map((restaurant) => (
              <tr key={restaurant.restaurant_id}>
                <td>{restaurant.restaurant_id}</td>
                <td>{restaurant.name || '-'}</td>
                <td>{restaurant.city || '-'}</td>
                <td>{Number(restaurant.avgStars ?? 0).toFixed(2)}</td>
                <td>{restaurant.totalReviews ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSalesSection = () => (
    <section className="dashboard-panel">
      <h2>Ventas</h2>
      <p>Cantidad de ventas por estado:</p>
      <h3 className="admin-table-title">Resumen de ventas por estado</h3>

      <div className="menu-table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Ventas Totales</th>
              <th>Órdenes Totales</th>
            </tr>
          </thead>
          <tbody>
            {salesByState.map((item) => (
              <tr key={item.state}>
                <td>{item.state || '-'}</td>
                <td>${Number(item.total_sales ?? 0).toFixed(2)}</td>
                <td>{item.total_orders ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderBestProductsSection = () => (
    <section className="dashboard-panel">
      <h2>Mejores productos</h2>
      <p>Producto más vendido:</p>
      <h3 className="admin-table-title">Ranking de productos más vendidos</h3>

      <div className="menu-table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Nombre del Producto</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Cantidad Total Vendida</th>
            </tr>
          </thead>
          <tbody>
            {bestProducts.map((product) => (
              <tr key={product.menu_id}>
                <td>{product.productName || '-'}</td>
                <td>{product.type || '-'}</td>
                <td>{product.size || '-'}</td>
                <td>{product.totalQuantitySold ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderSalesTrendSection = () => (
    <section className="dashboard-panel">
      <h2>Tendencia de ventas</h2>
      <p>Tendencia de ventas mensual:</p>
      <h3 className="admin-table-title">Evolución mensual de ventas y órdenes</h3>

      <div className="menu-table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Año</th>
              <th>Mes</th>
              <th>Ventas Totales</th>
              <th>Órdenes Totales</th>
            </tr>
          </thead>
          <tbody>
            {salesTrend.map((item) => (
              <tr key={`${item.year}-${item.month}`}>
                <td>{item.year ?? '-'}</td>
                <td>{item.month ?? '-'}</td>
                <td>${Number(item.totalSales ?? 0).toFixed(2)}</td>
                <td>{item.totalOrders ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  const renderReportsSection = () => (
    <section className="dashboard-panel">
      <h2>Reportes</h2>
      <iframe
        style={{
          background: '#F1F5F4',
          border: 'none',
          borderRadius: '2px',
          boxShadow: '0 2px 10px 0 rgba(70, 76, 79, .2)',
          width: '100%',
          height: '100vh',
          display: 'block',
        }}
        src="https://charts.mongodb.com/charts-project-0-hyxjueh/embed/dashboards?id=83a82352-a94c-4e52-ae0c-accb260864b4&theme=light&autoRefresh=true&maxDataAge=14400&showTitleAndDesc=false&scalingWidth=fixed&scalingHeight=fixed"
        title="Reportes"
      />
    </section>
  );

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
            className={activeSection === ADMIN_SECTIONS.menu ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.menu)}
          >
            <ListChecks size={18} /> Menú
          </button>
          <button
            type="button"
            className={activeSection === ADMIN_SECTIONS.availability ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.availability)}
          >
            <ShieldAlert size={18} /> Disponibilidad
          </button>
          <button
            type="button"
            className={activeSection === ADMIN_SECTIONS.bestRestaurants ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.bestRestaurants)}
          >
            <BarChart3 size={18} /> Mejores restaurantes
          </button>
          <button
            type="button"
            className={activeSection === ADMIN_SECTIONS.sales ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.sales)}
          >
            <TrendingUp size={18} /> Ventas
          </button>
          <button
            type="button"
            className={activeSection === ADMIN_SECTIONS.bestProducts ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.bestProducts)}
          >
            <ShoppingBasket size={18} /> Mejores productos
          </button>
          <button
            type="button"
            className={activeSection === ADMIN_SECTIONS.salesTrend ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.salesTrend)}
          >
            <ChartLine size={18} /> Tendencia de ventas
          </button>
          <button
            type="button"
            className={activeSection === ADMIN_SECTIONS.reports ? 'active' : ''}
            onClick={() => setActiveSection(ADMIN_SECTIONS.reports)}
          >
            <BarChart3 size={18} /> Reportes
          </button>
        </nav>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <h1>Dashboard de administrador</h1>

          <div className="header-actions">
            <p className="admin-user-label">{user.name}</p>
            <button type="button" className="logout-button" onClick={onLogout}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </header>

        {adminMessage ? <div className="admin-message">{adminMessage}</div> : null}

        {activeSection === ADMIN_SECTIONS.menu && renderMenuSection()}
        {activeSection === ADMIN_SECTIONS.availability && renderAvailabilitySection()}
        {activeSection === ADMIN_SECTIONS.bestRestaurants && renderBestRestaurantsSection()}
        {activeSection === ADMIN_SECTIONS.sales && renderSalesSection()}
        {activeSection === ADMIN_SECTIONS.bestProducts && renderBestProductsSection()}
        {activeSection === ADMIN_SECTIONS.salesTrend && renderSalesTrendSection()}
        {activeSection === ADMIN_SECTIONS.reports && renderReportsSection()}
      </section>
    </main>
  );
}
