from fastapi import FastAPI
from pydantic import BaseModel
from querys import *

app = FastAPI()

class User(BaseModel):
    email: str
    password: str

class Address(BaseModel):
    alias: str
    address: str
    city: str
    state: str
    postal_code: str

class user_id(BaseModel):
    user_id: str

class coordinates(BaseModel):
    latitude: float
    longitude: float

class menu_item(BaseModel):
    pizza: str
    type: str
    size: str
    price: float
    available_until: str | None = None

class order(BaseModel):
    user_id: str
    restaurant_id: str
    items: list
    payment_method: str

class restaurant_id(BaseModel):
    restaurant_id: str

class review_id(BaseModel):
    comment: str 
    stars: int 
    user_id: str
    restaurant_id: str


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/login")
def login(user: User):
    return get_login(user.email, user.password)

@app.get("/users/{user_id}/addresses")
def address(user_id: str):
    return get_address(user_id)

@app.get("/restaurants/ordered/{user_id}")
def restaurants_ordered(user_id: str):
    return get_restaurants_ordered(user_id)

@app.post("/users/{user_id}/addresses")
def createAddress(user_id: str, address: Address):
    return create_address(user_id, address.alias, address.address, address.city, address.state, address.postal_code)

@app.get("/reviews/{user_id}")
def review(user_id: str, restaurant_id: restaurant_id):
    return get_review(user_id, restaurant_id.restaurant_id)

@app.patch("/reviews/{review_id}")
def review(review_id: str, review: review_id):
    return patch_review(review_id, review.comment, review.stars, review.user_id, review.restaurant_id)

@app.post("/reviews")
def review(review: review_id):
    return post_review(review.comment, review.stars, review.user_id, review.restaurant_id)



@app.get("/restaurants")
def restaurants():
    return get_restaurants()

@app.get("/restaurants/names")
def restaurant_names():
    return get_restaurant_names()

@app.get("/restaurants/{restaurant_id}/menu")
def menu(restaurant_id: str):
    return get_menu(restaurant_id)


@app.get("/restaurants/near")
def near_restaurants(coords: coordinates):
    return get_near_restaurants(coords.latitude, coords.longitude)


@app.post("/menu")
def menu(menu_item: menu_item):
    return post_menu(menu_item.pizza, menu_item.type, menu_item.size, menu_item.price, menu_item.available_until)

@app.post("/orders")
def order(order: order):
    return create_order(order.user_id, order.restaurant_id, order.items, order.payment_method)




@app.get("/best-rated")
def best_rated():
    # Aquí puedes agregar la lógica para obtener los restaurantes mejor calificados desde la base de datos.
    # Por ejemplo, podrías buscar los restaurantes con las mejores calificaciones y devolver sus detalles.

    # return 200 OK con la lista de restaurantes mejor calificados
    return [{"name": "Pizza Hut", "average_rating": 4.5}, {"name": "Domino's", "average_rating": 4.0}]

@app.get("/sales-per-state")
def sales_per_state():
    # Aquí puedes agregar la lógica para obtener las ventas por estado desde la base de datos.
    # Por ejemplo, podrías agrupar las ventas por estado y devolver los totales.

    # return 200 OK con las ventas por estado
    return [{"state": "CA", "total_sales": 10000}, {"state": "NY", "total_sales": 8000}]

@app.get("/best-sellers")
def best_sellers():
    # Aquí puedes agregar la lógica para obtener los restaurantes con más ventas desde la base de datos.
    # Por ejemplo, podrías buscar los restaurantes con las ventas más altas y devolver sus detalles.

    # return 200 OK con la lista de restaurantes mejor vendidos
    return [{"name": "Pizza Hut", "total_sales": 10000}, {"name": "Domino's", "total_sales": 8000}]

@app.get("/sales-per-month")
def sales_per_month():
    # Aquí puedes agregar la lógica para obtener las ventas por mes desde la base de datos.
    # Por ejemplo, podrías agrupar las ventas por mes y devolver los totales.

    # return 200 OK con las ventas por mes
    return [{"month": "January", "total_sales": 10000}, {"month": "February", "total_sales": 8000}]






@app.post("/unavailable-items")
def mark_item_unavailable(items_ids: list, restaurants_ids: list):
    # Aquí puedes agregar la lógica para marcar los elementos del menú como no disponibles en los restaurantes especificados.
    # Por ejemplo, podrías actualizar los documentos correspondientes en la base de datos para reflejar la disponibilidad de los elementos.

    # return 200 OK con un mensaje de éxito
    return {"message": "Items marked as unavailable successfully"}

