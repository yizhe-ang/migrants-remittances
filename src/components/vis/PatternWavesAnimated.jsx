import { Pattern as CustomPattern } from "@visx/pattern";

const PatternWavesAnimated = ({
  id,
  width = 10,
  height = 10,
  fill = "none",
  stroke = "black",
  strokeWidth = 1,
  prefersReducedMotion = false,
}) => {
  return (
    <CustomPattern id={id} width={width} height={height}>
      {!prefersReducedMotion && (
        <animateTransform
          attributeType="xml"
          attributeName="patternTransform"
          type="translate"
          from="0 0"
          to="50 0"
          dur="10s"
          repeatCount="indefinite"
        />
      )}
      <path
        d={`M 0 ${height / 2} c ${height / 8} ${-height / 4} , ${(height * 3) / 8} ${
          -height / 4
        } , ${height / 2} 0
               c ${height / 8} ${height / 4} , ${(height * 3) / 8} ${height / 4} , ${
                 height / 2
               } 0 M ${-height / 2} ${height / 2}
               c ${height / 8} ${height / 4} , ${(height * 3) / 8} ${height / 4} , ${
                 height / 2
               } 0 M ${height} ${height / 2}
               c ${height / 8} ${-height / 4} , ${(height * 3) / 8} ${-height / 4} , ${
                 height / 2
               } 0`}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </CustomPattern>
  );
};

export default PatternWavesAnimated;
