const { v4: uuidv4 } = require('uuid');

const dataStore = new Map();

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const id = uuidv4();
  const data = JSON.parse(event.body);
  dataStore.set(id, data);

  return {
    statusCode: 200,
    body: JSON.stringify({ id }),
  };
};