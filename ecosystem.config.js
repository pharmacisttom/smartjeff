module.exports = {
  apps: [
    {
      name: "smartop",
      cwd: "/var/www/smartop",

      script: ".next/standalone/server.js",
      interpreter: "node",

      instances: 1,
      exec_mode: "fork",

      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      env: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "127.0.0.1",
      },

      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
        HOSTNAME: "127.0.0.1",
      },

      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      combine_logs: true,
    },
  ],
};
