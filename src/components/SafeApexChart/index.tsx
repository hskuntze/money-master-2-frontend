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
        show: false,
        ...(options?.chart?.toolbar || {}),
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
      },
    },
    colors: ["#004ac6", "#e21111"],
  };
}

export default function SafeApexChart({ id, options, series, type, height = 300, width = "100%" }: SafeApexChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const safeOptions = useMemo(() => mergeSafeChartOptions(id, options), [id, options]);

  if (!mounted) {
    return <div className="chart-placeholder" style={{ height }} />;
  }

  return <Chart key={id} options={safeOptions} series={series} type={type} height={height} width={width} />;
}
