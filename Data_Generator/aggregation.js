// Restaurantes mejor calificados
db.Reviews.aggregate([
  {
    $group: {
      _id: "$Restaurant_id",
      avgStars: { $avg: "$Stars" },
      totalReviews: { $sum: 1 }
    }
  },
  {
    $sort: { avgStars: -1 }
  },
  {
    $limit: 5
  },
  {
    $lookup: {
      from: "Restaurants",
      localField: "_id",
      foreignField: "_id",
      as: "restaurantInfo"
    }
  },
  {
    $unwind: "$restaurantInfo"
  },
  {
    $project: {
      _id: 0,
      restaurant_id: "$_id",
      name: "$restaurantInfo.Address1", 
      city: "$restaurantInfo.City",
      avgStars: { $round: ["$avgStars", 2] },
      totalReviews: 1
    }
  }
])

// Cantidad de Ventas por estado
db.Orders.aggregate([
  {
    $lookup: {
      from: "Restaurants",
      localField: "Restaurant_id",
      foreignField: "_id",
      as: "restaurant"
    }
  },
  {
    $unwind: "$restaurant"
  },
  {
    $group: {
      _id: "$restaurant.State",
      total_sales: { $sum: "$Total" },
      total_orders: { $sum: 1 }
    }
  },
  {
    $sort: { total_sales: -1 }
  },
  {
    $project: {
      _id: 0,
      state: "$_id",
      total_sales: 1,
      total_orders: 1
    }
  }
])

//  Producto mas vendido
db.Orders.aggregate([
  {
    $unwind: "$Items"
  },
  {
    $group: {
      _id: "$Items.Menu_id",
      totalQuantitySold: { $sum: "$Items.Quantity" }
    }
  },
  {
    $sort: { totalQuantitySold: -1 }
  },
  {
    $lookup: {
      from: "Menu",
      localField: "_id",
      foreignField: "_id",
      as: "menuInfo"
    }
  },
  {
    $unwind: "$menuInfo"
  },
  {
    $project: {
      _id: 0,
      menu_id: "$_id",
      productName: "$menuInfo.Pizza",
      type: "$menuInfo.Type",
      size: "$menuInfo.Size",
      totalQuantitySold: 1
    }
  }
])

// Tendencia de Ventas Mensual
db.Orders.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$Order_Date" },
        month: { $month: "$Order_Date" }
      },
      totalSales: { $sum: "$Total" },
      totalOrders: { $sum: 1 }
    }
  },
  {
    $sort: {
      "_id.year": 1,
      "_id.month": 1
    }
  },
  {
    $project: {
      _id: 0,
      year: "$_id.year",
      month: "$_id.month",
      totalSales: 1,
      totalOrders: 1
    }
  }
])