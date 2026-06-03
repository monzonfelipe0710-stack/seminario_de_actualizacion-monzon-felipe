const http = require('http');
const tf = require('@tensorflow/tfjs');

const PORT = 8008;

let trainedModel = null;
let lossHistory = [];

// y = 2x + 3
const XS_DATA = [-6, -5, -4, -3, -2, -1, 0, 1, 2];
const YS_DATA = XS_DATA.map(x => 2 * x + 3);

async function trainModel() {

  const model = tf.sequential();

  model.add(tf.layers.dense({ units: 1, inputShape: [1] }));

  model.compile({
    loss: 'meanSquaredError',
    optimizer: 'sgd'
  });

  const xs = tf.tensor2d(XS_DATA, [XS_DATA.length, 1]);
  const ys = tf.tensor2d(YS_DATA, [YS_DATA.length, 1]);

  lossHistory = [];

  await model.fit(xs, ys, {
    epochs: 300,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        lossHistory.push(logs.loss);
      }
    }
  });

  xs.dispose();
  ys.dispose();

  return model;
}

const server = http.createServer(async (req, res) => {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // TRAIN
  if (req.method === 'POST' && url === '/train') {

    try {

      trainedModel = await trainModel();

      res.end(JSON.stringify({
        status: 'ok',
        message: 'Modelo entrenado'
      }));

    } catch (err) {

      res.end(JSON.stringify({
        status: 'error',
        message: err.message
      }));
    }

    return;
  }

  // PREDICT
  if (req.method === 'POST' && url === '/predict') {

    if (!trainedModel) {
      res.end(JSON.stringify({
        status: 'error',
        message: 'Modelo no entrenado'
      }));
      return;
    }

    let body = '';

    req.on('data', chunk => body += chunk);

    req.on('end', () => {

      const { x } = JSON.parse(body);

      const input = tf.tensor2d([x], [1, 1]);
      const output = trainedModel.predict(input);

      const y = output.dataSync()[0];

      input.dispose();
      output.dispose();

      res.end(JSON.stringify({
        status: 'ok',
        x,
        y
      }));
    });

    return;
  }

  // LOSS GRAPH
  if (req.method === 'GET' && url === '/loss') {

    res.end(JSON.stringify({
      status: 'ok',
      loss: lossHistory
    }));

    return;
  }

  // NOT FOUND
  res.writeHead(404);
  res.end(JSON.stringify({
    status: 'error',
    message: 'Ruta no encontrada'
  }));
});

server.listen(PORT, () => {
  console.log(`Servidor en http://127.0.0.1:${PORT}`);
  console.log('Rutas: /train | /predict | /loss');
});