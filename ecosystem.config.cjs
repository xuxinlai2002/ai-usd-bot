module.exports = {
  apps: [
    {
      name: "ai-usd-telegram-bot",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      env_development: {
        NODE_ENV: "development"
      },
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      max_memory_restart: "1G",
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
      watch: false,
      ignore_watch: [
        "node_modules",
        "logs",
        "dist"
      ],
      autorestart: true,
      cron_restart: "0 0 * * *"
    }
  ]
};
