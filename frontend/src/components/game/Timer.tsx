import React, { useEffect, useState } from "react";
import { Rect, Group, Text } from "react-konva";

interface TimerProps {
  initialTime: number; // Time in seconds
  onTimeUp: () => void;
  width: number;
  y: number;
  isStarted?: boolean;
}

const Timer: React.FC<TimerProps> = ({
  initialTime,
  onTimeUp,
  width,
  y,
  isStarted = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(initialTime);
  const height = 20;

  useEffect(() => {
    if (!isStarted) return;

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp, isStarted]);

  useEffect(() => {
    if (!isStarted) {
      setTimeLeft(initialTime);
    }
  }, [isStarted, initialTime]);

  // Calculate progress width
  const progressWidth = (timeLeft / initialTime) * width;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Group>
      {/* Background bar */}
      <Rect
        x={10}
        y={y}
        width={width - 20}
        height={height}
        fill="#e5e7eb"
        cornerRadius={5}
      />
      {/* Progress bar */}
      <Rect
        x={10}
        y={y}
        width={progressWidth - 20}
        height={height}
        fill={timeLeft < initialTime * 0.2 ? "#ef4444" : "#22c55e"}
        cornerRadius={5}
      />
      {/* Timer text */}
      <Text
        x={width / 2}
        y={y + height / 2 - 6}
        text={timeString}
        fontSize={14}
        fill="#1f2937"
        align="center"
        verticalAlign="middle"
        offsetX={20}
      />
    </Group>
  );
};

export default Timer;
