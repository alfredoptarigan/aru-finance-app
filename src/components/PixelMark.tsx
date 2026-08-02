import Svg, { Rect } from 'react-native-svg';

export function PixelMark({ size = 120 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" accessibilityLabel="Ledgeria pixel character">
      <Rect x="2" y="1" width="8" height="1" fill="#2A2723" />
      <Rect x="1" y="2" width="10" height="6" fill="#B65F47" />
      <Rect x="2" y="3" width="8" height="4" fill="#F5F0E7" />
      <Rect x="3" y="4" width="1" height="1" fill="#2A2723" />
      <Rect x="8" y="4" width="1" height="1" fill="#2A2723" />
      <Rect x="4" y="6" width="4" height="1" fill="#B65F47" />
      <Rect x="2" y="8" width="3" height="2" fill="#2A2723" />
      <Rect x="7" y="8" width="3" height="2" fill="#2A2723" />
      <Rect x="1" y="10" width="4" height="1" fill="#756E65" />
      <Rect x="7" y="10" width="4" height="1" fill="#756E65" />
    </Svg>
  );
}
