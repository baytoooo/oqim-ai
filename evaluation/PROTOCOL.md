# OQIM validation, version 1.1

Protocol fixed before the first OQIM inference on the A40 clip. No training, threshold tuning, or label adjustment on this clip. External labels are copied unchanged from Safdar Hussain / TrafficLens, MIT, commit f0eaf0181c1d25e2c05ef95ae7f3cc312e3e1150. Preserve their limitations and attribution.

## Video

Kathinka Engels / Sounds of Changes, Motorway A40, CC BY 3.0, https://commons.wikimedia.org/wiki/File:Motorway_A40_-_on_bridge_above_the_traffic.webm . Original SHA-256 f4c7c1d826a166b78353386ecdc10ed2090255eaca832c083a64f8ea633257dc. Transcode: first 24.5 seconds, 960×540, H.264 CRF25, no audio, no temporal speed change. Served SHA-256 15becae21a01e218563886b0277d9907f87913a3967d99ba1eaaa1b34fd2f7f1.

YOLO26s, default confidence 0.30, 10 Hz, ByteTrack. Bottom-centre anchor, horizontal gate y=.80, x=.06–.46. Hysteresis 1% height, crossing timestamp interpolated between stable sides. Downward events only. No parameter selected using this clip's output.

Report total-count error and event matching, class agnostic. The reference contains 17 events, 7 certain and 10 probable. Do not call it a large or conclusive benchmark. Do not treat predictions near probable labels as false positives when interpreting certain-only recall. Publish recall for certain events separately, without a spurious certain-only precision.

Primary event scoring uses the reference interval [-1,+4] frames at 30 Hz, greedy nearest-first, plus maximum matching count. Publish signed timing errors. A separate ±0.5 s diagnostic measures coarse event association under 10 Hz sampling and re-encoding; it must never be substituted for the strict score or compared to TrafficLens's published scores. The original reference was labelled on the original 1280px video. Results on this transcoded clip are OQIM's own test, not reproduction of TrafficLens's detector benchmark.

One daylight scene, small sample, partly uncertain labels, camera motion and near-field traffic: no claim about night, rain, local vehicles, class accuracy, mAP, IDF1, real-road signal improvement or mobile hardware performance. Existing day/night samples remain smoke tests without ground truth. Retain every failure.

## Network

Fixed 120-case Cartesian grid: main rates 300/650/1200/1800 vehicles/h; side120/360; steady/surge/planned blockage; seeds11/23/42/71/101. Four nodes, 600seconds. Same generated inputs for all modes. Do not filter losses. Report pairwise reduction means, medians, extrema, wins/losses, conservation error. Blockage schedule is explicitly known to the scenario model. Future random arrivals are not visible to control.

## Deployment boundary

This product recommends experiments in a simulator. It cannot control live traffic lights. A road operator must separately calibrate and approve any real deployment.
