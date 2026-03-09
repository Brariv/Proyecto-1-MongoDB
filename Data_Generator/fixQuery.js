use ('Pizza_Hut')

// Add type field to all users
db.usuarios.updateMany(
  { type: { $exists: false } }, // Only update documents that don't have the type field
  { $set: { type: "Consumer" } }
)

db.usuarios.insertOne(
    {
        name: "John Doe",
        email: "john.doe@example.com",
        password: "123",
        phone: "+1-555-1234",
        addresses: [],
        reviews: [],
        type: "Admin"
    }
)
// update all available_until to forever
db.menu.updateMany(
  { available_until: { $exists: true } }, // Only update documents that have the available_until field
  { $set: { available_until: "forever" } }
)

db.menu.insertOne(
    {
        "Name": "Stuffed Crust",
        "Type": "Just Crust",
        "Size": "Medium",
        "Price": 9.99,
        "available_until": "2026-03-15 23:59:59+00:00"
    }
)

db.menu.insertOne(
    {
        "Name": "Heart Pizza",
        "Type": "Cheese Pizza",
        "Size": "Large",
        "Price": 12.99,
        "available_until": "2026-03-01 23:59:59+00:00"
    }
)

db.menu.insertMany(
    [
        {
        "Name": "Heart Pizza",
        "Type": "Cheese Pizza",
        "Size": "Large",
        "Price": 12.99,
        "available_until": "2026-03-01 23:59:59+00:00"
    },
    { 
        "Name": "Stuffed Crust",
        "Type": "Just Crust",
        "Size": "Medium",
        "Price": 9.99,
        "available_until": "2026-03-15 23:59:59+00:00"
    },
    {
        "Name": "Pickle Pizza",
        "Type": "Cheese Pizza",
        "Size": "Large",
        "Price": 14.99,
        "available_until": "2026-04-20 23:59:59+00:00"
    }
])