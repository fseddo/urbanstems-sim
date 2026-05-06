import type { ColumnCount } from '@/src/common/List';

// Placeholder: N evenly-spaced vertical bars in a 16x16 viewBox. Final shapes
// to be drawn by the user; this is good enough to validate the chooser layout.

const VIEWBOX = 16;
const PADDING = 2;
const BAR_GAP = 1.5;

export const ColumnsIcon = ({ count }: { count: ColumnCount }) => {
  const inner = VIEWBOX - PADDING * 2;
  const totalGap = BAR_GAP * (count - 1);
  const barWidth = (inner - totalGap) / count;

  return (
    <svg
      width='16'
      height='16'
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      fill='currentColor'
      xmlns='http://www.w3.org/2000/svg'
    >
      {Array.from({ length: count }, (_, i) => (
        <rect
          key={i}
          x={PADDING + i * (barWidth + BAR_GAP)}
          y={PADDING}
          width={barWidth}
          height={inner}
          rx={0.5}
        />
      ))}
    </svg>
  );
};
