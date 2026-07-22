(async () => {
  const res = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'luiz', password: 'luiz123' }),
  });
  console.log('status', res.status);
  console.log('headers', Object.fromEntries(res.headers.entries()));
  console.log('body', await res.text());
})();
