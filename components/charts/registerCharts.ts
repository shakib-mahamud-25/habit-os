import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from 'chart.js';

let registered = false;
export function ensureChartsRegistered() {
  if (registered) return;
  ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);
  registered = true;
}
