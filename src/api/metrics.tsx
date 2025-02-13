import parsePrometheusTextFormat from "parse-prometheus-text-format";
import type { LxdMetricGroup } from "types/metrics";

export const fetchMetrics = (target: string): Promise<LxdMetricGroup[]> => {
  const params = target === "none" ? "" : `?target=${target}`;

  return new Promise((resolve, reject) => {
    fetch(`/1.0/metrics${params}`)
      .then((response) => {
        return response.text();
      })
      .then((text) => {
        const json = parsePrometheusTextFormat(text);
        resolve(json);
      })
      .catch(reject);
  });
};
