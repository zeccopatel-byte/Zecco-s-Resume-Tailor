import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/tailor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeText: 'Test text with specific weird failure', jobDescription: 'Test job description' })
  });
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('Body:', text.substring(0, 500));
}

test();
