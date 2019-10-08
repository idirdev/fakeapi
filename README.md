# fakeapi

> **[EN]** Instant mock REST API server from a JSON file or directory — full CRUD, filtering, CORS, delay simulation and read-only mode.
> **[FR]** Serveur API REST factice instantané depuis un fichier JSON ou un répertoire — CRUD complet, filtrage, CORS, simulation de délai et mode lecture seule.

---

## Features / Fonctionnalités

**[EN]**
- Serves any JSON file or directory of JSON files as a REST API automatically
- Full CRUD: GET, POST, PUT, PATCH, DELETE on every resource collection
- Query-string filtering, sorting and pagination on GET list endpoints
- Configurable response delay to simulate network latency (`--delay`)
- CORS headers enabled with a single flag (`--cors`)
- Read-only mode prevents all write operations (`--read-only`)
- Writes changes back to the source JSON file (persistent mutations)
- Auto-generates UUID-based IDs for new POST items

**[FR]**
- Expose automatiquement n'importe quel fichier JSON ou répertoire de fichiers JSON comme API REST
- CRUD complet : GET, POST, PUT, PATCH, DELETE sur chaque collection de ressources
- Filtrage, tri et pagination par chaîne de requête sur les endpoints de liste GET
- Délai de réponse configurable pour simuler la latence réseau (`--delay`)
- En-têtes CORS activés avec un seul drapeau (`--cors`)
- Le mode lecture seule empêche toutes les opérations d'écriture (`--read-only`)
- Écrit les modifications dans le fichier JSON source (mutations persistantes)
- Génère automatiquement des IDs basés sur UUID pour les nouveaux éléments POST

---

## Installation

```bash
npm install -g @idirdev/fakeapi
```

---

## CLI Usage / Utilisation CLI

```bash
# Serve db.json as REST API / Exposer db.json comme API REST
fakeapi db.json

# Custom port and host / Port et hôte personnalisés
fakeapi db.json --port 4000 --host 0.0.0.0

# Enable CORS and add 300ms latency / Activer CORS et ajouter 300ms de latence
fakeapi db.json --cors --delay 300

# Read-only mode (no POST/PUT/DELETE) / Mode lecture seule (pas de POST/PUT/DELETE)
fakeapi db.json --read-only

# Serve a directory of JSON files / Exposer un répertoire de fichiers JSON
fakeapi ./fixtures/
```

### Example Output / Exemple de sortie

```
fakeapi at http://localhost:3000
Resources: users, posts, comments

# GET list with filter / Liste GET avec filtre
curl http://localhost:3000/users?role=admin
[{"id":"a1b2c3","name":"Alice","role":"admin"}]

# GET single item / Élément unique GET
curl http://localhost:3000/users/a1b2c3
{"id":"a1b2c3","name":"Alice","role":"admin"}

# POST new item / Nouvel élément POST
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","role":"editor"}'
{"id":"f4e5d6","name":"Bob","role":"editor"}

# DELETE / Supprimer
curl -X DELETE http://localhost:3000/users/f4e5d6
{"id":"f4e5d6","name":"Bob","role":"editor"}
```

---

## API (Programmatic) / API (Programmation)

```js
const { createServer, FakeApiServer } = require('@idirdev/fakeapi');

// Quick start / Démarrage rapide
const server = createServer('db.json', {
  port: 3001,
  host: 'localhost',
  delay: 200,    // 200ms simulated latency / latence simulée 200ms
  cors: true,
  readOnly: false,
});
server.start(); // fakeapi at http://localhost:3001

// Using the class directly / Utiliser la classe directement
const api = new FakeApiServer('./fixtures/', { port: 5000, cors: true });
api.start();
```

### db.json example / Exemple de db.json

```json
{
  "users":  [{ "id": 1, "name": "Alice", "role": "admin" }],
  "posts":  [{ "id": 1, "title": "Hello", "userId": 1 }],
  "tags":   [{ "id": 1, "label": "node" }]
}
```

---

## License

MIT — idirdev
