# ATLAS Personal Time v1.8

[English](README.md) · **Srpski**

Lični decimalni sat: 100 sati u danu, 100 minuta u satu, 100 sekundi u minutu i
100 stotinki u sekundi. Dan traje 24 sadašnja sata. Nema naloga, baze, npm
zavisnosti, fontova sa interneta ni praćenja posetilaca.

Autor: Marjan Panic · Licenca: [PolyForm Noncommercial 1.0.0](LICENSE) —
besplatno za nekomercijalnu upotrebu; komercijalna upotreba traži dozvolu autora.

## v1.8 — English / Srpski

Naziv aplikacije je ATLAS Personal Time. Izbor English / Srpski je na svim
stranicama, uključujući ceo Help. Engleski je početni jezik. Izbor se pamti
u kolačiću `atlas_lang` godinu dana; podržani su i `?lang=en` / `?lang=sr`.
Promena jezika ponovo učitava stranicu: sačuvajte započet događaj pre promene.
Sačuvani događaji, njihove originalne napomene, izbor zone i matematička pravila
ostaju isti. JSON format ostaje `atlas-history-v1`; stari izvozi su kompatibilni.

Srpske stranice su `web/*.html`, engleske `web/en/*.html`. Deljene poruke i
izbor jezika su u `web/i18n.mjs` i pozivima `t(sr, en)` u UI modulima.
Server bira HTML po jeziku; JavaScript moduli i matematičko jezgro su zajednički.
Za promene teksta uredite oba HTML prevoda. `translations/static-en.json` je
referentni spisak početnog prevoda četiri stranice, nije build korak.

English installation and operations: [README.en.md](README.en.md).
Complete bilingual documentation is available at `/help`.

**Demo uživo:** <https://neoartdoo.github.io/ATLAS-Time/> (statička kopija: nema servera, koristi se vreme vašeg uređaja).

## Instalacija

Potrebni su Docker Engine i Docker Compose v2 (ili samo Python 3 bez Dockera).

```bash
git clone https://github.com/neoartdoo/ATLAS-Time.git
cd ATLAS-Time
cp .env.example .env     # opciono: port, adresa
bash start.sh
```

Otvorite `http://localhost:6140`. Bez Dockera: `python3 server.py` (port 8080,
ili promenljiva `PORT`).

Podešavanja u `.env` (sva su opciona):

| Promenljiva | Podrazumevano | Značenje |
|---|---|---|
| `CLOCK_PORT` | `6140` | Port na hostu |
| `CLOCK_BIND` | `127.0.0.1` | Adresa vezivanja. `0.0.0.0` otvara sat celoj lokalnoj mreži |
| `CLOCK_EMBED_ORIGINS` | prazno | Adrese kojima je dozvoljeno da ugrade `/?embed=1` u iframe |

Interfejs nema prijavu: izlažite ga samo mrežama kojima verujete. Prvo pokretanje
preuzima sliku `python:3.13-alpine`; zatim radi bez interneta. `restart: unless-stopped`
vraća kontejner nakon restarta Dockera/hosta, ako Docker servis radi pri podizanju
sistema (`systemctl is-enabled docker`).

Gotova slika se objavljuje na `ghcr.io/neoartdoo/atlas-time` za svaku verziju (tag `v*`).

## Kako izgleda sat

`052.034.081.009` znači 52 nova sata, 34 nova minuta, 81 nova sekunda,
9 stotinki nove sekunde. Grupe su dopunjene na tri cifre radi željenog izgleda,
ali opseg svake grupe je 000–099. Uvek počinje od trenutnog vremena.

| Jedinica | Sadašnje vreme |
|---|---|
| Novi sat | 14 min 24 s |
| Novi minut | 8,64 s |
| Nova sekunda | 0,0864 s |
| Stotinka nove sekunde | 0,000864 s = 0,864 ms |

Poslednja grupa se menja brže nego što ekran može da iscrta. Prikaz se osvežava
približno 30 puta u sekundi i neke vrednosti se preskaču. To je rezolucija
prikaza, ne garancija preciznosti vremena.

Ispod su običan sat i gregorijanski datum u istoj izabranoj zoni, plus lokalni
sat Europe/Berlin. Na telefonu je raspored prilagođen uskom ekranu.

## Sat računara (NTP)

Aplikacija ne podešava sat i sama ne pita vremenske servere: prikazuje vreme računara
na kom radi server. Sinhronizujte taj računar sa bilo kojim NTP serverom (na primer
`pool.ntp.org` ili `time.windows.com`). Windows: `w32tm /query /status`, a
`w32tm /resync` (kao administrator) traži novu sinhronizaciju. Linux: `timedatectl status`.
Na Windowsu sat Docker Desktop virtuelne mašine može da zaostane posle spavanja ili
hibernacije; restart Docker Desktopa ga ponovo usklađuje.

## Vremenska osnova i sinhronizacija

Podrazumevana zona je stalna UTC+01, tako da svaki civilni dan u aplikaciji
traje 24 sata. Leti se razlikuje jedan sat od Berlina. Možete izabrati stalnu
UTC+02, UTC ili Europe/Berlin. Berlin prati letnje/zimsko vreme; tada dva dana
u godini traju 23 ili 25 običnih sati, a prikaz pri promeni preskače ili ponavlja
deo dana. Izbor se pamti u pregledaču.

Prvi prikaz koristi `Date.now()` uređaja; odmah zatim traži `/api/time` od servera.
Od tri uzorka bira najmanji odziv i procenjuje korekciju pomoću polovine
povratnog vremena. Dalje koristi monotoni sat pregledača između usklađivanja
na 60 sekundi. Po povratku u vidljivu karticu odmah se ponovo usklađuje.
Prekid veze i rezervni izvor su označeni na ekranu. Restart ne resetuje vreme.

Kontejner čita Unix vreme hosta. Ne podešava host i ne implementira atomski sat.
Proverite sinhronizaciju hosta pomoću `timedatectl status`; tačnost zavisi od
sata hosta, mreže i pregledača. Mrežna asimetrija nije potpuno ispravljiva ovim
HTTP merenjem. Ne obračunavamo posebnu sekundu 23:59:60; pratimo hostov Unix sat.

## Kalendar v1.2

Otvorite `/calendar` preko dugmeta „Godišnji kalendar · 13 meseci“.
Na toj stranici sat je manji, a svih 13 meseci prikazano je zajedno.
Unesite godinu (0001–9999) ili koristite pomeranje po 1, 100 ili 1000 godina.
Dugme „Danas“ vraća tekuću godinu i označava tekući datum.
Primeri: `/calendar?year=1026` i `/calendar?year=3026`.
Klik na dan prikazuje odgovarajući gregorijanski datum; iznad svakog meseca
piše njegov gregorijanski opseg. Današnji dan je zelen, dodatni dani zlatni.

Godina počinje 1. januara izabrane zone. Broj godine ostaje isti.
Datumski format je `2026.011.001` = godina 2026, mesec 11, dan 1.
Na primer, 8. oktobar 2026. odgovara upravo tom datumu.

| Vrsta godine | Mesec 1 | Meseci 2–12 | Mesec 13 | Ukupno |
|---|---:|---:|---:|---:|
| Obična | 28 | po 28 | 29 | 365 |
| Prestupna | 29 | po 28 | 29 | 366 |

Dodatni dan na kraju 13. meseca je Dan godine: `013.029`, uvek 31. decembar.
U prestupnoj godini i prvi mesec ima dan `001.029`, koji pada 29. januara.
To je naš izbor rasporeda; nije gregorijanski 29. februar. Svi dani su uzastopni
bez preskakanja ili dupliranja. Datumi meseci 2–13 u prestupnoj godini pomereni
su za jedan dan u odnosu na v1.0 zbog novog položaja prestupnog dana.
Mesec 000 iz v1.0 više se ne koristi. Novo pravilo važi i na glavnom satu.

Prestupno pravilo: deljivo sa 4, osim sa 100; deljivo sa 400 ipak je prestupno.
Za sve godine koristi se proleptički gregorijanski kalendar (pravilo produženo
unazad). Ovo nije istorijski kalendar kakav je tada važio u pojedinim državama,
niti predviđanje budućih kalendarskih reformi ili orbitalnog položaja Zemlje.
Kolone idu od ponedeljka do nedelje. Početna tačka je 01.01.0001. = ponedeljak.
Svaki sledeći dan pomera nedelju za jedan, uključujući oba dodatna dana.
Nema resetovanja početkom meseca ili godine. Zato se dani u nedelji poklapaju
sa odgovarajućim proleptičkim gregorijanskim datumima. Na primer, 013.029.2021.
je petak, a 001.001.2022. je subota. (U samom interfejsu godina se piše prva.)
U običnoj godini početak sledeće godine pomera se za jedan dan, u prestupnoj
za dva dana. Prazna mesta pre prvog dana u mesecu samo poravnavaju kolone.

## Ažuriranje

```bash
git pull
bash start.sh
```

`.env` nije u repozitorijumu i ostaje netaknut. Izbor vremenske zone i sačuvani
događaji žive u pregledaču i ne zavise od ažuriranja.

## Upravljanje

Iz foldera projekta:

```bash
docker compose ps
docker compose logs --tail=80 -f
docker compose restart
```

Za zaustavljanje: `docker compose stop`. Za povratak: `docker compose up -d`.
Nema korisničkih podataka na serveru; sve je u Git repozitorijumu.

## Provere i ograničenja isporuke

```bash
node --test tests/*.test.mjs
python3 tests/server_test.py
```

Testovi proveravaju decimalne granice, obostrano pretvaranje datuma, dodatne dane u prvom i poslednjem mesecu,
ukupne dužine svih godina 0001–9999, kontinuitet nedelje na svim prelazima meseci i godina, prestupne vekove, fiksne zone, berlinsko
letnje/zimsko vreme, godišnju stranicu i server API.
U okruženju izrade Docker nije dostupan, pa slika nije ovde izgrađena/pokrenuta.
Automatizovan vizuelni pregled u pregledaču nije bio dostupan; HTML/CSS je
pripremljen za desktop i mobilni prikaz, bez potvrde screenshotom.


## v1.3 — zasebna stranica za istoriju

Nova putanja: `/history`. Na postojećim stranicama dodat je link; moduli sata,
kalendara i njihove stilske definicije nisu menjani (provereno kontrolnim sumama).

- Ulazni kalendar: julijanski, gregorijanski ili naš lični sa 13 meseci.
- Astronomski ulaz: godine −9999 do 9999, uključujući 0.
- Istorijski ulaz: godine 1–9999 p. n. e. ili n. e.; nema godine 0.
- Astronomska godina 0 = 1. p. n. e.; −1 = 2. p. n. e.
- Izlaz: sva tri datuma, dan u nedelji, redni dan godine i neprekidni broj dana.
- Vreme nije pretpostavljeno. Ako je poznato, ulaz je u sadašnjim 24/60/60
  jedinicama; izlaz je u decimalnim 100/100/100/100 jedinicama.
- Nema automatskog preračunavanja istorijskih vremenskih zona.
- Datum po našem kalendaru u izlazu uvek ima astronomsku godinu; oznaka ere
  prikazana je posebno. Prelaz julijanski/gregorijanski može promeniti i godinu.
- Sačuvani događaji pripadaju pregledaču i adresi sa koje je stranica otvorena.
  To nije serverska baza: LAN i Tailscale adresa mogu imati različite liste.
  Izvoz i uvoz JSON služe za backup i prenos. Uvoz dodaje događaje bez brisanja
  postojećih; najviše 500 zapisa. Uklanjanje briše iz lokalne liste.

Primer: 13.07.1369. je 194. dan izvorne godine, odnosno 193 cela dana od početka.
Gregorijanski unos daje `1369.007.026`. Julijanski unos predstavlja drugi dan:
21.07.1369. gregorijanski, odnosno `1369.008.006` po našem kalendaru.

Kalendar ne pretpostavlja da su svi ljudi u istoriji koristili ova pravila.
To su matematički produženi (proleptički) kalendari. Nema automatskog izbora
reforme po državi, starog lokalnog početka godine ili ranih rimskih izuzetaka.
Pri radu sa izvorima prvo utvrdite kako je njihov datum zapisan. Godina 0 nije
utvrđena godina Isusovog rođenja. Datumi u praznini reforme dozvoljeni su kao
proleptički datumi, a nisu tvrdnja da su tada važili u određenoj državi.

Izvori za konvencije i istorijski primer:
- https://aa.usno.navy.mil/data/JulianDate
- https://eclipse.gsfc.nasa.gov/SEhelp/dates.html

Testovi: standardne JDN tačke, reforma 1582, prestupna pravila oba kalendara,
prelaz godine 0/1, negativne godine, datumi na granicama opsega i poređenje
sa postojećim ličnim kalendarom. Lokalni HTTP testovi uključuju novu stranicu.
Docker izvršavanje i vizuelna provera u pregledaču nisu dostupni u okruženju izrade.


## v1.4 — Atlas zvezdani datum

Na glavnoj i godišnjoj stranici dodat je UTC brojač dana i decimalnog vremena.
Primer formata: `739896.073.069.073`; matematička vrednost: `739896,736973` dana.
Svaka grupa vremena prikazana je sa tri cifre radi izgleda, ali njena vrednost
je 0–99 i zauzima dve cifre u razlomku dana. To nije decimalni broj sa više tačaka.

Osnova je 01.01.0001. u 00:00 UTC = 0. Na datum 26.04.1985. gregorijanski je
protekao 724756 ceo dan, a na 08.10.2026. 739896 dana. Brojanje počinje nulom;
to nisu redni brojevi dana kada bi prvi dan nosio broj 1.

Zvezdani datum je uvek UTC, nezavisan od izbora zone za ostale satove. To daje
istu vrednost za isti trenutak na svim uređajima koji imaju usklađeno vreme.
Ekvivalentni format sa tačkom umesto decimalnog zareza pogodan je za računanje:
`739896.736973`. Razlika daje dane, puta 86400 sadašnje sekunde, a puta 1000000
nove sekunde. Jedna milionitina dana je 0,0864 sadašnje sekunde.

Broj koristi sistemski Unix/UTC prikaz vremena; nije kontinuirana TAI skala.
Prestupne sekunde nisu posebno brojane, a preciznost ograničava izvorni sat.
Prikaz je odsečen, ne zaokružen, na šest decimala. Za negativne dane ispravno se
obrađuje znak: dan −1 plus pola dana daje broj −0,5, a ne −1,5.
JDN iz istorijske stranice ima drugu početnu tačku; za istu građansku oznaku
JDN = naš ceo broj dana + 1721426. Decimalni broj nije JDN niti zvanična Star
Trek konvencija; to je naš „Atlas zvezdani datum“.


## v1.5 — analogni decimalni sat

Nova stranica `/analog` ima okrugao brojčanik sa oznakama 0–9, sa nulom na vrhu
i smerom kretanja kao kod klasičnog sata. Dan ostaje 100 novih sati.
Pet kazaljki ima zajednički centar:

| Kazaljka | Značenje | Izgled |
|---|---|---|
| Desetice sati | 5 znači 50 sati | Zelena, najduža široka, trougao |
| Jedinice sati | 7 znači još 7 sati | Plava, kraća široka, kružić |
| Desetice minuta | 2 znači 20 minuta | Zlatna, još kraća/tanja, kvadrat |
| Jedinice minuta | 4 znači još 4 minuta | Ljubičasta, najkraća, romb |
| Sekunde | Oznaka 1 = 10 sekundi, 5 = 50 | Crvena, duga i veoma tanka |

Četiri cifarske kazaljke pokazuju tačne cifre i skaču za jednu oznaku kada se
cifra promeni; nema interpolacije između cifara. Sekundna kazaljka ide glatko
oko celog kruga za 100 novih sekundi, odnosno 8,64 sadašnje sekunde.

Dugme „Primer 57:24“ zamrzava primer na 57 sati, 24 minuta i 12 novih sekundi;
četiri glavne kazaljke pokazuju 5, 7, 2 i 4. „Uživo“ vraća trenutno vreme.
Klik na legendu ističe kazaljku i prigušuje ostale; ponovni klik vraća sve.
Sekundna može da se sakrije. Digitalni pomoćni zapis je podrazumevano zatvoren.

Stranica koristi isti izbor zone iz pregledača i sinhronizaciju sa serverom.
Na otvaranju koristi vreme uređaja, pa uzima najbolji od tri uzorka servera.
Usklađivanje se ponavlja na 60 sekundi; izvor/greška je označen na stranici.
Primer je zamrznut nezavisno od te sinhronizacije. Nijedan sat ne broji od nule
pri pokretanju kontejnera. Postojeća pravila kalendara se ne menjaju.

Provere: pozicije svih kazaljki za 57:24:12, decimalni prenosi, prelaz preko
ponoći, period sekundne kazaljke i HTTP putanje. SVG i HTML generisani su iz
geometrije; vizuelno renderovanje u pregledaču i Docker nisu provereni ovde.


## v1.6 — druga analogna stranica, sa tri kazaljke

Nova putanja je `/analog-3`. Postojeća `/analog` sa pet kazaljki ostaje dostupna.
Izgled, izbor zone, sinhronizacija, digitalna pomoć, primer 57:24:12, legenda,
isticanje kazaljke i skrivanje sekundne rade kao na prethodnoj stranici.

U novoj varijanti uklonjene su plava (jedinice sati) i ljubičasta (jedinice
minuta). Preostale kazaljke prikazuju celu vrednost, uključujući jedinice:

- Zelena: sati od 0 do 100, pun krug za jedan dan (24 sadašnja sata).
- Zlatna: minuti od 0 do 100, pun krug za jedan novi sat (14 min 24 s).
- Crvena: sekunde od 0 do 100, pun krug za jedan novi minut (8,64 s).

Svaka glavna oznaka znači deset jedinica; male crtice označavaju pojedinačne
jedinice. Kod 57:24:12 satna je malo posle 57. podele, minutna malo posle 24,
a sekundna na 12. Sve se kreću glatko: satnu pomeraju i minuti/sekunde, a
minutnu i sekunde. Tako uklanjanje dve kazaljke ne gubi informaciju.

Testovi proveravaju tri ugla za primer, pune krugove, glatko kretanje, prenos
jedinica i ponoć, plus postojeći sat sa pet kazaljki i HTTP putanje. Postojeći
analogni modul i njegove stilske definicije ostali su identični v1.5.
Vizuelni pregled u pregledaču i Docker izvršavanje nisu dostupni ovde.


## v1.7 — Help i objašnjenja

Nova stranica `/help`, sa linkom na svim ekranima. Sadrži 17 celina:
mapu stranica, nastanak projekta, decimalne jedinice, pravila meseci, neprekidnu
nedelju, vremenske zone, istorijsko datiranje, JDN, zvezdani datum, oba analogna
prikaza, sinhronizaciju, preciznost, tehnologije, konkretne fajlove/funkcije,
pokretanje i backup, FAQ i astronomske izvore.

Dugme „Izmeri tri uzorka“ prikazuje najmanji RTT, polovinu RTT-a kao grubu
procenu, razliku server–uređaj i serverovu UTC oznaku. To nije NTP dijagnostika
niti merenje odstupanja prema astronomskom vremenu. Ne podešava server ili
ostale satove. Dugme za štampu otvara standardni dijalog pregledača; čuvanje u
PDF zavisi od mogućnosti pregledača.

Help radi kao obična HTML stranica i bez JavaScript-a; skripta je potrebna za
štampanje preko dugmeta i dijagnostiku. Nema novih spoljnih biblioteka. Logika
prethodnih satova, kalendara i istorijskog kalkulatora ostaje nepromenjena.
