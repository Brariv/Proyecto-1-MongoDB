# Proyecto-1-MongoDB

## Endpoint Maping:
Enpoint is defined by a function that looks like this:
```
@app.get("/login")
def login(email: str, password: str):
```

So we need to make functions that look like this:
```
def get_login(email: str, password: str):
    client = MongoClient()
    db = client["Pizza_Hut"]
    users_collection = db["usuarios"]
    
    user = users_collection.find_one({"email": email, "password": password})
    
    if user:
        return {"message": "Login successful", "User_id": str(user["_id"]), "user_type": user["user_type"], "user_name": user["name"]}
    else:
        return {"message": "Invalid email or password"}, 401
```
so the return is defined by each mongo call
