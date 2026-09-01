# Bed-Stuy Live

A live dashboard for Brooklyn weather and the six transit departures that matter around
Nostrand Ave: the Manhattan-bound **A**, the Queens-bound **G**, the **B44**, the **B44 SBS**,
and the **B26** in both directions.

No API keys required — every upstream feed is public.

```bash
npm install
npm run dev      # http://localhost:3000
```

## What it shows

**Weather** (Open-Meteo) — current temperature and conditions, feels-like, today's high and
low, humidity, wind, sunrise/sunset. Chance of rain is grouped into windows ("2 AM – 4 AM,
33% chance") with an 18-hour probability strip underneath.

**Departures** (MTA GTFS-Realtime) — the next three departures per board, each with minutes
away, clock time, where that run terminates, and how far off schedule it is. Every board
carries a status pill:

| Pill | Meaning |
| --- | --- |
| On time | Next vehicle is running to schedule |
| Delayed | Next vehicle is 5+ min behind, or an active MTA delay alert covers the route |
| Not running | Nothing predicted and an active suspension alert covers the route |
| None predicted | Nothing predicted in the next 45 minutes |
| No data | The upstream feed could not be reached |

Status always describes the **next** departure, so a late third bus does not flag a board
whose next bus is on time. Individual runs still show their own "6 min late" / "2 min early"
note. Active suspension and delay alerts are printed under the affected board.

The page polls transit every 20 seconds and weather every 10 minutes, refreshes on tab focus,
and pauses entirely while the tab is hidden.

## Data sources

| Feed | Endpoint |
| --- | --- |
| A/C/E subway | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace` |
| G subway | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-g` |
| All NYC buses | `gtfsrt.prod.obanyc.com/tripUpdates` |
| Subway alerts | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json` |
| Bus alerts | `api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fbus-alerts.json` |
| Weather | `api.open-meteo.com/v1/forecast` |

The bus feed is a single ~1.6 MB protobuf covering every bus in the city, so `lib/feeds.ts`
puts a 15-second TTL cache with in-flight de-duplication in front of it. One download serves
every board and every open tab.

## Changing stops

All location config lives in `lib/config.ts` — coordinates, stop IDs, and direction labels.

Stop IDs come from the MTA static GTFS bundles. Bus stop IDs are direction-specific (Bedford
Ave is one-way northbound; each side of Halsey St has its own ID), so the stop alone pins the
direction and the feed's `direction_id` is never used.

Current stops:

| Board | Stop ID | Stop |
| --- | --- | --- |
| A, Manhattan bound | `A46N` | Nostrand Av |
| G, Queens bound | `G33N` | Bedford-Nostrand Avs |
| B44, toward Flushing Av | `303411` | Bedford Av / Fulton St |
| B44 SBS, toward Williamsburg Br Plaza | `303411` | Bedford Av / Fulton St |
| B26, toward Downtown Brooklyn | `307928` | Halsey St / Nostrand Av |
| B26, toward Ridgewood | `302464` | Halsey St / Nostrand Av |

`data/*-stops.json` maps stop IDs to names so a trip's terminal can be labelled. Regenerate it
after an MTA schedule change:

```bash
node scripts/build-stop-names.mjs
```

## Layout

```
app/api/transit  Merges both subway feeds, the bus feed, and both alert feeds into boards
app/api/weather  Open-Meteo passthrough, including rain-window grouping
lib/config.ts    Location, feed URLs, stop IDs, thresholds
lib/transit.ts   Departure extraction and status logic
lib/feeds.ts     Cached fetch + protobuf decoding
```
