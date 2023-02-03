
export async function handler () {
  return {
    statusCode: 200,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/json; charset=utf8'
    },
    body: JSON.stringify({ response: 'pong', date: new Date().toISOString() })
  }
}
