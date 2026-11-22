# Voyage nordique

Planificateur de voyage dans les pays nordiques (Danemark, Suède, Norvège, Finlande, Islande) propulsé par l'API Mistral et le SDK TypeScript officiel.

## Installation et exécution

```bash
npm install
cp .env.example .env   # renseignez votre clé MISTRAL_API_KEY
npm start              # http://localhost:3000
```

La clé API reste côté serveur ; le navigateur ne communique qu'avec l'endpoint local `/api/itinerary`.
