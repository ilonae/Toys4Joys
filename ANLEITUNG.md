# KI-Produkt-Tool — Anleitung

Dieses Tool erstellt aus Produktfotos saubere Shop-Bilder (weißer Hintergrund)
und generiert Produkttexte in DE / EN / ES. Alles läuft **lokal auf deinem
Computer** — deine API-Schlüssel verlassen deinen Rechner nicht.

---

## 1. Einmalige Einrichtung

### Voraussetzung: Python 3
- **Mac:** meist schon vorhanden. Falls nicht, beim ersten Start erscheint ein Hinweis.
- **Windows:** von https://www.python.org/downloads/ installieren
  → beim Installer **Haken bei „Add Python to PATH"** setzen.

### Starten
- **Mac:** Doppelklick auf **`Start-KI-Tool-Mac.command`**
  - Beim allerersten Doppelklick blockiert macOS evtl. die Datei:
    Rechtsklick → **Öffnen** → **Öffnen** bestätigen (nur einmal nötig).
- **Windows:** Doppelklick auf **`Start-KI-Tool-Windows.bat`**

Der erste Start dauert 2–3 Minuten (Installation + Download des KI-Modells, ~350 MB).
Danach geht es in wenigen Sekunden.

---

## 2. API-Schlüssel eintragen (einmalig)

Beim ersten Öffnen oben rechts auf **⚙ Einstellungen** klicken und eintragen:

| Schlüssel | Wofür | Wo bekommen |
|-----------|-------|-------------|
| **OpenAI** | Texte + Bildbearbeitung | https://platform.openai.com/api-keys |
| **Stability AI** | Hintergrund entfernen (Cloud-Fallback) | https://platform.stability.ai/account/keys |
| **Supabase** | Upload in den Shop | Supabase → Project Settings → API → `service_role` |
| **Claude** (optional) | Bildanalyse bei Erwachsenen-Produkten | https://console.anthropic.com/settings/keys |

Die Schlüssel werden **nur im Browser dieses Rechners** gespeichert
(localStorage) und bei jedem Start automatisch wieder geladen.

---

## 3. Täglich benutzen

1. Launcher doppelklicken (Mac/Windows) → Tool öffnet sich im Browser.
2. Das schwarze Server-Fenster **geöffnet lassen**, solange du arbeitest.
3. Foto hochladen, Felder ausfüllen, generieren.
4. Zum Beenden einfach das Server-Fenster schließen.

---

## 4. Hinweise

- **Grüner Punkt „rembg-Server: aktiv"** in den Einstellungen = beste
  Freistell-Qualität (läuft lokal). Falls grau: kurz warten oder Tool neu laden.
- Ohne lokalen Server wird automatisch **Stability AI** (Cloud) zum Freistellen
  benutzt — dafür wird der Stability-Schlüssel benötigt.
- **Prop-/Klebeband entfernen:** grüner Radierer-Knopf am Bild-Vorschaubild.
  Weiß = Hintergrund-Objekte übermalen · Pipette → Produktfarbe wählen, dann
  Klebeband auf dem Produkt übermalen.

---

## 5. Was ist im Paket?

```
Start-KI-Tool-Mac.command       ← Mac: Doppelklick zum Starten
Start-KI-Tool-Windows.bat       ← Windows: Doppelklick zum Starten
remove_bg_server.py             ← lokaler Freisteller-Server
requirements.txt                ← Liste der benötigten Pakete
ANLEITUNG.md                    ← diese Datei
.superdesign/design_iterations/
    └─ ki_produkt_tool_1_1.html ← das eigentliche Tool
venv/                           ← wird beim ersten Start automatisch erstellt
```
