module.exports = {
  apps: [{
    name: 'inchagram-api',
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: '44.196.221.8',
      ref: 'origin/main',
      repo: 'git@github.com:richarddaleumayan/inchagram.git',
      path: '/var/www/inchagram',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
