// Pronóstico de series de tiempo con suavizamiento exponencial doble (método de Holt).
// Modela nivel y tendencia lineal. Los parámetros alfa (nivel) y beta (tendencia) se eligen
// por búsqueda en rejilla minimizando el error cuadrático de un paso adelante.
// Funciones puras: no dependen de la base de datos.

const GRID = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
const MIN_POINTS = 4;
const round = (value, digits = 1) => Math.round(value * 10 ** digits) / 10 ** digits;

function holtRun(values, alpha, beta) {
  let level = values[1];
  let trend = values[1] - values[0];
  let sse = 0;
  let count = 0;
  for (let t = 2; t < values.length; t++) {
    const forecast = level + trend;
    const error = values[t] - forecast;
    sse += error * error;
    count++;
    const previousLevel = level;
    level = alpha * values[t] + (1 - alpha) * (level + trend);
    trend = beta * (level - previousLevel) + (1 - beta) * trend;
  }
  return { level, trend, mse: count ? sse / count : Infinity };
}

export function fitHolt(values) {
  let best = null;
  for (const alpha of GRID) {
    for (const beta of GRID) {
      const run = holtRun(values, alpha, beta);
      if (!best || run.mse < best.mse) best = { alpha, beta, ...run };
    }
  }
  return best;
}

/**
 * Pronostica `horizon` pasos. Devuelve null si hay menos de MIN_POINTS observaciones.
 * `floor` y `ceil` acotan los valores (p. ej. 0 para conteos, 0 y 100 para riesgo).
 */
export function forecastSeries(values, horizon, { floor = -Infinity, ceil = Infinity } = {}) {
  if (!Array.isArray(values) || values.length < MIN_POINTS) return null;
  const clamp = value => Math.min(ceil, Math.max(floor, value));
  const fit = fitHolt(values);
  const sigma = Math.sqrt(fit.mse);
  const points = [];
  for (let h = 1; h <= horizon; h++) {
    const center = fit.level + h * fit.trend;
    const half = 1.96 * sigma * Math.sqrt(h);
    points.push({
      paso: h,
      valor: round(clamp(center)),
      inferior: round(clamp(center - half)),
      superior: round(clamp(center + half))
    });
  }

  // Validación: se reserva el último tramo y se compara con un pronóstico ingenuo (último valor).
  const holdout = Math.min(7, Math.floor(values.length / 3));
  let backtest = null;
  if (holdout >= 2) {
    const train = values.slice(0, values.length - holdout);
    const test = values.slice(values.length - holdout);
    const trainFit = fitHolt(train);
    let modelError = 0;
    let naiveError = 0;
    test.forEach((actual, index) => {
      const step = index + 1;
      modelError += Math.abs(actual - clamp(trainFit.level + step * trainFit.trend));
      naiveError += Math.abs(actual - train[train.length - 1]);
    });
    backtest = {
      puntos: holdout,
      errorModelo: round(modelError / holdout, 2),
      errorIngenuo: round(naiveError / holdout, 2)
    };
  }

  const warnings = [];
  if (values.length < 14) warnings.push('Hay menos de 14 días con datos: el pronóstico es orientativo.');
  if (backtest && backtest.errorModelo > backtest.errorIngenuo) {
    warnings.push('En la validación el modelo no supera al pronóstico ingenuo; úsalo con cautela.');
  }

  return {
    metodo: 'Holt (suavizamiento exponencial doble)',
    parametros: { alfa: fit.alpha, beta: fit.beta },
    nivelActual: round(fit.level),
    tendenciaDiaria: round(fit.trend, 2),
    pronostico: points,
    validacion: backtest,
    advertencias: warnings
  };
}
