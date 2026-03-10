from __future__ import annotations

import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

PAYMENT_METHODS = ["Credit Card", "Debit Card", "Cash", "Apple Pay", "Google Pay"]


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def rand_date_between(start: datetime, end: datetime) -> datetime:
    if start >= end:
        return start
    delta = end - start
    seconds = int(delta.total_seconds())
    return start + timedelta(seconds=random.randint(0, max(1, seconds)))


def chunked(items: List[Any], size: int) -> Iterable[List[Any]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def generate_orders(
    order_count: int,
    users: List[Dict[str, Any]],
    restaurants: List[Dict[str, Any]],
    menu_items: List[Dict[str, Any]],
    start: datetime | None = None,
    end: datetime | None = None,
) -> List[Dict[str, Any]]:
    """
    Genera documentos para la colección `ordenes`.

    users:       [{"_id": ObjectId(...)}...]
    restaurants: [{"_id": ObjectId(...), "not_available_products": [ObjectId,...]}...]
    menu_items:  [{"_id": ObjectId(...), "Price": float/int}...]
    """
    if not users or not restaurants or not menu_items:
        return []

    start = start or datetime(2024, 1, 1, tzinfo=timezone.utc)
    end = end or _now_utc()

    menu_by_id = {m["_id"]: float(m.get("Price", 0.0)) for m in menu_items}
    all_menu_ids = list(menu_by_id.keys())

    orders: List[Dict[str, Any]] = []

    for _ in range(order_count):
        user = random.choice(users)
        rest = random.choice(restaurants)

        not_available = set(rest.get("not_available_products", []) or [])
        candidate_ids = [mid for mid in all_menu_ids if mid not in not_available] or all_menu_ids

        line_count = random.randint(1, 5)
        picked_ids = random.sample(candidate_ids, k=min(line_count, len(candidate_ids)))

        items = []
        total = 0.0
        for mid in picked_ids:
            qty = random.randint(1, 3)
            price = menu_by_id.get(mid, 0.0)
            items.append({"Menu_id": mid, "Quantity": qty, "Price": price})
            total += qty * price

        orders.append(
            {
                "_id": ObjectId(),
                "User_id": user["_id"],
                "Restaurant_id": rest["_id"],
                "Total": round(total, 2),
                "Items": items,
                "Order_date": rand_date_between(start, end),
                "Payment_method": random.choice(PAYMENT_METHODS),
            }
        )

    return orders


def insert_many_batched(collection, docs: List[Dict[str, Any]], batch_size: int) -> int:
    """Inserta documentos en batches (ordered=False para ir más rápido)."""
    if not docs:
        return 0
    inserted = 0
    for batch in chunked(docs, batch_size):
        res = collection.insert_many(batch, ordered=False)
        inserted += len(res.inserted_ids)
    return inserted


def generate_and_upload_orders(
    mongo_uri: str,
    db_name: str,
    order_count: int = 50_000,
    batch_size: int = 1_000,
) -> int:
    """
    Lee usuarios/restaurantes/menu desde Mongo y sube `order_count` órdenes nuevas a `ordenes`.
    """
    client = MongoClient(mongo_uri)
    db = client[db_name]

    col_users = db["usuarios"]
    col_rest = db["restaurantes"]
    col_menu = db["menu"]
    col_orders = db["ordenes"]

    users = list(col_users.find({}, {"_id": 1}))
    restaurants = list(col_rest.find({}, {"_id": 1, "not_available_products": 1}))
    menu_items = list(col_menu.find({}, {"_id": 1, "Price": 1}))

    if not users:
        raise RuntimeError("No hay usuarios en la colección `usuarios`.")
    if not restaurants:
        raise RuntimeError("No hay restaurantes en la colección `restaurantes`.")
    if not menu_items:
        raise RuntimeError("No hay items en la colección `menu`.")

    orders = generate_orders(
        order_count=order_count,
        users=users,
        restaurants=restaurants,
        menu_items=menu_items,
    )

    return insert_many_batched(col_orders, orders, batch_size)


if __name__ == "__main__":
    load_dotenv()
    mongo_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DATABASE")

    if not mongo_uri or not db_name:
        raise SystemExit("Faltan env vars: MONGODB_URI y MONGODB_DATABASE en tu .env")

    inserted = generate_and_upload_orders(
        mongo_uri=mongo_uri,
        db_name=db_name,
        order_count=int(os.getenv("ORDER_COUNT", "50000")),
        batch_size=int(os.getenv("BATCH_SIZE", "1000")),
    )

    print({"inserted_orders": inserted})