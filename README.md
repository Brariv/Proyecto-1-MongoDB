# Proyecto-1-MongoDB

## Descripción del Proyecto
Este proyecto es una aplicación de comercio electrónico que utiliza MongoDB como base de datos. La aplicación permite a los usuarios iniciar sesión, agregar direcciones de envío y realizar pedidos. La aplicación está diseñada para ser escalable y eficiente, utilizando consultas optimizadas para manejar grandes volúmenes de datos.

## Estructura del Proyecto
- `Backend/`: Contiene el código del backend de la aplicación, incluyendo las consultas a MongoDB.
- `Frontend/`: Contiene el código del frontend de la aplicación, incluyendo la interfaz de usuario y la lógica de interacción.
- `Data_Generator/`: Contiene los scripts para la generación de datos y la carga inicial en MongoDB.
- `Data/`: Contiene los csv para la base inicial de datos en MongoDB.
- `Documents/`: Contiene documentos relacionados con el proyecto, como diagramas de arquitectura y documentación técnica.
- `postman/`: Contiene las colecciones de Postman para probar las API del backend.
- `Templates/`: Contiene plantillas para el frontend.
- `Tests/`: Contiene pruebas por medio de querys para cada request del backend.
- `.gitignore`: Archivo que especifica los archivos a ignorar en el control de versiones.
- `.env`: Archivo que contiene las variables de entorno necesarias para la aplicación.
- `dependencies.txt`: Archivo que lista las dependencias necesarias para ejecutar la aplicación.

## Configuración del Entorno
1. Clona el repositorio en tu máquina local.
2. Crea un entorno virtual de python e instala las dependencias listadas en `dependencies.txt`.
```
python -m venv env
source env/bin/activate  # En Windows usa `env\Scripts\activate`
pip install -r dependencies.txt
```
3. Crea un archivo `.env` en la raíz del proyecto y agrega tu URI de MongoDB y el nombre de la base de datos
4. Ejecuta el script de generación de datos para cargar la base de datos con datos iniciales.
```
python mongo.py --locations ../Data/pizza_hut_locations.csv --menu ../Data/pizza_hut_menu.csv --reviews ../Data/pizza_hut_reviews.csv
```
5. Inicia el servidor del backend.
```
fastapi dev
```
6. Instala las dependencias del frontend.
```
npm install
```
7. Inicia el servidor del frontend.
```
npm run dev
```

## Endpoints del Backend
```
GET /login 
GET /users/{user_id}/addresses 
DELETE /users/{user_id}/addresses 
GET /restaurants/ordered/{user_id} 
POST /users/{user_id}/addresses 
GET /reviews/{user_id} 
PATCH /reviews/{review_id} 
POST /reviews 
GET /restaurants 
GET /restaurants/names 
GET /restaurants/{restaurant_id}/menu 
GET /restaurants/near 
POST /menu 
POST /orders 
GET /best-rated 
GET /sales-per-state 
GET /best-sellers 
GET /sales-per-month 
PATCH /unavailable-items 
```

