# Version 1.1 validation record

Status: local release candidate. Publication is held pending clarification of the hackathon submission deadline, because the provided rules prohibit changes to the submitted repository and deployed application after that deadline. Public GitHub main and public deployments were not updated in this work session. The previous public version remains available.

## Completed

- 21 Node regression tests pass, including bounded gate, anchor choice, time-gap rejection and directional transfer.
- All 120 fixed network scenarios reproduce, including losses. Evidence verifier checks the video SHA-256 and unique event/reference matches.
- Actual browser WebGPU inference on A 40:16/17 strict matches,0 additional events,1 miss;7/7 certain labels. Main evaluation 245 frames in 14.55 seconds on AppleM 5/16 GiB. The source JSON is authoritative for full precision.
- User file chooser route tested with the licensed day clip. Sample identity is null, SHA-256 recorded.4 crossings, with 1 downward. Counts and class predictions for that clip are not ground truth.
- Night stress clip:120 frames,1 detected crossing; no accuracy benchmark. Automatic scene diagnostic measured mean weighted luminance 0.0967 and 100%dark sampled frames, and displayed a manual-review warning. Visible road traffic is not reliably counted in these conditions.
- Measurement transfer, three-mode simulation, lower/central/upper-rate sensitivity and JSON display/export flows tested in-browser.
- Browser quality page recomputed all 120 scenarios in a worker in 1.62 seconds on the development device. This is a single runtime observation, not a performance guarantee.
- Mobile layout checked at 390×844: body width 390 px, no document horizontal overflow. Actual phone inference performance remains untested.
-8 editable slides rendered and visually inspected. Package and layout validation pass. Native PowerPoint execution not tested.
-38.25 second silent backup video consists of actual local UI captures. It shows model detections, live count, transfer, comparison and evidence. Capture intervals are preserved except idle gaps over 3 seconds shortened to 3 seconds. The recording run was slower (28.8 seconds) because screenshot capture competed for resources. No output was fabricated.

## Material limits

A single daylight clip with partly uncertain external labels does not validate other roads, night/rain/local vehicles or class accuracy. The simulator is a fluid queue laboratory, not a calibrated city digital twin. No real controllers, paid pilots, customer interviews or proven customer ROI. No guaranteed jury score. Proposed acceptance targets and costs in PILOT_PLAN.md are hypotheses.

## Reproduce

python3 server.py
npm test
npm run verify:evidence
npm run benchmark
npm run evaluate:cv

For fresh neural inference, use Video analytics and export a new measurement. `evaluate:cv` scores saved measured events and does not rerun the detector. Browser built-in samples and arbitrary local files share the same inference path. Model loading is excluded from the measured video-processing time.
