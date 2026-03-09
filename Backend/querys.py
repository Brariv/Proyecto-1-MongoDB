from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime, timezone

load_dotenv()

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)

def get_login(email: str, password: str):
    client = MongoClient()
    db = client["Pizza_Hut"]
    users_collection = db["usuarios"]
    
    user = users_collection.find_one({"email": email, "password": password})
    
    if user:
        return {"message": "Login successful", "User_id": str(user["_id"]), "user_type": user["user_type"], "user_name": user["name"]}
    else:
        return {"message": "Invalid email or password"}, 401
    
def get_address(User_id: str):
    client = MongoClient()
    db = client["Pizza_Hut"]
    users_collection = db["usuarios"]
    
    user = users_collection.find_one({"_id": ObjectId(User_id)})
    
    if user and "address" in user:
        return {"address": user["address"]}
    else:
        return {"message": "User not found or address not available"}, 404
    
def get_restaurants_ordered(User_id: str):
    client = MongoClient()
    db = client["Pizza_Hut"]
    orders_collection = db["ordenes"]
    
    orders = orders_collection.find({"User_id": ObjectId(User_id)})
    
    restaurant_ids = set()
    for order in orders:
        restaurant_ids.add(order["restaurant_id"])
    
    restaurants_collection = db["restaurantes"]
    restaurants = restaurants_collection.find({"_id": {"$in": list(restaurant_ids)}})
    
    return [{"restaurant_id": str(restaurant["_id"]), "name": restaurant["name"]} for restaurant in restaurants]

def get_review(User_id: str, restaurant_id: str):
    client = MongoClient()
    db = client["Pizza_Hut"]
    reviews_collection = db["resenas"]
    
    review = reviews_collection.find_one({"user_id": ObjectId(User_id), "restaurant_id": ObjectId(restaurant_id)})
    
    if review:
        return {"review_id": str(review["_id"]), "comment": review["comment"], "stars": review["stars"], "date": review["date"].isoformat()}
    else:
        return {"message": "Review not created yet"}, 204

def post_review(comment: str, stars: int, User_id: str, restaurant_id: str):
    client = MongoClient()
    db = client["Pizza_Hut"]
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
    client = MongoClient()
    db = client["Pizza_Hut"]
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