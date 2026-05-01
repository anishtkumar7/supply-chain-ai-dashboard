/**
 * RIVIT lockup: rivet icon (28×28) + wordmark (RIV white / IT cyan) + MANUFACTURING tag.
 * Variants: full sidebar, scaled login, icon-only when sidebar collapsed.
 */

const CYAN = '#00D4FF';
const GREY = '#8892A4';

/** 28×28 rivet mark only — outer ring + smaller inner disc + N/S/E/W callout ticks (cyan #00D4FF). */
function RivetIconMark() {
  const cx = 14;
  const cy = 14;
  const outerR = 11;
  const innerR = 8.25;
  return (
    <g>
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={CYAN} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={innerR} fill={CYAN} />
      {/* Precision callout ticks on outer ring — radial, outward from circumference */}
      <line x1="14" y1="2.15" x2="14" y2="0.35" stroke="#ffffff" strokeWidth="1" strokeLinecap="square" opacity="0.62" />
      <line x1="14" y1="25.85" x2="14" y2="27.65" stroke="#ffffff" strokeWidth="1" strokeLinecap="square" opacity="0.62" />
      <line x1="25.85" y1="14" x2="27.65" y2="14" stroke="#ffffff" strokeWidth="1" strokeLinecap="square" opacity="0.62" />
      <line x1="2.15" y1="14" x2="0.35" y2="14" stroke="#ffffff" strokeWidth="1" strokeLinecap="square" opacity="0.62" />
    </g>
  );
}

export function RivitLogo({ variant = 'sidebar' }) {
  if (variant === 'icon') {
    return (
      <svg
        className="rivit-logo rivit-logo--icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 28 28"
        width={30}
        height={30}
        aria-hidden
        focusable="false"
      >
        <title>RIVIT</title>
        <RivetIconMark />
      </svg>
    );
  }

  const isLogin = variant === 'login';
  const vbW = 212;
  const vbH = 46;
  const iconDy = 8;
  const textX = 38;
  const fsMain = isLogin ? 18 : 16;
  const mainY = isLogin ? 27 : 24;
  const subY = isLogin ? 41 : 37;

  return (
    <svg
      className={`rivit-logo rivit-logo--${variant}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbW} ${vbH}`}
      preserveAspectRatio="xMinYMid meet"
      aria-label="RIVIT Manufacturing"
      role="img"
    >
      <title>RIVIT Manufacturing</title>
      <g transform={`translate(0,${iconDy})`}>
        <RivetIconMark />
      </g>
      <text
        x={textX}
        y={mainY}
        fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize={fsMain}
        fontWeight="800"
        letterSpacing="0.14em"
      >
        <tspan fill="#ffffff">RIV</tspan>
        <tspan fill={CYAN}>IT</tspan>
      </text>
      <text
        x={textX}
        y={subY}
        fill={GREY}
        fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fontSize="9"
        fontWeight="200"
        letterSpacing="0.32em"
      >
        MANUFACTURING
      </text>
    </svg>
  );
}
