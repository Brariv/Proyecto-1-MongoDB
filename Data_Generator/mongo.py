from __future__ import annotations

import argparse
import csv
import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

"""Lab4 - Sample DB builder for MongoDB Atlas

This script loads Pizza Hut CSVs and generates a sample MongoDB database with
collections matching the provided JSON schemas:
- restaurantes
- usuarios
- menu
- ordenes
- resenas

Inputs (CSV):
- pizza_hut_locations.csv
- pizza_hut_menu.csv
- pizza_hut_reviews.csv

Env vars (required):
- MONGODB_URI
- MONGODB_DATABASE

Env vars (optional):
- RESTAURANT_LIMIT (default 500)
- USER_COUNT (default 600)
- ORDER_COUNT (default 2500)
- REVIEW_COUNT (default 3000)
- BATCH_SIZE (default 1000)

Usage:
  python mongo.py --locations ../Data/pizza_hut_locations.csv --menu ../Data/pizza_hut_menu.csv --reviews ../Data/pizza_hut_reviews.csv
"""




# ----------------------------
# Helpers
# ----------------------------

def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def chunked(iterable: List[Any], size: int) -> Iterable[List[Any]]:
    for i in range(0, len(iterable), size):
        yield iterable[i : i + size]


def parse_money(value: str) -> float:
    # '$8.49' -> 8.49
    if value is None:
        return 0.0
    v = str(value).strip().replace("$", "").replace(",", "")
    try:
        return float(v)
    except ValueError:
        return 0.0


def rand_date_between(start: datetime, end: datetime) -> datetime:
    # inclusive-ish
    if start >= end:
        return start
    delta = end - start
    seconds = int(delta.total_seconds())
    return start + timedelta(seconds=random.randint(0, max(1, seconds)))


def safe_float(x: Any, default: float = 0.0) -> float:
    try:
        return float(x)
    except Exception:
        return default


def pick_k_unique(items: List[Any], k: int) -> List[Any]:
    if not items:
        return []
    k = max(0, min(k, len(items)))
    return random.sample(items, k)


# ----------------------------
# CSV loaders
# ----------------------------

def load_locations_csv(path: str, limit: int) -> List[Dict[str, Any]]:
    """Load restaurant locations (US addresses + US coordinates)."""
    rows: List[Dict[str, Any]] = []

    with open(path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            # CSV has a leading empty header column (index). Ignore it.
            rtype = (raw.get("type") or raw.get(" type") or "").strip()
            address1 = (raw.get("address_1") or "").strip()
            address2 = (raw.get("address_2") or "").strip()
            city = (raw.get("city") or "").strip()
            state = (raw.get("state") or "").strip()
            postal_code = (raw.get("postal_code") or "").strip()
            open_hours = (raw.get("open_hours") or "").strip()
            lat = safe_float(raw.get("latitude"), None)
            lon = safe_float(raw.get("longitude"), None)

            # Must have US-like state + coordinates. Dataset is US-only; we just validate basics.
            if not state or lat is None or lon is None:
                continue

            doc = {
                "_id": ObjectId(),
                "state": state,
                "city": city,
                "location": {
                    "address1": address1,
                    "address2": address2,
                    "postal_code": postal_code,
                    "latitude": float(lat),
                    "longitude": float(lon),
                    # GeoJSON point (useful for 2dsphere indexes + Charts maps)
                    "geo": {"type": "Point", "coordinates": [float(lon), float(lat)]},
                },
                "hours": {
                    "Open": open_hours.split("-")[0].strip() if "-" in open_hours else open_hours,
                    "Close": open_hours.split("-")[1].strip() if "-" in open_hours else "",
                },
                "type": rtype,
                "phone": _fake_phone_us(),
                # will be filled later
                "not_available_products": [],
            }
            rows.append(doc)
            if limit and len(rows) >= limit:
                break

    return rows


def load_menu_csv(path: str) -> List[Dict[str, Any]]:
    """Load menu items from CSV and shape them like Menu.json."""
    items: List[Dict[str, Any]] = []
    available_until = datetime(2027, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

    with open(path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            # Example columns:
            # Company,Pizza Name,Type,Size,Price
            name = (raw.get("Pizza Name") or "").strip()
            ptype = (raw.get("Type") or "").strip()
            size = (raw.get("Size") or "").strip()
            price = parse_money(raw.get("Price") or "0")

            if not name:
                continue

            items.append(
                {
                    "_id": ObjectId(),
                    "Pizza": name,
                    "Type": ptype,
                    "Size": size,
                    "Price": price,
                    "available_until": "forever",
                }
            )

    return items


def load_reviews_csv(path: str, limit: int) -> List[Dict[str, Any]]:
    """Load raw review texts/stars from CSV.

    The CSV does not include user_id/restaurant_id, so we keep it as a pool
    and attach it later when generating review documents.
    """
    pool: List[Dict[str, Any]] = []
    with open(path, "r", encoding="utf-8", errors="ignore", newline="") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            title = (raw.get("title") or "").strip()
            stars = raw.get("stars")
            text = (raw.get("text") or "").strip()
            try:
                stars_i = int(str(stars).strip().replace('"', "") or 0)
            except Exception:
                stars_i = 0

            if stars_i <= 0:
                continue

            pool.append({"title": title, "stars": stars_i, "text": text})
            if limit and len(pool) >= limit:
                break

    return pool


# ----------------------------
# Synthetic generators
# ----------------------------

def _fake_phone_us() -> str:
    # Simple + safe fake format
    area = random.randint(200, 999)
    mid = random.randint(200, 999)
    last = random.randint(1000, 9999)
    return f"{area}-{mid}-{last}"


FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Jamie",
    "Chris", "Sam", "Cameron", "Drew", "Parker", "Hayden", "Reese", "Quinn",
    "Sydney", "Bailey", "Logan", "Kendall",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin",
]


def gen_users(
    count: int,
    us_addresses_pool: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Generate Users.json-like documents.

    - Usually 1 address, sometimes multiple.
    - Address and coordinates must be in the US; we sample from the locations CSV.
    """
    users: List[Dict[str, Any]] = []

    for _ in range(count):
        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        name = f"{fn} {ln}"
        email = f"{fn.lower()}.{ln.lower()}{random.randint(1,9999)}@email.com"
        type = "Consumer"

        # 85% one address, 15% multiple (2-3)
        addr_count = 1 if random.random() < 0.85 else random.randint(2, 3)
        addresses = []
        for i in range(addr_count):
            loc = random.choice(us_addresses_pool)
            addresses.append(
                {
                    "alias": "Home" if i == 0 else f"Alt{i}",
                    "address": loc["location"]["address1"],
                    "city": loc["city"],
                    "state": loc["state"],
                    "postal_code": loc["location"]["postal_code"],
                    "latitude": loc["location"]["latitude"],
                    "longitude": loc["location"]["longitude"],
                    "geo": loc["location"]["geo"],
                }
            )

        users.append(
            {
                "_id": ObjectId(),
                "name": name,
                "email": email,
                "type": "Consumer",
                "password": "hashed_password",
                "phone": "+1-" + _fake_phone_us(),
                "addresses": addresses,
                "reviews_id": [],
            }
        )

    return users


PAYMENT_METHODS = ["Credit Card", "Debit Card", "Cash", "Apple Pay", "Google Pay"]


def attach_not_available_products(restaurants: List[Dict[str, Any]], menu_ids: List[ObjectId]) -> None:
    """Most restaurants have all products available.

    Only a small portion will miss 1-2 products, stored in not_available_products.
    """
    if not restaurants or not menu_ids:
        return

    for r in restaurants:
        # 90% have everything available
        if random.random() < 0.90:
            r["not_available_products"] = []
        else:
            r["not_available_products"] = pick_k_unique(menu_ids, random.randint(1, 2))


def gen_orders(
    count: int,
    users: List[Dict[str, Any]],
    restaurants: List[Dict[str, Any]],
    menu_items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Generate Orders.json-like documents."""
    if not users or not restaurants or not menu_items:
        return []

    menu_by_id = {m["_id"]: m for m in menu_items}
    all_menu_ids = list(menu_by_id.keys())

    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    end = _now_utc()

    orders: List[Dict[str, Any]] = []

    for _ in range(count):
        user = random.choice(users)
        restaurant = random.choice(restaurants)

        not_available = set(restaurant.get("not_available_products", []))
        # Choose between 1 and 5 line items
        line_count = random.randint(1, 5)

        # Try to avoid picking not-available products
        candidate_ids = [mid for mid in all_menu_ids if mid not in not_available]
        if not candidate_ids:
            candidate_ids = all_menu_ids

        picked_ids = pick_k_unique(candidate_ids, min(line_count, len(candidate_ids)))
        items = []
        total = 0.0
        for mid in picked_ids:
            m = menu_by_id[mid]
            qty = random.randint(1, 3)
            price = float(m.get("Price", 0.0))
            items.append({"Menu_id": mid, "Quantity": qty, "Price": price})
            total += qty * price

        orders.append(
            {
                "_id": ObjectId(),
                "User_id": user["_id"],
                "Restaurant_id": restaurant["_id"],
                "Total": round(total, 2),
                "Items": items,
                "Order_date": rand_date_between(start, end),
                "Payment_method": random.choice(PAYMENT_METHODS),
            }
        )

    return orders


def gen_reviews(
    count: int,
    users: List[Dict[str, Any]],
    restaurants: List[Dict[str, Any]],
    raw_pool: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Generate Reviews.json-like documents.

    Uses stars/text from the CSV pool, attaches random user + restaurant.
    Also backfills each user's reviews_id list later.
    """
    if not users or not restaurants:
        return []

    start = datetime(2024, 1, 1, tzinfo=timezone.utc)
    end = _now_utc()

    reviews: List[Dict[str, Any]] = []
    for _ in range(count):
        user = random.choice(users)
        restaurant = random.choice(restaurants)

        if raw_pool:
            raw = random.choice(raw_pool)
            stars = int(raw.get("stars", 5))
            comment = raw.get("text") or raw.get("title") or "Great!"
        else:
            stars = random.randint(1, 5)
            comment = "Great service!"

        reviews.append(
            {
                "_id": ObjectId(),
                "stars": max(1, min(5, stars)),
                "date": rand_date_between(start, end),
                "comment": comment,
                "restaurant_id": restaurant["_id"],
                "user_id": user["_id"],
            }
        )

    return reviews


# ----------------------------
# MongoDB writer
# ----------------------------

def insert_many_batched(collection, docs: List[Dict[str, Any]], batch_size: int) -> int:
    if not docs:
        return 0
    inserted = 0
    for batch in chunked(docs, batch_size):
        # ordered=False = faster
        res = collection.insert_many(batch, ordered=False)
        inserted += len(res.inserted_ids)
    return inserted


def main() -> None:
    load_dotenv()

    mongo_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DATABASE")

    if not mongo_uri or not db_name:
        raise SystemExit("Missing env vars. Set MONGODB_URI and MONGODB_DATABASE in your .env")

    parser = argparse.ArgumentParser(description="Build a sample Pizza Hut MongoDB database from CSVs")
    parser.add_argument("--locations", default="pizza_hut_locations.csv", help="Path to pizza_hut_locations.csv")
    parser.add_argument("--menu", default="pizza_hut_menu.csv", help="Path to pizza_hut_menu.csv")
    parser.add_argument("--reviews", default="pizza_hut_reviews.csv", help="Path to pizza_hut_reviews.csv")
    args = parser.parse_args()

    restaurant_limit = int(os.getenv("RESTAURANT_LIMIT", "500"))
    user_count = int(os.getenv("USER_COUNT", "600"))
    order_count = int(os.getenv("ORDER_COUNT", "2500"))
    review_count = int(os.getenv("REVIEW_COUNT", "3000"))
    batch_size = int(os.getenv("BATCH_SIZE", "1000"))

    # Connect
    client = MongoClient(mongo_uri)
    db = client[db_name]

    # Collections
    col_rest = db["restaurantes"]
    col_users = db["usuarios"]
    col_menu = db["menu"]
    col_orders = db["ordenes"]
    col_reviews = db["resenas"]

    # Clean (optional but useful for re-running)
    for c in (col_rest, col_users, col_menu, col_orders, col_reviews):
        c.drop()

    print("Loading CSVs...")
    restaurants = load_locations_csv(args.locations, restaurant_limit)
    menu_items = load_menu_csv(args.menu)
    raw_reviews = load_reviews_csv(args.reviews, limit=20000)  # pool cap

    # Attach not available products (only a few restaurants miss 1-2 products)
    attach_not_available_products(restaurants, [m["_id"] for m in menu_items])

    # Generate users (addresses from US locations + coordinates in the US)
    users = gen_users(user_count, restaurants)

    # Generate orders and reviews
    orders = gen_orders(order_count, users, restaurants, menu_items)
    reviews = gen_reviews(review_count, users, restaurants, raw_reviews)

    # Backfill users.reviews_id
    reviews_by_user: Dict[ObjectId, List[ObjectId]] = {}
    for r in reviews:
        reviews_by_user.setdefault(r["user_id"], []).append(r["_id"])
    for u in users:
        u["reviews_id"] = reviews_by_user.get(u["_id"], [])

    print("Uploading to MongoDB...")
    ins_rest = insert_many_batched(col_rest, restaurants, batch_size)
    ins_menu = insert_many_batched(col_menu, menu_items, batch_size)
    ins_users = insert_many_batched(col_users, users, batch_size)
    ins_orders = insert_many_batched(col_orders, orders, batch_size)
    ins_reviews = insert_many_batched(col_reviews, reviews, batch_size)

    print("Done!")
    print(
        {
            "restaurantes": ins_rest,
            "menu": ins_menu,
            "usuarios": ins_users,
            "ordenes": ins_orders,
            "resenas": ins_reviews,
        }
    )

    # Helpful indexes for later (optional)
    col_rest.create_index({"location.geo": "2dsphere"})
    col_rest.create_index({"city": 1, "state": 1})
    col_menu.create_index({"Type": 1})
    col_orders.create_index({"Restaurant_id": 1, "Order_date": -1})
    col_orders.create_index({"User_id": 1, "Order_date": -1})
    col_reviews.create_index({"restaurant_id": 1, "date": -1})
    col_users.create_index({"email": 1}, unique=True)

    print("Indexes created.")


if __name__ == "__main__":
    main()