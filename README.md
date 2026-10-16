# MDW Publish

SaaS-Grundlage für das Planen, Freigeben und Protokollieren von Beiträgen in autorisierten Social-Media-Gruppen.

## Lokal starten

1. `cp .env.example .env.local` und die Werte des Supabase-Projekts eintragen.
2. `npm install`
3. `npm run dev`

## Sicherer Produktionsweg

- Die SQL-Vorlage in `supabase/schema.sql` zuerst in einem separaten Testprojekt prüfen. Danach mit der Supabase CLI als versionierte Migration erzeugen.
- Für die Browser-App ausschließlich den Publishable Key verwenden. `service_role` bleibt in einer serverseitigen Funktion.
- Vor dem ersten Zugriff Richtlinien mit `supabase test db` testen.
- Meta-Tokens gehören verschlüsselt in ein ausschließlich serverseitig erreichbares Geheimnis; sie dürfen nie an den Browser ausgeliefert werden.
- Geplante Veröffentlichung: Worker mit atomarer Job-Sperre, Idempotenz-Schlüssel, Fehler-Backoff und Audit-Eintrag.

## Deployment

Das Repository in GitHub pushen, bei Netlify importieren und dort dieselben `NEXT_PUBLIC_*`-Variablen hinterlegen. Für die produktive Veröffentlichung sind zusätzlich OAuth-Redirect-URLs sowie ein rechtlich geprüfter Datenschutz-/Löschprozess nötig.
