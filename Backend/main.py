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
    
class bulk_edit(BaseModel):
    items_ids: list
    restaurants_ids: list

class address_del(BaseModel):
    address: str

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/login")
def login(user: User):
    return get_login(user.email, user.password)

@app.get("/users/{user_id}/addresses")
def address(user_id: str):
    return get_address(user_id)

@app.delete("/users/{user_id}/addresses")
def del_address(user_id: str, address: address_del):
    return delete_address(user_id, address.address)

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
    return get_top_rated_restaurants()

@app.get("/sales-per-state")
def sales_per_state():
    return get_sales_by_state()

@app.get("/best-sellers")
def best_sellers():
    return get_best_selling_product()

@app.get("/sales-per-month")
def sales_per_month():
    return get_monthly_sales_trend()





@app.patch("/unavailable-items")
def mark_item_unavailable(bulk_edit: bulk_edit):
    return bulk_update_menu(bulk_edit.restaurants_ids, bulk_edit.items_ids)

