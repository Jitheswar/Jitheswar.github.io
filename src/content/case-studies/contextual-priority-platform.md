---
title: Contextual Priority Platform
claim: >-
  A container-CVE queue that re-ranks vulnerabilities by whether the workload
  running them is reachable and behaving abnormally right now, instead of by
  static CVSS severity alone.
headlineMetric: Detected a simulated compromise in 33 seconds, zero false positives across a 20-minute quiet baseline
problem: |
  A container image scanner pointed at a realistic Kubernetes cluster returns
  well over a thousand vulnerabilities, and every one of them carries a
  severity rating that reads identically wherever that CVE appears, on every
  image, in every cluster, on every day.
  A critical CVE in a container nothing can reach is noise.
  A medium CVE in a container that is reachable from outside and is, right
  now, burning CPU and opening outbound connections it has never opened
  before is the thing to look at first.
  Severity alone cannot tell those two cases apart, because severity does
  not know either workload exists.
  The evidence that would distinguish them is already sitting in the
  cluster's own telemetry; it is simply never joined to the vulnerability
  data.
constraint: |
  Telling a genuine compromise from an ordinary burst of load has to happen
  fast, on minutes of a workload's own telemetry history rather than the
  hours a demonstration cluster cannot be left running long enough to
  accumulate.
  Both failure directions cost something visible: miss a real compromise
  and the queue never reacts to it, but flag every ordinary CPU spike and
  an operator learns to ignore the badge, which quietly disables the
  platform's one mechanism for re-prioritising anything.
  A busy database and a compromised one can look identical on CPU alone, so
  whatever judges "abnormal" has to learn what is normal for that specific
  workload, not for workloads in general.
decision: |
  Anomaly detection runs an Isolation Forest over windowed multivariate
  features per pod - CPU, network transmit rate, receive rate, and their
  ratio together - with a z-score baseline covering the cold start before
  enough windows exist.
  Replicas of one deployment train one shared baseline, aggregated by
  maximum rather than mean, so a compromise on one replica of several is
  never diluted below threshold by the healthy ones, and a workload's
  baseline stops refitting once its exposure signal is active, so a
  sustained compromise cannot quietly become the new normal.
  Against the seeded cluster's internet-facing nginx workload and a
  scripted compromise that burns CPU on throwaway hashing and beacons to
  public DNS resolvers at a fixed interval, the detector raised a signal in
  33.4 seconds against a 360-second bound, with zero false positives across
  40 observations over a 20-minute quiet baseline.

  A signal immediately re-triages only that workload's vulnerabilities.
  Each keeps a deterministic base score from severity, EPSS, CISA KEV
  membership, and fix availability, and a language model may adjust that
  score by roughly plus or minus 25 on a 0-100 scale while writing the
  rationale a human reads - bounded so the queue stays reproducible and an
  operator can toggle the model's contribution off to see exactly what it
  changed.
rejectedAlternative: |
  An autoencoder or an LSTM sequence model was the first instinct for
  behavioural anomaly detection, and both were rejected in design: both
  need hours of clean multivariate history to reliably beat a shallow
  method, and this cluster has minutes before a demonstration needs to run.
  A fixed threshold on CPU alone was rejected in the other direction:
  cheaper still, but it fires on any CPU-heavy workload whether or not
  anything is wrong, since a batch job and a compromise can burn the same
  cycles.
  Scoring CPU, network transmit, receive, and their ratio together instead
  only raises a signal when CPU rises alongside a shift in traffic pattern
  - the shape an actual compromise takes, and one a single-metric threshold
  cannot see.
honestLimits: |
  This was built solo as an academic team submission: the repository's
  README lists a team of three for a university course requirement, but
  every one of its 19 commits carries my name, checkable against the
  repository's own history rather than asserted.
  Reachability is a coarse proxy, not a network-policy analysis: a workload
  counts as externally reachable only if its Service is LoadBalancer or
  NodePort, or an Ingress routes to it; actual traffic, firewalls, and
  NetworkPolicy resources are never checked.
  EPSS and the CISA KEV catalog are point-in-time snapshots downloaded once
  into the repository, not live feeds queried at request time, so a CVE
  added to KEV since that snapshot will not be reflected until someone
  manually refreshes the file.
  The compromise the detector was measured against has a fixed CPU load
  and beacon interval, built to be reproducible for this demonstration
  rather than sampled from a real intrusion, so the 33-second latency
  describes this scenario's signature, not compromises in general.
sourceUrl: https://github.com/Jitheswar/KLH-CSE-2026-27-2420030078-AIDevOps
tags:
  - Python
  - Kubernetes
  - FastAPI
  - Prometheus
order: 4
---
