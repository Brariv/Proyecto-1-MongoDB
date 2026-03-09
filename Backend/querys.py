from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timezone
import os

load_dotenv()

mongo_uri = os.getenv("MONGODB_URI")
db_name = os.getenv("MONGODB_DATABASE")

if not mongo_uri or not db_name:
    raise SystemExit("Missing env vars. Set MONGODB_URI and MONGODB_DATABASE in your .env")

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def get_login(email: str, password: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    users_collection = db["usuarios"]
    
    user = users_collection.find_one({"email": email, "password": password})
    
    if user:
        return {"message": "Login successful", "User_id": str(user["_id"]), "user_type": user["type"], "user_name": user["name"]}
    else:
        return {"message": "Invalid email or password"}, 401
    
def get_address(User_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    users_collection = db["usuarios"]
    
    user = users_collection.find_one({"_id": ObjectId(User_id)})
    
    if user:
        return {"addresses": user["addresses"]}
    else:
        return {"message": "User not found or address not available"}, 404
    
def get_restaurants_ordered(User_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    orders_collection = db["ordenes"]
    
    orders = orders_collection.find({"User_id": ObjectId(User_id)})
    
    restaurant_ids = set()
    
    for order in orders:
        restaurant_ids.add(order["Restaurant_id"])
    
    restaurants_collection = db["restaurantes"]
    restaurants = restaurants_collection.find({"_id": {"$in": list(restaurant_ids)}})
    
    return [{"restaurant_id": str(restaurant["_id"]), "name": restaurant["type"], "address": restaurant["location"]["address1"]} for restaurant in restaurants]



def get_review(User_id: str, restaurant_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    reviews_collection = db["resenas"]
    
    review = reviews_collection.find_one({"user_id": ObjectId(User_id), "restaurant_id": ObjectId(restaurant_id)})
    
    if review:
        return {"review_id": str(review["_id"]), "comment": review["comment"], "stars": review["stars"], "date": review["date"].isoformat()}
    else:
        return {"message": "Review not created yet"}, 204

def post_review(comment: str, stars: int, User_id: str, restaurant_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    reviews_collection = db["resenas"]
    
    review = {
        "comment": comment,
        "stars": stars,
        "user_id": ObjectId(User_id),
        "restaurant_id": ObjectId(restaurant_id),
        "date": _now_utc()
    }
    
    result = reviews_collection.insert_one(review)
    
    if result.inserted_id:
        return {"message": "Review created successfully"}, 201
    else:
        return {"message": "Failed to create review"}, 500

def patch_review(review_id: str, comment: str, stars: int, User_id: str, restaurant_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    reviews_collection = db["resenas"]
    
    review = reviews_collection.find_one({"_id": ObjectId(review_id)})
    
    if review:
        if review["user_id"] == ObjectId(User_id) and review["restaurant_id"] == ObjectId(restaurant_id):
            update_result = reviews_collection.update_one(
                {"_id": ObjectId(review_id)},
                {"$set": {"comment": comment, "stars": stars, "date": _now_utc()}}
            )
            if update_result.modified_count > 0:
                return {"message": f"Review {review_id} updated successfully"}
            else:
                return {"message": "Failed to update review"}, 500
        else:
            return {"message": "Unauthorized to update this review"}, 403
    else:
        return {"message": "Review not found"}, 404
    

def get_restaurants():
    client = MongoClient(mongo_uri)
    db = client[db_name]
    restaurants_collection = db["restaurantes"]
    
    restaurants = restaurants_collection.find()
    
    return [{"restaurant_id": str(restaurant["_id"]), "type": restaurant["type"], "address": restaurant["location"], "phone": restaurant["phone"], "state": restaurant["state"], "city": restaurant["city"]} for restaurant in restaurants]

def get_restaurant_names():
    client = MongoClient(mongo_uri)
    db = client[db_name]
    restaurants_collection = db["restaurantes"]
    
    restaurants = restaurants_collection.find()
    
    return [{"restaurant_id": str(restaurant["_id"]), "type": restaurant["type"], "address": restaurant["location"]["address1"]} for restaurant in restaurants]




def get_menu(restaurant_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    menu_collection = db["menu"]
    restaurant_collection = db["restaurantes"]
    
    menu = menu_collection.find()
    not_available_items = restaurant_collection.find_one({"_id": ObjectId(restaurant_id)})
    menu_items = []
    for item in menu:
        if item["name"] not in not_available_items.get("not_available_items", []):
            menu_items.append({"name": item["name"], "price": item["price"]})

    if menu:
        return {"menu": menu_items}
    else:
        return {"message": "Menu not found for this restaurant"}, 404
    
def create_address(user_id: str, alias: str, address: str, city: str, state: str, postal_code: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    users_collection = db["usuarios"]
    
    new_address = {
        "alias": alias,
        "address": address,
        "city": city,
        "state": state,
        "postal_code": postal_code,
        "longitude": None,
        "latitude": None
    }
    
    update_result = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"address": new_address}}
    )
    
    if update_result.modified_count > 0:
        return {"message": "Address created successfully"}, 201
    else:
        return {"message": "Failed to create address"}, 500
    
def get_menu(restaurant_id: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    menu_collection = db["menu"]
    restaurant_collection = db["restaurantes"]
    
    menu = menu_collection.find()
    not_available_items = restaurant_collection.find_one({"_id": ObjectId(restaurant_id)})

    menu_items = []
    for item in menu:
        if item["_id"] not in not_available_items.get("not_available_items", []):
            menu_items.append({"pizza": item["Pizza"],"type":item["Type"],"size":item["Size"], "price": item["Price"]})

    
    if menu:
        return {"menu": menu_items}
    else:
        return {"message": "Menu not found for this restaurant"}, 404
    
def get_near_restaurants(latitude: float, longitude: float):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    restaurants_collection = db["restaurantes"]

    restaurants = restaurants_collection.find({
        "location": {
            "$near": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [longitude, latitude]
                },
                "$maxDistance": 20000
            }
        }
    })

    return [{"name": restaurant["type"], "hours": restaurant["hours"], "phone": restaurant["phone"], "address": restaurant["location"]["address1"]} for restaurant in restaurants]

def post_menu(pizza: str, type: str, size: str, price: float, available_until: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    menu_collection = db["menu"]

    available_until = "forever" if available_until is None else available_until
    
    menu_item = {
        "Pizza": pizza,
        "Type": type,
        "Size": size,
        "Price": price,
        "available_until": available_until
    }
    
    result = menu_collection.insert_one(menu_item)
    
    if result.inserted_id:
        return {"message": "Menu item created successfully"}, 201
    else:
        return {"message": "Failed to create menu item"}, 500
    
def create_order(user_id: str, restaurant_id: str, items: list, paymen_method: str):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    orders_collection = db["ordenes"]
    menu_collection = db["menu"]

    menu_items = [{
        "Menu_id": item["menu_id"],
        "Quantity": item["quantity"],
        "Price": menu_collection.find_one({"_id": ObjectId(item["menu_id"])})["Price"]
    } for item in items]


    order = {
        "User_id": ObjectId(user_id),
        "Restaurant_id": ObjectId(restaurant_id),
        "Total": sum(item["Quantity"] * item["Price"] for item in menu_items),
        "Items": menu_items,
        "Order_date": _now_utc(),
        "Payment_method": paymen_method
    }
    
    result = orders_collection.insert_one(order)
    
    if result.inserted_id:
        return {"message": "Order created successfully"}, 201
    else:
        return {"message": "Failed to create order"}, 500