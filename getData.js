const dataStore = new Map();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const id = event.queryStringParameters.id;
  const data = dataStore.get(id);

  if (data) {
    dataStore.delete(id); // Remove data after retrieval
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Data not found' }),
    };
  }
};