import { type State } from "vanjs-core";
import { cx } from "../util.js";
import { Svg, SvgPath } from "./svg.js";

/**
 * Icon — collection of SVG icons from vanuikit (Lucide style, 24×24, stroked
 * with `currentColor`). Replaces emojis: they get tinted by the theme and look
 * identical on every platform. Every icon in the catalog must come from here.
 */
export type IconName =
  | "sun"
  | "moon"
  | "monitor"
  | "chevron-left"
  | "chevron-right"
  | "x"
  | "check"
  | "menu"
  | "search"
  | "globe"
  | "credit-card"
  | "puzzle"
  | "key"
  | "log-out"
  | "info"
  | "alert-triangle"
  | "bell"
  | "question"
  | "check-circle"
  | "x-circle"
  | "trash"
  | "inbox"
  | "smartphone"
  | "rocket"
  | "navigation"
  | "user"
  | "settings"
  | "arrow-right";

const PATHS: Record<IconName, string[]> = {
  sun: [
    "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M12 2v2",
    "M12 20v2",
    "m4.93 4.93 1.41 1.41",
    "m17.66 17.66 1.41 1.41",
    "M2 12h2",
    "M20 12h2",
    "m6.34 17.66-1.41 1.41",
    "m19.07 4.93-1.41 1.41",
  ],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"],
  monitor: [
    "M20 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z",
    "M8 21h8",
    "M12 17v4",
  ],
  "chevron-left": ["M15 18l-6-6 6-6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  search: [
    "m21 21-4.34-4.34",
    "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  ],
  globe: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M2 12h20",
    "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z",
  ],
  "credit-card": [
    "M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8Z",
    "M2 12h20",
  ],
  puzzle: [
    "M10.5 2h3a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 1 10.5 2Z",
    "M19.5 13.5v-3a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-1A1.5 1.5 0 0 0 14 6h-3",
    "M19.5 13.5a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 0-1.5 1.5v1a1.5 1.5 0 0 1-1.5 1.5h-3",
    "M13.5 19.5h-3a1.5 1.5 0 0 1-1.5-1.5v-1a1.5 1.5 0 0 0-1.5-1.5h-1a1.5 1.5 0 0 1-1.5-1.5v-3",
    "M2 10.5v-3a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 0 1.5-1.5v-1A1.5 1.5 0 0 1 7.5 2h3",
    "M10.5 2H7.5",
  ],
  key: [
    "m21 2-2 2",
    "m19 4-2 2",
    "m17 6-2 2",
    "m15 8-2 2",
    "m13 10-1.61 1.61",
    "M7.5 15.5a5.5 5.5 0 1 1 7.778-7.778 5.5 5.5 0 0 1-7.777 7.777Z",
    "m6 18-1 1",
    "m7 17-1 1",
    "m9 19-2 2",
    "m11 21-1 1",
  ],
  "log-out": [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "m16 17 5-5-5-5",
    "M21 12H9",
  ],
  info: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M12 16v-4",
    "M12 8h.01",
  ],
  "alert-triangle": [
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z",
    "M12 9v4",
    "M12 17h.01",
  ],
  bell: [
    "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",
    "M10.3 21a1.94 1.94 0 0 0 3.4 0",
  ],
  question: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ],
  "check-circle": [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "m9 12 2 2 4-4",
  ],
  "x-circle": [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "m15 9-6 6",
    "m9 9 6 6",
  ],
  trash: [
    "M3 6h18",
    "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
    "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "M10 11v6",
    "M14 11v6",
  ],
  inbox: [
    "M22 12h-6l-2 3h-4l-2-3H2",
    "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z",
  ],
  smartphone: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z",
    "M9 18h6",
  ],
  rocket: [
    "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z",
    "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z",
    "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",
    "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
  ],
  navigation: ["M3 11 22 2l-9 19-2-8-8-2Z"],
  user: [
    "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",
    "M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  ],
  settings: [
    "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
};

export type IconProps = {
  name: IconName;
  /** Size classes (default size-4) and extras. */
  class?: string | (() => string) | State<string>;
};

/**
 * Icon — <svg> with a real namespace and currentColor stroke (tinted by the text).
 */
export function Icon(props: IconProps) {
  const userClass = () =>
    typeof props.class === "function"
      ? props.class()
      : typeof props.class === "object" && props.class !== null && "val" in props.class
        ? (props.class as State<string>).val
        : props.class;

  return Svg(
    {
      viewBox: "0 0 24 24",
      style:
        "fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round",
      class: () => {
        const uc = userClass() ?? "";
        // If the consumer already sets a size (size-/w-/h-), respect it and
        // don't layer the default `size-4` on top: both land on the same
        // <svg> and the result depends on cascade order (it ended up 16px
        // instead of the requested size, e.g. size-[18px]).
        const hasSize = /(^|\s)(size|w|h)-/.test(uc);
        return cx("shrink-0 select-none", !hasSize && "size-4", uc);
      },
      "aria-hidden": "true",
    },
    ...PATHS[props.name].map((d) => SvgPath({ d })),
  );
}
