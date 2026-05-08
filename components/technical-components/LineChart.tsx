"use client";

import { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    type Chart as ChartType,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export type LineChartProps = {
  labels?: string[];
  values?: number[];
  datasetLabel?: string;
  chartTitle?: string;
};

function LineChart(props?: LineChartProps) {
  const {
    labels,
    values,
    datasetLabel = "Sales",
    chartTitle = "Monthly sales",
  } = props ?? {};
  const chartRef = useRef<ChartType<"line", number[], string> | null>(null);

  const demoLabels = ["January", "February", "March", "April", "May"];
  const demoValues = [10, 20, 30, 40, 50];

  const hasSeries =
    Array.isArray(labels) &&
    Array.isArray(values) &&
    labels.length > 0 &&
    labels.length === values.length;

  const chartLabels = hasSeries ? labels : demoLabels;
  const chartValues = hasSeries ? values : demoValues;

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    });

    const canvasParent = chartRef.current?.canvas?.parentElement;
    if (canvasParent) resizeObserver.observe(canvasParent);

    return () => resizeObserver.disconnect();
  }, []);

  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: datasetLabel,
        data: chartValues,
        borderColor: "#E11D48",
        backgroundColor: "#E11D48",
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: chartTitle },
    },
  };

  return <Line ref={chartRef} key={chartLabels.join(",")} data={data} options={options} />;
}

export default LineChart;
