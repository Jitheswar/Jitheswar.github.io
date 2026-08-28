---
title: Liquid Glass
claim: >-
  An Omarchy theme that takes its palette from your wallpaper's hue and pins
  everything else, so the desktop stays legible no matter what you point it
  at.
headlineMetric: 15 stars, 3 forks on GitHub
problem: |
  Omarchy ships with a set of fixed-palette themes, and switching wallpaper
  does nothing to the theme around it.
  A wallpaper and a theme picked separately drift out of sync the moment
  either one changes, and most people change wallpaper far more often than
  they change theme.
  The desktop ends up looking assembled rather than designed.
constraint: |
  Whatever gets derived from the wallpaper has to stay legible on every
  wallpaper someone might actually set, including flat colours,
  near-monochrome photos, and very dark or very bright images.
  It also has to run without asking the user to tune anything per wallpaper,
  since a theme nobody wants to configure is a theme nobody uses.
decision: |
  Liquid Glass samples only the wallpaper's dominant hue.
  Saturation and lightness for every surface are pinned in code and never
  move.
  One wallpaper in, one hue out, and the rest of the palette is invariant
  regardless of what that wallpaper is.
  This is the same mechanism this site's own Set-Piece uses to derive its
  palette from a Source image, which is why the site is an instance of this
  theme's idea rather than a container describing it.
rejectedAlternative: |
  The first version derived the whole palette, hue, saturation, and
  lightness together, from the wallpaper.
  It looked right on the wallpaper it was built against and produced a flat,
  low-contrast theme on several others, with no way to tell in advance which
  wallpapers would fail.
  Pinning saturation and lightness and sampling hue alone removed the two
  dimensions responsible for that failure while keeping the one dimension
  actually worth changing.
honestLimits: |
  The theme samples the wallpaper once, at apply time, rather than watching
  for wallpaper changes, so a new wallpaper means reapplying the theme
  rather than an automatic recolour.
  There is no automated test suite behind the palette logic; the invariants
  were checked by hand against a handful of wallpapers, not proven for
  every hue.
  It has only been run against Omarchy's own Hyprland and GTK4 stack, not
  against other Wayland compositors.
  Fifteen stars and three forks is real interest from strangers who don't
  know me, and it is the only third-party validation in this portfolio, but
  it is not validation at scale.
sourceUrl: https://github.com/Jitheswar/omarchy-liquid-glass-theme
tags:
  - Hyprland
  - Omarchy
  - Bash
  - Wayland
order: 1
---
