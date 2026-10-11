# OQIM AI

Startup prototype: local video inference → measured vehicle flow → network simulation → signal recommendations → reproducible comparison.

## Run

Node.js 22+ for tests, Python 3 for the static server. No npm install or cloud AI key is needed.

```sh
npm test
python3 server.py
```
Open http://127.0.0.1:8872. Any static HTTPS host can serve `dist/`. All inference and simulation run in the visitor's browser. This version has no server inference, no REST service, and no central account database.

## Jury demo

1. Open the app and run the same scenario in three modes. Change seed, number of nodes, demand, blockage or parking outflow; export JSON.
2. Open Video analytics, load the AI model, choose an authorised stationary-camera clip (MP4 H.264 or browser-compatible WebM).
3. Place the counting line across the traffic. Run analysis. Video-time sampling is 10 Hz regardless of inference speed; wall-clock FPS and inference time are measured.
4. Check crossings manually on the same analysed interval and enter the reference count. This measures count error, not detector mAP.
5. Transfer the measured rate to J1 and recalculate the network. Only the rate is measured; Poisson arrivals, side demand, geometry and other nodes remain explicitly simulated.
6. Download measurements and the experiment report. Data stays local, model assets are served with the app.

## Model and algorithm

Default YOLO26s ONNX (PariVision/Ultralytics, AGPL-3.0), or optional COCO-SSD lite_mobilenet_v2, detects car/bus/truck/motorcycle. YOLO uses ONNX Runtime 1.30.0 WebGPU with single-thread WASM CPU fallback. COCO-SSD uses TensorFlow.js WebGL or CPU. The ByteTrack browser port comes from PariVision (see THIRD_PARTY.md). OQIM adds line-crossing accounting and network integration. No face, identity or number-plate recognition.

The road model is a deterministic 1-second fluid queue simulation (fractional vehicles). Nodes are configurable (1–24 via JSON; 2–12 using the slider), each with a finite incoming road, travel-time cohorts, a main movement and a side movement. A main movement routes a fraction to one next node and the rest exits. Side vehicles exit after service. Converging links and cycles are supported. This is not a full multi-lane microscopic traffic simulator or a map of Tashkent.

External queues count in delay and remaining demand. Every comparison receives exactly the same arrival array. Storage is reserved before simultaneous transfers; generated vehicles equal completed plus all remaining queues and travel cohorts.

Fixed: 25 s main green. Reactive: green allocation proportional to observed queues. OQIM: each minute uses past 60 s arrivals, rolls out 90 s across the network, and tests ±5 s changes to each node's main green with a network delay objective. Predicted candidate changes and actual changes respect each node's cycle boundary. Future random arrivals are not given to the controller. The scenario blockage schedule is known to the model. Main green 15–39 s; cycle 60 s; side green 50 minus main green; each change has 3 s yellow and 2 s clearance. Offsets are supplied by configuration, not automatically optimised. There is no explicit pedestrian phase or emergency-vehicle integration.

The parking scenario adds a declared outflow at the final node at 360–420 s and reduces approach throughput. A separate video module measures user-defined parking rectangles by tracked vehicle centres. Occupancy is not automatically equated with parking outflow. Blockage reduces middle-node saturation at 240–420 s. These are scenario assumptions, not detected facts.

## Metrics

- delay: integrated stopped/waiting vehicles across all queues, vehicle-seconds.
- meanDelay: delay divided by all generated demand, not only completed trips.
- maxQueue: largest node total (main + side + external queue) during the run.
- completed / remaining: fractional vehicle equivalents.
- overload: seconds with any main link at ≥90% capacity or any external backlog.
- conservationError: absolute generated minus accounted vehicles.

The finite horizon can leave unfinished trips; both completions and remaining demand are reported. An OQIM result can be worse than fixed or reactive and is not hidden. Real-city effectiveness, night/rain accuracy and local-vehicle accuracy have not been established.

## Persistence and API

Last ten reports are saved in localStorage. No video is stored. Clearing history only affects this browser. Download full JSON for reproducibility. The history version omits arrival arrays; parameters and seed regenerate them. ES module API is documented in `dist/api.html`.

## Cost and commercial hypothesis

Inference runs on visitor hardware and has no billed cloud inference API. Equipment, electricity, hosting, bandwidth, integration and support still have costs. The UI includes an editable per-object model: $1,000 setup, $300 monthly subscription, $120 direct monthly costs, $600 assumed customer benefit. These are unvalidated hypotheses, not prices or measured ROI. They imply $180 contribution before common expenses and 3.33 months customer payback after subscription. City contracts need their own economics.

## Sources, provenance and licences

See THIRD_PARTY.md and LICENSE (AGPL-3.0). Synthetic demand is generated by the included seeded PRNG and Poisson method. No organiser footage is included. Two openly licensed road clips with attribution are included for testing (see THIRD_PARTY.md). The user must have rights to process an uploaded video. This prototype was developed with Codex assistance; PariVision's tracker is pre-existing open-source work, not work newly created for the final. Declare this explicitly under the competition rules.

## Remaining production work

Real multi-camera calibration and evaluation; calibrated speeds; full turn/lane topology; learned demand/context forecasts; coordinated offset optimisation; production parking-space calibration; validated incident rules; authenticated multi-user backend; controller integrations with authorised operators; deployment load testing; measured paid pilot. No claim is made that these are already implemented.

Conditional 5/10/15 minute forecasts are available from a selected simulation timestamp. They hold the latest plan and extrapolate the past 60-second mean arrivals. Confidence is not statistically calibrated. The optimisation lookahead itself is 90 seconds.

Parking occupancy and possible stationary vehicles: set rectangles before analysis. The latter uses 1.2% image displacement over 10 seconds and requires operator review; red-light waiting can trigger it. These image-space heuristics are not calibrated road speed or crash classifiers.

## Verification receipt

21 automated checks pass in version1.1. `cv-smoke-results.json` records real browser inference on both licensed clips: 120 frames per 12-second clip. Day took 10.71 s (42.64 ms mean inference), night 9.16 s (39.65 ms). These are measured on this development machine, not universal speed promises. These original day/night smoke-test counts are not ground truth. The separate v1.1 A40 evaluation below uses external labels. Occlusion, clipping and fragmentation remain limitations; do not present these as accuracy or real-city results.

Public demo: https://baytoooo.github.io/oqim-ai/
Sites mirror (deployment succeeded, but connection failed during our external check): https://oqim-ai-network-lab.bayt.chatgpt.site
Public source: https://github.com/baytoooo/oqim-ai


## Version1.1: reviewable evidence

`npm test` runs21 regression checks. `npm run benchmark` regenerates `dist/evidence/network-benchmark.json` from a fixed120-scenario Cartesian grid. OQIM mean delay reduction:24.55% against fixed (104wins,16losses),20.06% against reactive (118wins,2losses). Worst cases:28.56% more delay than fixed,11.56% more than reactive. No cases are removed. These are synthetic model results, not city savings. The browser quality tab also recomputes the full grid in a Web Worker on the judge's device.

`npm run evaluate:cv` scores `evaluation/motorway-measurement.json`, captured from real browser inference, against unmodified external labels. A40:16predicted crossings,17reference events,16strict temporal matches,0false positives,1miss; precision1.000,recall0.941,F1=0.970. All7certain labels match. Labels10/17are probable, only one daylight scene,960pxtranscode. Protocol frozen in commitc268abc before first inference. This does not establish general vehicle accuracy, mAP, IDF1, night/rain quality or performance on local vehicles. See evaluation/PROTOCOL.md, reference/LABELLING_RECORD.md and dist/evidence/cv-evaluation.json for signed errors and tolerances.

Measured on AppleM5,16GiBRAM,Chromium in Codex,WebGPU:245frames of24.5svideo in14.55 s; mean inference34.5ms. Decode, drawing and inference are included in total wall time. Model loading excluded. The first download is about46MB and can be slow; reload uses browser CacheStorage. No mobilehardware speed claim. Models are included for running the local server without a third-party inference service.

To reproduce from pixels: open Video analytics, select A40, load YOLO26s, keep confidence30%,10Hz,bottom-centre,gatey80%,x6–46%,analyse and export JSON. Select downward flow before transfer. A raw user upload follows the same pipeline and gets its own SHA-256; sample identity is not used by detection or counting. Saved reference counts are only in the evidence tab and never supplied to the model.

Directional transfer avoids mixing opposing traffic. The approximate95%Poisson score interval concerns sampling noise at a constant arrival rate; detector errors and nonstationarity are excluded. Shortwindows are clearly marked. Sensitivity runs use lower/central/upper rates as three separate scenarios, not a confidence interval of road improvement. Invalidated line/anchor/threshold settings clear old measurements. All samples use the same detector and tracker.

`PILOT_PLAN.md` contains a proposed2-weekpilot, acceptance targets, customerinterviewquestions and unit-economics assumptions. No customer interviews, paid pilots or savings are claimed. Entry price,subscription and expenses are hypotheses. Actual operational value cannot be replaced with simulated traffic percentages.

## v1.3 — Tashkent and slow network playback
- Open `/#city` for the real OpenStreetMap basemap of Tashkent with extruded buildings (MapLibre 5.6.0 / OpenFreeMap). Internet required for map tiles; heights may be estimated. No live city traffic or camera integration.
- The separate network simulation opens in an overview of all directed links. It uses one-second snapshots, source-tagged cohorts and travel-time progress; glyphs represent aggregate groups, not tracked individual vehicles.
- Playback defaults to 0.5×, supports 1× / 5×, pause, single-second steps and following the next downstream junction. Hidden tabs pause progression; the end stops instead of looping.
- Detailed snapshots do not alter simulation outcomes: a regression test compares all metrics and common snapshots with the original five-second sampling, including converging links.

## v1.4 — Nearby parking
Open `/#city`, choose a place or click its entrance, then select a 3/5/10 minute walking limit. Parking geometry comes from OSM; Valhalla calculates pedestrian travel times and paths. Private/customer/resident/permit/no-access tags are excluded. Unknown access conditions remain visible. Up to 24 closest candidates are checked; unverified or failed routes are not included.
`Demo: Webster full` sets explicitly simulated occupancy (nearest lot full, nearby Ilkhom lot five free). Normal mode starts with occupancy unknown. User-entered counts are local-only and expire after five minutes; missing/old/invalid counts never become available spaces. The driving link opens external navigation; the displayed blue route is walking from parking to destination. No live feed, booking, guaranteed space, or guaranteed travel time.
The user explicitly confirmed on 2026-10-11 that the organizers permit updates and requested publication.

### v1.5: camera projection, selected intersections and allocation
Each sampled video second has a paired original frame and one 3D instance per vehicle detection, including stationary detections. This is an illustrative projection, not calibrated metric reconstruction. Counts depend on detector recall. Select 2–24 Tashkent map points in travel order to simulate a geographic chain; road connectivity, travel times and phases remain scenario assumptions. Parking allocation compares nearest versus capacity-aware assignment for identical driver demand, with an explicit linear arrival-time forecast. CV occupancy of user-marked spaces can populate scenario A; it is a recorded observation, not a live feed. No shared reservations, live camera integrations or trained parking forecast are claimed.

Validation: 28 unit/integration tests and 120 reproducible traffic benchmark outcomes.

### v1.6: cars on the Tashkent map
MapLibre extrusion layers animate metre-sized cars along a Valhalla auto route, including routes through user-selected map points. Pause, 0.5×/1×/2× speed, count and follow-camera controls are available. This geographic animation is explicitly independent of the aggregate traffic controller simulation and camera detections. At route end cars respawn at the beginning. Cars closer than seven metres are suppressed; count is capped by available route length. The schematic network now spaces transit glyphs and keeps them outside the destination queue zone. 29 tests pass; the 120-scenario benchmark remains reproducible.

### v1.7: parking camera evidence
Two explicitly simulated camera diagrams show individually marked parking spaces. Changing occupancy recomputes demo availability and reranks walking-distance candidates. Parking cards link back to their camera source. A real uploaded video's last analyzed frame, rectangles and occupancy can be applied to either parking in demo mode; the assignment does not claim that the footage was recorded at that location or is current. Frames remain in browser memory. Live camera access is not configured. Resetting the parking demo resets its corresponding camera diagram. 30 tests pass.
