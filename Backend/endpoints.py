from fastapi import FastAPI
from Backend.querys import *

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/login")
def login(email: str, password: str):
    return get_login(email, password)
    
@app.get("/address")
def get_address(user_id: str):
    # Aquí puedes agregar la lógica para obtener la dirección del usuario desde la base de datos utilizando el user_id.
    # Por ejemplo, podrías buscar el usuario por su ID y luego devolver su dirección.
    
    # return 200 OK con la dirección del usuario
    return {"address": "123 Main St, Anytown, USA"}

@app.post("/address")
def update_address(user_id: str, alias: str, address: str, city: str, state: str, postal_code: str):
    # Aquí puedes agregar la lógica para actualizar la dirección del usuario en la base de datos utilizando el user_id.
    # Por ejemplo, podrías buscar el usuario por su ID y luego actualizar su dirección con los nuevos datos proporcionados.
    
    # return 200 OK con un mensaje de éxito
    return {"message": "Address updated successfully"}

@app.get("/reviews")
def get_review(user_id: str, restaurant_id: str):
    # Aquí puedes agregar la lógica para obtener la reseña del usuario desde la base de datos utilizando el user_id y restaurant_id.
    # Por ejemplo, podrías buscar la reseña por su ID y luego devolver sus detalles.

    # return 200 OK con la reseña del usuario
    return {"comment": "Great pizza!", "stars": 5, "date": "2023-10-10T10:00:00Z"}

@app.patch("/reviews/{review_id}")
def update_review(review_id: int, comment: str, stars: int, user_id: str, restaurant_id: str):
    # Aquí puedes agregar la lógica para actualizar la reseña en la base de datos.
    # Por ejemplo, podrías buscar la reseña por su ID y luego actualizar los campos correspondientes.
    
    # return 200 OK con un mensaje de éxito
    return {"message": f"Review {review_id} updated successfully"}

@app.post("/reviews")
def create_review(comment: str, stars: int, user_id: str, restaurant_id: str):
    # Aquí puedes agregar la lógica para crear una nueva reseña en la base de datos.
    # Por ejemplo, podrías insertar un nuevo documento con los campos proporcionados.
    
    # return 201 Created con un mensaje de éxito
    return {"message": "Review created successfully"}, 201



@app.get("/restaurants")
def get_restaurants():
    # Aquí puedes agregar la lógica para obtener la lista de restaurantes desde la base de datos.
    # Por ejemplo, podrías buscar todos los restaurantes y devolver sus detalles.

    # return 200 OK con la lista de restaurantes
    return [{"name": "Pizza Hut", "address": "123 Main St, Anytown, USA", "phone": "555-1234", "state": "CA", "city": "Anytown", "zip_code": "12345"}]

@app.get("/restaurants/names")
def get_restaurant_names():
    # Aquí puedes agregar la lógica para obtener la lista de nombres de restaurantes desde la base de datos.
    # Por ejemplo, podrías buscar todos los restaurantes y devolver solo sus nombres.

    # return 200 OK con la lista de nombres de restaurantes
    return [{"name": "Pizza Hut", "restaurant_id": "12345"}]

@app.get("/menu/{restaurant_id}")
def get_menu(restaurant_id: str):
    # Aquí puedes agregar la lógica para obtener el menú del restaurante desde la base de datos utilizando el restaurant_id.
    # Por ejemplo, podrías buscar el restaurante por su ID y luego devolver su menú.

    # return 200 OK con el menú del restaurante
    return [{"name": "Pepperoni Pizza", "price": 12.99}, {"name": "Caesar Salad", "price": 8.99}]


@app.get("/near-rastaurants")
def get_near_restaurants(latitude: float, longitude: float):
    # Aquí puedes agregar la lógica para obtener los restaurantes cercanos utilizando las coordenadas de latitud y longitud.
    # Por ejemplo, podrías calcular la distancia entre las coordenadas proporcionadas y las ubicaciones de los restaurantes en la base de datos, y luego devolver los restaurantes más cercanos.

    # return 200 OK con la lista de restaurantes cercanos
    return [{"name": "Pizza Hut", "distance": 0.5}, {"name": "Domino's", "distance": 1.0}]


@app.post("/menu")
def create_menu(pizza: str, type: str, size: str, price: float, available_until: str):
    # Aquí puedes agregar la lógica para crear un nuevo elemento en el menú del restaurante.
    # Por ejemplo, podrías insertar un nuevo documento con los campos proporcionados.

    # return 201 Created con un mensaje de éxito
    return {"message": "Menu item created successfully"}, 201

@app.post("/orders")
def create_order(user_id: str, restaurant_id: str, items: list):
    # Aquí puedes agregar la lógica para crear una nueva orden en la base de datos.
    # Por ejemplo, podrías insertar un nuevo documento con los campos proporcionados.

    # return 201 Created con un mensaje de éxito
    return {"message": "Order created successfully"}, 201




@app.get("/best-rated")
def get_best_rated():
    # Aquí puedes agregar la lógica para obtener los restaurantes mejor calificados desde la base de datos.
    # Por ejemplo, podrías buscar los restaurantes con las mejores calificaciones y devolver sus detalles.

    # return 200 OK con la lista de restaurantes mejor calificados
    return [{"name": "Pizza Hut", "average_rating": 4.5}, {"name": "Domino's", "average_rating": 4.0}]

@app.get("/sales-per-state")
def get_sales_per_state():
    # Aquí puedes agregar la lógica para obtener las ventas por estado desde la base de datos.
    # Por ejemplo, podrías agrupar las ventas por estado y devolver los totales.

    # return 200 OK con las ventas por estado
    return [{"state": "CA", "total_sales": 10000}, {"state": "NY", "total_sales": 8000}]

@app.get("/best-sellers")
def get_best_sellers():
    # Aquí puedes agregar la lógica para obtener los restaurantes con más ventas desde la base de datos.
    # Por ejemplo, podrías buscar los restaurantes con las ventas más altas y devolver sus detalles.

    # return 200 OK con la lista de restaurantes mejor vendidos
    return [{"name": "Pizza Hut", "total_sales": 10000}, {"name": "Domino's", "total_sales": 8000}]

@app.get("/sales-per-month")
def get_sales_per_month():
    # Aquí puedes agregar la lógica para obtener las ventas por mes desde la base de datos.
    # Por ejemplo, podrías agrupar las ventas por mes y devolver los totales.

    # return 200 OK con las ventas por mes
    return [{"month": "January", "total_sales": 10000}, {"month": "February", "total_sales": 8000}]