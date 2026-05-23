import Chart from "react-apexcharts";
import { useEffect, useMemo, useState } from "react";

export type SafeApexChartProps = {
  id: string;
  options: any;
  series: any;
  type: any;
  height?: number | string;
  width?: number | string;
};

function mergeSafeChartOptions(id: string, options: any) {
  return {
    ...options,
    chart: {
      ...(options?.chart || {}),
      id,
      animations: {
        ...(options?.chart?.animations || {}),
        enabled: false,
      },
      toolbar: {
        ...(options?.chart?.toolbar || {}),
        show: false,
      },
    },
  };
}

export default function SafeApexChart({
  id,
  options,
  series,
  type,
  height = 300,
  width = "100%",
}: SafeApexChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const safeOptions = useMemo(
    () => mergeSafeChartOptions(id, options),
    [id, options],
  );

  if (!mounted) {
    return <div className="chart-placeholder" style={{ height }} />;
  }

  return (
    <div className="safe-apex-chart">
      <Chart
        key={id}
        options={safeOptions}
        series={series}
        type={type}
        height={height}
        width={width}
      />
    </div>
  );
}
