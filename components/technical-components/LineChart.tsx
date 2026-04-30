"use client";

import { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
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
    Legend
);

const LineChart = () => {
    const chartRef = useRef<any>(null);

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
        labels: ["January", "February", "March", "April", "May"],
        datasets: [
            {
                label: "Sales",
                data: [10, 20, 30, 40, 50],
                borderColor: "#E11D48",
                backgroundColor: "#E11D48",
            },
        ],
    };

    const options = {
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" as const },
            title: { display: true, text: "Monthly Sales" },
        },
    };

    return <Line ref={chartRef} data={data} options={options} />;
};

export default LineChart;