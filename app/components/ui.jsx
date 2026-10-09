// Shared presentational primitives for the Optixelra admin UI.
//
// These exist so the five feature pages cannot drift apart. The build this was
// rebuilt from repeated its page-header markup, its stat blocks and its
// progress bars inline in every route, which is how it ended up with four
// different stat treatments (a 4-card grid on one page, `heading2xl` blocks on
// another, a hairline grid on a third) all claiming to be the same thing.
//
// Everything here is markup + class names only. The classes live in
// app/styles/optixelra.css; no colours or sizes are declared in this file.
// That stylesheet's header documents the three rules of the design language —
// no drop shadows, fully rounded geometry, nothing inverted — and the markup
// below assumes them. Two places where the markup is shaped by those rules
// rather than by the data are called out in comments: `Tag` emits no border
// element, and `EmptyState` carries a glyph that the previous build did not
// need because it relied on a shadowed card to frame the message instead.

/* -------------------------------------------------------------------------- */
/*  CommandBar — the page header                                              */
/* -------------------------------------------------------------------------- */

// A tinted emerald header band. The app name is an outlined pill rather than a
// solid chip: this header sits on a tint, not on ink, so an outline reads
// cleanly where a fill would shout, and it keeps the page title the largest
// thing on the row.
export function CommandBar({ title, subtitle, eyebrow = "Optixelra", children }) {
  return (
    <div className="ox-bar">
      <div className="ox-bar-main">
        <span className="ox-bar-eyebrow">{eyebrow}</span>
        <h2 className="ox-bar-title">{title}</h2>
        {subtitle && <p className="ox-bar-sub">{subtitle}</p>}
      </div>
      {children && <div className="ox-bar-aside">{children}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  KpiStrip — a responsive grid of soft stone figure tiles                   */
/* -------------------------------------------------------------------------- */

// `items` is [{ label, value, note?, tone?, tag? }].
//   tone: 'ok' | 'bad'          — colours the figure
//   tag:  a Tag tone, or `true` — renders the value as a tag instead of a
//                                 figure, for word values like "Growth" or
//                                 "On" that read as a broken headline at figure
//                                 size. `true` means "tag it, no tone".
//
// The emerald bullet before each label is drawn by the stylesheet, not emitted
// here — it is decoration, and as a real element it would be announced as
// stray content by a screen reader.
export function KpiStrip({ items }) {
  return (
    <div className="ox-kpi">
      {items.map((item) => (
        <div className="ox-kpi-cell" key={item.label}>
          <p className="ox-kpi-label">{item.label}</p>
          {item.tag ? (
            <div className="ox-kpi-tagline">
              <Tag tone={item.tag === true ? undefined : item.tag}>{item.value}</Tag>
            </div>
          ) : (
            <p
              className={
                item.tone ? `ox-kpi-value ox-kpi-value--${item.tone}` : "ox-kpi-value"
              }
              title={String(item.value)}
            >
              {item.value}
            </p>
          )}
          {item.note && <p className="ox-kpi-note">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Segmented — replaces the filter/sort <Select> dropdowns                   */
/* -------------------------------------------------------------------------- */

// `options` is [{ label, value, count? }]. A real button group rather than a
// radio-styled select: the counts are visible without opening anything, which
// is the whole point of showing them. The active segment is an outlined white
// pill on the stone track (`aria-pressed` drives it), so the selection survives
// a glance without needing a solid fill.
export function Segmented({ label, options, value, onChange, disabled = false }) {
  const group = (
    <div className="ox-seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ox-seg-btn"
          aria-pressed={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {typeof option.count === "number" && (
            <span className="ox-seg-count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );

  if (!label) return group;
  return (
    <div className="ox-field">
      <span className="ox-field-label">{label}</span>
      {group}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Panel — a white card on the page wash, with a plain header                */
/* -------------------------------------------------------------------------- */

// The header emits no accent glyph before the title. A white panel on a stone
// page wash is already a distinct surface, and tinting the header as well put
// three greens on one screen — see the stylesheet's note on this block.
export function Panel({ title, note, actions, children, footer, padded = false }) {
  return (
    <section className="ox-panel">
      {(title || actions) && (
        <header className="ox-panel-head">
          <div>
            {title && <h3 className="ox-panel-title">{title}</h3>}
            {note && <p className="ox-panel-note">{note}</p>}
          </div>
          {actions}
        </header>
      )}
      {padded ? <div className="ox-panel-body">{children}</div> : children}
      {footer && <div className="ox-panel-foot">{footer}</div>}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Meter — a fully rounded inline bar                                        */
/* -------------------------------------------------------------------------- */

// Polaris's ProgressBar carries its own block margins and minimum height, which
// is fine in a card and wrong in a 36px-tall table row.
export function Meter({ value, tone, showValue = true, label }) {
  const pct = Math.max(0, Math.min(100, Math.round(value || 0)));
  return (
    <div className="ox-meter">
      <div
        className="ox-meter-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <span
          className={tone ? `ox-meter-fill ox-meter-fill--${tone}` : "ox-meter-fill"}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showValue && <span className="ox-meter-value">{`${pct}%`}</span>}
    </div>
  );
}

// Score → meter tone. Shared so a product at 85% is never green in one place
// and amber in another.
export function scoreTone(score) {
  if (score >= 80) return "ok";
  if (score >= 50) return "warn";
  return "bad";
}

/* -------------------------------------------------------------------------- */
/*  Tag / Dot — borderless pill status markers                                */
/* -------------------------------------------------------------------------- */

// Borderless by design: the tint alone carries the tone. A row of four outlined
// tags reads as a row of four buttons, which is what the bordered pills in the
// previous build did on the dashboard.
//
// Note the tone vocabulary here does NOT use the brand colour for 'ok'. The
// accent is emerald, so success is lime — read the palette notes at the top of
// the stylesheet before adding a tone.
export function Tag({ tone, children, dot = false }) {
  return (
    <span className={tone ? `ox-tag ox-tag--${tone}` : "ox-tag"}>
      {dot && <Dot tone={tone} />}
      {children}
    </span>
  );
}

export function Dot({ tone, className }) {
  const cls = ["ox-dot", tone ? `ox-dot--${tone}` : "", className || ""]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} aria-hidden="true" />;
}

/* -------------------------------------------------------------------------- */
/*  Table scaffolding                                                         */
/* -------------------------------------------------------------------------- */

// `variant` picks the column template class (products | alt | pages | formats |
// vitals), which is declared once in the stylesheet so the header row and the
// body rows can never disagree about the column count. The head is a stone
// wash, not a reversed ink band, so the table reads as a continuation of the
// figure tiles above it rather than as a separate widget.
export function Table({ variant, children }) {
  return <div className={`ox-table ox-table--${variant}`}>{children}</div>;
}

export function Thead({ columns }) {
  return (
    <div className="ox-tr ox-thead">
      {columns.map((col) => (
        <div
          key={col.key || col.label}
          className={["ox-th", col.className, col.align === "right" ? "ox-td--num" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          {col.label}
        </div>
      ))}
    </div>
  );
}

export function Row({ selected, active, children }) {
  const cls = [
    "ox-tr",
    "ox-tbody-row",
    selected ? "ox-tbody-row--selected" : "",
    active ? "ox-tbody-row--active" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return <div className={cls}>{children}</div>;
}

// The glyph is a decorative emerald ring — the circle is the one shape reserved
// in this system for "nothing here yet" and the launchpad monogram. It replaces
// the framing the previous build got for free from a shadowed card: with
// shadows gone, a bare centred paragraph in a white panel had nothing to
// anchor it.
export function EmptyState({ title, children }) {
  return (
    <div className="ox-empty">
      <span className="ox-empty-glyph" aria-hidden="true" />
      <p className="ox-empty-title">{title}</p>
      {children && <p className="ox-empty-body">{children}</p>}
    </div>
  );
}

// Skeleton rows that keep the table's shape while the catalog request is in
// flight, instead of collapsing the page to a single centred spinner. The
// widths are staggered by row AND column rather than being fixed per column,
// so the placeholder reads as uneven real content instead of as a rigid grid.
export function SkeletonRows({ variant, columns, rows = 6 }) {
  const widths = ["100%", "88%", "72%", "94%", "66%", "82%"];
  return (
    <Table variant={variant}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div className="ox-tr ox-tbody-row" key={rowIndex}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <div
              className="ox-skel"
              key={colIndex}
              style={{ width: widths[(rowIndex + colIndex) % widths.length] }}
            />
          ))}
        </div>
      ))}
    </Table>
  );
}

/* -------------------------------------------------------------------------- */
/*  ActionBar — sticky floating bulk-action footer                            */
/* -------------------------------------------------------------------------- */

// A white pill with an emerald rule, floating over the table. It has no shadow
// to lift it off the content it overlaps, so the stylesheet keeps its fill
// fully opaque and its border the accent colour — do not make this translucent.
export function ActionBar({ text, note, children }) {
  return (
    <div className="ox-actionbar">
      <div>
        <p className="ox-actionbar-text">{text}</p>
        {note && <p className="ox-actionbar-note">{note}</p>}
      </div>
      <div className="ox-actionbar-actions">{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Formatters                                                                */
/* -------------------------------------------------------------------------- */

// Megabytes → the largest sensible unit. Defined once and imported, rather than
// redeclared in four routes with three different rounding rules (the old build
// had one that rendered "0 KB" and one that rendered "NaN KB" for the same
// input).
export function formatBytes(mb) {
  const v = Number(mb) || 0;
  if (v >= 1000) return `${(v / 1000).toFixed(1)} GB`;
  if (v >= 1) return `${v.toFixed(1)} MB`;
  if (v > 0) return `${Math.max(1, Math.round(v * 1024))} KB`;
  return "0 KB";
}

export function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}
