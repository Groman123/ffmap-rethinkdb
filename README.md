# ffmap-rethinkdb

[![Build Status](https://travis-ci.org/johnyb/ffmap-rethinkdb.svg)](https://travis-ci.org/johnyb/ffmap-rethinkdb)

A middleware to store ffmap-backend data into a rethinkdb and serve it via a socket.io based API.

## Vision

Every Freifunk community maintains and collects a set of data about the community itself, the mesh network, infrastructure networks, and many
other things.
This project is meant to provide a way to normalise or canonise all data and provide a way to export it for consumption by others.
It is mandatory that this project will not be used to create centralised structures, that offend the philosophy common throughout the
projects in the Freifunk ecosystem.
The purpose of this project is rather to provide just another, completely optional way of accessing information that is public anyway.

While being scalable and distributable, it should still simplify the life of developers intending to do any form of visualisation
of the data stored in the system.
It should hide away all the details and complexities needed to aggregate the data and allow for a unified and standardised way to
access information.

## Use-cases

In this section, a few use-cases that are targeted for the 1.0 release of the software will be outlined.

### Community Map

In a typical setup using a firmware based on [gluon](http://wiki.freifunk.net/Freifunk_Firmware_Gluon), information about all the nodes in
a network is stored in a distributed database called [A.L.F.R.E.D.](http://www.open-mesh.org/projects/open-mesh/wiki/Alfred).
The ffmap project aims at different visualisations of network internals.
One way of viewing the network is to filter all nodes that have geological information stored and present them on a map.
In addition to that, some other data directly associated to a node might also be shown.
This includes links between nodes, uptime, traffic statistics, connected clients, installed software, and many other things.

Using this project as a tool to aggregate JSON data from different instances of [ffmap-backend](https://github.com/ffnord/ffmap-backend/),
that might even serve different versions of the API, can help to unify it for consumption by one installation of
[ffmap-d3](https://github.com/ffnord/ffmap-d3/).
It will also be easy to use future-proof (web-)technologies to get this information via Websockets or REST API.
This should help to reduce the amount of data that is transfered to the user, because the middleware is able to calculate
the changes and only send those back to the browser.
When navigating a map, it is also possible to filter out nodes that are not visible to the user at the moment.
This will help to further decrease the amount of transfered data.
Instead of pulling the data every 30s or so, it is possible to listen to a Websocket (using [socket.io](http://socket.io)) to get
notified for changes by the middleware.

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

