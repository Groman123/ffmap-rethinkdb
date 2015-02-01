# ffmap-rethinkdb

[![Build Status](https://travis-ci.org/johnyb/ffmap-rethinkdb.svg)](https://travis-ci.org/johnyb/ffmap-rethinkdb)

A middleware to store ffmap-backend data into a rethinkdb and serve it via a socket.io based API.

## Development

### Running in Docker container

Since this project depends on a running version of [rethinkdb](http://rethinkdb.com/), the easiest way
to run this app in production might be in a docker container. There are pre-configured Dockerfiles for
rethinkdb installations and nodejs runtimes, that can be used.

To get those docker images, use these commands:

```
docker pull dockerfile/rethinkdb
docker pull dockerfile/nodejs-runtime
```

In order to create containers out of those images, use:

```
docker run --name rethinkdb -d -v /home/rethink/data:/data dockerfile/rethinkdb
docker run --name ffmap -d -v ~/code/ff/ffmap-d3/build:/app/public -v ~/code/ff/nook/ffmap-rethinkdb:/app --link rethinkdb:rethinkdb -p 8000:8000  dockerfile/nodejs-runtime
```

This will only make the ffmap-rethink application available on localhost, not any other ports from the
docker containers. In order to do so, you might want to export one of `8080/tcp`, `28015/tcp`, or `29015/tcp`
of the rethinkdb container.

The nodejs-runtime container is configured to bind the ffmap-rethink root directory into the images `app/` directory
and the build directory of a compatible version of the frontend into the container's `app/public` directory. This
should work with the default configuration as defined in `config.js`.

