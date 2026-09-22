// Función serverless de Netlify.
// Se ejecuta en el servidor de Netlify, no en el navegador del cliente —
// por eso no tiene problemas de CORS al hablar con la API de Mercado Libre.
//
// El frontend la llama así: /.netlify/functions/ml-search?q=samsung+a23+modulo
//
// Usa el módulo "https" incluido en Node.js en vez de fetch, para que funcione
// sin importar qué versión de Node esté corriendo la función en Netlify.

const https = require("https");

function httpGetJson(url) {
  return new Promise(function (resolve, reject) {
    https
      .get(url, { headers: { "User-Agent": "mi-taller-cotizador/1.0" } }, function (res) {
        var chunks = [];
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
        res.on("end", function () {
          var raw = Buffer.concat(chunks).toString("utf8");
          try {
            var json = JSON.parse(raw);
            resolve({ statusCode: res.statusCode, json: json });
          } catch (parseErr) {
            reject(new Error("Respuesta no válida de Mercado Libre: " + parseErr.message));
          }
        });
      })
      .on("error", function (err) {
        reject(err);
      });
  });
}

exports.handler = async function (event) {
  const query = event.queryStringParameters && event.queryStringParameters.q;

  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Falta el parámetro q" })
    };
  }

  try {
    const url =
      "https://api.mercadolibre.com/sites/MLA/search?q=" +
      encodeURIComponent(query) +
      "&condition=new&limit=5";

    const result = await httpGetJson(url);

    if (result.statusCode < 200 || result.statusCode >= 300) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Mercado Libre respondió " + result.statusCode })
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // cache corto: reduce llamadas repetidas a Mercado Libre para la misma búsqueda
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify(result.json)
    };
  } catch (err) {
    console.error("Error consultando Mercado Libre desde la función:", err && err.message ? err.message : err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudo consultar Mercado Libre" })
    };
  }
};
