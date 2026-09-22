// Función serverless de Netlify.
// Se ejecuta en el servidor de Netlify, no en el navegador del cliente —
// por eso no tiene problemas de CORS al hablar con la API de Mercado Libre.
//
// El frontend la llama así: /.netlify/functions/ml-search?q=samsung+a23+modulo

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

    const res = await fetch(url);

    if (!res.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "Mercado Libre respondió " + res.status })
      };
    }

    const data = await res.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // cache corto: reduce llamadas repetidas a Mercado Libre para la misma búsqueda
        "Cache-Control": "public, max-age=300"
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    console.error("Error consultando Mercado Libre desde la función:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No se pudo consultar Mercado Libre" })
    };
  }
};
