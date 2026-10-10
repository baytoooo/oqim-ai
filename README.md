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

Fixed: 25 s main green. Reactive: green allocation proportional to observed queues. OQIM: each minute uses past 60 s arrivals, rolls out 90 s across the network, and tests ±5 s changes to each node's main green with a network delay objective. Predicted candidate changes and actual changes respect each node's cycle boundary. Future demand events are not given to the controller. Main green 15–39 s; cycle 60 s; side green 50 minus main green; each change has 3 s yellow and 2 s clearance. Offsets are supplied by configuration, not automatically optimised. There is no explicit pedestrian phase or emergency-vehicle integration.

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

13 automated checks pass. `cv-smoke-results.json` records real browser inference on both licensed clips: 120 frames per 12-second clip. Day took 10.71 s (42.64 ms mean inference), night 9.16 s (39.65 ms). These are measured on this development machine, not universal speed promises. The detected crossing counts are not manually validated ground truth. Occlusion, clipping and fragmentation remain limitations; do not present these as accuracy or real-city results.

Public demo: https://oqim-ai-network-lab.bayt.chatgpt.site
Public source: https://github.com/baytoooo/oqim-ai
