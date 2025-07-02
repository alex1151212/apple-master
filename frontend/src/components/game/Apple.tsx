import { Circle, Text } from "react-konva";

export interface AppleType {
  id: string;
  x: number;
  y: number;
  value: number;
}

export interface AppleProps {
  apple: AppleType;
  cellSize: number;
}

const Apple: React.FC<AppleProps> = ({ apple, cellSize }) => {
  return (
    <>
      <Circle
        key={apple.id}
        x={apple.x + cellSize / 2}
        y={apple.y + cellSize / 2}
        radius={15}
        fill="red"
        stroke="black"
      />
      <Text
        x={apple.x + cellSize / 2 - 5}
        y={apple.y + cellSize / 2 - 5}
        text={apple.value.toString()}
        fill="white"
        fontSize={16}
        align="center"
      />
    </>
  );
};

export default Apple;
