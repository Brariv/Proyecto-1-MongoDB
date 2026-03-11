db.menu.find()
  .sort({ _id: -1 })
  .limit(1)
  
 db.ordenes.find()
  .sort({ _id: -1 })
  .limit(1)
  
db.resenas.find()
  .sort({ _id: -1 })
  .limit(1)
  
db.usuarios.aggregate([
  { $match: { "cliente": "modificado" } },
  {
    $project: {
      lastAddress: { $arrayElemAt: ["$addresses", -1] }
    }
  }
])  