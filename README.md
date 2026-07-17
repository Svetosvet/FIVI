# SODZZO — video search aggregator

Webová appka (HTML/CSS/JS frontend + dve malé serverless funkcie), ktorá
vyhľadáva videá naraz na YouTube, Vimeo a Dailymotion a prehráva ich priamo
v appke cez embed prehrávač. Twitch je pripravený v kóde, ale zatiaľ vypnutý.

**Ani YouTube kľúč, ani Vimeo token nie sú nikde v kóde appky ani v `config.js`.**
Obidva bežia len na serveri (Netlify serverless funkcie), nastavené ako
premenné prostredia — nikdy sa preto nedostanú do prehliadača, do git
histórie ani do verejného repozitára. Toto vyžadujú podmienky oboch platforiem:
YouTube Developer Policies (III.D.1.d) zakazujú "embedovanie" API kľúčov do
open-source projektov a Vimeo Developer Addendum (4.3) zakazuje kľúče v
client-side kóde.

## 1. YouTube kľúč

1. Choď na https://console.cloud.google.com/
2. Vytvor nový projekt (alebo použi existujúci)
3. V "APIs & Services" → "Library" zapni **YouTube Data API v3**
4. V "Credentials" vytvor **API key**
5. Kľúč **nikam v kóde nevkladaj** — nastavíš ho ako premennú prostredia
   priamo v Netlify (postup nižšie, krok "Nastav premenné prostredia")

Zadarmo máš cca 100 vyhľadávaní denne (search.list má vlastný denný limit
oddelený od všeobecnej 10 000-jednotkovej kvóty).

## 2. Vimeo token

1. Choď na https://developer.vimeo.com/apps a vytvor appku
2. V appke → **Authentication** → vygeneruj **Unauthenticated** access token
   (stačí scope **Public**)
3. Token tiež nikam v kóde nevkladaj — ide do tej istej sekcie premenných
   prostredia v Netlify

## 3. Dailymotion

Nič netreba – verejné vyhľadávacie API funguje bez kľúča.

## 4. Vyskúšaj lokálne

Ak máš nainštalovaný Netlify CLI (`npm install -g netlify-cli`), spusti v
priečinku appky `netlify dev` — spustí frontend aj obe serverless funkcie
naraz, s kľúčmi z lokálneho `.env` súboru (ten do gitu tiež nedávaj — pridaj
ho do `.gitignore`). Bez Netlify CLI appka lokálne nájde len Dailymotion.

## 5. Nasadenie online (Netlify, zadarmo)

1. Nahraj celý priečinok appky (vrátane `netlify/functions/`) do nového
   GitHub repozitára — keďže kľúče už nie sú nikde v súboroch, pokojne môže
   byť repozitár verejný
2. Choď na https://app.netlify.com → **Add new site** → **Import an existing
   project** → prepoj svoj GitHub repozitár
3. Netlify automaticky rozpozná priečinok `netlify/functions` a obe funkcie
   nasadí spolu so stránkou
4. **Nastav premenné prostredia:** v Netlify choď do **Site configuration →
   Environment variables** → **Add a variable** a pridaj:
   - `YOUTUBE_API_KEY` = tvoj YouTube kľúč z kroku 1
   - `VIMEO_ACCESS_TOKEN` = tvoj Vimeo token z kroku 2
5. Netlify appku zdeployne a dá ti verejnú adresu (napr. `sodzzo-abcd.netlify.app`)

(Git-prepojenie namiesto drag-and-drop je potrebné práve preto, aby Netlify
mohol nasadiť aj tie serverless funkcie, nielen statické súbory.)

## 6. Reklama — čo je a čo nie je dovolené

- **YouTube**: bežná reklama niekde inde na stránke appky (nie na/v rámci
  YouTube prehrávača) je povolená, pokiaľ appka ponúka aj nezávislú hodnotu
  okrem YouTube dát — čo SODZZO spĺňa (agreguje aj Vimeo a Dailymotion).
- **Vimeo aj Dailymotion**: akákoľvek reklama vyžaduje ich predchádzajúci
  písomný súhlas.

## 7. Privacy policy

Appka má vlastnú stránku `privacy.html`, ktorú vyžadujú podmienky YouTube aj
Vimeo pre verejné appky. Je odkazovaná v pätičke hlavnej stránky.

## Ako appka funguje

- `index.html` – štruktúra stránky (search bar, taby Home/Favorites/History,
  filter platforiem, prehrávač, pätička s odkazmi)
- `privacy.html` – privacy policy appky
- `styles.css` – dark mode dizajn, fialovo-modrá farebná schéma
- `config.js` – len nesekrétne feature flags (žiadne kľúče)
- `app.js` – logika vyhľadávania, vykresľovania kariet, prehrávača
  a ukladania Favorites/History do `localStorage` prehliadača
- `netlify/functions/youtube-search.js` – serverless proxy pre YouTube kľúč
- `netlify/functions/vimeo-search.js` – serverless proxy pre Vimeo token
