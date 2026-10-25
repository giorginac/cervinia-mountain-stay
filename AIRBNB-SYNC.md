# Sincronizzazione Airbnb

Il sito legge `availability.json`. Il workflow GitHub Actions aggiorna ogni 3 ore le date occupate usando gli URL di esportazione iCal da Airbnb.

## Configurazione privata
In GitHub apri **Settings → Secrets and variables → Actions → New repository secret** e crea:
- `AIRBNB_ICAL_PETIT`: URL di esportazione iCal per Le Petit Chalet
- `AIRBNB_ICAL_PASSO`: URL di esportazione iCal per Passo nel Cielo

Questi URL NON devono mai comparire in un file pubblico o in una pagina web.

Poi apri **Actions → Sync Airbnb availability → Run workflow** e verifica l'esito. Se entrambi i calendari vengono letti, `availability.json` riceve `connected: true` e la data dell'aggiornamento. In caso di errore, il workflow non sovrascrive la versione precedente.

**Limiti:** Airbnb/iCal non è in tempo reale. Il sito mostra notti occupate, non conferma disponibilità o prenotazioni. Controlla sempre su Airbnb prima di accettare una richiesta; per prevenire doppie prenotazioni i soggiorni diretti vanno bloccati manualmente su Airbnb, salvo realizzazione di una sincronizzazione bidirezionale separata.
