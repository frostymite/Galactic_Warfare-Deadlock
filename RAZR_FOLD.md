# Deadlock v9 — Motorola Razr Fold Layout

Targets the Razr Fold's narrow cover display and nearly square 8.1-inch inner display.

Automatic modes:
- PHONE: bottom navigation, single-column touch layout.
- UNFOLDED: side rail, crease-safe two-pane Story/Combat layouts.
- FLEX: reduced-height laptop/half-fold layout.

The app listens to resize, orientationchange, and VisualViewport resize, so folding/unfolding updates the interface without reloading.

The center crease-safe gutter defaults to 22 CSS pixels and is adjustable in Settings from 12–48 px.
