UI Brand Patch
---------------
This patch updates the core Button and Input components to use your white-label CSS variables.

Files added/updated:
- client/src/components/ui/button.tsx
- client/src/components/ui/input.tsx

Features:
- Buttons:
  - Supports variants: default, secondary, accent, outline, ghost
  - Uses var(--brand-primary), var(--brand-secondary), var(--brand-accent)
  - Radius uses var(--brand-radius)
  - Focus ring uses brand-primary
- Inputs:
  - Rounded corners use var(--brand-radius)
  - Focus ring uses brand-primary

Install:
1. Overwrite your existing ui/button.tsx and ui/input.tsx with these files.
2. Restart dev server if necessary.
3. All buttons and inputs will now theme according to your White Label settings.
