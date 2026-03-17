let chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

export function renderBarChart(canvasId, labels, datasets) {
  destroyChart(canvasId);

  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartInstances[canvasId] = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

export function renderDoughnutChart(canvasId, labels, values) {
  destroyChart(canvasId);

  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  chartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      }
    }
  });
}