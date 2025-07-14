const chokidar = require('chokidar');
const http = require('http');

// Watch the generated SCSS file
const watcher = chokidar.watch('_generated-nudges.scss', {
  persistent: true,
  ignoreInitial: true
});

console.log('🔄 Browser refresh watcher started...');

watcher.on('change', (path) => {
  console.log(`📄 File changed: ${path}`);
  
  // Send a simple HTTP request to trigger browser refresh
  // This will work with most development servers
  const options = {
    hostname: 'localhost',
    port: 8001,
    path: '/',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log('🔄 Browser refresh triggered');
  });

  req.on('error', (err) => {
    // Ignore errors - server might not be running
  });

  req.end();
});

console.log('👀 Watching for changes to _generated-nudges.scss...');
console.log('💡 Tip: Make sure your browser is open to http://localhost:8001'); 