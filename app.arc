@app
fwa-svelte-service

@http
/api/*
  src src/api/
  method any

@aws
profile default
region us-west-1
runtime nodejs16.x
architecture arm64

@plugins
distribution
